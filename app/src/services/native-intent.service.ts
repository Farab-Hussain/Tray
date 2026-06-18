import { NativeModules, Platform, NativeEventEmitter } from 'react-native';
import { logger } from '../utils/logger';

export type PendingCallIntent = {
  callId: string;
  callType?: string;
  action?: string;
  callerId?: string;
  receiverId?: string;
};

const getTrayVoipModule = () =>
  Platform.OS === 'ios' ? NativeModules.TrayVoipModule : null;

export const consumeNativePendingCallIntent = async (): Promise<PendingCallIntent | null> => {
  try {
    const mod =
      Platform.OS === 'android' ? NativeModules.TrayIntentModule : getTrayVoipModule();
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
    const token = await getTrayVoipModule()?.getVoipToken?.();
    return typeof token === 'string' && token.length > 0 ? token : null;
  } catch {
    return null;
  }
};

export const hasActiveCallKitCall = async (callId: string): Promise<boolean> => {
  if (Platform.OS !== 'ios' || !callId) return false;
  try {
    return Boolean(await getTrayVoipModule()?.hasActiveCallKitCall?.(callId));
  } catch {
    return false;
  }
};

export const dismissCallKitCall = async (
  callId?: string,
  reason: 'ended' | 'missed' | 'failed' = 'ended',
): Promise<void> => {
  if (Platform.OS !== 'ios') return;
  try {
    await getTrayVoipModule()?.endCallKitCall?.(callId || '', reason);
  } catch (error) {
    logger.warn('⚠️ [CallKit] Failed to dismiss call UI:', error);
  }
};

export const presentIncomingCallKit = async (params: {
  callId: string;
  callType?: string;
  callerId: string;
  receiverId: string;
  callerName?: string;
}): Promise<void> => {
  if (Platform.OS !== 'ios') return;
  try {
    await getTrayVoipModule()?.presentIncomingCall?.(
      params.callId,
      params.callType || 'audio',
      params.callerId,
      params.receiverId,
      params.callerName || 'Incoming Call',
    );
  } catch (error) {
    logger.warn('⚠️ [CallKit] Failed to present incoming call:', error);
  }
};

export const presentOutgoingCallKit = async (params: {
  callId: string;
  callType?: string;
  callerId: string;
  receiverId: string;
  calleeName?: string;
}): Promise<void> => {
  if (Platform.OS !== 'ios') return;
  try {
    await getTrayVoipModule()?.presentOutgoingCall?.(
      params.callId,
      params.callType || 'audio',
      params.callerId,
      params.receiverId,
      params.calleeName || 'Outgoing Call',
    );
  } catch (error) {
    logger.warn('⚠️ [CallKit] Failed to present outgoing call:', error);
  }
};

export const reportCallKitConnected = async (callId: string): Promise<void> => {
  if (Platform.OS !== 'ios' || !callId) return;
  try {
    await getTrayVoipModule()?.reportCallKitConnected?.(callId);
  } catch {
    // non-critical
  }
};

export const subscribeToCallKitActions = (
  handler: (payload: PendingCallIntent & { action: string }) => void,
) => {
  if (Platform.OS !== 'ios') {
    return () => {};
  }

  const mod = getTrayVoipModule();
  if (!mod) {
    return () => {};
  }

  const emitter = new NativeEventEmitter(mod);
  const subscription = emitter.addListener('CallKitCallAction', handler);
  return () => subscription.remove();
};
