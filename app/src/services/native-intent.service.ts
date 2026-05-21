import { NativeModules, Platform } from 'react-native';
import { logger } from '../utils/logger';

export type PendingCallIntent = {
  callId: string;
  callType?: string;
  action?: string;
  callerId?: string;
  receiverId?: string;
};

export const consumeNativePendingCallIntent = async (): Promise<PendingCallIntent | null> => {
  try {
    const mod =
      Platform.OS === 'android' ? NativeModules.TrayIntentModule : NativeModules.TrayVoipModule;
    if (!mod?.getPendingCallIntent) return null;
    const result = await mod.getPendingCallIntent();
    if (!result?.callId) return null;
    return result as PendingCallIntent;
  } catch (error) {
    logger.warn('⚠️ [NativeIntent] getPendingCallIntent failed:', error);
    return null;
  }
};

export const getNativeVoipToken = async (): Promise<string | null> => {
  if (Platform.OS !== 'ios') return null;
  try {
    const token = await NativeModules.TrayVoipModule?.getVoipToken?.();
    return typeof token === 'string' && token.length > 0 ? token : null;
  } catch {
    return null;
  }
};
