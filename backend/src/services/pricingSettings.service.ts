import { db } from '../config/firebase';

const SETTINGS_COLLECTION = 'platformSettings';
const SETTINGS_DOC_ID = 'pricing';

export interface PricingSettings {
  studentConsultantFee: number;
  recruiterPostingFee: number;
  recruiterPostingsPerBundle: number;
}

export const DEFAULT_PRICING: PricingSettings = {
  studentConsultantFee: 25,
  recruiterPostingFee: 5,
  recruiterPostingsPerBundle: 3,
};

export const getPricingSettings = async (): Promise<PricingSettings> => {
  try {
    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return { ...DEFAULT_PRICING };
    }

    const data = doc.data();
    return normalizePricingSettings(data);
  } catch (error) {
    console.error('Error fetching pricing settings:', error);
    return { ...DEFAULT_PRICING };
  }
};

const toFiniteNumber = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const normalizePricingSettings = (data?: Record<string, unknown>): PricingSettings => ({
  studentConsultantFee: toFiniteNumber(
    data?.studentConsultantFee,
    DEFAULT_PRICING.studentConsultantFee
  ),
  recruiterPostingFee: toFiniteNumber(
    data?.recruiterPostingFee,
    DEFAULT_PRICING.recruiterPostingFee
  ),
  recruiterPostingsPerBundle: toFiniteNumber(
    data?.recruiterPostingsPerBundle,
    DEFAULT_PRICING.recruiterPostingsPerBundle
  ),
});

export const updatePricingSettings = async (
  settings: Partial<PricingSettings>
): Promise<PricingSettings> => {
  const normalized = normalizePricingSettings({
    studentConsultantFee: settings.studentConsultantFee,
    recruiterPostingFee: settings.recruiterPostingFee,
    recruiterPostingsPerBundle: settings.recruiterPostingsPerBundle,
  });

  const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
  await docRef.set(
    {
      ...normalized,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  const saved = await docRef.get();
  return normalizePricingSettings(saved.data());
};
