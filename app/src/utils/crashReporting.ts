/**
 * Crash reporting — no third-party provider configured.
 * ErrorBoundary and other callers use these helpers; wire Firebase Crashlytics here if needed later.
 */

export const initCrashReporting = (): void => {
  // no-op
};

export const captureException = (
  error: Error,
  context?: Record<string, unknown>,
): void => {
  if (__DEV__) {
    console.error('Exception:', error, context);
  }
};

export const captureMessage = (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
): void => {
  if (__DEV__) {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }
};

export const setUserContext = (_user: {
  id: string;
  email?: string;
  username?: string;
}): void => {
  // no-op
};

export const clearUserContext = (): void => {
  // no-op
};
