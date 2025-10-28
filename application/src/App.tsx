import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import Toast from 'react-native-toast-message';
import RootNavigator from './navigator/RootNavigation';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';

// Stripe publishable key from environment variables
import { STRIPE_PUBLISHABLE_KEY } from '@env';

export default function App() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <AuthProvider>
        <ChatProvider>
          {/* <NotificationProvider> */}
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <Toast />
          {/* </NotificationProvider> */}
        </ChatProvider>
      </AuthProvider>
    </StripeProvider>
  );
}
