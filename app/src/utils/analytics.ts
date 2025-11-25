/**
 * Analytics Utility
 * Centralized analytics tracking for production builds
 * 
 * To enable:
 * 1. Firebase Analytics is already installed via @react-native-firebase/app
 * 2. Initialize in App.tsx
 * 3. Uncomment the Firebase Analytics code below
 */

// Uncomment when ready to use:
// import analytics from '@react-native-firebase/analytics';

/**
 * Initialize analytics
 * Call this in App.tsx after Firebase is initialized
 */
export const initAnalytics = async (): Promise<void> => {
  if (__DEV__) {
    // Analytics disabled in development by default
    // Set to true to test analytics in development
    return;
  }

  // Uncomment when ready:
  /*
  try {
    await analytics().setAnalyticsCollectionEnabled(true);
    if (__DEV__) {
      console.log('✅ Analytics initialized');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Failed to initialize analytics:', error);
    }
  }
  */
};

/**
 * Log a screen view
 */
export const logScreenView = async (screenName: string, screenClass?: string): Promise<void> => {
  if (__DEV__) {
    console.log(`[Analytics] Screen view: ${screenName}`);
    return;
  }

  // Uncomment when ready:
  /*
  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
  }
  */
};

/**
 * Log an event
 */
export const logEvent = async (
  eventName: string,
  params?: Record<string, any>,
): Promise<void> => {
  if (__DEV__) {
    console.log(`[Analytics] Event: ${eventName}`, params);
    return;
  }

  // Uncomment when ready:
  /*
  try {
    // Filter out sensitive data
    const safeParams = params ? { ...params } : {};
    delete safeParams.password;
    delete safeParams.token;
    delete safeParams.apiKey;

    await analytics().logEvent(eventName, safeParams);
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
  }
  */
};

/**
 * Set user properties
 */
export const setUserProperties = async (properties: Record<string, any>): Promise<void> => {
  if (__DEV__) {
    console.log('[Analytics] User properties:', properties);
    return;
  }

  // Uncomment when ready:
  /*
  try {
    // Filter out sensitive data
    const safeProperties = { ...properties };
    delete safeProperties.password;
    delete safeProperties.token;
    delete safeProperties.apiKey;

    await analytics().setUserProperties(safeProperties);
  } catch (error) {
    // Silently fail
  }
  */
};

/**
 * Set user ID
 */
export const setUserId = async (userId: string): Promise<void> => {
  if (__DEV__) {
    console.log(`[Analytics] User ID: ${userId}`);
    return;
  }

  // Uncomment when ready:
  /*
  try {
    await analytics().setUserId(userId);
  } catch (error) {
    // Silently fail
  }
  */
};

/**
 * Common event names (standardize across app)
 */
export const Events = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'signup',
  PASSWORD_RESET: 'password_reset',

  // Job Applications
  JOB_VIEW: 'job_view',
  JOB_APPLY: 'job_apply',
  APPLICATION_VIEW: 'application_view',

  // Payments
  PAYMENT_STARTED: 'payment_started',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',

  // Profile
  PROFILE_UPDATE: 'profile_update',
  RESUME_CREATE: 'resume_create',
  RESUME_UPDATE: 'resume_update',

  // Consultant
  CONSULTANT_PROFILE_CREATE: 'consultant_profile_create',
  SERVICE_CREATE: 'service_create',
  BOOKING_CREATE: 'booking_create',
} as const;

