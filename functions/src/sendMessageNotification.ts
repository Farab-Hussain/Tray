/**
 * Firebase Cloud Function to send push notifications when a new message is sent
 * 
 * DEPLOYMENT:
 * 1. Install Firebase Functions CLI: npm install -g firebase-tools
 * 2. Login: firebase login
 * 3. Initialize functions: firebase init functions
 * 4. Copy this file to your functions/src directory
 * 5. Deploy: firebase deploy --only functions:sendMessageNotification
 * 
 * REQUIRED INSTALL:
 * npm install firebase-functions firebase-admin
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const database = admin.database();

/**
 * Cloud Function that triggers when a new message is created in Realtime Database
 * Sends FCM push notification to the recipient
 */
export const sendMessageNotification = functions.database
  .ref('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    try {
      const newMessage = snap.val();
      const chatId = context.params.chatId;
      const messageId = context.params.messageId;

      console.log('📨 New message created:', messageId);
      console.log('💬 Message text:', newMessage.text);
      console.log('👤 Sender ID:', newMessage.senderId);

      // Skip if message doesn't have required fields
      if (!newMessage.senderId || !newMessage.text) {
        console.log('⚠️ Skipping - message missing required fields');
        return null;
      }

      // Get chat data from Realtime Database to find participants
      const chatSnapshot = await database.ref(`chats/${chatId}`).once('value');

      if (!chatSnapshot.exists()) {
        console.log('⚠️ Chat not found:', chatId);
        return null;
      }

      const chatData = chatSnapshot.val();
      const participants = chatData?.participants || [];

      console.log('👥 Chat participants:', participants);

      // Find the recipient (not the sender)
      const recipientId = participants.find((p: string) => p !== newMessage.senderId);

      if (!recipientId) {
        console.log('⚠️ Could not find recipient');
        return null;
      }

      console.log('📤 Recipient ID:', recipientId);

      // Get recipient's FCM tokens from Realtime Database
      const fcmTokensRef = database.ref(`users/${recipientId}/fcmTokens`);
      const tokensSnapshot = await fcmTokensRef.once('value');

      if (!tokensSnapshot.exists()) {
        console.log('⚠️ No FCM tokens found for recipient:', recipientId);
        return null;
      }

      // Get sender's name for the notification
      let senderName = 'Someone';
      try {
        const senderSnapshot = await database.ref(`users/${newMessage.senderId}`).once('value');
        if (senderSnapshot.exists()) {
          const senderData = senderSnapshot.val();
          senderName = senderData?.name || senderData?.displayName || 'Someone';
        }
      } catch (error) {
        console.log('⚠️ Could not fetch sender name:', error);
      }

      // Prepare notification payload
      const notification = {
        title: senderName,
        body: newMessage.text || 'New message',
      };

      const data = {
        chatId: chatId,
        senderId: newMessage.senderId,
        messageId: messageId,
        type: 'chat_message',
      };

      const tokensData = tokensSnapshot.val();
      const tokens = Object.keys(tokensData).map((key) => tokensData[key].fcmToken).filter(Boolean);

      if (tokens.length === 0) {
        console.log('⚠️ No valid FCM tokens found');
        return null;
      }

      console.log('📱 Sending notification to tokens:', tokens);


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
            },
          },
        },
        android: {
          notification: {
            sound: 'default',
            channelId: 'chat_messages',
          },
          priority: 'high' as const,
        },
      };

      const responses = await admin.messaging().sendEachForMulticast(message);

      console.log('✅ Notification sent successfully');
      console.log('📊 Response:', responses);

      // Handle failed tokens (clean up invalid tokens)
      const failedTokenKeys: string[] = [];
      const tokenKeys = Object.keys(tokensData);
      
      if (responses.responses) {
        responses.responses.forEach((result, index) => {
          if (result.error) {
            console.error('❌ Failed to send to token:', tokens[index], result.error);
            if (
              result.error.code === 'messaging/invalid-registration-token' ||
              result.error.code === 'messaging/registration-token-not-registered'
            ) {
              failedTokenKeys.push(tokenKeys[index]);
            }
          }
        });
      }

      // Clean up failed tokens
      if (failedTokenKeys.length > 0) {
        console.log('🧹 Removing invalid tokens:', failedTokenKeys.length);
        const updates: Record<string, null> = {};
        failedTokenKeys.forEach((tokenKey) => {
          updates[`users/${recipientId}/fcmTokens/${tokenKey}`] = null;
        });
        await database.ref().update(updates);
      }

      return null;
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return null;
    }
  });

