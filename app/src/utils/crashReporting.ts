/**
 * Crash Reporting Utility
 * Centralized crash reporting for production builds
 * 
 * To enable:
 * 1. Install: npm install @sentry/react-native
 * 2. Initialize in App.tsx
 * 3. Uncomment the Sentry code below
 */

// Uncomment when Sentry is installed:
// import * as Sentry from '@sentry/react-native';

/**
 * Initialize crash reporting
 * Call this in App.tsx before rendering
 */
export const initCrashReporting = (): void => {
  if (__DEV__) {
    // Don't initialize crash reporting in development
    return;
  }

  // Uncomment when Sentry is installed:
  /*
  Sentry.init({
    dsn: 'YOUR_SENTRY_DSN_HERE',
    enableInExpoDevelopment: false,
    debug: false,
    environment: 'production',
    tracesSampleRate: 0.2, // 20% of transactions
    beforeSend(event) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.Authorization;
      }
      return event;
    },
  });
  */
};

/**
 * Capture an exception
 */
export const captureException = (error: Error, context?: Record<string, any>): void => {
  if (__DEV__) {
    console.error('Exception (would be reported in production):', error, context);
    return;
  }

  // Uncomment when Sentry is installed:
  /*
  Sentry.captureException(error, {
    contexts: {
      custom: context || {},
    },
  });
  */
};

/**
 * Capture a message
 */
export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info'): void => {
  if (__DEV__) {
    console.log(`[${level.toUpperCase()}] ${message}`);
    return;
  }

  // Uncomment when Sentry is installed:
  /*
  Sentry.captureMessage(message, {
    level: level as Sentry.SeverityLevel,
  });
  */
};

/**
 * Set user context for crash reports
 */
export const setUserContext = (user: { id: string; email?: string; username?: string }): void => {
  if (__DEV__) {
    return;
  }

  // Uncomment when Sentry is installed:
  /*
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
  */
};

/**
 * Clear user context
 */
export const clearUserContext = (): void => {
  if (__DEV__) {
    return;
  }

  // Uncomment when Sentry is installed:
  /*
  Sentry.setUser(null);
  */
};

