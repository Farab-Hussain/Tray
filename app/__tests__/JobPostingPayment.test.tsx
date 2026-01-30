// app/__tests__/JobPostingPayment.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import JobPostingPaymentScreen from '../src/Screen/Recruiter/Payment/JobPostingPaymentScreen';
import PaymentService from '../src/services/payment.service';

// Mock dependencies
jest.mock('../src/services/payment.service');
jest.mock('@stripe/stripe-react-native', () => ({
  useStripe: () => ({
    initPaymentSheet: jest.fn(),
    presentPaymentSheet: jest.fn(),
  }),
  StripeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
    },
  }),
}));

jest.mock('../src/components/shared/ScreenHeader', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ title, onBackPress }: any) => (
      <Text testID="screen-header" onPress={onBackPress}>
        {title}
      </Text>
    ),
  };
});

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const mockRoute = {
  params: {
    jobData: {
      title: 'Test Job',
      description: 'Test Description',
    },
  },
};

describe('JobPostingPaymentScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderComponent = () => {
    return render(
      <StripeProvider publishableKey="test-key">
        <JobPostingPaymentScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      </StripeProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render the payment screen correctly', async () => {
      // Mock successful payment intent creation
      (PaymentService.createJobPostingPaymentIntent as jest.Mock).mockResolvedValue({
        success: true,
        clientSecret: 'test-client-secret',
        paymentIntentId: 'test-payment-intent-id',
        amount: 100,
        currency: 'usd',
        description: 'Job posting fee - $1.00',
      });

      // Mock successful payment sheet initialization
      const { initPaymentSheet } = require('@stripe/stripe-react-native').useStripe();
      initPaymentSheet.mockResolvedValue({ error: null });

      const { getByText, getByTestId } = renderComponent();

      await waitFor(() => {
        expect(getByText('Job Posting Payment')).toBeTruthy();
        expect(getByText('Job Posting Fee')).toBeTruthy();
        expect(getByText('$1.00')).toBeTruthy();
        expect(getByText('Pay $1.00')).toBeTruthy();
        expect(getByText('Cancel')).toBeTruthy();
      });
    });

    it('should show loading state initially', () => {
      // Mock payment intent creation
      (PaymentService.createJobPostingPaymentIntent as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { getByText } = renderComponent();

      expect(getByText('Initializing payment...')).toBeTruthy();
    });

    it('should display payment benefits correctly', async () => {
      (PaymentService.createJobPostingPaymentIntent as jest.Mock).mockResolvedValue({
        success: true,
        clientSecret: 'test-client-secret',
      });

      const { initPaymentSheet } = require('@stripe/stripe-react-native').useStripe();
      initPaymentSheet.mockResolvedValue({ error: null });

      const { getByText } = renderComponent();

      await waitFor(() => {
        expect(getByText('What you get:')).toBeTruthy();
        expect(getByText('• 30 days of job posting visibility')).toBeTruthy();
        expect(getByText('• Access to qualified candidates')).toBeTruthy();
        expect(getByText('• Application management tools')).toBeTruthy();
        expect(getByText('• Candidate matching system')).toBeTruthy();
      });
    });
  });

  describe('Payment Flow', () => {
    it('should initialize payment sheet on mount', async () => {
      const mockCreatePaymentIntent = PaymentService.createJobPostingPaymentIntent as jest.Mock;
      mockCreatePaymentIntent.mockResolvedValue({
        success: true,
        clientSecret: 'test-client-secret',
        paymentIntentId: 'test-payment-intent-id',
      });

      const { initPaymentSheet } = require('@stripe/stripe-react-native').useStripe();
      initPaymentSheet.mockResolvedValue({ error: null });

      renderComponent();

      await waitFor(() => {
        expect(mockCreatePaymentIntent).toHaveBeenCalled();
        expect(initPaymentSheet).toHaveBeenCalledWith({
          paymentIntentClientSecret: 'test-client-secret',
          merchantDisplayName: 'Tray Platform',
          allowsDelayedPaymentMethods: true,
          defaultBillingDetails: {
            name: 'Test User',
            email: 'test@example.com',
          },
        });
      });
    });

    it('should handle payment sheet initialization error', async () => {
      (PaymentService.createJobPostingPaymentIntent as jest.Mock).mockResolvedValue({
        success: true,
        clientSecret: 'test-client-secret',
      });

      const { initPaymentSheet } = require('@stripe/stripe-react-native').useStripe();
      initPaymentSheet.mockResolvedValue({ 
        error: { message: 'Payment sheet initialization failed' }
      });

      const spyAlert = jest.spyOn(Alert, 'alert');

      renderComponent();

      await waitFor(() => {
        expect(spyAlert).toHaveBeenCalledWith(
          'Error',
          'Failed to initialize payment sheet'
        );
      });
    });

    it('should handle payment intent creation failure', async () => {
      (PaymentService.createJobPostingPaymentIntent as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to create payment intent',
      });

      const spyAlert = jest.spyOn(Alert, 'alert');

      renderComponent();

      await waitFor(() => {
        expect(spyAlert).toHaveBeenCalledWith(
          'Error',
          'Failed to create payment intent'
        );
      });
    });

    it('should process payment successfully', async () => {
      (PaymentService.createJobPostingPaymentIntent as jest.Mock).mockResolvedValue({
        success: true,
        clientSecret: 'test-client-secret',
        paymentIntentId: 'test-payment-intent-id',
      });

      (PaymentService.confirmJobPostingPayment as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Payment confirmed',
      });

      const { initPaymentSheet, presentPaymentSheet } = require('@stripe/stripe-react-native').useStripe();
      initPaymentSheet.mockResolvedValue({ error: null });
      presentPaymentSheet.mockResolvedValue({ error: null });

      const { getByText } = renderComponent();

      await waitFor(() => {
        expect(getByText('Pay $1.00')).toBeTruthy();
      });

      fireEvent.press(getByText('Pay $1.00'));

      await waitFor(() => {
        expect(presentPaymentSheet).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(PaymentService.confirmJobPostingPayment).toHaveBeenCalledWith('test-payment-intent-id');
      });
    });

    it('should handle payment failure', async () => {
      (PaymentService.createJobPostingPaymentIntent as jest.Mock).mockResolvedValue({
        success: true,
        clientSecret: 'test-client-secret',
        paymentIntentId: 'test-payment-intent-id',
      });

      const { initPaymentSheet, presentPaymentSheet } = require('@stripe/stripe-react-native').useStripe();
      initPaymentSheet.mockResolvedValue({ error: null });
      presentPaymentSheet.mockResolvedValue({ 
        error: { message: 'Payment failed' }
      });

      const spyAlert = jest.spyOn(Alert, 'alert');

      const { getByText } = renderComponent();

      await waitFor(() => {
        expect(getByText('Pay $1.00')).toBeTruthy();
      });

      fireEvent.press(getByText('Pay $1.00'));

      await waitFor(() => {
        expect(spyAlert).toHaveBeenCalledWith(
          'Payment Failed',
          'Payment failed'
        );
      });
    });

    it('should navigate to job creation after successful payment', async () => {
      (PaymentService.createJobPostingPaymentIntent as jest.Mock).mockResolvedValue({
        success: true,
        clientSecret: 'test-client-secret',
        paymentIntentId: 'test-payment-intent-id',
      });

      (PaymentService.confirmJobPostingPayment as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Payment confirmed',
      });

      const { initPaymentSheet, presentPaymentSheet } = require('@stripe/stripe-react-native').useStripe();
      initPaymentSheet.mockResolvedValue({ error: null });
      presentPaymentSheet.mockResolvedValue({ error: null });

      const spyAlert = jest.spyOn(Alert, 'alert');
      spyAlert.mockImplementation((title, message, buttons) => {
        if (buttons && buttons[1] && buttons[1].onPress) {
          buttons[1].onPress();
        }
      });

      const { getByText } = renderComponent();

      await waitFor(() => {
        expect(getByText('Pay $1.00')).toBeTruthy();
      });

      fireEvent.press(getByText('Pay $1.00'));

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateJob', {
          jobData: mockRoute.params.jobData,
          paymentConfirmed: true,
        });
      });
    });
  });

  describe('User Interactions', () => {
    it('should handle cancel button press', async () => {
      (PaymentService.createJobPostingPaymentIntent as jest.Mock).mockResolvedValue({
        success: true,
        clientSecret: 'test-client-secret',
      });

      const { initPaymentSheet } = require('@stripe/stripe-react-native').useStripe();
      initPaymentSheet.mockResolvedValue({ error: null });

      const spyAlert = jest.spyOn(Alert, 'alert');
      spyAlert.mockImplementation((title, message, buttons) => {
        if (buttons && buttons[1] && buttons[1].onPress) {
          buttons[1].onPress();
        }
      });

      const { getByText } = renderComponent();

      await waitFor(() => {
        expect(getByText('Cancel')).toBeTruthy();
      });

      fireEvent.press(getByText('Cancel'));

      await waitFor(() => {
        expect(spyAlert).toHaveBeenCalledWith(
          'Cancel Payment',
          'Are you sure you want to cancel? Your job posting will not be processed.',
          expect.any(Array)
        );
      });

      await waitFor(() => {
        expect(mockNavigation.goBack).toHaveBeenCalled();
      });
    });

    it('should handle back button press', async () => {
      (PaymentService.createJobPostingPaymentIntent as jest.Mock).mockResolvedValue({
        success: true,
        clientSecret: 'test-client-secret',
      });

      const { initPaymentSheet } = require('@stripe/stripe-react-native').useStripe();
      initPaymentSheet.mockResolvedValue({ error: null });

      const { getByTestId } = renderComponent();

      await waitFor(() => {
        expect(getByTestId('screen-header')).toBeTruthy();
      });

      fireEvent.press(getByTestId('screen-header'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle payment confirmation failure', async () => {
      (PaymentService.createJobPostingPaymentIntent as jest.Mock).mockResolvedValue({
        success: true,
        clientSecret: 'test-client-secret',
        paymentIntentId: 'test-payment-intent-id',
      });

      (PaymentService.confirmJobPostingPayment as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Payment confirmation failed',
      });

      const { initPaymentSheet, presentPaymentSheet } = require('@stripe/stripe-react-native').useStripe();
      initPaymentSheet.mockResolvedValue({ error: null });
      presentPaymentSheet.mockResolvedValue({ error: null });

      const spyAlert = jest.spyOn(Alert, 'alert');

      const { getByText } = renderComponent();

      await waitFor(() => {
        expect(getByText('Pay $1.00')).toBeTruthy();
      });

      fireEvent.press(getByText('Pay $1.00'));

      await waitFor(() => {
        expect(spyAlert).toHaveBeenCalledWith(
          'Error',
          'Payment confirmation failed'
        );
      });
    });

    it('should handle network errors during payment', async () => {
      (PaymentService.createJobPostingPaymentIntent as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const spyAlert = jest.spyOn(Alert, 'alert');

      renderComponent();

      await waitFor(() => {
        expect(spyAlert).toHaveBeenCalledWith(
          'Error',
          'Failed to initialize payment'
        );
      });
    });
  });

  describe('Component State', () => {
    it('should disable pay button during processing', async () => {
      (PaymentService.createJobPostingPaymentIntent as jest.Mock).mockResolvedValue({
        success: true,
        clientSecret: 'test-client-secret',
        paymentIntentId: 'test-payment-intent-id',
      });

      const { initPaymentSheet, presentPaymentSheet } = require('@stripe/stripe-react-native').useStripe();
      initPaymentSheet.mockResolvedValue({ error: null });
      
      // Mock a long-running payment process
      presentPaymentSheet.mockImplementation(() => new Promise(() => {}));

      const { getByText } = renderComponent();

      await waitFor(() => {
        expect(getByText('Pay $1.00')).toBeTruthy();
      });

      fireEvent.press(getByText('Pay $1.00'));

      // Button should be disabled during processing
      const payButton = getByText('Pay $1.00');
      expect(payButton.props.disabled).toBe(true);
    });

    it('should show correct payment amount', async () => {
      (PaymentService.createJobPostingPaymentIntent as jest.Mock).mockResolvedValue({
        success: true,
        clientSecret: 'test-client-secret',
        amount: 100,
        currency: 'usd',
      });

      const { initPaymentSheet } = require('@stripe/stripe-react-native').useStripe();
      initPaymentSheet.mockResolvedValue({ error: null });

      const { getByText } = renderComponent();

      await waitFor(() => {
        expect(getByText('$1.00')).toBeTruthy();
        expect(getByText('Pay $1.00')).toBeTruthy();
      });
    });
  });
});
