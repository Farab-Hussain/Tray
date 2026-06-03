import { Request, Response } from 'express';
import { getStripeClient } from '../utils/stripeClient';
import {
  DEFAULT_PRICING,
  getPricingSettings as fetchPricingSettings,
  updatePricingSettings as savePricingSettings,
} from '../services/pricingSettings.service';

export const getPricingSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await fetchPricingSettings();
    return res.status(200).json(settings);
  } catch (error) {
    console.error('Error fetching pricing settings:', error);
    return res.status(500).json({ error: 'Failed to fetch pricing settings' });
  }
};

export const updatePricingSettings = async (req: Request, res: Response) => {
  try {
    const {
      clientAccessFee,
      consultantAccessFee,
      hiringManagerAccessFee,
      consultantSalesFeePercent,
    } = req.body;

    if (
      clientAccessFee === undefined ||
      consultantAccessFee === undefined ||
      hiringManagerAccessFee === undefined ||
      consultantSalesFeePercent === undefined
    ) {
      return res.status(400).json({
        error:
          'Missing required fields: clientAccessFee, consultantAccessFee, hiringManagerAccessFee, consultantSalesFeePercent',
      });
    }

    const clientFee = Number(clientAccessFee);
    const consultantFee = Number(consultantAccessFee);
    const hiringManagerFee = Number(hiringManagerAccessFee);
    const salesPercent = Number(consultantSalesFeePercent);

    if (
      [clientFee, consultantFee, hiringManagerFee, salesPercent].some((n) => Number.isNaN(n)) ||
      clientFee < 0 ||
      consultantFee < 0 ||
      hiringManagerFee < 0 ||
      salesPercent < 0 ||
      salesPercent > 100
    ) {
      return res.status(400).json({
        error:
          'Invalid pricing values. Fees must be non-negative and sales percent must be between 0 and 100.',
      });
    }

    const saved = await savePricingSettings({
      clientAccessFee: clientFee,
      consultantAccessFee: consultantFee,
      hiringManagerAccessFee: hiringManagerFee,
      consultantSalesFeePercent: salesPercent,
    });

    return res.status(200).json({
      success: true,
      message: 'Pricing settings updated successfully',
      settings: saved,
    });
  } catch (error) {
    console.error('Error updating pricing settings:', error);
    return res.status(500).json({ error: 'Failed to update pricing settings' });
  }
};

/** List active Stripe promotion codes (for nonprofit / partner codes) */
export const listPromotionCodes = async (_req: Request, res: Response) => {
  try {
    const stripe = getStripeClient();
    const promos = await stripe.promotionCodes.list({ active: true, limit: 100 });
    return res.status(200).json({
      codes: promos.data.map((p) => ({
        id: p.id,
        code: p.code,
        active: p.active,
        timesRedeemed: p.times_redeemed,
        maxRedemptions: p.max_redemptions,
        expiresAt: p.expires_at ? new Date(p.expires_at * 1000).toISOString() : null,
      })),
    });
  } catch (error: any) {
    console.error('Error listing promotion codes:', error);
    return res.status(500).json({ error: error.message || 'Failed to list promotion codes' });
  }
};

/** Create a Stripe coupon + promotion code (nonprofit / partner access) */
export const createPromotionCode = async (req: Request, res: Response) => {
  try {
    const { code, percentOff, amountOff, maxRedemptions, expiresAt } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'code is required' });
    }

    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      return res.status(400).json({ error: 'code cannot be empty' });
    }

    const pct = percentOff !== undefined ? Number(percentOff) : undefined;
    const amt = amountOff !== undefined ? Number(amountOff) : undefined;

    if (pct === undefined && amt === undefined) {
      return res.status(400).json({ error: 'percentOff or amountOff is required' });
    }

    if (pct !== undefined && (Number.isNaN(pct) || pct <= 0 || pct > 100)) {
      return res.status(400).json({ error: 'percentOff must be between 1 and 100' });
    }

    if (amt !== undefined && (Number.isNaN(amt) || amt <= 0)) {
      return res.status(400).json({ error: 'amountOff must be a positive number (USD)' });
    }

    const stripe = getStripeClient();

    const couponParams: Record<string, unknown> = {
      duration: 'once',
      name: `Tray — ${normalizedCode}`,
    };

    if (pct !== undefined) {
      couponParams.percent_off = pct;
    } else if (amt !== undefined) {
      couponParams.amount_off = Math.round(amt * 100);
      couponParams.currency = 'usd';
    }

    const coupon = await stripe.coupons.create(couponParams as any);

    const promoCreateParams: Parameters<typeof stripe.promotionCodes.create>[0] = {
      promotion: {
        type: 'coupon',
        coupon: coupon.id,
      },
      code: normalizedCode,
      active: true,
    };

    if (maxRedemptions !== undefined && maxRedemptions !== null) {
      const max = Number(maxRedemptions);
      if (!Number.isNaN(max) && max > 0) {
        promoCreateParams.max_redemptions = max;
      }
    }

    if (expiresAt) {
      const exp = new Date(expiresAt);
      if (!Number.isNaN(exp.getTime())) {
        promoCreateParams.expires_at = Math.floor(exp.getTime() / 1000);
      }
    }

    const promotionCode = await stripe.promotionCodes.create(promoCreateParams);

    return res.status(201).json({
      success: true,
      message: 'Promotion code created',
      promotionCode: {
        id: promotionCode.id,
        code: promotionCode.code,
        percentOff: pct,
        amountOff: amt,
        maxRedemptions: promotionCode.max_redemptions,
        expiresAt: promotionCode.expires_at
          ? new Date(promotionCode.expires_at * 1000).toISOString()
          : null,
      },
    });
  } catch (error: any) {
    console.error('Error creating promotion code:', error);
    return res.status(500).json({ error: error.message || 'Failed to create promotion code' });
  }
};
