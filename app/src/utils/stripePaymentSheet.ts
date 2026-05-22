import { Platform } from 'react-native';

/** Shared Payment Sheet options — must match backend STRIPE_SECRET_KEY account. */
export const getStripePaymentSheetOptions = (
  clientSecret: string,
  billing?: { name?: string; email?: string },
) => ({
  paymentIntentClientSecret: clientSecret,
  merchantDisplayName: 'Tray Platform',
  allowsDelayedPaymentMethods: true,
  ...(Platform.OS === 'ios' ? { returnURL: 'tray://stripe-redirect' } : {}),
  defaultBillingDetails: {
    name: billing?.name || '',
    email: billing?.email || '',
  },
});

export const formatStripePaymentError = (message?: string): string => {
  if (!message) {
    return 'Payment could not be completed. Please try again.';
  }
  if (message.includes('No such payment_intent')) {
    return (
      'Payment setup is out of date. Tap Apply Code again (or reload the app), then pay. ' +
      'If this keeps happening, ensure app STRIPE_PUBLISHABLE_KEY matches backend STRIPE_SECRET_KEY (same Stripe account).'
    );
  }
  return message;
};
