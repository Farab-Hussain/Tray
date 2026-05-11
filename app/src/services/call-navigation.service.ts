import { getCurrentRoute, navigate } from '../navigator/navigationRef';
import { logger } from '../utils/logger';
import { getCallOnce, type CallDocument, type CallStatus } from './call.service';

type IncomingCallNavigationParams = {
  callId?: string;
  callType?: 'audio' | 'video' | string;
  callerId?: string;
  receiverId?: string;
  userId?: string;
  autoAccept?: boolean;
};

const CALL_GUARD_TTL_MS = 2 * 60 * 1000;
const activeHandledCalls = new Set<string>();
const terminalCalls = new Set<string>();
const cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();

const terminalStatuses = new Set<CallStatus>(['ended', 'missed']);

const scheduleCleanup = (callId: string) => {
  const existingTimer = cleanupTimers.get(callId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    activeHandledCalls.delete(callId);
    terminalCalls.delete(callId);
    cleanupTimers.delete(callId);
  }, CALL_GUARD_TTL_MS);

  cleanupTimers.set(callId, timer);
};

export const markCallTerminal = (callId?: string) => {
  if (!callId) return;
  terminalCalls.add(callId);
  activeHandledCalls.delete(callId);
  scheduleCleanup(callId);
};

export const markCallHandled = (callId?: string) => {
  if (!callId || terminalCalls.has(callId)) return;
  activeHandledCalls.add(callId);
  scheduleCleanup(callId);
};

export const isCallScreenRoute = (routeName?: string) =>
  routeName === 'CallingScreen' || routeName === 'VideoCallingScreen';

export const getActiveCallIdFromNavigation = () => {
  const currentRoute = getCurrentRoute?.();
  if (!isCallScreenRoute(currentRoute?.name)) {
    return null;
  }
  return (currentRoute?.params as any)?.callId || null;
};

const getFreshCallStatus = async (callId: string) => {
  try {
    const callDoc = await getCallOnce(callId);
    if (!callDoc.exists()) {
      return null;
    }
    return (callDoc.data() as CallDocument)?.status || null;
  } catch (error) {
    logger.warn('⚠️ [CallNavigation] Unable to verify call status:', error);
    return undefined;
  }
};

export const navigateToIncomingCallIfNeeded = async (
  params: IncomingCallNavigationParams,
  source: string,
) => {
  const callId = params.callId;
  const callerId = params.callerId;
  const receiverId = params.receiverId || params.userId;

  if (!callId || !callerId || !receiverId) {
    logger.warn('⚠️ [CallNavigation] Missing call navigation params:', {
      source,
      callId,
      callerId,
      receiverId,
    });
    return false;
  }

  if (terminalCalls.has(callId)) {
    logger.debug('📞 [CallNavigation] Call is terminal locally, skipping:', {
      source,
      callId,
    });
    return false;
  }

  const currentCallId = getActiveCallIdFromNavigation();
  if (currentCallId === callId) {
    markCallHandled(callId);
    logger.debug('📞 [CallNavigation] Already on this call screen, skipping:', {
      source,
      callId,
    });
    return false;
  }

  if (activeHandledCalls.has(callId)) {
    logger.debug('📞 [CallNavigation] Call already handled, skipping:', {
      source,
      callId,
    });
    return false;
  }

  const freshStatus = await getFreshCallStatus(callId);
  if (freshStatus && terminalStatuses.has(freshStatus)) {
    markCallTerminal(callId);
    logger.debug('📞 [CallNavigation] Firestore call is terminal, skipping:', {
      source,
      callId,
      freshStatus,
    });
    return false;
  }

  if (freshStatus === 'active') {
    markCallHandled(callId);
    logger.debug('📞 [CallNavigation] Firestore call is already active, skipping new incoming navigation:', {
      source,
      callId,
    });
    return false;
  }

  markCallHandled(callId);

  const screenName =
    params.callType === 'video' ? 'VideoCallingScreen' : 'CallingScreen';

  navigate('Screen', {
    screen: screenName,
    params: {
      callId,
      isCaller: false,
      callerId,
      receiverId,
      autoAccept: params.autoAccept,
    },
  });

  logger.debug('✅ [CallNavigation] Navigated to incoming call:', {
    source,
    callId,
    screenName,
  });

  return true;
};
