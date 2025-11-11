// src/services/payout.service.ts
import { db } from "../config/firebase";
import { Logger } from "../utils/logger";
import Stripe from "stripe";
import { getPlatformFeePercent } from "./platformSettings.service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const MINIMUM_PAYOUT_AMOUNT = parseFloat(process.env.MINIMUM_PAYOUT_AMOUNT || '10'); // Minimum $10 to payout

/**
 * Process automated payouts for consultants
 * Transfers earnings from completed bookings to consultant Stripe accounts
 */
export const processAutomatedPayouts = async () => {
  try {
    Logger.info("Payout", "", "Starting automated payout processing...");
    const platformFeePercent = await getPlatformFeePercent();

    // Get all bookings that are:
    // 1. Status: completed or approved
    // 2. Payment status: paid
    // 3. Payment transferred: false (not yet paid out)
    const bookingsSnapshot = await db
      .collection("bookings")
      .where("paymentStatus", "==", "paid")
      .where("status", "in", ["completed", "approved"])
      .get();

    Logger.info("Payout", "", `Found ${bookingsSnapshot.size} completed bookings to check`);

    // Group bookings by consultant
    const consultantEarnings: Record<string, {
      consultantId: string;
      bookings: any[];
      totalAmount: number;
    }> = {};

    for (const doc of bookingsSnapshot.docs) {
      const booking = doc.data();
      
      // Skip if already transferred
      if (booking.paymentTransferred) {
        continue;
      }

      const consultantId = booking.consultantId;
      
      if (!consultantEarnings[consultantId]) {
        consultantEarnings[consultantId] = {
          consultantId,
          bookings: [],
          totalAmount: 0,
        };
      }

      consultantEarnings[consultantId].bookings.push({
        id: doc.id,
        ...booking,
      });
      consultantEarnings[consultantId].totalAmount += booking.amount || 0;
    }

    let payoutsProcessed = 0;
    let totalPayoutAmount = 0;

    // Process payouts for each consultant
    for (const consultantId in consultantEarnings) {
      const earnings = consultantEarnings[consultantId];
      
      // Check if consultant has minimum payout amount
      if (earnings.totalAmount < MINIMUM_PAYOUT_AMOUNT) {
        Logger.info("Payout", consultantId, `Total earnings $${earnings.totalAmount} below minimum payout of $${MINIMUM_PAYOUT_AMOUNT}`);
        continue;
      }

      try {
        // Get consultant's Stripe account
        const consultantDoc = await db.collection("consultants").doc(consultantId).get();
        if (!consultantDoc.exists) {
          Logger.warn("Payout", consultantId, "Consultant not found");
          continue;
        }

        const consultantData = consultantDoc.data();
        const stripeAccountId = consultantData?.stripeAccountId;

        if (!stripeAccountId) {
          Logger.warn("Payout", consultantId, "Consultant does not have Stripe account set up");
          continue;
        }

        // Verify Stripe account is ready
        const account = await stripe.accounts.retrieve(stripeAccountId);
        
        if (!account.details_submitted || !account.charges_enabled || !account.payouts_enabled) {
          Logger.warn("Payout", consultantId, "Stripe account not ready for payouts");
          continue;
        }

        // Calculate platform fee and transfer amount
        const platformFeeAmount = Math.round(earnings.totalAmount * 100 * (platformFeePercent / 100));
        const transferAmount = Math.round(earnings.totalAmount * 100) - platformFeeAmount;

        if (transferAmount <= 0) {
          Logger.warn("Payout", consultantId, "Transfer amount is zero or negative");
          continue;
        }

        // Create Stripe transfer
        const transfer = await stripe.transfers.create({
          amount: transferAmount,
          currency: "usd",
          destination: stripeAccountId,
          description: `Automated payout for ${earnings.bookings.length} completed booking(s)`,
          metadata: {
            consultantId,
            bookingCount: earnings.bookings.length.toString(),
            platformFee: platformFeeAmount.toString(),
          },
        });

        // Create payout record
        const payoutRef = db.collection("payouts").doc();
        const payoutData = {
          id: payoutRef.id,
          consultantId,
          amount: transferAmount / 100,
          platformFee: platformFeeAmount / 100,
          totalEarnings: earnings.totalAmount,
          bookingIds: earnings.bookings.map(b => b.id),
          transferId: transfer.id,
          status: 'completed',
          processedAt: new Date().toISOString(),
        };

        await payoutRef.set(payoutData);

        // Update all bookings to mark as transferred
        const updatePromises = earnings.bookings.map(booking =>
          db.collection("bookings").doc(booking.id).update({
            paymentTransferred: true,
            transferId: transfer.id,
            payoutId: payoutRef.id,
            transferAmount: transferAmount / 100,
            platformFee: platformFeeAmount / 100,
            transferredAt: new Date().toISOString(),
          })
        );

        await Promise.all(updatePromises);

        payoutsProcessed++;
        totalPayoutAmount += transferAmount / 100;

        Logger.info("Payout", consultantId, `Payout processed: $${transferAmount / 100} for ${earnings.bookings.length} bookings`);
      } catch (error: any) {
        Logger.error("Payout", consultantId, `Failed to process payout: ${error.message}`, error);
        // Continue with next consultant
      }
    }

    Logger.info("Payout", "", `Payout processing completed. Processed ${payoutsProcessed} payouts totaling $${totalPayoutAmount}`);
    return { success: true, payoutsProcessed, totalPayoutAmount };
  } catch (error: any) {
    Logger.error("Payout", "", `Error in payout service: ${error.message}`, error);
    throw error;
  }
};

/**
 * Get payout history for a consultant
 */
export const getConsultantPayouts = async (consultantId: string) => {
  try {
    const payoutsSnapshot = await db
      .collection("payouts")
      .where("consultantId", "==", consultantId)
      .orderBy("processedAt", "desc")
      .get();

    const payouts = payoutsSnapshot.docs.map(doc => doc.data());
    return payouts;
  } catch (error: any) {
    Logger.error("Payout", consultantId, `Failed to get payout history: ${error.message}`, error);
    throw error;
  }
};

