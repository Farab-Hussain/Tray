// src/controllers/notification.controller.ts
import { Request, Response } from "express";
import { db, admin, firebaseApp } from "../config/firebase";
import { Logger } from "../utils/logger";
import { sendVoipCallPush } from "../services/voipPush.service";

const callPushLastSent = new Map<string, number>();
const CALL_PUSH_COOLDOWN_MS = 8000;

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

    const bodyText =
      typeof messageText === 'string' && messageText.trim().length > 0
        ? messageText.trim()
        : 'New message';

    console.log('📨 Sending notification for message');
    console.log('💬 Message text:', bodyText);
    console.log('👤 Sender ID:', senderId);
    console.log('📤 Recipient ID:', recipientId);

    // Get recipient's FCM tokens from Firestore
    const fcmTokensRef = db
      .collection('users')
      .doc(recipientId)
      .collection('fcmTokens');
    const tokensSnapshot = await fcmTokensRef.get();

    if (tokensSnapshot.empty) {
      console.log('⚠️ No FCM tokens found for recipient:', recipientId);
      return res.json({ success: true, message: 'No FCM tokens found' });
    }

    // Get sender's name
    let senderName = 'Someone';
    try {
      const senderDoc = await db.collection('users').doc(senderId).get();
      if (senderDoc.exists) {
        const senderData = senderDoc.data();
        senderName = senderData?.name || senderData?.displayName || 'Someone';
      }
    } catch (error) {
      console.log('⚠️ Could not fetch sender name:', error);
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
      console.log('⚠️ No valid FCM tokens found');
      return res.json({ success: true, message: 'No valid tokens' });
    }

    console.log('📱 Sending notification to tokens:', tokens.length);

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

    console.log('✅ Notification sent successfully');

    // Handle failed tokens (clean up invalid tokens)
    const failedTokenDocs: admin.firestore.QueryDocumentSnapshot[] = [];
    
    if (responses.responses) {
      responses.responses.forEach((result, index) => {
        if (result.error) {
          console.error('❌ Failed to send to token:', tokens[index], result.error);
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
      console.log('🧹 Removing invalid tokens:', failedTokenDocs.length);
      const deletePromises = failedTokenDocs.map((doc) => doc.ref.delete());
      await Promise.all(deletePromises);
    }

    Logger.success(route, senderId, `Notification sent to ${recipientId}`);
    res.json({ success: true, sent: responses.successCount, failed: responses.failureCount });
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

    const lastSent = callPushLastSent.get(callerId) ?? 0;
    if (Date.now() - lastSent < CALL_PUSH_COOLDOWN_MS) {
      return res.status(429).json({ error: 'Please wait before placing another call' });
    }
    callPushLastSent.set(callerId, Date.now());

    console.log('📞 Sending call notification');
    console.log('📞 Call ID:', callId);
    console.log('👤 Caller ID:', callerId);
    console.log('📤 Receiver ID:', receiverId);
    console.log('📱 Call Type:', callType);

    // Get receiver's FCM tokens from Firestore
    const fcmTokensRef = db
      .collection('users')
      .doc(receiverId)
      .collection('fcmTokens');
    const tokensSnapshot = await fcmTokensRef.get();

    let callerName = 'Someone';
    try {
      const callerDoc = await db.collection('users').doc(callerId).get();
      if (callerDoc.exists) {
        const callerData = callerDoc.data();
        callerName = callerData?.name || callerData?.displayName || 'Someone';
      }
    } catch {
      // non-critical
    }

    const voipSent = await sendVoipCallPush(receiverId, {
      callId,
      callerId,
      receiverId,
      callType,
      callerName,
    });

    if (tokensSnapshot.empty) {
      console.log('⚠️ No FCM tokens found for receiver:', receiverId);
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
      console.log('⚠️ No valid FCM tokens found');
      return res.json({ success: true, message: 'No valid tokens' });
    }
    console.log('📱 Sending call notification to tokens:', tokens.length);
    
    const sendPromises = tokens.map(token => {
      const singleMessage = {
        token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          type: 'call',
          callId: String(callId),
          callerId: String(callerId),
          receiverId: String(receiverId),
          callType: String(callType),
          category: 'call',
          link: `tray://call/${callId}`,
          callerName: String(callerName),
        },
        android: {
          priority: 'high' as const,
          ttl: 30000,
          notification: {
            title: notification.title,
            body: notification.body,
            sound: 'default',
            channelId: 'incoming_calls',
            priority: 'max' as const,
            visibility: 'public' as const,
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
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
              'mutable-content': 1,
              category: 'CALL_CATEGORY',
              'thread-id': callId,
            },
          },
        },
      };
      
      // Use the specific firebaseApp.messaging() instance
      return (firebaseApp || admin).messaging().send(singleMessage)
        .then(response => ({ success: true, response }))
        .catch(error => ({ success: false, error }));
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log(`✅ Call notification attempt finished. Success: ${successCount}, Fail: ${failureCount}`);

    // Handle failed tokens (clean up invalid tokens)
    const failedTokenDocs: admin.firestore.QueryDocumentSnapshot[] = [];
    
    results.forEach((result: any, index) => {
      if (!result.success && result.error) {
        console.error('❌ FCM Error Detail:', JSON.stringify(result.error, null, 2));
        console.error('❌ Failed to send to token:', tokens[index], result.error.message);
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
      console.log('🧹 Removing invalid tokens:', failedTokenDocs.length);
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
      offline: tokens.length === 0 && voipSent === 0,
      delivered: sentToAny || voipSent > 0,
    });
  } catch (error) {
    Logger.error(route, "", "Error sending call notification", error);
    res.status(500).json({ error: 'Failed to send call notification' });
  }
};
