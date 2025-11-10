import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY is not configured. Please set the environment variable to enable payment operations.",
  );
}

export const stripeClient = new Stripe(secretKey, {
  apiVersion: "2025-09-30.clover",
});

export type StripeClient = typeof stripeClient;

