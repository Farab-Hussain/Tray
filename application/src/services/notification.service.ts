import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetcher } from './fetcher';

const FCM_TOKEN_KEY = 'fcm_token';

/**
 * Request notification permissions
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('✅ Notification permissions granted');
      return true;
    } else {
      console.log('❌ Notification permissions denied');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Get FCM token
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    // Check if we already have a token stored
    const savedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    if (savedToken) {
      console.log('📱 Using saved FCM token');
      return savedToken;
    }

    // Request permission first
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('No notification permission');
      return null;
    }

    // Get the FCM token
    const token = await messaging().getToken();
    if (token) {
      console.log('✅ FCM token obtained:', token);
      // Save token to AsyncStorage
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      return token;
    }

    return null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Register FCM token with backend
 */
export const registerFCMToken = async (fcmToken: string): Promise<void> => {
  try {
    // This endpoint should be provided by your backend
    await fetcher(`/fcm/token`, {
      method: 'POST',
      body: JSON.stringify({
        fcmToken,
        deviceType: 'ios',
      }),
    });
    console.log('✅ FCM token registered with backend');
  } catch (error) {
    console.error('Error registering FCM token:', error);
  }
};

/**
 * Delete FCM token from backend (on logout)
 */
export const deleteFCMToken = async (): Promise<void> => {
  try {
    await fetcher(`/fcm/token`, {
      method: 'DELETE',
      body: JSON.stringify({}),
    });
    console.log('✅ FCM token deleted from backend');
    // Also remove from local storage
    await AsyncStorage.removeItem(FCM_TOKEN_KEY);
  } catch (error) {
    console.error('Error deleting FCM token:', error);
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
    console.error('Error refreshing FCM token:', error);
    return null;
  }
};

/**
 * Listen for token refresh
 */
export const setupTokenRefreshListener = () => {
  return messaging().onTokenRefresh(async (token) => {
    console.log('🔄 FCM token refreshed:', token);
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    await registerFCMToken(token);
  });
};

/**
 * Handle foreground notifications
 */
export const setupForegroundMessageHandler = () => {
  return messaging().onMessage(async (remoteMessage) => {
    console.log('📨 Message received in foreground:', remoteMessage);
    // The notification will be shown automatically by the system
    // But you can customize it here if needed
  });
};

/**
 * Handle background notifications
 */
export const setupBackgroundMessageHandler = () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('📨 Message received in background:', remoteMessage);
    // The notification will be shown automatically by the system
  });
};

/**
 * Handle notification opened (app opened from notification)
 */
export const setupNotificationOpenedHandler = (callback: (data: any) => void) => {
  // Check if app was opened from a notification
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('📨 App opened from notification:', remoteMessage);
        callback(remoteMessage.data);
      }
    });

  // Listen for when a notification causes the app to open from background state
  return messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('📨 Notification caused app to open:', remoteMessage);
    callback(remoteMessage.data);
  });
};

/**
 * Get notification badge count (for app icon badge)
 */
export const getBadgeCount = async (): Promise<number> => {
  try {
    // Get unread count from your local state or API
    // This is just a placeholder
    return 0;
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
};

/**
 * Set app icon badge count
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  try {
    await messaging().setBadge(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
};

