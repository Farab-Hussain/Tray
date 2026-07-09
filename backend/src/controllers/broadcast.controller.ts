import { Request, Response } from "express";
import { db, admin } from "../config/firebase";
import { Logger } from "../utils/logger";

type Audience = 'all' | 'students' | 'consultants' | 'recruiters' | 'admins';

const AUDIENCE_TO_ROLE: Record<Exclude<Audience, 'all'>, string> = {
  students: 'student',
  consultants: 'consultant',
  recruiters: 'recruiter',
  admins: 'admin',
};

const buildPayload = (title: string, body: string, deepLink?: string) => ({
  notification: { title, body },
  data: {
    type: 'broadcast',
    body,
    link: deepLink || '',
  },
  apns: {
    headers: {
      // Ensure APNs treats this as an alert push and delivers immediately (not background-only)
      'apns-push-type': 'alert',
      'apns-priority': '10',
    },
    payload: {
      aps: {
        alert: { title, body },
        sound: 'default',
        badge: 1,
        // Keep content-available to allow silent handling if app is foregrounded
        'content-available': 1,
      },
    },
  },
  android: {
    priority: 'high' as const,
    notification: {
      // Do NOT set a custom channelId unless the app creates it; otherwise Android drops the notif.
      sound: 'default',
    },
  },
});

type TokenRecord = { token: string; userId: string; tokenDocId: string };

export const sendBroadcast = async (req: Request, res: Response) => {
  const route = "POST /admin/broadcast/send";

  try {
    const { title, body, audience = 'all', link } = req.body as {
      title?: string;
      body?: string;
      audience?: Audience;
      link?: string;
    };

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and message body are required' });
    }

    const snapshot = await db.collection('users').get();
    const tokens: TokenRecord[] = [];
    const recipientUserIds: string[] = [];
    const roleFilter = audience === 'all' ? null : AUDIENCE_TO_ROLE[audience];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const isActive = data?.isActive !== false;
      if (!isActive) return;

      const roles: string[] = Array.isArray(data?.roles)
        ? data.roles
        : data?.role
          ? [data.role]
          : [];

      if (roleFilter && !roles.includes(roleFilter)) return;

      recipientUserIds.push(doc.id);
      // collect tokens from subcollection
      // (note: we can’t await inside forEach; we’ll do a second pass below)
    });

    // Fetch FCM tokens in a second pass to avoid async inside forEach
    const tokenFetches: Promise<void>[] = [];
    snapshot.forEach((doc) => {
      tokenFetches.push((async () => {
        const data = doc.data();
        const isActive = data?.isActive !== false;
        if (!isActive) return;

        const roles: string[] = Array.isArray(data?.roles)
          ? data.roles
          : data?.role
            ? [data.role]
            : [];

        if (roleFilter && !roles.includes(roleFilter)) return;

        const fcmTokensRef = db.collection('users').doc(doc.id).collection('fcmTokens');
        const tokenDocs = await fcmTokensRef.get();
        tokenDocs.forEach((tokenDoc) => {
          const tokenData = tokenDoc.data();
          if (tokenData?.fcmToken) {
            tokens.push({
              token: tokenData.fcmToken as string,
              userId: doc.id,
              tokenDocId: tokenDoc.id,
            });
          }
        });
      })());
    });

    await Promise.all(tokenFetches);

    const payload = buildPayload(title, body, link);

    // Send as multicast in chunks of 500
    const chunkSize = 500;
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];
    const tokensToDelete: TokenRecord[] = [];

    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize);
      const response = await admin.messaging().sendEachForMulticast({ ...payload, tokens: chunk.map((c) => c.token) });
      sent += response.successCount;
      failed += response.failureCount;
      response.responses.forEach((r, idx) => {
        if (!r.error) return;

        const message = r.error.message || 'unknown';
        errors.push(message);

        const code = (r.error as any)?.code as string | undefined;
        const tokenRecord = chunk[idx];

        const looksInvalid =
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-argument' ||
          message.toLowerCase().includes('requested entity was not found') ||
          message.toLowerCase().includes('missing required authentication credential');

        if (looksInvalid && tokenRecord) {
          tokensToDelete.push(tokenRecord);
        }
      });
    }

    if (tokensToDelete.length) {
      const deletionJobs = tokensToDelete.map(({ userId, tokenDocId }) =>
        db
          .collection('users')
          .doc(userId)
          .collection('fcmTokens')
          .doc(tokenDocId)
          .delete()
          .catch((err) =>
            Logger.warn('Broadcast', 'admin', `Failed to delete invalid token ${tokenDocId} for user ${userId}: ${err?.message || err}`)
          )
      );
      await Promise.allSettled(deletionJobs);
    }

    const logPayload = {
      title,
      body,
      audience,
      link: link || null,
      tokensTargeted: tokens.length,
      sent,
      failed,
      invalidTokensRemoved: tokensToDelete.length,
      status: failed === 0 ? 'sent' : sent === 0 ? 'failed' : 'partial',
      errors: Array.from(new Set(errors)).slice(0, 5),
      createdAt: admin.firestore.Timestamp.now(),
      createdBy: {
        uid: (req as any)?.user?.uid || 'unknown',
        email: (req as any)?.user?.email || null,
      },
    };

    const docRef = await db.collection('broadcasts').add(logPayload);

    Logger.info('Broadcast', 'admin', `Broadcast push: ${sent}/${tokens.length} sent (log ${docRef.id})`);

    // Create in-app notification entries so users see the broadcast in the notifications tab
    try {
      const uniqueUserIds = Array.from(new Set(recipientUserIds));
      const notificationsRef = db.collection('notifications');
      const senderId = (req as any)?.user?.uid || 'system';
      const senderName = (req as any)?.user?.email || 'FairChance';

      // Firestore batch limit: 500 writes; keep a safety margin
      const MAX_BATCH_SIZE = 450;
      let batch = db.batch();
      let opCount = 0;

      const commitBatch = async () => {
        if (opCount === 0) return;
        await batch.commit();
        batch = db.batch();
        opCount = 0;
      };

      const nowTs = admin.firestore.Timestamp.now();
      for (const userId of uniqueUserIds) {
        const doc = notificationsRef.doc();
        batch.set(doc, {
          userId,
          type: 'broadcast',
          category: 'system',
          title,
          message: body,
          data: {
            link: link || '',
            broadcastId: docRef.id,
          },
          read: false,
          senderId,
          senderName: senderName || 'FairChance',
          senderAvatar: null,
          createdAt: nowTs,
        });
        opCount += 1;
        if (opCount >= MAX_BATCH_SIZE) {
          await commitBatch();
        }
      }

      await commitBatch();
      Logger.info('Broadcast', 'admin', `In-app notifications created for ${uniqueUserIds.length} users`);
    } catch (notifError: any) {
      Logger.warn('Broadcast', 'admin', `Failed to create in-app notifications: ${notifError?.message || notifError}`);
    }

    return res.status(failed === 0 ? 200 : 207).json({ id: docRef.id, ...logPayload });
  } catch (error: any) {
    Logger.error('Broadcast', '', 'Failed to send broadcast', error);
    return res.status(500).json({ error: 'Failed to send broadcast', details: error?.message || 'Unknown error' });
  }
};
