import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { api } from '../lib/fetcher';
import { logger } from '../utils/logger';
import {
  markCallTerminal,
  navigateToIncomingCallIfNeeded,
} from './call-navigation.service';

const FCM_TOKEN_KEY = 'fcm_token';

// Safely import React Native Firebase messaging
let messaging: any = null;
try {
  // Suppress deprecation warnings during module loading
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    // Suppress Firebase deprecation warnings during initialization
    if (!message.includes('This method is deprecated') &&
        !message.includes('react-native-firebase') &&
        !message.includes('migrating-to-v22') &&
        !message.includes('Please use `getApp()` instead')) {
      originalWarn.apply(console, args);
    }
  };
  
  // First ensure Firebase App is initialized
  const firebaseApp = require('@react-native-firebase/app');
  if (!firebaseApp || !firebaseApp.default) {
    console.warn = originalWarn;
    throw new Error('Firebase App module not available');
  }
  
  // Then get messaging
  const messagingModule = require('@react-native-firebase/messaging');
  if (!messagingModule || !messagingModule.default) {
    console.warn = originalWarn;
    throw new Error('Messaging module not available');
  }
  
  messaging = messagingModule.default;
  
  // Restore warnings
  console.warn = originalWarn;
  
  if (__DEV__) {
    logger.debug('✅ [FCM] Firebase Messaging module loaded successfully');
  }
} catch (error: any) {
  // Restore warnings if error occurred (originalWarn is in outer scope)
  // Note: originalWarn may not be accessible here if error occurred before definition
  // This is okay - the warnings will still be suppressed by the global warning filter in App.tsx
  
  if (__DEV__) {
    // Only log if it's not the native module error (which is expected until rebuild)
    const errorMsg = error?.message || '';
    if (!errorMsg.includes('not installed natively') && 
        !errorMsg.includes('not installed on your project')) {
            if (__DEV__) {
        logger.debug('ℹ️ [FCM] React Native Firebase Messaging not available:', errorMsg || 'Unknown error')
      };
    }
        if (__DEV__) {
      logger.debug('ℹ️ [FCM] Push notifications will be disabled until native module is properly linked')
    };
  }
  messaging = null;
}

// Helper to check if messaging is available
const isMessagingAvailable = (): boolean => {
  try {
    return messaging !== null && typeof messaging === 'function';
  } catch {
    return false;
  }
};

// Suppress React Native Firebase deprecation warnings (they work fine, just deprecated API)
const suppressDeprecationWarnings = () => {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    // Suppress only React Native Firebase deprecation warnings
    if (!message.includes('deprecated') && !message.includes('rnfirebase.io/migrating') &&
      !message.includes('Please use') && !message.includes('will be removed')) {
      originalWarn.apply(console, args);
    }
  };
  return originalWarn;
};

const restoreConsoleWarn = (originalWarn: typeof console.warn) => {
  console.warn = originalWarn;
};

/**
 * Request notification permissions
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isMessagingAvailable()) {
    if (__DEV__) {
      logger.debug('ℹ️ [FCM] Messaging not available, skipping permission request');
    }
    return false;
  }

  try {
    const originalWarn = suppressDeprecationWarnings();
    let messagingInstance;
    try {
      messagingInstance = messaging();
      if (!messagingInstance) {
        throw new Error('Messaging instance is null');
      }
    } catch (linkError: any) {
      const errorMsg = linkError?.message || '';
      if (errorMsg.includes('not installed natively') || errorMsg.includes('not installed on your project')) {
        if (__DEV__) {
          // Use console.log instead of console.error since this is expected behavior until rebuild
          logger.debug('ℹ️ [FCM] Native module not installed. The app was built but the native module needs to be linked.');
                    if (__DEV__) {
            logger.debug('ℹ️ [FCM] Try: cd ios && pod install && cd .. && npx react-native run-ios --device')
          };
        }
        restoreConsoleWarn(originalWarn);
        return false;
      }
      throw linkError;
    }
    const authStatus = await messagingInstance.requestPermission();
    restoreConsoleWarn(originalWarn);

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      if (__DEV__) {
        logger.debug('✅ [FCM] Notification permissions granted');
      }
      return true;
    } else {
      if (__DEV__) {
        logger.debug('ℹ️ [FCM] Notification permissions denied or not determined');
      }
      return false;
    }
  } catch (error: any) {
    logger.error('❌ [FCM] Error requesting notification permission:', error.message || error);
    return false;
  }
};

/**
 * Get FCM token
 */
export const getFCMToken = async (): Promise<string | null> => {
  if (!isMessagingAvailable()) {
    if (__DEV__) {
      logger.debug('ℹ️ [FCM] Messaging not available, cannot get token');
    }
    return null;
  }

  try {
    // Request permission first
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      if (__DEV__) {
        logger.debug('ℹ️ [FCM] Notification permission denied');
      }
      return null;
    }

    if (__DEV__) {
      logger.debug('📱 [FCM] Getting token from Firebase...');
    }
    // Always get a fresh token from Firebase (it handles caching internally)
    const originalWarn = suppressDeprecationWarnings();
    let messagingInstance;
    try {
      messagingInstance = messaging();
      if (!messagingInstance) {
        throw new Error('Messaging instance is null');
      }
    } catch (linkError: any) {
      const errorMsg = linkError?.message || '';
      if (errorMsg.includes('not installed natively') || errorMsg.includes('not installed on your project')) {
        if (__DEV__) {
          // Use console.log instead of console.error since this is expected behavior until rebuild
          logger.debug('ℹ️ [FCM] Native module not installed. The app was built but the native module needs to be linked.');
                    if (__DEV__) {
            logger.debug('ℹ️ [FCM] Try: cd ios && pod install && cd .. && npx react-native run-ios --device')
          };
        }
        restoreConsoleWarn(originalWarn);
        return null;
      }
      throw linkError;
    }
    
    // On iOS, register for remote messages FIRST before getting token
    // This ensures APNS token is available before FCM token request
    if (Platform.OS === 'ios') {
      try {
        if (__DEV__) {
          logger.debug('📱 [FCM] Registering iOS device for remote messages (APNS)...');
        }
        await messagingInstance.registerDeviceForRemoteMessages();
        // Wait for APNS token to be obtained (iOS needs time to register with APNS)
        await new Promise<void>(resolve => setTimeout(() => resolve(), 3000));
        if (__DEV__) {
          logger.debug('✅ [FCM] iOS device registered for remote messages');
        }
      } catch (registerError: any) {
        const errorMsg = registerError?.message || '';
        if (errorMsg.includes('already registered')) {
          if (__DEV__) {
            logger.debug('ℹ️ [FCM] Device already registered for remote messages');
          }
          // Still wait a bit to ensure APNS token is ready
          await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
        } else {
          if (__DEV__) {
            logger.warn('⚠️ [FCM] Error registering for remote messages:', registerError.message || 'Unknown');
          }
          // Continue anyway - might still work
        }
      }
    }
    
    // Get token with retry mechanism
    let token: string | null = null;
    let retries = 3;
    
    while (retries > 0 && !token) {
      try {
        token = await messagingInstance.getToken();
        break; // Success, exit loop
      } catch (tokenError: any) {
        const errorCode = tokenError?.code || '';
        const errorMessage = tokenError?.message || '';
        
        // Handle APNS token not ready error
        if (errorCode === 'messaging/unknown' && 
            (errorMessage.includes('APNS token') || errorMessage.includes('No APNS token'))) {
          if (retries > 1) {
            if (__DEV__) {
              logger.debug(`ℹ️ [FCM] APNS token not ready, waiting... (${retries - 1} retries left)`);
            }
            // Wait longer for APNS token to be ready
            await new Promise<void>(resolve => setTimeout(() => resolve(), 2000));
            retries--;
            continue;
          } else {
            // Last retry failed
            if (__DEV__) {
              logger.warn('⚠️ [FCM] APNS token not available after retries');
            }
            restoreConsoleWarn(originalWarn);
            return null;
          }
        }
        
        // Handle unregistered device error
        if (errorCode === 'messaging/unregistered') {
          if (Platform.OS === 'ios') {
            // Try registering again
            try {
              await messagingInstance.registerDeviceForRemoteMessages();
              await new Promise<void>(resolve => setTimeout(() => resolve(), 2000));
            } catch {
              // Ignore registration errors
            }
          }
          
          if (retries > 1) {
            if (__DEV__) {
              logger.debug(`ℹ️ [FCM] Device not registered, retrying... (${retries - 1} retries left)`);
            }
            await new Promise<void>(resolve => setTimeout(() => resolve(), 2000));
            retries--;
            continue;
          } else {
            if (__DEV__) {
              logger.warn('⚠️ [FCM] Failed to get token after all retries');
            }
            restoreConsoleWarn(originalWarn);
            return null;
          }
        }
        
        // Other errors - throw immediately
        throw tokenError;
      }
    }
    restoreConsoleWarn(originalWarn);
    if (token) {
      if (__DEV__) {
        logger.debug('✅ [FCM] Token obtained successfully');
      }
      // Save token to AsyncStorage for quick access
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      if (__DEV__) {
        logger.debug('✅ [FCM] Token saved successfully');
      }
      return token;
    }

    if (__DEV__) {
    logger.warn('⚠️ [FCM] No token returned from Firebase');
    }
    return null;
  } catch (error: any) {
    // Only log detailed errors in development
    if (__DEV__) {
    logger.error('❌ [FCM] Error getting token:', error.message || error);
    logger.error('❌ [FCM] Error code:', error.code);
    logger.error('❌ [FCM] Error stack:', error.stack);
    } else {
      // In production, only log minimal error info
            if (__DEV__) {
        logger.error('❌ [FCM] Failed to get token:', error.code || 'unknown')
      };
    }
    return null;
  }
};

/**
 * Ensure the device FCM token is registered with the backend (idempotent).
 * Call on login, app foreground, and after permission grants.
 */
export const ensurePushNotificationsRegistered = async (
  options?: { forceRefresh?: boolean }
): Promise<boolean> => {
  try {
    let token: string | null = null;

    if (options?.forceRefresh) {
      token = await getFCMToken();
    } else {
      token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      if (!token) {
        token = await getFCMToken();
      }
    }

    if (!token) {
      if (__DEV__) {
        logger.warn('⚠️ [FCM] No token available — push notifications will not work until permission is granted');
      }
      return false;
    }

    await registerFCMToken(token);
    return true;
  } catch (error: any) {
    logger.error('❌ [FCM] ensurePushNotificationsRegistered failed:', error?.message || error);
    return false;
  }
};

/**
 * Register FCM token with backend
 */
export const registerFCMToken = async (fcmToken: string): Promise<void> => {
  try {
    const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
    await api.post('/fcm/token', {
      fcmToken,
      deviceType,
    });
    if (__DEV__) {
      logger.debug('✅ FCM token registered with backend');
    }
  } catch (error: any) {
    logger.error('❌ Error registering FCM token:', error.response?.data || error.message);
    // Don't throw - allow app to continue if token registration fails
  }
};

/**
 * Delete FCM token from backend (on logout)
 */
export const deleteFCMToken = async (fcmToken?: string): Promise<void> => {
  try {
    await api.delete('/fcm/token', {
      data: fcmToken ? { fcmToken } : {},
    });
    if (__DEV__) {
      logger.debug('✅ FCM token deleted from backend');
    }
    // Also remove from local storage
    await AsyncStorage.removeItem(FCM_TOKEN_KEY);
  } catch (error: any) {
    logger.error('❌ Error deleting FCM token:', error.response?.data || error.message);
    // Don't throw - allow app to continue if token deletion fails
  }
};

/**
 * Refresh FCM token (called when token changes)
 */
export const refreshFCMToken = async (): Promise<string | null> => {
  try {
    // Delete old token
    await deleteFCMToken();
    // Get new token
    const newToken = await getFCMToken();
    if (newToken) {
      // Register new token
      await registerFCMToken(newToken);
    }
    return newToken;
  } catch (error) {
        if (__DEV__) {
      logger.error('Error refreshing FCM token:', error)
    };
    return null;
  }
};

/**
 * Listen for token refresh
 */
export const setupTokenRefreshListener = () => {
  if (!isMessagingAvailable()) {
        if (__DEV__) {
      logger.warn('⚠️ [FCM] Messaging not available, skipping token refresh listener')
    };
    return () => { }; // Return empty cleanup function
  }

  const originalWarn = suppressDeprecationWarnings();
  const unsubscribe = messaging().onTokenRefresh(async (token: string) => {
    if (__DEV__) {
      logger.debug('🔄 FCM token refreshed');
    }
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    await registerFCMToken(token);
  });
  restoreConsoleWarn(originalWarn);
  return unsubscribe;
};

export const setupForegroundMessageHandler = () => {
  if (!isMessagingAvailable()) {
        if (__DEV__) {
      logger.warn('⚠️ [FCM] Messaging not available, skipping foreground handler')
    };
    return () => { }; // Return empty cleanup function
  }

  const originalWarn = suppressDeprecationWarnings();
  const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
    if (__DEV__) {
      logger.debug('📨 [Foreground] Message received while app is open:', remoteMessage);
    }
    
    // Extract message data and notification
    const messageData = remoteMessage.data || {};
    const notification = remoteMessage.notification || {};
    
    // Handle incoming call notifications
    if (messageData.type === 'call' || messageData.callId) {
      const callId = messageData.callId;
      const callType = messageData.callType || 'audio'; // 'audio' or 'video'
      const callerId = messageData.callerId;
      const receiverId = messageData.receiverId || messageData.userId;
      
            if (__DEV__) {
        logger.debug('📞 [Foreground] Incoming call notification received:', { 
        callId, 
        callType, 
        callerId, 
        receiverId,
        fullData: messageData 
      })
      };
      
      try {
        await navigateToIncomingCallIfNeeded(
          { callId, callType, callerId, receiverId },
          'foreground-fcm',
        );
      } catch (error: any) {
                if (__DEV__) {
          logger.error('❌ [Foreground] Error handling call notification:', error.message || error)
        };
      }
      
      return; // Don't process further for call notifications
    }
    
    // For foreground messages:
    // - iOS: AppDelegate shows notifications via UNUserNotificationCenter delegate
    // - Android: React Native Firebase automatically displays notifications when notification field is present in payload
    // Both platforms will show pop-up notifications even when app is in foreground
    
    if (messageData.chatId) {
            if (__DEV__) {
        logger.debug('💬 [Foreground] Chat message received for chat:', messageData.chatId)
      };
            if (__DEV__) {
        logger.debug('💬 [Foreground] Message from:', messageData.senderId)
      };
            if (__DEV__) {
        logger.debug('💬 [Foreground] Message text:', messageData.messageText || notification.body)
      };
      
      // The chat context will handle refreshing chats when messages arrive
      // No need to manually refresh here as the real-time listeners will pick it up
    }
    
    // The notification will be automatically displayed as a pop-up on both iOS and Android
    // iOS: Via AppDelegate's UNUserNotificationCenterDelegate
    // Android: Via React Native Firebase's automatic notification display
  });
  restoreConsoleWarn(originalWarn);
  return unsubscribe;
};

export const setupBackgroundMessageHandler = () => {
  // Background handler is registered in index.js
  // This function exists for API compatibility but does nothing
  if (__DEV__) {
    logger.debug('ℹ️ [FCM] Background handler is registered in index.js');
  }
  
  // Add background state monitoring for calls
  if (Platform.OS === 'ios') {
    // iOS specific background handling
    if (__DEV__) {
      logger.debug('📱 [FCM] Setting up iOS background call monitoring');
    }
  } else if (Platform.OS === 'android') {
    // Android specific background handling
    if (__DEV__) {
      logger.debug('🤖 [FCM] Setting up Android background call monitoring');
    }
  }
};

// Handle notification opened (app opened from notification)
export const setupNotificationOpenedHandler = (callback: (data: any) => void) => {
  if (!isMessagingAvailable()) {
        if (__DEV__) {
      logger.warn('⚠️ [FCM] Messaging not available, skipping notification opened handler')
    };
    return () => { }; // Return empty cleanup function
  }

  const originalWarn = suppressDeprecationWarnings();

  // Check if app was opened from a notification
  messaging()
    .getInitialNotification()
    .then((remoteMessage: any) => {
      if (remoteMessage) {
        if (__DEV__) {
        logger.debug('📨 App opened from notification:', remoteMessage);
        }
        
        const messageData = remoteMessage.data || {};
        
        // Handle incoming call notifications
        if (messageData.type === 'call' || messageData.callId) {
          handleIncomingCallNotification(messageData);
          return;
        }
        
        callback(remoteMessage.data);
      }
    });

  // Listen for when a notification causes the app to open from background state
  const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage: any) => {
    if (__DEV__) {
      logger.debug('📨 [Notification Opened] Notification caused app to open:', remoteMessage);
    }
    
    const messageData = remoteMessage.data || {};
    const notification = remoteMessage.notification || {};
    
        if (__DEV__) {
      logger.debug('📨 [Notification Opened] Message data:', messageData)
    };
        if (__DEV__) {
      logger.debug('📨 [Notification Opened] Notification:', notification)
    };
    
    // Handle incoming call notifications
    if (messageData.type === 'call' || messageData.callId) {
            if (__DEV__) {
        logger.debug('📞 [Notification Opened] Handling incoming call notification...')
      };
      handleIncomingCallNotification(messageData);
      return;
    }
    
    callback(remoteMessage.data);
  });

  restoreConsoleWarn(originalWarn);
  return unsubscribe;
};

/**
 * Setup notification opened handler with navigation support (when app is opened from notification)
 * Handles both initial notification and notification opened from background
 * This version accepts navigation object for action handling
 */
export const setupNotificationOpenedHandlerWithNavigation = (navigation: any) => {
  if (!isMessagingAvailable()) {
        if (__DEV__) {
      logger.warn('⚠️ [FCM] Messaging not available, skipping notification opened handler')
    };
    return () => { };
  }

  const originalWarn = suppressDeprecationWarnings();
  
  // Handle notification that opened app from quit state
  messaging()
    .getInitialNotification()
    .then((remoteMessage: any) => {
      if (remoteMessage) {
                if (__DEV__) {
          logger.debug('📱 [Notification Opened] App opened from notification:', remoteMessage)
        };
        handleNotificationAction(remoteMessage, navigation);
      }
    });

  // Handle notification that opened app from background
  const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage: any) => {
        if (__DEV__) {
      logger.debug('📱 [Notification Opened] App opened from background notification:', remoteMessage)
    };
    handleNotificationAction(remoteMessage, navigation);
  });
  
  restoreConsoleWarn(originalWarn);
  return unsubscribe;
};

/**
 * Handle notification actions (reply, accept, decline, etc.)
 */
const handleNotificationAction = async (remoteMessage: any, navigation: any) => {
  const messageData = remoteMessage.data || {};
  const action = messageData.action || remoteMessage.action; // Action from notification button
  
    if (__DEV__) {
    logger.debug('🔔 [Notification Action] Action:', action, 'Data:', messageData)
  };
  
  // Handle call notification actions
  if (messageData.type === 'call' || messageData.callId) {
    const callId = messageData.callId;
    const callType = messageData.callType || 'audio';
    const callerId = messageData.callerId;
    const receiverId = messageData.receiverId;
    
    if (action === 'accept') {
      await navigateToIncomingCallIfNeeded(
        { callId, callType, callerId, receiverId, autoAccept: true },
        'notification-action-accept',
      );
    } else if (action === 'decline') {
      // Decline the call
      const { endCall } = require('./call.service');
      markCallTerminal(callId);
      endCall(callId, 'missed').catch(() => {});
    } else {
      await navigateToIncomingCallIfNeeded(
        { callId, callType, callerId, receiverId },
        'notification-action-open',
      );
    }
    return;
  }
  
  // Handle message notification actions
  if (messageData.type === 'chat_message' || messageData.chatId) {
    const chatId = messageData.chatId;
    const senderId = messageData.senderId;
    
    if (action === 'reply') {
      // Navigate to chat screen with keyboard open
      setTimeout(() => {
        navigation.navigate('ChatScreen', {
          chatId,
          otherUserId: senderId,
          focusInput: true, // Flag to focus input
        });
      }, 200);
    } else if (action === 'mark_read') {
      // Note: This would need user context - handled in ChatContext
    } else {
      // Default: navigate to chat screen
      setTimeout(() => {
        navigation.navigate('ChatScreen', {
          chatId,
          otherUserId: senderId,
        });
      }, 200);
    }
    return;
  }
  
  // Handle booking notification actions
  if (messageData.type === 'booking' || messageData.bookingId) {
    const bookingId = messageData.bookingId;
    
    if (action === 'view') {
      // Navigate to booking details
      setTimeout(() => {
        navigation.navigate('BookingDetails', { bookingId });
      }, 200);
    }
    return;
  }
};

// Handle incoming call notification - navigate to calling screen
const handleIncomingCallNotification = async (data: any) => {
  const callId = data.callId;
  const callType = data.callType || 'audio'; // 'audio' or 'video'
  const callerId = data.callerId;
  const receiverId = data.receiverId || data.userId;
  
  if (__DEV__) {
    logger.debug('📞 [Call Notification] Handling incoming call:', { callId, callType, callerId, receiverId });
  }
  
  if (!callId || !callerId || !receiverId) {
    if (__DEV__) {
      logger.warn('⚠️ [Call Notification] Missing call parameters');
    }
    return;
  }
  
  try {
    await navigateToIncomingCallIfNeeded(
      { callId, callType, callerId, receiverId },
      'notification-open',
    );
  } catch (error: any) {
        if (__DEV__) {
      logger.error('❌ [Call Notification] Error setting up navigation:', error.message || error)
    };
  }
};

// Get notification badge count (for app icon badge)

export const getBadgeCount = async (): Promise<number> => {
  // Get unread count from your local state or API
  // This is just a placeholder
  return 0;
};

/**
 * Set app icon badge count
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  if (!isMessagingAvailable()) {
    return; // Silently fail if messaging not available
  }

  try {
    await messaging().setBadge(count);
  } catch (error) {
        if (__DEV__) {
      logger.error('Error setting badge count:', error)
    };
  }
};
