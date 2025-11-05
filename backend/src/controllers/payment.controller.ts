import { Request, Response } from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { db } from "../config/firebase";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

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
    const paymentIntent = await stripe.paymentIntents.create({
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

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      endpointSecret as string
    );

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as any;
      console.log("💰 Payment successful for:", paymentIntent.metadata.bookingId);
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
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
    const account = await stripe.accounts.create({
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
    const webReturnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consultant/account/stripe/return`;
    const webRefreshUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consultant/account/stripe/refresh`;
    
    // Use mobile URLs if MOBILE_RETURN_URL is set, otherwise use web URLs
    const returnUrl = process.env.MOBILE_RETURN_URL ? mobileReturnUrl : webReturnUrl;
    const refreshUrl = process.env.MOBILE_REFRESH_URL ? mobileRefreshUrl : webRefreshUrl;
    
    const accountLink = await stripe.accountLinks.create({
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
    const account = await stripe.accounts.retrieve(stripeAccountId);
    
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
      const webReturnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consultant/account/stripe/return`;
      const webRefreshUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consultant/account/stripe/refresh`;
      
      // Use mobile URLs if MOBILE_RETURN_URL is set, otherwise use web URLs
      const returnUrl = process.env.MOBILE_RETURN_URL ? mobileReturnUrl : webReturnUrl;
      const refreshUrl = process.env.MOBILE_REFRESH_URL ? mobileRefreshUrl : webRefreshUrl;
      
      const accountLink = await stripe.accountLinks.create({
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
export const transferToConsultant = async (req: Request, res: Response) => {
  try {
    const { bookingId, amount, description } = req.body;
    
    if (!bookingId || !amount) {
      return res.status(400).json({ error: "Missing required fields: bookingId and amount" });
    }
    
    // Get booking details
    const bookingDoc = await db.collection("bookings").doc(bookingId).get();
    if (!bookingDoc.exists) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    const bookingData = bookingDoc.data();
    const consultantId = bookingData?.consultantId;
    
    if (!consultantId) {
      return res.status(400).json({ error: "Consultant ID not found in booking" });
    }
    
    // Get consultant's Stripe account
    const consultantDoc = await db.collection("consultants").doc(consultantId).get();
    if (!consultantDoc.exists) {
      return res.status(404).json({ error: "Consultant not found" });
    }
    
    const consultantData = consultantDoc.data();
    const stripeAccountId = consultantData?.stripeAccountId;
    
    if (!stripeAccountId) {
      return res.status(400).json({ 
        error: "Consultant does not have a Stripe account. Please set up payment account first.",
        code: 'NO_STRIPE_ACCOUNT'
      });
    }
    
    // Verify account is active and ready to receive transfers
    const account = await stripe.accounts.retrieve(stripeAccountId);
    if (!account.details_submitted || !account.charges_enabled || !account.payouts_enabled) {
      return res.status(400).json({ 
        error: "Consultant's Stripe account is not fully set up. Please complete onboarding.",
        code: 'ACCOUNT_NOT_READY',
        onboardingRequired: true
      });
    }
    
    // Calculate platform fee (e.g., 10% commission)
    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '10');
    const platformFeeAmount = Math.round(amount * 100 * (platformFeePercent / 100));
    const transferAmount = Math.round(amount * 100) - platformFeeAmount;
    
    // Create transfer to consultant
    const transfer = await stripe.transfers.create({
      amount: transferAmount,
      currency: "usd",
      destination: stripeAccountId,
      description: description || `Payment for booking ${bookingId}`,
      metadata: {
        bookingId,
        consultantId,
        studentId: bookingData?.studentId,
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
    
    console.log(`✅ Transferred $${transferAmount / 100} to consultant ${consultantId} for booking ${bookingId}`);
    
    res.status(200).json({
      message: "Payment transferred successfully",
      transferId: transfer.id,
      amount: transferAmount / 100,
      platformFee: platformFeeAmount / 100,
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
