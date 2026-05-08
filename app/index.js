/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

// Register background message handler for Firebase Cloud Messaging
// This must be registered before the app component
let messaging = null;
try {
  // First check if Firebase App is available
  const firebaseApp = require('@react-native-firebase/app');
  if (!firebaseApp || !firebaseApp.default) {
    throw new Error('Firebase App module not available');
  }

  // Then get messaging
  const messagingModule = require('@react-native-firebase/messaging');
  if (!messagingModule || !messagingModule.default) {
    throw new Error('Messaging module not available');
  }

  messaging = messagingModule.default;

  try {
    const messagingInstance = messaging();
    if (
      messagingInstance &&
      typeof messagingInstance.setBackgroundMessageHandler === 'function'
    ) {
      // Register background message handler
      messagingInstance.setBackgroundMessageHandler(async remoteMessage => {
          console.log('📨 [Background] Message received at:', new Date().toISOString());
          console.log('📨 [Background] Message received:', remoteMessage);

          try {
            // Extract message data
            const messageData = remoteMessage.data || {};
            const notificationData = remoteMessage.notification || {};

            console.log('📨 [Background] Processing message data:', JSON.stringify(messageData));
            console.log('📨 [Background] Notification data:', JSON.stringify(notificationData));

          // Handle different types of background messages
          if (messageData.type === 'call' || messageData.callId) {
            // This is an incoming call notification
            console.log(
              '📞 [Background] Processing incoming call notification',
            );
            console.log('📞 [Background] Call details:', {
              callId: messageData.callId,
              callType: messageData.callType || 'audio',
              callerId: messageData.callerId,
              receiverId: messageData.receiverId || messageData.userId,
            });

            // The notification will be automatically displayed by the system
            // When the user taps the notification, it will open the app
            // and the onNotificationOpenedApp handler will navigate to the calling screen
            console.log('✅ [Background] Call notification processed');
          } else if (
            messageData.type === 'chat_message' ||
            messageData.chatId
          ) {
            // This is a chat message notification
            console.log('💬 [Background] Processing chat message notification');

            // The notification will be automatically displayed by the system
            // The notification data contains:
            // - chatId: The chat ID
            // - senderId: The sender's user ID
            // - messageText: The message text

            // We can also create a Firestore notification entry here if needed
            // But typically the backend already creates it when sending the message
            console.log('✅ [Background] Chat message notification processed');
          } else if (messageData.type === 'booking' || messageData.bookingId) {
            // This is a booking notification
            console.log('📅 [Background] Processing booking notification');
            console.log('✅ [Background] Booking notification processed');
          } else {
            // Generic notification
            console.log('📢 [Background] Processing generic notification');
            console.log('✅ [Background] Generic notification processed');
          }
        } catch (error) {
          console.error(
            '❌ [Background] Error processing background message:',
            error,
          );
          // Don't throw - allow the notification to still be displayed
        }
      });
      if (__DEV__) {
        console.log('✅ [FCM] Background message handler registered');
      }
    }
  } catch (nativeError) {
    // Native module not linked yet - this is okay, will be available after rebuild
    if (__DEV__) {
      const errorMsg = nativeError?.message || '';
      if (
        errorMsg.includes('not installed natively') ||
        errorMsg.includes('not installed on your project')
      ) {
        console.log(
          'ℹ️ [FCM] Background handler not available: Native module needs to be linked after rebuild',
        );
      } else {
        console.log(
          'ℹ️ [FCM] Background handler not available:',
          nativeError?.message || 'Unknown error',
        );
      }
    }
  }
} catch (error) {
  if (__DEV__) {
    console.log(
      'ℹ️ [FCM] Background handler not available:',
      error?.message || 'Unknown error',
    );
  }
}

AppRegistry.registerComponent(appName, () => App);
