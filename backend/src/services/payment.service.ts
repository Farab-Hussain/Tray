// src/services/payment.service.ts
import { db } from "../config/firebase";
import { stripeClient } from "../utils/stripeClient";
import { Logger } from "../utils/logger";
import { getPlatformFeeAmount } from "./platformSettings.service";

export interface TransferResult {
  success: boolean;
  transferId?: string;
  amount?: number;
  platformFee?: number;
  error?: string;
  retryable?: boolean;
  code?: string;
  onboardingRequired?: boolean;
}

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  paymentIntentId: string;
  studentId: string;
  consultantId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'transferred' | 'failed' | 'refunded';
  paymentStatus: 'succeeded' | 'failed' | 'refunded';
  transferId?: string;
  transferStatus?: 'pending' | 'completed' | 'failed';
  platformFee?: number;
  transferAmount?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  transferredAt?: string;
}

/**
 * Store payment transaction record in database
 */
export const storePaymentTransaction = async (
  paymentIntentId: string,
  bookingId: string,
  metadata: {
    studentId: string;
    consultantId: string;
    amount: number;
    currency: string;
  }
): Promise<PaymentTransaction> => {
  try {
    const transactionRef = db.collection("paymentTransactions").doc();
    const transactionData: PaymentTransaction = {
      id: transactionRef.id,
      bookingId,
      paymentIntentId,
      studentId: metadata.studentId,
      consultantId: metadata.consultantId,
      amount: metadata.amount,
      currency: metadata.currency,
      status: 'paid',
      paymentStatus: 'succeeded',
      transferStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await transactionRef.set(transactionData);
    Logger.info("Payment", bookingId, `Payment transaction stored: ${transactionRef.id}`);
    
    return transactionData;
  } catch (error: any) {
    Logger.error("Payment", bookingId, `Failed to store payment transaction: ${error.message}`, error);
    throw error;
  }
};

/**
 * Transfer payment to consultant after session completion
 * Includes retry logic and proper error handling
 */
export const transferPaymentToConsultant = async (
  bookingId: string,
  retryCount: number = 0,
  maxRetries: number = 3
): Promise<TransferResult> => {
  try {
    // Get booking details
    const bookingDoc = await db.collection("bookings").doc(bookingId).get();
    if (!bookingDoc.exists) {
      return {
        success: false,
        error: "Booking not found",
        retryable: false,
      };
    }

    const bookingData = bookingDoc.data();
    
    // Check if already transferred
    if (bookingData?.paymentTransferred) {
      Logger.info("Payment", bookingId, "Payment already transferred");
      return {
        success: true,
        transferId: bookingData.transferId,
        amount: bookingData.transferAmount,
        platformFee: bookingData.platformFee,
      };
    }

    // Validate required fields
    if (bookingData?.paymentStatus !== "paid") {
      return {
        success: false,
        error: `Booking payment status is ${bookingData?.paymentStatus}, not paid`,
        retryable: false,
      };
    }

    if (!bookingData?.amount) {
      return {
        success: false,
        error: "Booking amount not found",
        retryable: false,
      };
    }

    const consultantId = bookingData.consultantId;
    if (!consultantId) {
      return {
        success: false,
        error: "Consultant ID not found in booking",
        retryable: false,
      };
    }

    // Get consultant's Stripe account
    const consultantDoc = await db.collection("consultants").doc(consultantId).get();
    if (!consultantDoc.exists) {
      return {
        success: false,
        error: "Consultant not found",
        retryable: false,
      };
    }

    const consultantData = consultantDoc.data();
    const stripeAccountId = consultantData?.stripeAccountId;

    if (!stripeAccountId) {
      return {
        success: false,
        error: "Consultant does not have a Stripe account. Please set up payment account first.",
        retryable: false,
        code: 'NO_STRIPE_ACCOUNT',
        onboardingRequired: true
      };
    }

    // Verify account is active and ready to receive transfers
    const account = await stripeClient.accounts.retrieve(stripeAccountId);
    if (!account.details_submitted || !account.charges_enabled || !account.payouts_enabled) {
      return {
        success: false,
        error: "Consultant's Stripe account is not fully set up. Please complete onboarding.",
        retryable: false,
        code: 'ACCOUNT_NOT_READY',
        onboardingRequired: true
      };
    }

    // Calculate platform fee and transfer amount
    const platformFeeAmountDollars = await getPlatformFeeAmount();
    const platformFeeAmount = Math.round(platformFeeAmountDollars * 100); // Convert to cents
    const bookingAmount = typeof bookingData.amount === 'number' 
      ? bookingData.amount 
      : parseFloat(bookingData.amount);
    const transferAmount = Math.round(bookingAmount * 100) - platformFeeAmount;

    if (transferAmount <= 0) {
      return {
        success: false,
        error: `Transfer amount is zero or negative. Booking amount: $${bookingAmount}, Platform fee: $${platformFeeAmountDollars}`,
        retryable: false,
      };
    }

    // Create transfer to consultant
    const transfer = await stripeClient.transfers.create({
      amount: transferAmount,
      currency: "usd",
      destination: stripeAccountId,
      description: `Payment for booking ${bookingId}`,
      metadata: {
        bookingId,
        consultantId,
        studentId: bookingData.studentId,
        platformFee: platformFeeAmount.toString(),
      },
    });

    // Update booking with transfer information
    await db.collection("bookings").doc(bookingId).update({
      paymentTransferred: true,
      transferId: transfer.id,
      transferAmount: transferAmount / 100, // Convert back to dollars
      platformFee: platformFeeAmount / 100,
      transferredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Update payment transaction if it exists
    const transactionSnapshot = await db
      .collection("paymentTransactions")
      .where("bookingId", "==", bookingId)
      .limit(1)
      .get();

    if (!transactionSnapshot.empty) {
      const transactionDoc = transactionSnapshot.docs[0];
      await transactionDoc.ref.update({
        status: 'transferred',
        transferStatus: 'completed',
        transferId: transfer.id,
        transferAmount: transferAmount / 100,
        platformFee: platformFeeAmount / 100,
        transferredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    Logger.info("Payment", bookingId, `✅ Transferred $${transferAmount / 100} to consultant ${consultantId} (Transfer ID: ${transfer.id})`);

    return {
      success: true,
      transferId: transfer.id,
      amount: transferAmount / 100,
      platformFee: platformFeeAmount / 100,
    };
  } catch (error: any) {
    Logger.error("Payment", bookingId, `Failed to transfer payment (attempt ${retryCount + 1}/${maxRetries}): ${error.message}`, error);

    // Determine if error is retryable
    const isRetryable = 
      retryCount < maxRetries &&
      (error.type === 'StripeConnectionError' ||
       error.type === 'StripeAPIError' ||
       error.code === 'ECONNRESET' ||
       error.code === 'ETIMEDOUT');

    if (isRetryable) {
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      Logger.info("Payment", bookingId, `Retrying transfer in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return transferPaymentToConsultant(bookingId, retryCount + 1, maxRetries);
    }

    return {
      success: false,
      error: error.message || 'Failed to transfer payment',
      retryable: isRetryable,
      code: error.code || 'TRANSFER_ERROR'
    };
  }
};

/**
 * Get payment transaction by booking ID
 */
export const getPaymentTransaction = async (bookingId: string): Promise<PaymentTransaction | null> => {
  try {
    const snapshot = await db
      .collection("paymentTransactions")
      .where("bookingId", "==", bookingId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as PaymentTransaction;
  } catch (error: any) {
    Logger.error("Payment", bookingId, `Failed to get payment transaction: ${error.message}`, error);
    throw error;
  }
};

/**
 * Update payment transaction status
 */
export const updatePaymentTransaction = async (
  transactionId: string,
  updates: Partial<PaymentTransaction>
): Promise<void> => {
  try {
    await db.collection("paymentTransactions").doc(transactionId).update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    Logger.error("Payment", transactionId, `Failed to update payment transaction: ${error.message}`, error);
    throw error;
  }
};

