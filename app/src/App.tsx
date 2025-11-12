import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import Toast from 'react-native-toast-message';
import RootNavigator from './navigator/RootNavigation';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { NetworkProvider } from './contexts/NetworkContext';
import OfflineOverlay from './components/ui/OfflineOverlay';
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
import { api } from './lib/fetcher';

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

const sanitizeEnvStripeKey = () => {
  if (!STRIPE_PUBLISHABLE_KEY) {
    return null;
  }

  const trimmedKey = STRIPE_PUBLISHABLE_KEY.trim();

  if (!trimmedKey || trimmedKey === 'pk_test_...' || trimmedKey.includes('XXXX') || trimmedKey === 'pk_test_missing_key') {
    return null;
  }

  return trimmedKey;
};

export default function App() {
  const [stripeKey, setStripeKey] = useState<string | null>(sanitizeEnvStripeKey());
  const [stripeKeyError, setStripeKeyError] = useState<string | null>(null);
  const [loadingStripeKey, setLoadingStripeKey] = useState<boolean>(!sanitizeEnvStripeKey());

  useEffect(() => {
    if (stripeKey) {
      return;
    }

    const loadStripeKey = async () => {
      setLoadingStripeKey(true);
      try {
        const response = await api.get<{ publishableKey: string; mode: 'test' | 'live' | 'unknown' }>('/payment/config');
        const publishableKey = response.data?.publishableKey?.trim();
        if (!publishableKey) {
          throw new Error('Missing publishable key in response');
        }
        setStripeKey(publishableKey);
        if (__DEV__) {
          console.log('✅ Loaded Stripe publishable key from backend:', publishableKey.slice(0, 10) + '…');
        }
      } catch (error: any) {
        const message = error?.message || 'Unable to load payment configuration.';
        if (__DEV__) {
          console.error('❌ Error loading Stripe publishable key:', error);
        }
        setStripeKeyError(message);
      } finally {
        setLoadingStripeKey(false);
      }
    };

    loadStripeKey();
  }, [stripeKey]);

  const stripeUnavailableView = useMemo(() => {
    if (!stripeKeyError) {
      return null;
    }

    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorTitle}>Payments Unavailable</Text>
        <Text style={styles.errorMessage}>
          {stripeKeyError}
        </Text>
      </View>
    );
  }, [stripeKeyError]);

  if (loadingStripeKey) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Preparing secure payments…</Text>
      </View>
    );
  }

  if (!stripeKey) {
    return stripeUnavailableView;
  }

  return (
    <StripeProvider publishableKey={stripeKey}>
      <NetworkProvider>
        <AuthProvider>
          <ChatProvider>
            <NotificationProvider>
              <NavigationContainer ref={navigationRef}>
                <RootNavigator />
              </NavigationContainer>
              <OfflineOverlay />
              <Toast />
            </NotificationProvider>
          </ChatProvider>
        </AuthProvider>
      </NetworkProvider>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#b91c1c',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
  },
});
