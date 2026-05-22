import type Stripe from 'stripe';
import { getStripeClient } from '../utils/stripeClient';

export interface PromoCodeResult {
  valid: boolean;
  amountCents: number;
  promotionCodeId?: string;
  couponId?: string;
  error?: string;
}

type PromotionCodeRecord = Stripe.PromotionCode & {
  coupon?: string | Stripe.Coupon;
  promotion?: {
    type?: string;
    coupon?: string | Stripe.Coupon;
  };
};

async function resolveCouponFromPromo(
  stripe: Stripe,
  promo: PromotionCodeRecord,
): Promise<Stripe.Coupon> {
  if (promo.coupon) {
    return typeof promo.coupon === 'string'
      ? await stripe.coupons.retrieve(promo.coupon)
      : promo.coupon;
  }

  const promotionCoupon = promo.promotion?.coupon;
  if (!promotionCoupon) {
    throw new Error('Promotion code has no associated coupon');
  }

  return typeof promotionCoupon === 'string'
    ? await stripe.coupons.retrieve(promotionCoupon)
    : promotionCoupon;
}

async function findActivePromotionCode(
  stripe: Stripe,
  code: string,
): Promise<PromotionCodeRecord | undefined> {
  // Stripe matches promotion codes case-insensitively via `code` filter
  const promoList = await stripe.promotionCodes.list({
    code,
    active: true,
    limit: 1,
  });

  return promoList.data[0] as PromotionCodeRecord | undefined;
}

/**
 * Validate a Stripe promotion code and return the discounted amount in cents.
 * Supports Stripe API versions that expose coupon on `coupon` or `promotion.coupon`.
 */
export const applyPromotionCodeToAmount = async (
  baseAmountCents: number,
  promotionCode: string,
): Promise<PromoCodeResult> => {
  const code = promotionCode?.trim();
  if (!code) {
    return { valid: false, amountCents: baseAmountCents, error: 'Promotion code is required' };
  }

  try {
    const stripe = getStripeClient();
    const promo = await findActivePromotionCode(stripe, code);

    if (!promo) {
      return {
        valid: false,
        amountCents: baseAmountCents,
        error:
          'Promotion code not found or inactive. Enter the code from Stripe (e.g. STUDENT20), and ensure your app uses the same Stripe test/live mode as the dashboard.',
      };
    }

    const minAmount = promo.restrictions?.minimum_amount;
    if (minAmount != null && baseAmountCents < minAmount) {
      const minDollars = (minAmount / 100).toFixed(2);
      return {
        valid: false,
        amountCents: baseAmountCents,
        error: `This code requires a minimum purchase of $${minDollars}`,
      };
    }

    if (promo.restrictions?.first_time_transaction) {
      // Access fee is always a first purchase for this product; no extra check needed
    }

    const coupon = await resolveCouponFromPromo(stripe, promo);

    let discounted = baseAmountCents;

    if (coupon.percent_off != null) {
      discounted = Math.round((baseAmountCents * (100 - coupon.percent_off)) / 100);
    } else if (coupon.amount_off != null) {
      const currencyMatches = !coupon.currency || coupon.currency === 'usd';
      if (currencyMatches) {
        discounted = Math.max(0, baseAmountCents - coupon.amount_off);
      }
    }

    // Stripe minimum charge is 50 cents unless fully discounted
    if (discounted > 0 && discounted < 50) {
      discounted = 50;
    }

    return {
      valid: true,
      amountCents: discounted,
      promotionCodeId: promo.id,
      couponId: coupon.id,
    };
  } catch (error: any) {
    console.error('Promotion code validation error:', error);
    const stripeMessage =
      error?.raw?.message || error?.message || 'Failed to validate promotion code';
    return {
      valid: false,
      amountCents: baseAmountCents,
      error: stripeMessage,
    };
  }
};
