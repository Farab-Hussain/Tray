import { Request, Response } from "express";
import dotenv from "dotenv";
import { db } from "../config/firebase";
import { getStripeClient } from "../utils/stripeClient";
import {
  getPlatformFeeAmount,
  getPlatformSettings,
  updatePlatformFeeAmount,
} from "../services/platformSettings.service";
import { transferPaymentToConsultant } from "../services/payment.service";
import { getWebAppUrl } from "../utils/webAppUrl";

dotenv.config();

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { amount, currency, bookingId, studentId, consultantId } = req.body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid amount. Amount must be a valid number.' });
    }

    // Convert to cents - Stripe expects amounts in smallest currency unit
    const amountInCents = Math.round(amount * 100);

    // Stripe's minimum amount is typically 50 cents (0.50)
    // Validate minimum amount
    if (amountInCents < 50) {
      return res.status(400).json({ 
        error: 'Amount too low. Minimum payment amount is $0.50 (or equivalent in your currency).',
        minimumAmount: 0.50,
        providedAmount: amount
      });
    }

    // Stripe's maximum for a single payment intent varies by currency
    // For USD: $999,999.99 (99,999,999 cents)
    // We'll let Stripe handle the maximum limit validation
    // and provide better error messages if it fails

    // Create payment intent
    const paymentIntent = await getStripeClient().paymentIntents.create({
      amount: amountInCents,
      currency: currency || "usd",
      metadata: { bookingId, studentId, consultantId },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    // Handle Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError' || error.type === 'StripeAPIError') {
      const errorMessage = error.message?.toLowerCase() || '';
      
      // Check for maximum amount errors (various formats)
      if (errorMessage.includes('amount') && 
          (errorMessage.includes('no more') || 
           errorMessage.includes('maximum') || 
           errorMessage.includes('99999999') ||
           errorMessage.includes('exceed'))) {
        return res.status(400).json({ 
          error: 'Amount exceeds the maximum limit. For large payments, please contact support or split into multiple payments.',
          details: error.message,
          code: 'AMOUNT_TOO_HIGH'
        });
      }
      
      // Check for minimum amount errors
      if (errorMessage.includes('amount') && 
          (errorMessage.includes('less than') || 
           errorMessage.includes('minimum') || 
           errorMessage.includes('too small') ||
           errorMessage.includes('at least'))) {
        return res.status(400).json({ 
          error: 'Amount is too low. Minimum payment amount is $0.50 (or equivalent in your currency).',
          details: error.message,
          minimumAmount: 0.50,
          code: 'AMOUNT_TOO_LOW'
        });
      }
      
      // Generic Stripe validation error
      if (errorMessage.includes('amount')) {
        return res.status(400).json({ 
          error: 'Invalid payment amount. ' + (error.message || 'Please check the amount and try again.'),
          details: error.message,
          code: 'INVALID_AMOUNT'
        });
      }
    }

    console.error('Error creating payment intent:', error);
    
    // Return error with appropriate status code
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ 
      error: error.message || 'Failed to create payment intent',
      details: error.message,
      code: error.code || 'PAYMENT_ERROR'
    });
  }
};

export const getStripeConfig = (_req: Request, res: Response) => {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey || typeof publishableKey !== 'string' || publishableKey.trim() === '') {
    return res.status(500).json({
      error: 'Stripe publishable key is not configured',
      code: 'STRIPE_PUBLISHABLE_KEY_MISSING',
    });
  }

  const mode = publishableKey.startsWith('pk_live') ? 'live' : publishableKey.startsWith('pk_test') ? 'test' : 'unknown';

  res.status(200).json({
    publishableKey: publishableKey.trim(),
    mode,
  });
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error("❌ STRIPE_WEBHOOK_SECRET is not configured");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  try {
    const event = getStripeClient().webhooks.constructEvent(
      req.body,
      sig as string,
      endpointSecret
    );

    console.log(`🔔 [Webhook] Received event: ${event.type}`);

    // Handle payment intent succeeded
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as any;
      const bookingId = paymentIntent.metadata?.bookingId;
      const studentId = paymentIntent.metadata?.studentId;
      const consultantId = paymentIntent.metadata?.consultantId;

      if (!bookingId) {
        console.warn("⚠️ [Webhook] Payment intent succeeded but no bookingId in metadata");
        return res.status(200).json({ received: true, warning: "No bookingId in metadata" });
      }

      try {
        // Import payment service
        const { storePaymentTransaction } = await import("../services/payment.service");

        // Get booking to verify it exists
        const bookingDoc = await db.collection("bookings").doc(bookingId).get();
        if (!bookingDoc.exists) {
          console.error(`❌ [Webhook] Booking ${bookingId} not found`);
          return res.status(200).json({ received: true, warning: `Booking ${bookingId} not found` });
        }

        const bookingData = bookingDoc.data();
        const amount = paymentIntent.amount / 100; // Convert from cents to dollars
        const currency = paymentIntent.currency || "usd";

        // Store payment transaction
        await storePaymentTransaction(paymentIntent.id, bookingId, {
          studentId: studentId || bookingData?.studentId,
          consultantId: consultantId || bookingData?.consultantId,
          amount,
          currency,
        });

        // Update booking status to paid
        await db.collection("bookings").doc(bookingId).update({
          paymentStatus: "paid",
          paymentIntentId: paymentIntent.id,
          updatedAt: new Date().toISOString(),
        });

        console.log(`✅ [Webhook] Payment processed for booking ${bookingId}: $${amount} ${currency.toUpperCase()}`);
        console.log(`   💰 Status: Paid - Pending consultant payout`);

        // Send email notifications if needed (already handled in createBooking, but can add here too)
        // The booking creation flow should handle this, but we can add a fallback here if needed

      } catch (error: any) {
        console.error(`❌ [Webhook] Error processing payment_intent.succeeded:`, error);
        // Don't fail the webhook - Stripe will retry if we return non-200
        // Log the error for manual review
        return res.status(200).json({ 
          received: true, 
          error: error.message,
          note: "Payment recorded but booking update may have failed. Manual review required."
        });
      }
    }

    // Handle payment intent failed
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as any;
      const bookingId = paymentIntent.metadata?.bookingId;

      if (bookingId) {
        try {
          await db.collection("bookings").doc(bookingId).update({
            paymentStatus: "failed",
            updatedAt: new Date().toISOString(),
          });
          console.log(`❌ [Webhook] Payment failed for booking ${bookingId}`);
        } catch (error: any) {
          console.error(`❌ [Webhook] Error updating booking for failed payment:`, error);
        }
      }
    }

    // Handle transfer created (for tracking)
    if (event.type === "transfer.created") {
      const transfer = event.data.object as any;
      console.log(`💸 [Webhook] Transfer created: ${transfer.id} - $${transfer.amount / 100} to ${transfer.destination}`);
    }

    // Handle transfer paid (transfer completed)
    if ((event.type as string) === "transfer.paid") {
      const transfer = (event.data as any).object as any;
      const bookingId = transfer.metadata?.bookingId;

      if (bookingId) {
        try {
          // Update payment transaction if exists
          const transactionSnapshot = await db
            .collection("paymentTransactions")
            .where("bookingId", "==", bookingId)
            .where("transferId", "==", transfer.id)
            .limit(1)
            .get();

          if (!transactionSnapshot.empty) {
            await transactionSnapshot.docs[0].ref.update({
              transferStatus: "completed",
              updatedAt: new Date().toISOString(),
            });
          }

          console.log(`✅ [Webhook] Transfer paid: ${transfer.id} for booking ${bookingId}`);
        } catch (error: any) {
          console.error(`❌ [Webhook] Error updating transfer status:`, error);
        }
      }
    }

    res.status(200).json({ received: true, processed: event.type });
  } catch (err: any) {
    console.error("❌ [Webhook] Error:", err.message);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
};

// Create Stripe Connect account for consultant
export const createConnectAccount = async (req: Request, res: Response) => {
  try {
    const consultantId = (req as any).user.uid;
    
    // Try to get consultant from consultants collection first
    let consultantDoc = await db.collection("consultants").doc(consultantId).get();
    let consultantData = consultantDoc.exists ? consultantDoc.data() : null;
    
    // If not found, check consultantProfiles collection and create consultant document
    if (!consultantDoc.exists) {
      const profileDoc = await db.collection("consultantProfiles").doc(consultantId).get();
      if (!profileDoc.exists) {
        return res.status(404).json({ error: "Consultant not found" });
      }
      
      const profileData = profileDoc.data();
      
      // Check if profile is approved
      if (profileData?.status !== "approved") {
        return res.status(403).json({ 
          error: "Consultant profile not approved",
          message: "Your consultant profile must be approved before setting up payments"
        });
      }
      
      // Create consultant document from profile data using the service method
      const { consultantFlowService } = await import("../services/consultantFlow.service");
      const profile = await consultantFlowService.getProfileByUid(consultantId);
      await consultantFlowService.linkApprovedConsultant(profile);
      
      // Refresh consultant data
      consultantDoc = await db.collection("consultants").doc(consultantId).get();
      consultantData = consultantDoc.data();
      
      console.log(`✅ Created consultant document from profile for Stripe setup: ${consultantId}`);
    }
    
    // Check if consultant already has a Stripe account
    if (consultantData?.stripeAccountId) {
      return res.status(400).json({ 
        error: "Stripe account already exists",
        stripeAccountId: consultantData.stripeAccountId
      });
    }
    
    // Create Stripe Connect account
    const account = await getStripeClient().accounts.create({
      type: 'express', // Express accounts for easier onboarding
      country: 'US', // Default to US, can be made dynamic
      email: consultantData?.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    
    // Create account link for onboarding
    // Use mobile deep link URL format for React Native apps
    const mobileReturnUrl = process.env.MOBILE_RETURN_URL || 'tray://stripe/return';
    const mobileRefreshUrl = process.env.MOBILE_REFRESH_URL || 'tray://stripe/refresh';
    const webBase = getWebAppUrl();
    const webReturnUrl = `${webBase}/consultant/account/stripe/return`;
    const webRefreshUrl = `${webBase}/consultant/account/stripe/refresh`;

    // Use mobile URLs if MOBILE_RETURN_URL is set, otherwise use web URLs
    const returnUrl = process.env.MOBILE_RETURN_URL ? mobileReturnUrl : webReturnUrl;
    const refreshUrl = process.env.MOBILE_REFRESH_URL ? mobileRefreshUrl : webRefreshUrl;

    const accountLink = await getStripeClient().accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
    
    // Save Stripe account ID to consultant document
    await db.collection("consultants").doc(consultantId).update({
      stripeAccountId: account.id,
      stripeAccountStatus: 'pending',
      stripeAccountDetailsSubmitted: false,
      stripeOnboardingComplete: false,
      updatedAt: new Date().toISOString(),
    });
    
    console.log(`✅ Created Stripe Connect account for consultant: ${consultantId}`);
    
    res.status(200).json({
      accountId: account.id,
      onboardingUrl: accountLink.url,
      message: "Stripe account created successfully. Please complete onboarding.",
    });
  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error);
    
    // Check if it's a Stripe Connect not enabled error
    if (error.message && error.message.includes("signed up for Connect")) {
      return res.status(400).json({ 
        error: "Stripe Connect is not enabled",
        message: "Stripe Connect must be enabled on your Stripe account before consultants can create payment accounts. Please enable Stripe Connect in your Stripe Dashboard.",
        helpUrl: "https://stripe.com/docs/connect",
        code: 'STRIPE_CONNECT_NOT_ENABLED'
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to create Stripe account',
      code: error.code || 'STRIPE_ERROR'
    });
  }
};

export const getPlatformFeeConfig = async (_req: Request, res: Response) => {
  try {
    const settings = await getPlatformSettings();
    res.status(200).json({
      platformFeeAmount: settings.platformFeeAmount,
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy,
      source: settings.updatedAt ? "admin" : "default",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load platform fee configuration" });
  }
};

export const updatePlatformFeeConfig = async (req: Request, res: Response) => {
  try {
    const { platformFeeAmount } = req.body;
    const user = (req as any).user;

    if (platformFeeAmount === undefined || platformFeeAmount === null) {
      return res.status(400).json({ error: "platformFeeAmount is required" });
    }

    const parsed =
      typeof platformFeeAmount === "number"
        ? platformFeeAmount
        : parseFloat(platformFeeAmount);

    if (Number.isNaN(parsed) || parsed < 0) {
      return res.status(400).json({ error: "platformFeeAmount must be a non-negative number" });
    }

    const updatedBy = user?.uid || "admin";
    await updatePlatformFeeAmount(parsed, updatedBy);

    res.status(200).json({
      message: "Platform fee updated successfully",
      platformFeeAmount: parsed,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update platform fee configuration" });
  }
};

// Get Stripe Connect account status
export const getConnectAccountStatus = async (req: Request, res: Response) => {
  try {
    const consultantId = (req as any).user.uid;
    
    // Try to get consultant from consultants collection first
    let consultantDoc = await db.collection("consultants").doc(consultantId).get();
    let consultantData = consultantDoc.exists ? consultantDoc.data() : null;
    
    // If not found, check consultantProfiles collection
    if (!consultantDoc.exists) {
      const profileDoc = await db.collection("consultantProfiles").doc(consultantId).get();
      if (!profileDoc.exists) {
        return res.status(404).json({ error: "Consultant not found" });
      }
      
      // Get profile data - we'll work with what we have
      const profileData = profileDoc.data();
      
      // Check if profile is approved
      if (profileData?.status !== "approved") {
        return res.status(403).json({ 
          error: "Consultant profile not approved",
          message: "Your consultant profile must be approved before setting up payments"
        });
      }
      
      // Return response indicating no Stripe account yet (they need to create one)
      return res.status(200).json({ 
        hasAccount: false,
        message: "No Stripe account found. Please create one.",
        profileApproved: true
      });
    }
    
    const stripeAccountId = consultantData?.stripeAccountId;
    
    if (!stripeAccountId) {
      return res.status(200).json({ 
        hasAccount: false,
        message: "No Stripe account found. Please create one."
      });
    }
    
    // Get account details from Stripe
    const account = await getStripeClient().accounts.retrieve(stripeAccountId);
    
    // Check if details are submitted
    const detailsSubmitted = account.details_submitted || false;
    const chargesEnabled = account.charges_enabled || false;
    const payoutsEnabled = account.payouts_enabled || false;
    
    // Create account link if onboarding is not complete
    let onboardingUrl = null;
    if (!detailsSubmitted || !chargesEnabled || !payoutsEnabled) {
      // Use mobile deep link URL format for React Native apps
      const mobileReturnUrl = process.env.MOBILE_RETURN_URL || 'tray://stripe/return';
      const mobileRefreshUrl = process.env.MOBILE_REFRESH_URL || 'tray://stripe/refresh';
      const webBase = getWebAppUrl();
      const webReturnUrl = `${webBase}/consultant/account/stripe/return`;
      const webRefreshUrl = `${webBase}/consultant/account/stripe/refresh`;

      // Use mobile URLs if MOBILE_RETURN_URL is set, otherwise use web URLs
      const returnUrl = process.env.MOBILE_RETURN_URL ? mobileReturnUrl : webReturnUrl;
      const refreshUrl = process.env.MOBILE_REFRESH_URL ? mobileRefreshUrl : webRefreshUrl;

      const accountLink = await getStripeClient().accountLinks.create({
        account: stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });
      onboardingUrl = accountLink.url;
    }
    
    // Update consultant document with latest status
    await db.collection("consultants").doc(consultantId).update({
      stripeAccountStatus: account.details_submitted ? 'active' : 'pending',
      stripeAccountDetailsSubmitted: detailsSubmitted,
      stripeOnboardingComplete: chargesEnabled && payoutsEnabled,
      updatedAt: new Date().toISOString(),
    });
    
    res.status(200).json({
      hasAccount: true,
      accountId: stripeAccountId,
      status: {
        detailsSubmitted,
        chargesEnabled,
        payoutsEnabled,
        isComplete: chargesEnabled && payoutsEnabled,
      },
      onboardingUrl,
    });
  } catch (error: any) {
    console.error('Error getting Stripe Connect account status:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get account status',
      code: error.code || 'STRIPE_ERROR'
    });
  }
};

// Transfer payment to consultant after session completion
// Now uses the payment service with retry logic
export const transferToConsultant = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ error: "Missing required field: bookingId" });
    }
    
    const result = await transferPaymentToConsultant(bookingId);
    
    if (!result.success) {
      const statusCode = result.retryable ? 503 : 400;
      return res.status(statusCode).json({ 
        error: result.error,
        code: result.code,
        retryable: result.retryable,
        onboardingRequired: result.onboardingRequired
      });
    }
    
    res.status(200).json({
      message: "Payment transferred successfully",
      transferId: result.transferId,
      amount: result.amount,
      platformFee: result.platformFee,
      bookingId,
    });
  } catch (error: any) {
    console.error('Error transferring payment to consultant:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to transfer payment',
      code: error.code || 'TRANSFER_ERROR'
    });
  }
};

/**
 * Get job posting credits and bundle pricing for current user
 */
export const getJobPostingPaymentStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { jobServices } = await import("../services/job.service");
    const status = await jobServices.checkJobPostingPayment(user.uid);

    return res.status(200).json(status);
  } catch (error: any) {
    console.error("Error fetching job posting payment status:", error);
    return res.status(500).json({ error: "Failed to fetch job posting status" });
  }
};

/**
 * Create payment intent for job posting bundle ($5 for 3 postings by default)
 */
export const createJobPostingPaymentIntent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { promotionCode } = req.body || {};

    const { getPricingSettings } = await import("../services/pricingSettings.service");
    const { applyPromotionCodeToAmount } = await import("../services/promotionCode.service");
    const pricingSettings = await getPricingSettings();
    const baseAmountCents = Math.round(pricingSettings.recruiterPostingFee * 100);

    let amountCents = baseAmountCents;
    let promoApplied = false;

    if (promotionCode) {
      const promoResult = await applyPromotionCodeToAmount(baseAmountCents, promotionCode);
      if (!promoResult.valid) {
        return res.status(400).json({ error: promoResult.error || "Invalid promotion code" });
      }
      amountCents = promoResult.amountCents;
      promoApplied = true;
    }

    const paymentIntent = await getStripeClient().paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      metadata: {
        type: "job-posting",
        userId: user.uid,
        description: "Job posting bundle",
        postingsPerBundle: String(pricingSettings.recruiterPostingsPerBundle),
        promotionCode: promotionCode || "",
        promoApplied: String(promoApplied),
      },
    });

    const bundleLabel = `$${pricingSettings.recruiterPostingFee.toFixed(2)} for ${pricingSettings.recruiterPostingsPerBundle} postings`;

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountCents,
      currency: "usd",
      bundleFee: pricingSettings.recruiterPostingFee,
      postingsPerBundle: pricingSettings.recruiterPostingsPerBundle,
      description: `Job posting bundle - ${bundleLabel}`,
      promoApplied,
    });
  } catch (error: any) {
    console.error('Error creating job posting payment intent:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create payment intent',
      code: error.code || 'PAYMENT_INTENT_ERROR'
    });
  }
};

/**
 * Confirm job posting payment and record it
 */
export const confirmJobPostingPayment = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "Payment intent ID is required" });
    }

    // Retrieve the payment intent to confirm it's paid
    const paymentIntent = await getStripeClient().paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: "Payment not successful",
        status: paymentIntent.status 
      });
    }

    // Verify the payment intent is for job posting and belongs to this user
    if (paymentIntent.metadata.type !== 'job-posting' || paymentIntent.metadata.userId !== user.uid) {
      return res.status(400).json({ error: "Invalid payment intent" });
    }

    const { jobServices } = await import("../services/job.service");
    const { creditsAdded, creditsRemaining } = await jobServices.recordJobPostingPayment(
      user.uid,
      paymentIntentId,
      paymentIntent.amount
    );

    res.status(200).json({
      message: "Job posting bundle purchased",
      paymentIntentId,
      amount: paymentIntent.amount,
      status: "paid",
      creditsAdded,
      creditsRemaining,
    });
  } catch (error: any) {
    console.error('Error confirming job posting payment:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to confirm payment',
      code: error.code || 'PAYMENT_CONFIRMATION_ERROR'
    });
  }
};

/**
 * Get platform access fee status for student/consultant
 */
export const getAccessFeePaymentStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userDoc = await db.collection("users").doc(user.uid).get();
    const userData = userDoc.data() || {};
    const { getPricingSettings } = await import("../services/pricingSettings.service");
    const pricing = await getPricingSettings();

    return res.status(200).json({
      paid: userData.hasPaidAccessFee === true || userData.accessFeeWaived === true,
      waived: userData.accessFeeWaived === true,
      fee: pricing.studentConsultantFee,
      amountCents: Math.round(pricing.studentConsultantFee * 100),
    });
  } catch (error: any) {
    console.error("Error fetching access fee status:", error);
    return res.status(500).json({ error: "Failed to fetch access fee status" });
  }
};

/**
 * Create payment intent for student/consultant access fee ($25 flat rate by default)
 */
export const createAccessFeePaymentIntent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { promotionCode } = req.body || {};

    const { getPricingSettings } = await import("../services/pricingSettings.service");
    const { applyPromotionCodeToAmount } = await import("../services/promotionCode.service");
    const pricingSettings = await getPricingSettings();
    const baseAmountCents = Math.round(pricingSettings.studentConsultantFee * 100);

    let amountCents = baseAmountCents;
    let promoApplied = false;

    if (promotionCode) {
      const promoResult = await applyPromotionCodeToAmount(baseAmountCents, promotionCode);
      if (!promoResult.valid) {
        return res.status(400).json({ error: promoResult.error || "Invalid promotion code" });
      }
      amountCents = promoResult.amountCents;
      promoApplied = true;
    }

    // 100% promo — grant access without charging a card
    if (amountCents === 0 && promoApplied) {
      await db.collection("users").doc(user.uid).update({
        hasPaidAccessFee: true,
        accessFeePaidAt: new Date().toISOString(),
        accessFeePromoCode: promotionCode || "",
        updatedAt: new Date().toISOString(),
      });

      const { cache } = await import("../utils/cache");
      cache.delete(`user:${user.uid}`);

      return res.status(200).json({
        clientSecret: null,
        paymentIntentId: null,
        amount: 0,
        currency: "usd",
        fee: pricingSettings.studentConsultantFee,
        description: "Platform access fee — fully discounted",
        promoApplied: true,
        freeAccess: true,
      });
    }

    const paymentIntent = await getStripeClient().paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      metadata: {
        type: "platform-access",
        userId: user.uid,
        description: "Platform access fee",
        promotionCode: promotionCode || "",
        promoApplied: String(promoApplied),
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountCents,
      currency: "usd",
      fee: pricingSettings.studentConsultantFee,
      baseAmount: baseAmountCents,
      description: `Platform access fee - $${(amountCents / 100).toFixed(2)}`,
      promoApplied,
    });
  } catch (error: any) {
    console.error('Error creating access fee payment intent:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create payment intent',
      code: error.code || 'PAYMENT_INTENT_ERROR'
    });
  }
};

/**
 * Confirm access fee payment
 */
export const confirmAccessFeePayment = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "Payment intent ID is required" });
    }

    const paymentIntent = await getStripeClient().paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: "Payment not successful",
        status: paymentIntent.status 
      });
    }

    if (paymentIntent.metadata.type !== 'platform-access' || paymentIntent.metadata.userId !== user.uid) {
      return res.status(400).json({ error: "Invalid payment intent" });
    }

    await db.collection("users").doc(user.uid).update({
      hasPaidAccessFee: true,
      accessFeePaymentIntentId: paymentIntentId,
      accessFeePaidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { cache } = await import("../utils/cache");
    cache.delete(`user:${user.uid}`);

    res.status(200).json({
      message: "Access fee payment confirmed",
      status: "paid",
      hasPaidAccessFee: true,
    });
  } catch (error: any) {
    console.error('Error confirming access fee payment:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to confirm payment',
      code: error.code || 'PAYMENT_CONFIRMATION_ERROR'
    });
  }
};
