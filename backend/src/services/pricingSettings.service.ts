import { db } from '../config/firebase';

const SETTINGS_COLLECTION = 'platformSettings';
const SETTINGS_DOC_ID = 'pricing';

export interface PricingSettings {
  /** Client role (student) — one-time entry fee */
  clientAccessFee: number;
  /** Consultant — one-time entry fee (default $0) */
  consultantAccessFee: number;
  /** Hiring Manager role (recruiter) — one-time entry fee */
  hiringManagerAccessFee: number;
  /** Platform share of consultant in-app sales (bookings, etc.) */
  consultantSalesFeePercent: number;
  /** @deprecated Legacy fields — migrated on read */
  studentConsultantFee?: number;
  recruiterPostingFee?: number;
  recruiterPostingsPerBundle?: number;
}

export const DEFAULT_PRICING: PricingSettings = {
  clientAccessFee: 25,
  consultantAccessFee: 0,
  hiringManagerAccessFee: 25,
  consultantSalesFeePercent: 10,
};

export const getPricingSettings = async (): Promise<PricingSettings> => {
  try {
    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { ...DEFAULT_PRICING };
    }

    return normalizePricingSettings(doc.data());
  } catch (error) {
    console.error('Error fetching pricing settings:', error);
    return { ...DEFAULT_PRICING };
  }
};

const toFiniteNumber = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const normalizePricingSettings = (data?: Record<string, unknown>): PricingSettings => {
  const legacyStudentFee = toFiniteNumber(data?.studentConsultantFee, DEFAULT_PRICING.clientAccessFee);

  return {
    clientAccessFee: toFiniteNumber(data?.clientAccessFee, legacyStudentFee),
    consultantAccessFee: toFiniteNumber(
      data?.consultantAccessFee,
      DEFAULT_PRICING.consultantAccessFee
    ),
    hiringManagerAccessFee: toFiniteNumber(
      data?.hiringManagerAccessFee,
      DEFAULT_PRICING.hiringManagerAccessFee
    ),
    consultantSalesFeePercent: toFiniteNumber(
      data?.consultantSalesFeePercent,
      DEFAULT_PRICING.consultantSalesFeePercent
    ),
  };
};

export const updatePricingSettings = async (
  settings: Partial<PricingSettings>
): Promise<PricingSettings> => {
  const current = await getPricingSettings();
  const normalized = normalizePricingSettings({
    ...current,
    ...settings,
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

export const getConsultantSalesFeePercent = async (): Promise<number> => {
  const pricing = await getPricingSettings();
  return pricing.consultantSalesFeePercent;
};
