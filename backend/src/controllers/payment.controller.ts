import { Request, Response } from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { amount, currency, bookingId, studentId, consultantId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency || "usd",
      metadata: { bookingId, studentId, consultantId },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
