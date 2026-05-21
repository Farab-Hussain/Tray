import { Request, Response } from 'express';
import { db } from '../config/firebase';
import {
  DEFAULT_PRICING,
  normalizePricingSettings,
} from '../services/pricingSettings.service';

const SETTINGS_COLLECTION = 'platformSettings';
const SETTINGS_DOC_ID = 'pricing';

export const getPricingSettings = async (req: Request, res: Response) => {
  try {
    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(200).json({ ...DEFAULT_PRICING });
    }

    return res.status(200).json(normalizePricingSettings(doc.data()));
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

    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
    await docRef.set(
      normalizePricingSettings({
        studentConsultantFee,
        recruiterPostingFee,
        recruiterPostingsPerBundle,
      }),
      { merge: true }
    );
    await docRef.set({ updatedAt: new Date().toISOString() }, { merge: true });

    return res.status(200).json({ success: true, message: 'Pricing settings updated successfully' });
  } catch (error) {
    console.error('Error updating pricing settings:', error);
    return res.status(500).json({ error: 'Failed to update pricing settings' });
  }
};
