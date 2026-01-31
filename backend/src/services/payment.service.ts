// src/services/payment.service.ts
import { db } from "../config/firebase";
import { getStripeClient } from "../utils/stripeClient";
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
  platformFeePercentage?: number;
  consultantPayoutPercentage?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  transferredAt?: string;
}

export interface PayoutSummary {
  totalAmount: number;
  platformFee: number;
  consultantAmount: number;
  platformFeePercentage: number;
  consultantPayoutPercentage: number;
}

/**
 * Calculate payout breakdown (90% consultant, 10% platform)
 */
export const calculatePayoutBreakdown = (totalAmount: number): PayoutSummary => {
  const platformFeePercentage = 0.10; // 10% platform fee
  const consultantPayoutPercentage = 0.90; // 90% consultant payout
  
  const platformFee = Math.round(totalAmount * platformFeePercentage * 100) / 100; // Round to 2 decimal places
  const consultantAmount = Math.round(totalAmount * consultantPayoutPercentage * 100) / 100;
  
  return {
    totalAmount,
    platformFee,
    consultantAmount,
    platformFeePercentage: platformFeePercentage * 100,
    consultantPayoutPercentage: consultantPayoutPercentage * 100,
  };
};

/**
 * Store payment transaction record in database with automatic payout calculation
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
    
    // Calculate automatic payout breakdown
    const payoutBreakdown = calculatePayoutBreakdown(metadata.amount);
    
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
      platformFee: payoutBreakdown.platformFee,
      transferAmount: payoutBreakdown.consultantAmount,
      platformFeePercentage: payoutBreakdown.platformFeePercentage,
      consultantPayoutPercentage: payoutBreakdown.consultantPayoutPercentage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await transactionRef.set(transactionData);
    Logger.info("Payment", bookingId, `Payment transaction stored: ${transactionRef.id} - Platform fee: $${payoutBreakdown.platformFee}, Consultant payout: $${payoutBreakdown.consultantAmount}`);
    
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
    const account = await getStripeClient().accounts.retrieve(stripeAccountId);
    if (!account.details_submitted || !account.charges_enabled || !account.payouts_enabled) {
      return {
        success: false,
        error: "Consultant's Stripe account is not fully set up. Please complete onboarding.",
        retryable: false,
        code: 'ACCOUNT_NOT_READY',
        onboardingRequired: true
      };
    }

    // Calculate platform fee and transfer amount using the new calculation function
    const bookingAmount = typeof bookingData.amount === 'number' 
      ? bookingData.amount 
      : parseFloat(bookingData.amount);
    const payoutBreakdown = calculatePayoutBreakdown(bookingAmount);
    const platformFeeAmount = Math.round(payoutBreakdown.platformFee * 100); // Convert to cents
    const transferAmount = Math.round(payoutBreakdown.consultantAmount * 100); // Convert to cents

    if (transferAmount <= 0) {
      return {
        success: false,
        error: `Transfer amount is zero or negative. Booking amount: $${bookingAmount}, Platform fee: $${payoutBreakdown.platformFee}`,
        retryable: false,
      };
    }

    // Create transfer to consultant
    const transfer = await getStripeClient().transfers.create({
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

    Logger.info("Payment", bookingId, `✅ Transferred $${payoutBreakdown.consultantAmount} to consultant ${consultantId} (Platform fee: $${payoutBreakdown.platformFee}) - Transfer ID: ${transfer.id}`);

    return {
      success: true,
      transferId: transfer.id,
      amount: payoutBreakdown.consultantAmount,
      platformFee: payoutBreakdown.platformFee,
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

/**
 * Get payment transactions by user ID
 */
export const getPaymentTransactionsByUser = async (
  userId: string,
  userRole: 'student' | 'consultant' | 'admin',
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<PaymentTransaction[]> => {
  try {
    let query: any = db.collection("paymentTransactions");

    // Filter by user role
    if (userRole === 'student') {
      query = query.where("studentId", "==", userId);
    } else if (userRole === 'consultant') {
      query = query.where("consultantId", "==", userId);
    }
    // Admin can see all transactions

    // Apply additional filters
    if (filters?.status) {
      query = query.where("status", "==", filters.status);
    }

    if (filters?.startDate) {
      query = query.where("createdAt", ">=", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.where("createdAt", "<=", filters.endDate);
    }

    // Apply limit and ordering
    const limit = filters?.limit || 50;
    query = query.orderBy("createdAt", "desc").limit(limit);

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => doc.data() as PaymentTransaction);
  } catch (error: any) {
    Logger.error("Payment", userId, `Failed to get payment transactions: ${error.message}`, error);
    throw error;
  }
};

/**
 * Get all payment transactions (admin only)
 */
export const getAllPaymentTransactions = async (filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<PaymentTransaction[]> => {
  try {
    let query: any = db.collection("paymentTransactions");

    // Apply filters
    if (filters?.status) {
      query = query.where("status", "==", filters.status);
    }

    if (filters?.startDate) {
      query = query.where("createdAt", ">=", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.where("createdAt", "<=", filters.endDate);
    }

    // Apply limit and ordering
    const limit = filters?.limit || 100;
    query = query.orderBy("createdAt", "desc").limit(limit);

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => doc.data() as PaymentTransaction);
  } catch (error: any) {
    Logger.error("Payment", "admin", `Failed to get all payment transactions: ${error.message}`, error);
    throw error;
  }
};

/**
 * Automated payout processing for completed sessions
 * This function should be called by a scheduled job or webhook
 */
export const processPendingPayouts = async (): Promise<{
  processed: number;
  failed: number;
  total: number;
  errors: string[];
}> => {
  const result = {
    processed: 0,
    failed: 0,
    total: 0,
    errors: [] as string[],
  };

  try {
    // Get all completed bookings that haven't been paid out
    const bookingsSnapshot = await db.collection("bookings")
      .where("status", "==", "completed")
      .where("paymentStatus", "==", "paid")
      .where("paymentTransferred", "==", false)
      .limit(50) // Process in batches
      .get();

    result.total = bookingsSnapshot.size;

    for (const bookingDoc of bookingsSnapshot.docs) {
      const bookingId = bookingDoc.id;
      
      try {
        const transferResult = await transferPaymentToConsultant(bookingId);
        
        if (transferResult.success) {
          result.processed++;
          Logger.info("Payment", "auto-payout", `Successfully processed payout for booking ${bookingId}`);
        } else {
          result.failed++;
          result.errors.push(`Booking ${bookingId}: ${transferResult.error}`);
          Logger.error("Payment", "auto-payout", `Failed payout for booking ${bookingId}: ${transferResult.error}`);
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Booking ${bookingId}: ${error.message}`);
        Logger.error("Payment", "auto-payout", `Error processing payout for booking ${bookingId}: ${error.message}`, error);
      }
    }

    Logger.info("Payment", "auto-payout", `Batch payout completed: ${result.processed} processed, ${result.failed} failed, ${result.total} total`);
    
    return result;
  } catch (error: any) {
    Logger.error("Payment", "auto-payout", `Failed to process pending payouts: ${error.message}`, error);
    throw error;
  }
};

/**
 * Get revenue analytics for admin dashboard
 */
export const getRevenueAnalytics = async (filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  totalRevenue: number;
  platformFees: number;
  consultantPayouts: number;
  totalTransactions: number;
  averageTransactionAmount: number;
  breakdownByMonth: Array<{
    month: string;
    revenue: number;
    platformFees: number;
    consultantPayouts: number;
    transactionCount: number;
  }>;
}> => {
  try {
    let query: any = db.collection("paymentTransactions")
      .where("status", "==", "transferred");

    if (filters?.startDate) {
      query = query.where("createdAt", ">=", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.where("createdAt", "<=", filters.endDate);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();
    const transactions = snapshot.docs.map((doc: any) => doc.data() as PaymentTransaction);
    
    // Calculate analytics
    const totalRevenue = transactions.reduce((sum: number, tx: any) => sum + tx.amount, 0);
    const platformFees = transactions.reduce((sum: number, tx: any) => sum + (tx.platformFee || 0), 0);
    const consultantPayouts = transactions.reduce((sum: number, tx: any) => sum + (tx.transferAmount || 0), 0);
    const totalTransactions = transactions.length;
    const averageTransactionAmount = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Monthly breakdown
    const monthlyBreakdown: { [key: string]: any } = {};
    
    transactions.forEach((tx: any) => {
      const month = tx.createdAt.substring(0, 7); // YYYY-MM format
      
      if (!monthlyBreakdown[month]) {
        monthlyBreakdown[month] = {
          month,
          revenue: 0,
          platformFees: 0,
          consultantPayouts: 0,
          transactionCount: 0,
        };
      }
      
      monthlyBreakdown[month].revenue += tx.amount;
      monthlyBreakdown[month].platformFees += tx.platformFee || 0;
      monthlyBreakdown[month].consultantPayouts += tx.transferAmount || 0;
      monthlyBreakdown[month].transactionCount += 1;
    });

    const breakdownByMonth = Object.values(monthlyBreakdown)
      .sort((a: any, b: any) => b.month.localeCompare(a.month));

    return {
      totalRevenue,
      platformFees,
      consultantPayouts,
      totalTransactions,
      averageTransactionAmount,
      breakdownByMonth,
    };
  } catch (error: any) {
    Logger.error("Payment", "analytics", `Failed to get revenue analytics: ${error.message}`, error);
    throw error;
  }
};

/**
 * Refund payment and handle payout reversal if needed
 */
export const processRefund = async (
  paymentIntentId: string,
  refundAmount?: number,
  reason?: string
): Promise<{
  success: boolean;
  refundId?: string;
  amount?: number;
  error?: string;
}> => {
  try {
    // Get the payment transaction
    const transactionSnapshot = await db.collection("paymentTransactions")
      .where("paymentIntentId", "==", paymentIntentId)
      .limit(1)
      .get();

    if (transactionSnapshot.empty) {
      return { success: false, error: "Payment transaction not found" };
    }

    const transaction = transactionSnapshot.docs[0].data() as PaymentTransaction;
    const refundAmountCents = refundAmount ? Math.round(refundAmount * 100) : Math.round(transaction.amount * 100);

    // Create refund in Stripe
    const refund = await getStripeClient().refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmountCents,
      reason: 'requested_by_customer',
      metadata: {
        transactionId: transaction.id,
        bookingId: transaction.bookingId,
        reason: reason || 'Customer requested refund',
      },
    });

    // Update transaction status
    await updatePaymentTransaction(transaction.id, {
      status: 'refunded',
      paymentStatus: 'refunded',
      metadata: {
        ...transaction.metadata,
        refundId: refund.id,
        refundAmount: refundAmountCents / 100,
        refundReason: reason,
        refundedAt: new Date().toISOString(),
      },
    });

    // If payment was already transferred to consultant, handle the reversal
    if (transaction.transferStatus === 'completed' && transaction.transferId) {
      try {
        // Create a reversal transfer (move money back from consultant to platform)
        await getStripeClient().transfers.createReversal(transaction.transferId, {
          amount: refundAmountCents,
          description: `Refund reversal for booking ${transaction.bookingId}`,
        });

        Logger.info("Payment", transaction.bookingId, `Refund reversal processed: $${refundAmountCents / 100}`);
      } catch (reversalError: any) {
        Logger.error("Payment", transaction.bookingId, `Failed to process refund reversal: ${reversalError.message}`, reversalError);
        // Don't fail the refund if reversal fails, but log it for manual handling
      }
    }

    Logger.info("Payment", transaction.bookingId, `Refund processed: $${refundAmountCents / 100} - Refund ID: ${refund.id}`);

    return {
      success: true,
      refundId: refund.id,
      amount: refundAmountCents / 100,
    };
  } catch (error: any) {
    Logger.error("Payment", paymentIntentId, `Failed to process refund: ${error.message}`, error);
    return {
      success: false,
      error: error.message || 'Failed to process refund',
    };
  }
};

