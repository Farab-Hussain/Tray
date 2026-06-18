/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import {
  storePendingCall,
  storePendingChat,
} from './src/services/pending-notification.service';

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
          if (__DEV__) {
            console.log('📨 [Background] Message received at:', new Date().toISOString());
            console.log('📨 [Background] Message type:', remoteMessage?.data?.type || 'unknown');
          }

          try {
            const messageData = remoteMessage.data || {};

            if (__DEV__) {
              console.log('📨 [Background] Processing background notification');
            }

          // Handle different types of background messages
          if (messageData.type === 'call' || messageData.callId) {
            await storePendingCall({
              callId: messageData.callId,
              callType: messageData.callType || 'audio',
              callerId: messageData.callerId,
              receiverId: messageData.receiverId || messageData.userId,
            });
          } else if (
            messageData.type === 'chat_message' ||
            messageData.chatId
          ) {
            await storePendingChat({
              chatId: messageData.chatId,
              senderId: messageData.senderId,
            });
          } else if (messageData.type === 'booking' || messageData.bookingId) {
            if (__DEV__) {
              console.log('📅 [Background] Processing booking notification');
            }
          } else if (__DEV__) {
            console.log('📢 [Background] Processing generic notification');
          }
        } catch (error) {
          if (__DEV__) {
            console.error(
              '❌ [Background] Error processing background message:',
              error,
            );
          }
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
