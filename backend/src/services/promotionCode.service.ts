import { getStripeClient } from '../utils/stripeClient';

export interface PromoCodeResult {
  valid: boolean;
  amountCents: number;
  promotionCodeId?: string;
  couponId?: string;
  error?: string;
}

/**
 * Validate a Stripe promotion code and return the discounted amount in cents.
 */
export const applyPromotionCodeToAmount = async (
  baseAmountCents: number,
  promotionCode: string
): Promise<PromoCodeResult> => {
  const code = promotionCode?.trim();
  if (!code) {
    return { valid: false, amountCents: baseAmountCents, error: 'Promotion code is required' };
  }

  try {
    const stripe = getStripeClient();
    const promoList = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
      expand: ['data.coupon'],
    });

    const promo = promoList.data[0] as unknown as {
      id: string;
      coupon: string | { id: string; percent_off?: number; amount_off?: number; currency?: string };
    };
    if (!promo) {
      return { valid: false, amountCents: baseAmountCents, error: 'Invalid or expired promotion code' };
    }

    const coupon =
      typeof promo.coupon === 'string'
        ? await stripe.coupons.retrieve(promo.coupon)
        : promo.coupon;

    let discounted = baseAmountCents;

    if (coupon.percent_off) {
      discounted = Math.round(baseAmountCents * (100 - coupon.percent_off) / 100);
    } else if (coupon.amount_off) {
      const currencyMatches = !coupon.currency || coupon.currency === 'usd';
      if (currencyMatches) {
        discounted = Math.max(0, baseAmountCents - coupon.amount_off);
      }
    }

    // Stripe minimum charge is 50 cents unless 100% off
    if (discounted > 0 && discounted < 50) {
      discounted = 50;
    }

    return {
      valid: true,
      amountCents: discounted,
      promotionCodeId: promo.id,
      couponId: typeof coupon === 'string' ? coupon : coupon.id,
    };
  } catch (error: any) {
    console.error('Promotion code validation error:', error);
    return {
      valid: false,
      amountCents: baseAmountCents,
      error: error.message || 'Failed to validate promotion code',
    };
  }
};
