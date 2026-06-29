// src/controllers/notification.controller.ts
import { Request, Response } from "express";
import { db, admin, firebaseApp, auth } from "../config/firebase";
import { Logger } from "../utils/logger";
import { sendVoipCallPush } from "../services/voipPush.service";
import {
  isUserBusy,
  cleanupStaleCallsForUsers,
  endOtherRingingCallsForParticipants,
} from "../services/callBusy.service";
import { devLog, devWarn, devError, maskToken } from "../utils/sanitizeLog";
import { resolveUserDisplayName } from "../utils/displayName";

const callPushLastSent = new Map<string, number>();
const CALL_PUSH_COOLDOWN_MS = 8000;

const getChatParticipants = async (chatId: string): Promise<string[]> => {
  const snapshot = await admin.database(firebaseApp).ref(`chats/${chatId}`).get();
  if (!snapshot.exists()) {
    return [];
  }

  const chatData = snapshot.val() || {};
  return Array.isArray(chatData.participants)
    ? chatData.participants.filter(
        (participant: unknown): participant is string => typeof participant === "string",
      )
    : [];
};

/**
 * Send push notification when a message is sent
 * This replaces Cloud Functions for users on Spark plan
 * 
 * POST /notifications/send-message
 * Body: { chatId, senderId, recipientId, messageText }
 */
export const sendMessageNotification = async (req: Request, res: Response) => {
  const route = "POST /notifications/send-message";
  
  try {
    const user = (req as any).user;
    if (!user?.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { chatId, senderId, recipientId, messageText } = req.body;

    if (!chatId || !senderId || !recipientId) {
      Logger.error(route, "", "Missing required fields");
      return res.status(400).json({ error: 'Missing required fields: chatId, senderId, recipientId' });
    }

    if (senderId !== user.uid) {
      Logger.error(route, user.uid, `Sender mismatch: ${senderId} !== ${user.uid}`);
      return res.status(403).json({ error: 'senderId must match authenticated user' });
    }

    const participants = await getChatParticipants(String(chatId));
    if (!participants.includes(senderId) || !participants.includes(recipientId) || senderId === recipientId) {
      Logger.warn(route, user.uid, `Rejected message notification for non-participant chat ${chatId}`);
      return res.status(403).json({ error: 'Sender and recipient must be chat participants' });
    }

    const bodyText =
      typeof messageText === 'string' && messageText.trim().length > 0
        ? messageText.trim()
        : 'New message';

    devLog('📨 Sending notification for message');
    devLog('👤 Sender ID:', senderId);
    devLog('📤 Recipient ID:', recipientId);

    // Get sender's name
    let senderName = 'Someone';
    try {
      const senderDoc = await db.collection('users').doc(senderId).get();
      if (senderDoc.exists) {
        const senderData = senderDoc.data();
        senderName = senderData?.name || senderData?.displayName || 'Someone';
      }
    } catch (error) {
      devLog('⚠️ Could not fetch sender name:', error);
    }

    await db.collection('notifications').add({
      userId: String(recipientId),
      type: 'chat_message',
      category: 'message',
      title: senderName,
      message: bodyText,
      data: {
        chatId: String(chatId),
        senderId: String(senderId),
      },
      senderId: String(senderId),
      senderName,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Get recipient's FCM tokens from Firestore. In-app notification is already stored,
    // so push delivery can fail without hiding the message from the notification screen.
    const fcmTokensRef = db
      .collection('users')
      .doc(recipientId)
      .collection('fcmTokens');
    const tokensSnapshot = await fcmTokensRef.get();

    if (tokensSnapshot.empty) {
      devLog('⚠️ No FCM tokens found for recipient:', recipientId);
      return res.json({ success: true, stored: true, sent: 0, failed: 0, message: 'No FCM tokens found' });
    }

    // Prepare notification payload
    const notification = {
      title: senderName,
      body: bodyText,
    };

    const data = {
      chatId: String(chatId),
      senderId: String(senderId),
      type: 'chat_message',
      category: 'message',
      link: `tray://chat/${chatId}`,
      messageText: bodyText,
    };

    // Prepare rich notification actions for iOS
    const apnsActions = [
      {
        id: 'reply',
        title: 'Reply',
        options: ['foreground'],
      },
      {
        id: 'mark_read',
        title: 'Mark as Read',
      },
    ];

    // Prepare Android notification actions
    const androidActions = [
      {
        action: 'reply',
        title: 'Reply',
        icon: 'ic_reply',
      },
      {
        action: 'mark_read',
        title: 'Mark as Read',
        icon: 'ic_done',
      },
    ];

    // Extract FCM tokens
    const tokens: string[] = [];
    const tokenDocs: admin.firestore.QueryDocumentSnapshot[] = [];
    
    tokensSnapshot.forEach((doc) => {
      const tokenData = doc.data();
      if (tokenData.fcmToken) {
        tokens.push(tokenData.fcmToken);
        tokenDocs.push(doc);
      }
    });

    if (tokens.length === 0) {
      devLog('⚠️ No valid FCM tokens found');
      return res.json({ success: true, stored: true, sent: 0, failed: 0, message: 'No valid tokens' });
    }

    devLog('📱 Sending notification to token count:', tokens.length);

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: notification, // This ensures pop-up appears on both iOS and Android
      data: data,
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'content-available': 1,
            'alert': {
              'title': notification.title,
              'body': notification.body,
            },
            'mutable-content': 1,
            'category': 'MESSAGE_CATEGORY', // Notification category
            'thread-id': chatId, // Group notifications by chat
          },
        },
        fcmOptions: {
          // FCM options for iOS
        },
        headers: {
          'apns-priority': '10', // High priority for immediate delivery
          'apns-push-type': 'alert', // Ensure notification is displayed as alert
        },
      },
      android: {
        notification: {
          sound: 'default',
          channelId: 'chat_messages', // Notification channel
          priority: 'high' as const,
          visibility: 'public' as const,
          defaultSound: true,
          defaultVibrateTimings: true,
          defaultLightSettings: true,
          // Note: Android notification actions are handled via data payload
          // The app should read action data from the notification data
        },
        priority: 'high' as const,
        ttl: 3600,
      },
      // Ensure notification is shown even when app is in foreground
      webpush: {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/icon.png',
        },
      },
    };

    const responses = await admin.messaging().sendEachForMulticast(message);

    devLog('✅ Notification sent successfully');

    // Handle failed tokens (clean up invalid tokens)
    const failedTokenDocs: admin.firestore.QueryDocumentSnapshot[] = [];
    
    if (responses.responses) {
      responses.responses.forEach((result, index) => {
        if (result.error) {
          devError('❌ Failed to send to token:', maskToken(tokens[index]), result.error?.code || result.error);
          if (
            result.error.code === 'messaging/invalid-registration-token' ||
            result.error.code === 'messaging/registration-token-not-registered'
          ) {
            failedTokenDocs.push(tokenDocs[index]);
          }
        }
      });
    }

    // Clean up failed tokens
    if (failedTokenDocs.length > 0) {
      devLog('🧹 Removing invalid tokens:', failedTokenDocs.length);
      const deletePromises = failedTokenDocs.map((doc) => doc.ref.delete());
      await Promise.all(deletePromises);
    }

    Logger.success(route, senderId, `Notification sent to ${recipientId}`);
    res.json({ success: true, stored: true, sent: responses.successCount, failed: responses.failureCount });
  } catch (error) {
    Logger.error(route, "", "Error sending notification", error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

/**
 * Send push notification for incoming call
 * 
 * POST /notifications/send-call
 * Body: { callId, callerId, receiverId, callType }
 */
export const sendCallNotification = async (req: Request, res: Response) => {
  const route = "POST /notifications/send-call";
  
  try {
    const user = (req as any).user;
    if (!user?.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { callId, callerId, receiverId, callType } = req.body;

    if (!callId || !callerId || !receiverId || !callType) {
      Logger.error(route, "", "Missing required fields");
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (callerId !== user.uid) {
      Logger.error(route, user.uid, `Caller mismatch: ${callerId}`);
      return res.status(403).json({ error: 'callerId must match authenticated user' });
    }

    await cleanupStaleCallsForUsers([callerId, receiverId]);
    await endOtherRingingCallsForParticipants(callerId, receiverId, callId);

    if (await isUserBusy(callerId, callId)) {
      devLog('📞 send-call rejected: caller busy', { callerId, callId });
      return res.status(409).json({
        error: 'You are already in a call',
        busy: true,
        role: 'caller',
      });
    }

    if (await isUserBusy(receiverId, callId)) {
      devLog('📞 send-call rejected: receiver busy', { receiverId, callId });
      return res.status(409).json({
        error: 'Receiver is busy',
        busy: true,
        role: 'receiver',
      });
    }

    const lastSent = callPushLastSent.get(callerId) ?? 0;
    if (Date.now() - lastSent < CALL_PUSH_COOLDOWN_MS) {
      return res.status(429).json({ error: 'Please wait before placing another call' });
    }
    callPushLastSent.set(callerId, Date.now());

    devLog('📞 Sending call notification');
    devLog('📞 Call ID:', callId);
    devLog('👤 Caller ID:', callerId);
    devLog('📤 Receiver ID:', receiverId);
    devLog('📱 Call Type:', callType);

    // Get receiver's FCM tokens from Firestore
    const fcmTokensRef = db
      .collection('users')
      .doc(receiverId)
      .collection('fcmTokens');
    const tokensSnapshot = await fcmTokensRef.get();

    let callerName = 'Someone';
    try {
      const callerDoc = await db.collection('users').doc(callerId).get();
      const callerData = callerDoc.exists ? callerDoc.data() : undefined;
      let authDisplayName: string | undefined;
      let authEmail: string | undefined;
      try {
        const authUser = await auth.getUser(callerId);
        authDisplayName = authUser.displayName;
        authEmail = authUser.email;
      } catch {
        // non-critical
      }
      callerName = resolveUserDisplayName({
        name: callerData?.name,
        displayName: authDisplayName,
        email: callerData?.email || authEmail,
        uid: callerId,
      });
    } catch {
      // non-critical
    }

    let voipSent = 0;
    try {
      voipSent = await sendVoipCallPush(receiverId, {
        callId,
        callerId,
        receiverId,
        callType,
        callerName,
      });
    } catch (voipError) {
      devWarn('⚠️ [VoIP] sendVoipCallPush failed (FCM will still be attempted):', voipError);
    }

    if (tokensSnapshot.empty) {
      devLog('⚠️ No FCM tokens found for receiver:', receiverId);
      return res.json({
        success: true,
        message: voipSent > 0 ? 'VoIP push sent' : 'No FCM tokens found',
        voipSent,
      });
    }

    // Prepare notification payload
    const notification = {
      title: `Incoming ${callType === 'video' ? 'Video' : 'Audio'} Call`,
      body: `${callerName} is calling you...`,
    };

    const data = {
      callId: callId,
      callerId: callerId,
      receiverId: receiverId,
      callType: callType,
      type: 'call',
      category: 'call', // Notification category
      link: `tray://call/${callId}`, // Deep link for navigation
    };

    // Prepare rich notification actions for call
    const callApnsActions = [
      {
        id: 'accept',
        title: 'Accept',
        options: ['foreground'],
      },
      {
        id: 'decline',
        title: 'Decline',
        options: ['destructive'],
      },
    ];

    const callAndroidActions = [
      {
        action: 'accept',
        title: 'Accept',
        icon: 'ic_call_answer',
      },
      {
        action: 'decline',
        title: 'Decline',
        icon: 'ic_call_decline',
      },
    ];

    // Extract FCM tokens
    const tokens: string[] = [];
    const tokenDocs: admin.firestore.QueryDocumentSnapshot[] = [];
    
    tokensSnapshot.forEach((doc) => {
      const tokenData = doc.data();
      if (tokenData.fcmToken) {
        tokens.push(tokenData.fcmToken);
        tokenDocs.push(doc);
      }
    });

    if (tokens.length === 0) {
      devLog('⚠️ No valid FCM tokens found');
      return res.json({
        success: true,
        message: voipSent > 0 ? 'VoIP push sent' : 'No valid tokens',
        voipSent,
        offline: voipSent === 0,
        delivered: voipSent > 0,
      });
    }
    devLog('📱 Sending call notification to token count:', tokens.length);

    const stringData = {
      type: 'call',
      callId: String(callId),
      callerId: String(callerId),
      receiverId: String(receiverId),
      callType: String(callType),
      category: 'call',
      link: `tray://call/${callId}`,
      callerName: String(callerName),
    };

    const sendPromises = tokenDocs.map((tokenDoc, index) => {
      const token = tokens[index];
      const deviceType = (tokenDoc.data()?.deviceType as string) || 'android';

      // Android: data-only high-priority push so native TrayFirebaseMessagingService
      // always receives the message and can show full-screen incoming call UI.
      if (deviceType === 'android') {
        const androidMessage = {
          token,
          data: stringData,
          android: {
            priority: 'high' as const,
            ttl: 30000,
            directBootOk: true,
          },
        };
        return (firebaseApp || admin).messaging().send(androidMessage)
          .then(response => ({ success: true, response }))
          .catch(error => ({ success: false, error }));
      }

      // iOS: VoIP + CallKit owns ringing when VoIP succeeds. Skip duplicate FCM alert.
      // When VoIP fails, send alert FCM as fallback so the receiver still gets notified.
      if (deviceType === 'ios') {
        if (voipSent > 0) {
          devLog('📞 [iOS] VoIP delivered — skipping FCM call alert for token:', maskToken(token));
          return Promise.resolve({ success: true, response: 'skipped-voip-delivered' });
        }

        const iosFallbackMessage = {
          token,
          data: stringData,
          apns: {
            headers: {
              'apns-priority': '10',
              'apns-push-type': 'alert',
            },
            payload: {
              aps: {
                alert: {
                  title: notification.title,
                  body: notification.body,
                },
                sound: 'default',
                badge: 1,
                'content-available': 1,
                category: 'CALL_CATEGORY',
                'thread-id': callId,
              },
            },
          },
        };
        return (firebaseApp || admin).messaging().send(iosFallbackMessage)
          .then(response => ({ success: true, response }))
          .catch(error => ({ success: false, error }));
      }

      devWarn('⚠️ Unknown deviceType, skipping FCM:', deviceType);
      return Promise.resolve({
        success: false,
        error: new Error(`Unknown deviceType: ${deviceType}`),
      });
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    devLog(`✅ Call notification attempt finished. Success: ${successCount}, Fail: ${failureCount}`);

    // Handle failed tokens (clean up invalid tokens)
    const failedTokenDocs: admin.firestore.QueryDocumentSnapshot[] = [];
    
    results.forEach((result: any, index) => {
      if (!result.success && result.error) {
        devError('❌ FCM Error Detail:', result.error?.code || 'unknown');
        devError('❌ Failed to send to token:', maskToken(tokens[index]), result.error?.message);
        if (
          result.error.code === 'messaging/invalid-registration-token' ||
          result.error.code === 'messaging/registration-token-not-registered' ||
          result.error.code === 'messaging/third-party-auth-error'
        ) {
          failedTokenDocs.push(tokenDocs[index]);
        }
      }
    });

    // Clean up failed tokens
    if (failedTokenDocs.length > 0) {
      devLog('🧹 Removing invalid tokens:', failedTokenDocs.length);
      const deletePromises = failedTokenDocs.map((doc) => doc.ref.delete());
      await Promise.all(deletePromises);
    }

    Logger.success(route, callerId, `Call notification sent to ${receiverId}`);
    const sentToAny = successCount > 0;
    res.json({
      success: true,
      sent: successCount,
      failed: failureCount,
      voipSent,
      voipConfigured: voipSent > 0 || process.env.APNS_KEY_ID != null,
      offline: tokens.length === 0 && voipSent === 0,
      delivered: sentToAny || voipSent > 0,
    });
  } catch (error) {
    Logger.error(route, "", "Error sending call notification", error);
    res.status(500).json({ error: 'Failed to send call notification' });
  }
};
