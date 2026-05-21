import { Request, Response } from 'express';
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
    const { studentConsultantFee, recruiterPostingFee, recruiterPostingsPerBundle } = req.body;

    if (studentConsultantFee === undefined || recruiterPostingFee === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const studentFee = Number(studentConsultantFee);
    const recruiterFee = Number(recruiterPostingFee);
    const bundleSize =
      recruiterPostingsPerBundle !== undefined
        ? Number(recruiterPostingsPerBundle)
        : DEFAULT_PRICING.recruiterPostingsPerBundle;

    if (
      Number.isNaN(studentFee) ||
      Number.isNaN(recruiterFee) ||
      Number.isNaN(bundleSize) ||
      studentFee < 0 ||
      recruiterFee < 0 ||
      bundleSize < 1
    ) {
      return res.status(400).json({
        error: 'Invalid pricing values. Fees must be non-negative and bundle size at least 1.',
      });
    }

    const saved = await savePricingSettings({
      studentConsultantFee: studentFee,
      recruiterPostingFee: recruiterFee,
      recruiterPostingsPerBundle: bundleSize,
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
