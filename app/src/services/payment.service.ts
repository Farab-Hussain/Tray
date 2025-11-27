import { api } from '../lib/fetcher';

export interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  bookingId: string;
  studentId: string;
  consultantId: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface PaymentIntentError {
  error: string;
}

class PaymentService {
  /**
   * Create a payment intent for a booking
   */
  async createPaymentIntent(data: PaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      const response = await api.post<PaymentIntentResponse>('/payment/create-payment-intent', {
        amount: data.amount,
        currency: data.currency || 'usd',
        bookingId: data.bookingId,
        studentId: data.studentId,
        consultantId: data.consultantId,
      });

      return response.data;
    } catch (error: any) {
            if (__DEV__) {
        console.error('Error creating payment intent:', error)
      };
      throw new Error(error.response?.data?.error || 'Failed to create payment intent');
    }
  }

  /**
   * Confirm a payment intent (for future use with Stripe Elements)
   */
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string) {
    try {
            if (__DEV__) {
        console.log('Confirming payment intent:', paymentIntentId, 'with method:', paymentMethodId)
      };
      
      
      return { success: true, paymentIntentId };
    } catch (error: any) {
            if (__DEV__) {
        console.error('Error confirming payment intent:', error)
      };
      throw new Error('Failed to confirm payment');
    }
  }

  async handlePaymentSuccess(paymentIntentId: string, bookingId: string) {
    try {
            if (__DEV__) {
        console.log('Payment successful for booking:', bookingId)
      };
      
      return { success: true, bookingId };
    } catch (error: any) {
            if (__DEV__) {
        console.error('Error handling payment success:', error)
      };
      throw new Error('Failed to process payment success');
    }
  }

  async handlePaymentFailure(paymentIntentId: string, bookingId: string, error: string) {
    try {
            if (__DEV__) {
        console.log('Payment failed for booking:', bookingId, 'Error:', error)
      };
      
      
      return { success: true, bookingId, error };
    } catch (err: any) {
            if (__DEV__) {
        console.error('Error handling payment failure:', err)
      };
      throw new Error('Failed to process payment failure');
    }
  }

  /**
   * Create Stripe Connect account for consultant
   */
  async createConnectAccount(): Promise<{ accountId: string; onboardingUrl: string }> {
    try {
      const response = await api.post<{ accountId: string; onboardingUrl: string; message: string }>('/payment/connect/create-account');
      return {
        accountId: response.data.accountId,
        onboardingUrl: response.data.onboardingUrl,
      };
    } catch (error: any) {
            if (__DEV__) {
        console.error('Error creating Stripe Connect account:', error)
      };
      throw new Error(error.response?.data?.error || 'Failed to create Stripe account');
    }
  }

  /**
   * Get Stripe Connect account status
   */
  async getConnectAccountStatus(): Promise<{
    hasAccount: boolean;
    accountId?: string;
    status?: {
      detailsSubmitted: boolean;
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      isComplete: boolean;
    };
    onboardingUrl?: string | null;
  }> {
    try {
      const response = await api.get<{
        hasAccount: boolean;
        accountId?: string;
        status?: {
          detailsSubmitted: boolean;
          chargesEnabled: boolean;
          payoutsEnabled: boolean;
          isComplete: boolean;
        };
        onboardingUrl?: string | null;
      }>('/payment/connect/account-status');
      return response.data;
    } catch (error: any) {
            if (__DEV__) {
        console.error('Error getting Stripe account status:', error)
      };
      throw new Error(error.response?.data?.error || 'Failed to get account status');
    }
  }

  async getPlatformFeeConfig(): Promise<{
    platformFeeAmount: number;
    updatedAt?: string;
    updatedBy?: string;
    source?: string;
  }> {
    try {
      const response = await api.get('/payment/platform-fee');
      return response.data;
    } catch (error: any) {
            if (__DEV__) {
        console.error('Error fetching platform fee config:', error)
      };
      throw new Error(error.response?.data?.error || 'Failed to load platform fee configuration');
    }
  }

  async updatePlatformFeeConfig(platformFeeAmount: number) {
    try {
      const response = await api.put('/payment/platform-fee', { platformFeeAmount });
      return response.data;
    } catch (error: any) {
            if (__DEV__) {
        console.error('Error updating platform fee config:', error)
      };
      throw new Error(error.response?.data?.error || 'Failed to update platform fee configuration');
    }
  }
}

export default new PaymentService();
