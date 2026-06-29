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

const getTrayIntentModule = () =>
  Platform.OS === 'android' ? NativeModules.TrayIntentModule : null;

export const peekNativePendingCallIntent = async (): Promise<PendingCallIntent | null> => {
  try {
    if (Platform.OS === 'android') {
      const mod = getTrayIntentModule();
      if (!mod?.peekPendingCallIntent) return null;
      const result = await mod.peekPendingCallIntent();
      if (!result?.callId) return null;
      return result as PendingCallIntent;
    }
    const mod = getTrayVoipModule();
    if (!mod?.getPendingCallIntent) return null;
    const result = await mod.getPendingCallIntent();
    if (!result?.callId) return null;
    return result as PendingCallIntent;
  } catch (error) {
    logger.warn('⚠️ [NativeIntent] peekPendingCallIntent failed:', error);
    return null;
  }
};

export const consumeNativePendingCallIntent = async (): Promise<PendingCallIntent | null> => {
  try {
    const mod =
      Platform.OS === 'android' ? getTrayIntentModule() : getTrayVoipModule();
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

export const dismissNativeCallUi = async (
  callId?: string,
  reason: 'ended' | 'missed' | 'failed' = 'ended',
): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      await getTrayVoipModule()?.endCallKitCall?.(callId || '', reason);
      return;
    }
    if (Platform.OS === 'android') {
      await getTrayIntentModule()?.dismissCallUi?.(callId || '');
    }
  } catch (error) {
    logger.warn('⚠️ [NativeCall] Failed to dismiss call UI:', error);
  }
};

/** @deprecated Use dismissNativeCallUi */
export const dismissCallKitCall = dismissNativeCallUi;

export const presentIncomingCallNative = async (params: {
  callId: string;
  callType?: string;
  callerId: string;
  receiverId: string;
  callerName?: string;
}): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      await getTrayVoipModule()?.presentIncomingCall?.(
        params.callId,
        params.callType || 'audio',
        params.callerId,
        params.receiverId,
        params.callerName || 'Incoming Call',
      );
      return;
    }
    await getTrayIntentModule()?.presentIncomingCall?.(
      params.callId,
      params.callType || 'audio',
      params.callerId,
      params.receiverId,
      params.callerName || 'Incoming Call',
    );
  } catch (error) {
    logger.warn('⚠️ [NativeCall] Failed to present incoming call:', error);
  }
};

/** @deprecated Use presentIncomingCallNative */
export const presentIncomingCallKit = presentIncomingCallNative;

export const presentOutgoingCallNative = async (params: {
  callId: string;
  callType?: string;
  callerId: string;
  receiverId: string;
  calleeName?: string;
}): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      await getTrayVoipModule()?.presentOutgoingCall?.(
        params.callId,
        params.callType || 'audio',
        params.callerId,
        params.receiverId,
        params.calleeName || 'Outgoing Call',
      );
      return;
    }
    await getTrayIntentModule()?.presentOutgoingCall?.(
      params.callId,
      params.callType || 'audio',
      params.callerId,
      params.receiverId,
      params.calleeName || 'Calling…',
    );
  } catch (error) {
    logger.warn('⚠️ [NativeCall] Failed to present outgoing call:', error);
  }
};

/** @deprecated Use presentOutgoingCallNative */
export const presentOutgoingCallKit = presentOutgoingCallNative;

export const reportCallKitConnected = async (callId: string): Promise<void> => {
  if (Platform.OS !== 'ios' || !callId) return;
  try {
    await getTrayVoipModule()?.reportCallKitConnected?.(callId);
  } catch {
    // non-critical
  }
};

export const setVideoCallActiveNative = async (active: boolean): Promise<void> => {
  if (Platform.OS !== 'android') return;
  try {
    await getTrayIntentModule()?.setVideoCallActive?.(active);
  } catch (error) {
    logger.warn('⚠️ [NativeCall] Failed to set video call active:', error);
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
