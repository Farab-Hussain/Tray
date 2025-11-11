import { db } from "../config/firebase";
import { Logger } from "../utils/logger";

const SETTINGS_COLLECTION = "settings";
const PLATFORM_DOC_ID = "platform";
const DEFAULT_PLATFORM_FEE = parseFloat(process.env.PLATFORM_FEE_PERCENT || "10");

interface PlatformSettings {
  platformFeePercent: number;
  updatedAt?: string;
  updatedBy?: string;
}

const getSettingsDocRef = () => db.collection(SETTINGS_COLLECTION).doc(PLATFORM_DOC_ID);

export const getPlatformSettings = async (): Promise<PlatformSettings> => {
  try {
    const doc = await getSettingsDocRef().get();

    if (!doc.exists) {
      return {
        platformFeePercent: DEFAULT_PLATFORM_FEE,
      };
    }

    const data = doc.data() || {};

    let platformFeePercent = DEFAULT_PLATFORM_FEE;
    if (typeof data.platformFeePercent === "number") {
      platformFeePercent = data.platformFeePercent;
    } else if (typeof data.platformFeePercent === "string") {
      const parsed = parseFloat(data.platformFeePercent);
      if (!Number.isNaN(parsed)) {
        platformFeePercent = parsed;
      }
    }

    return {
      platformFeePercent,
      updatedAt: data.updatedAt,
      updatedBy: data.updatedBy,
    };
  } catch (error: any) {
    Logger.error("PlatformSettings", "system", "Failed to read platform settings", error);
    return {
      platformFeePercent: DEFAULT_PLATFORM_FEE,
    };
  }
};

export const getPlatformFeePercent = async (): Promise<number> => {
  const settings = await getPlatformSettings();
  return settings.platformFeePercent ?? DEFAULT_PLATFORM_FEE;
};

export const updatePlatformFeePercent = async (
  platformFeePercent: number,
  updatedBy: string,
) => {
  if (Number.isNaN(platformFeePercent) || platformFeePercent < 0) {
    throw new Error("Platform fee percent must be a non-negative number");
  }

  const docRef = getSettingsDocRef();
  const payload = {
    platformFeePercent,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  await docRef.set(payload, { merge: true });
  Logger.info("PlatformSettings", updatedBy, `Updated platform fee to ${platformFeePercent}%`);
};

