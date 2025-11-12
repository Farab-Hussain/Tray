import { db } from "../config/firebase";
import { Logger } from "../utils/logger";

const SETTINGS_COLLECTION = "settings";
const PLATFORM_DOC_ID = "platform";
const DEFAULT_PLATFORM_FEE_AMOUNT = parseFloat(process.env.PLATFORM_FEE_AMOUNT || "5.00"); // Default $5.00

interface PlatformSettings {
  platformFeeAmount: number; // Fixed price in dollars
  updatedAt?: string;
  updatedBy?: string;
}

const getSettingsDocRef = () => db.collection(SETTINGS_COLLECTION).doc(PLATFORM_DOC_ID);

export const getPlatformSettings = async (): Promise<PlatformSettings> => {
  try {
    const doc = await getSettingsDocRef().get();

    if (!doc.exists) {
      return {
        platformFeeAmount: DEFAULT_PLATFORM_FEE_AMOUNT,
      };
    }

    const data = doc.data() || {};

    // Support both old (percentage) and new (fixed amount) format for migration
    let platformFeeAmount = DEFAULT_PLATFORM_FEE_AMOUNT;
    
    // If platformFeeAmount exists, use it
    if (typeof data.platformFeeAmount === "number") {
      platformFeeAmount = data.platformFeeAmount;
    } else if (typeof data.platformFeeAmount === "string") {
      const parsed = parseFloat(data.platformFeeAmount);
      if (!Number.isNaN(parsed)) {
        platformFeeAmount = parsed;
      }
    } else if (typeof data.platformFeePercent === "number") {
      // Migration: If only old percentage exists, convert to default amount
      // This is a one-time migration - admin should set the fixed amount
      platformFeeAmount = DEFAULT_PLATFORM_FEE_AMOUNT;
    }

    return {
      platformFeeAmount,
      updatedAt: data.updatedAt,
      updatedBy: data.updatedBy,
    };
  } catch (error: any) {
    Logger.error("PlatformSettings", "system", "Failed to read platform settings", error);
    return {
      platformFeeAmount: DEFAULT_PLATFORM_FEE_AMOUNT,
    };
  }
};

export const getPlatformFeeAmount = async (): Promise<number> => {
  const settings = await getPlatformSettings();
  return settings.platformFeeAmount ?? DEFAULT_PLATFORM_FEE_AMOUNT;
};

// Keep for backward compatibility during migration
export const getPlatformFeePercent = async (): Promise<number> => {
  // This is deprecated - return 0 to avoid breaking existing code
  // All new code should use getPlatformFeeAmount
  return 0;
};

export const updatePlatformFeeAmount = async (
  platformFeeAmount: number,
  updatedBy: string,
) => {
  if (Number.isNaN(platformFeeAmount) || platformFeeAmount < 0) {
    throw new Error("Platform fee amount must be a non-negative number");
  }

  const docRef = getSettingsDocRef();
  const payload = {
    platformFeeAmount,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  await docRef.set(payload, { merge: true });
  Logger.info("PlatformSettings", updatedBy, `Updated platform fee to $${platformFeeAmount.toFixed(2)}`);
};

// Keep for backward compatibility
export const updatePlatformFeePercent = async (
  platformFeePercent: number,
  updatedBy: string,
) => {
  // Deprecated - this will be removed in future versions
  // Convert percentage to a default amount (not recommended)
  const defaultAmount = 5.00;
  await updatePlatformFeeAmount(defaultAmount, updatedBy);
  Logger.warn("PlatformSettings", updatedBy, `updatePlatformFeePercent is deprecated. Using default amount $${defaultAmount}`);
};

