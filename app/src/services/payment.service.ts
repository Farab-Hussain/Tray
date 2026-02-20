import { api } from '../lib/fetcher';
import { logger } from '../utils/logger';

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
  amount?: number;
  currency?: string;
  description?: string;
  success?: boolean;
  error?: string;
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
        logger.error('Error creating payment intent:', error)
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
        logger.debug('Confirming payment intent:', paymentIntentId, 'with method:', paymentMethodId)
      };
      
      
      return { success: true, paymentIntentId };
    } catch (error: any) {
            if (__DEV__) {
        logger.error('Error confirming payment intent:', error)
      };
      throw new Error('Failed to confirm payment');
    }
  }

  async handlePaymentSuccess(paymentIntentId: string, bookingId: string) {
    try {
            if (__DEV__) {
        logger.debug('Payment successful for booking:', bookingId)
      };
      
      return { success: true, bookingId };
    } catch (error: any) {
            if (__DEV__) {
        logger.error('Error handling payment success:', error)
      };
      throw new Error('Failed to process payment success');
    }
  }

  async handlePaymentFailure(paymentIntentId: string, bookingId: string, error: string) {
    try {
            if (__DEV__) {
        logger.debug('Payment failed for booking:', bookingId, 'Error:', error)
      };
      
      
      return { success: true, bookingId, error };
    } catch (err: any) {
            if (__DEV__) {
        logger.error('Error handling payment failure:', err)
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
        logger.error('Error creating Stripe Connect account:', error)
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
        logger.error('Error getting Stripe account status:', error)
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
        logger.error('Error fetching platform fee config:', error)
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
        logger.error('Error updating platform fee config:', error)
      };
      throw new Error(error.response?.data?.error || 'Failed to update platform fee configuration');
    }
  }

  /**
   * Create payment intent for job posting
   */
  async createJobPostingPaymentIntent(): Promise<PaymentIntentResponse> {
    try {
      if (__DEV__) {
        logger.debug('Creating job posting payment intent...')
      };

      const response = await api.post<PaymentIntentResponse>('/payment/job-posting/create-intent');

      if (__DEV__) {
        logger.debug('Job posting payment intent created:', response.data)
      };

      return {
        ...response.data,
        success: true
      };
    } catch (error: any) {
      if (__DEV__) {
        logger.error('Error creating job posting payment intent:', error)
      };
      
      return {
        clientSecret: '',
        paymentIntentId: '',
        success: false,
        error: error.response?.data?.error || 'Failed to create job posting payment intent'
      };
    }
  }

  /**
   * Confirm job posting payment
   */
  async confirmJobPostingPayment(paymentIntentId: string): Promise<PaymentIntentResponse> {
    try {
      if (__DEV__) {
        logger.debug('Confirming job posting payment:', paymentIntentId)
      };

      const response = await api.post<PaymentIntentResponse>('/payment/job-posting/confirm', {
        paymentIntentId
      });

      if (__DEV__) {
        logger.debug('Job posting payment confirmed:', response.data)
      };

      return {
        ...response.data,
        success: true
      };
    } catch (error: any) {
      if (__DEV__) {
        logger.error('Error confirming job posting payment:', error)
      };
      
      return {
        clientSecret: '',
        paymentIntentId: '',
        success: false,
        error: error.response?.data?.error || 'Failed to confirm job posting payment'
      };
    }
  }
}

export default new PaymentService();
