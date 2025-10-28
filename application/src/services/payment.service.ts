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
      console.error('Error creating payment intent:', error);
      throw new Error(error.response?.data?.error || 'Failed to create payment intent');
    }
  }

  /**
   * Confirm a payment intent (for future use with Stripe Elements)
   */
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string) {
    try {
      console.log('Confirming payment intent:', paymentIntentId, 'with method:', paymentMethodId);
      
      
      return { success: true, paymentIntentId };
    } catch (error: any) {
      console.error('Error confirming payment intent:', error);
      throw new Error('Failed to confirm payment');
    }
  }

  async handlePaymentSuccess(paymentIntentId: string, bookingId: string) {
    try {
      console.log('Payment successful for booking:', bookingId);
      
      return { success: true, bookingId };
    } catch (error: any) {
      console.error('Error handling payment success:', error);
      throw new Error('Failed to process payment success');
    }
  }

  async handlePaymentFailure(paymentIntentId: string, bookingId: string, error: string) {
    try {
      console.log('Payment failed for booking:', bookingId, 'Error:', error);
      
      
      return { success: true, bookingId, error };
    } catch (err: any) {
      console.error('Error handling payment failure:', err);
      throw new Error('Failed to process payment failure');
    }
  }
}

export default new PaymentService();
