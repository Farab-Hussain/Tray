import { getActiveCallIdFromNavigation } from './call-navigation.service';
import { getCallOnce, type CallDocument } from './call.service';

export type LocalCallPhase = 'ringing' | 'active';

type LocalActiveCall = {
  callId: string;
  status: LocalCallPhase;
};

let localActiveCall: LocalActiveCall | null = null;

/** Track the call this device is currently in (ringing or connected). */
export const setLocalActiveCall = (callId: string, status: LocalCallPhase) => {
  if (!callId) return;
  localActiveCall = { callId, status };
};

export const updateLocalActiveCallStatus = (callId: string, status: LocalCallPhase) => {
  if (localActiveCall?.callId === callId) {
    localActiveCall = { callId, status };
  }
};

export const clearLocalActiveCall = (callId?: string) => {
  if (!callId || localActiveCall?.callId === callId) {
    localActiveCall = null;
  }
};

export const getLocalActiveCallId = (): string | null =>
  localActiveCall?.callId ?? null;

export const getLocalActiveCallPhase = (): LocalCallPhase | null =>
  localActiveCall?.status ?? null;

const isLiveCallPhase = (status: LocalCallPhase | null | undefined): boolean =>
  status === 'ringing' || status === 'active';

/**
 * Clear stale in-memory call tracking when Firestore shows the call has ended.
 */
export const reconcileStaleLocalCallState = async (): Promise<void> => {
  const ids = new Set<string>();
  const navCallId = getActiveCallIdFromNavigation();
  const localId = getLocalActiveCallId();
  if (navCallId) ids.add(navCallId);
  if (localId) ids.add(localId);

  for (const id of ids) {
    try {
      const doc = await getCallOnce(id);
      const status = doc.exists()
        ? ((doc.data() as CallDocument)?.status ?? null)
        : null;
      if (!status || status === 'ended' || status === 'missed') {
        clearLocalActiveCall(id);
      }
    } catch {
      clearLocalActiveCall(id);
    }
  }
};

/**
 * True when this device is already in a live call session.
 * Pass excludeCallId to allow updates for the same call session.
 */
export const isLocallyInCall = (excludeCallId?: string): boolean => {
  if (!localActiveCall) return false;
  if (excludeCallId && localActiveCall.callId === excludeCallId) {
    return false;
  }
  return isLiveCallPhase(localActiveCall.status);
};
