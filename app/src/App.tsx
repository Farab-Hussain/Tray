import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import Toast from 'react-native-toast-message';
import RootNavigator from './navigator/RootNavigation';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { navigationRef } from './navigator/navigationRef';

// Initialize React Native Firebase App (required for messaging)
// Do this silently to avoid deprecation warnings during initialization
try {
  // Suppress warnings during Firebase initialization
  const originalWarn = console.warn;
  console.warn = () => {}; // Temporarily suppress warnings
  
  const firebaseApp = require('@react-native-firebase/app');
  if (firebaseApp && firebaseApp.default) {
    // Firebase App auto-initializes from GoogleService-Info.plist
    // Don't call getApp() here to avoid deprecation warning
    if (__DEV__) {
      console.log('✅ [Firebase] React Native Firebase App initialized');
    }
  }
  
  // Restore warnings
  console.warn = originalWarn;
} catch (error: any) {
  // Restore warnings if error occurred
  if (typeof console.warn === 'function') {
    // Already restored above
  }
  if (__DEV__) {
    // Only log if it's a real error, not just missing module
    if (!error.message?.includes('not installed natively')) {
      console.warn('⚠️ [Firebase] React Native Firebase App not available:', error.message);
    }
  }
}

// Stripe publishable key from environment variables
import { STRIPE_PUBLISHABLE_KEY } from '@env';

// Suppress React Native deprecation warnings
// This warning comes from React Navigation library, not our code
// It will be fixed when React Navigation updates to use requestIdleCallback
if (typeof console.warn === 'function') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    // Suppress InteractionManager deprecation warnings
    // Suppress Firebase deprecation warnings (they work fine, just deprecated API)
    if (!message.includes('InteractionManager has been deprecated') &&
        !message.includes('This method is deprecated') &&
        !message.includes('react-native-firebase') &&
        !message.includes('migrating-to-v22') &&
        !message.includes('Please use `getApp()` instead')) {
      originalWarn.apply(console, args);
    }
  };
}

// Validate Stripe key exists
if (__DEV__) {
  if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY === 'pk_test_...' || STRIPE_PUBLISHABLE_KEY.includes('XXXX')) {
    console.warn('⚠️ STRIPE_PUBLISHABLE_KEY is not properly configured. Payment features may not work.');
  }
}

export default function App() {
  // Use a fallback if key is missing to prevent app crash
  const stripeKey = STRIPE_PUBLISHABLE_KEY || 'pk_test_missing_key';
  
  return (
    <StripeProvider publishableKey={stripeKey}>
      <AuthProvider>
        <ChatProvider>
          <NotificationProvider>
            <NavigationContainer ref={navigationRef}>
              <RootNavigator />
            </NavigationContainer>
            <Toast />
          </NotificationProvider>
        </ChatProvider>
      </AuthProvider>
    </StripeProvider>
  );
}
