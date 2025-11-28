import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

// ROOT CAUSE FIX: Make Stripe optional so server can start without it
// This prevents the server from crashing in development when Stripe isn't configured
let stripeClient: Stripe | null = null;

if (secretKey) {
  try {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2025-09-30.clover",
    });
    console.log("✅ Stripe client initialized");
  } catch (error: any) {
    console.warn("⚠️ Failed to initialize Stripe client:", error?.message);
  }
} else {
  console.warn("⚠️ STRIPE_SECRET_KEY is not configured - payment operations will be disabled");
}

// Export a getter function that throws if Stripe is not configured when needed
export const getStripeClient = (): Stripe => {
  if (!stripeClient) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Please set the environment variable to enable payment operations.",
    );
  }
  return stripeClient;
};

// Export the client directly (may be null)
export { stripeClient };

export type StripeClient = Stripe;

