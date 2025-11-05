// src/controllers/notification.controller.ts
import { Request, Response } from "express";
import { db, admin } from "../config/firebase";
import { Logger } from "../utils/logger";

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
    const { chatId, senderId, recipientId, messageText } = req.body;

    if (!chatId || !senderId || !recipientId || !messageText) {
      Logger.error(route, "", "Missing required fields");
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('📨 Sending notification for message');
    console.log('💬 Message text:', messageText);
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
      body: messageText || 'New message',
    };

    const data = {
      chatId: chatId,
      senderId: senderId,
      type: 'chat_message',
    };

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
            'content-available': 1, // Required for background notifications
            'alert': {
              'title': notification.title,
              'body': notification.body,
            },
            'mutable-content': 1, // Allow notification extensions
          },
        },
        headers: {
          'apns-priority': '10', // High priority for immediate delivery
          'apns-push-type': 'alert', // Ensure notification is displayed as alert
        },
      },
      android: {
        notification: {
          sound: 'default',
          channelId: 'chat_messages',
          priority: 'high' as const,
          visibility: 'public' as const, // Show on lock screen
          defaultSound: true,
          defaultVibrateTimings: true,
          defaultLightSettings: true,
          clickAction: 'FLUTTER_NOTIFICATION_CLICK', // Action when notification is tapped
        },
        priority: 'high' as const,
        ttl: 3600, // Time to live in seconds
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
    const { callId, callerId, receiverId, callType } = req.body;

    if (!callId || !callerId || !receiverId || !callType) {
      Logger.error(route, "", "Missing required fields");
      return res.status(400).json({ error: 'Missing required fields' });
    }

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

    if (tokensSnapshot.empty) {
      console.log('⚠️ No FCM tokens found for receiver:', receiverId);
      return res.json({ success: true, message: 'No FCM tokens found' });
    }

    // Get caller's name
    let callerName = 'Someone';
    try {
      const callerDoc = await db.collection('users').doc(callerId).get();
      if (callerDoc.exists) {
        const callerData = callerDoc.data();
        callerName = callerData?.name || callerData?.displayName || 'Someone';
      }
    } catch (error) {
      console.log('⚠️ Could not fetch caller name:', error);
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
    };

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

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: notification,
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
          },
        },
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'alert',
        },
      },
      android: {
        notification: {
          sound: 'default',
          channelId: 'calls',
          priority: 'high' as const,
          visibility: 'public' as const,
          defaultSound: true,
          defaultVibrateTimings: true,
          defaultLightSettings: true,
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
        priority: 'high' as const,
        ttl: 30, // Call notifications expire after 30 seconds
      },
    };

    const responses = await admin.messaging().sendEachForMulticast(message);

    console.log('✅ Call notification sent successfully');

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

    Logger.success(route, callerId, `Call notification sent to ${receiverId}`);
    res.json({ success: true, sent: responses.successCount, failed: responses.failureCount });
  } catch (error) {
    Logger.error(route, "", "Error sending call notification", error);
    res.status(500).json({ error: 'Failed to send call notification' });
  }
};

