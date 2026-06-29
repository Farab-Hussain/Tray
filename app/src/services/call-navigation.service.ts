import { Platform } from 'react-native';
import { getCurrentRoute, navigate } from '../navigator/navigationRef';
import { logger } from '../utils/logger';
import { showToast } from '../utils/toast';
import { logCallState } from '../utils/call-state-logger';
import { emitCallAcceptRequest } from './call-accept-events.service';
import { usesNativeCallUi } from '../utils/callUi';
import { getCallOnce, type CallDocument, type CallStatus } from './call.service';
import { isLocallyInCall, reconcileStaleLocalCallState } from './active-call.service';
import {
  dismissNativeCallUi,
  hasActiveCallKitCall,
  presentIncomingCallNative,
  presentOutgoingCallNative,
} from './native-intent.service';

type CallNavigationParams = {
  callId?: string;
  callType?: 'audio' | 'video' | string;
  callerId?: string;
  receiverId?: string;
  userId?: string;
  autoAccept?: boolean;
  callerName?: string;
  calleeName?: string;
  isCaller?: boolean;
};

export type OutgoingCallParams = {
  callId: string;
  callType: 'audio' | 'video';
  callerId: string;
  receiverId: string;
  calleeName?: string;
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
  dismissNativeCallUi(callId).catch(() => {});
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

const getHeadlessScreenName = (callType?: string) =>
  callType === 'video' ? 'VideoCallingScreen' : 'CallingScreen';

const navigateHeadlessCallScreen = (
  params: CallNavigationParams & {
    callId: string;
    callerId: string;
    receiverId: string;
    isCaller: boolean;
  },
  source?: string,
) => {
  const screen = getHeadlessScreenName(params.callType);
  logCallState({
    callId: params.callId,
    role: 'Navigation',
    event: 'navigate',
    status: '-',
    screen,
    isCaller: params.isCaller,
    nativeCallUi: usesNativeCallUi(),
    source,
    extra: { autoAccept: params.autoAccept ?? false },
  });
  navigate('Screen', {
    screen,
    params: {
      callId: params.callId,
      isCaller: params.isCaller,
      callerId: params.callerId,
      receiverId: params.receiverId,
      autoAccept: params.autoAccept,
      nativeCallOnly: usesNativeCallUi(),
    },
  });
};

/** Start an outgoing call: native ringing UI + headless WebRTC session. */
export const startOutgoingCall = async (params: OutgoingCallParams): Promise<boolean> => {
  await reconcileStaleLocalCallState();

  if (isLocallyInCall()) {
    logger.warn('📞 [CallNavigation] Cannot start call — user is already in a call');
    showToast.error({ message: 'You are already in a call' });
    return false;
  }

  const { callId, callType, callerId, receiverId, calleeName } = params;

  navigateHeadlessCallScreen(
    {
      callId,
      callType,
      callerId,
      receiverId,
      isCaller: true,
    },
    'startOutgoingCall',
  );

  if (usesNativeCallUi()) {
    await presentOutgoingCallNative({
      callId,
      callType,
      callerId,
      receiverId,
      calleeName: calleeName || 'Calling…',
    });
    logger.debug('📞 [CallNavigation] Outgoing call started with native UI:', { callId, callType });
  } else {
    logger.debug('📞 [CallNavigation] Outgoing call started with in-app UI:', { callId, callType });
  }
  return true;
};

/** Open the in-app call screen for an already-active call (no accept). */
export const openActiveCallScreen = (
  params: CallNavigationParams,
  source: string,
): boolean => {
  const callId = params.callId;
  const callerId = params.callerId;
  const receiverId = params.receiverId || params.userId;

  if (!callId || !callerId || !receiverId) {
    logger.warn('⚠️ [CallNavigation] Missing params for active call screen:', { source, callId });
    return false;
  }

  if (terminalCalls.has(callId)) {
    return false;
  }

  const currentCallId = getActiveCallIdFromNavigation();
  if (currentCallId === callId) {
    markCallHandled(callId);
    return false;
  }

  markCallHandled(callId);
  navigateHeadlessCallScreen({
    ...params,
    callId,
    callerId,
    receiverId,
    isCaller: params.isCaller ?? false,
    autoAccept: false,
  });
  logger.debug('📞 [CallNavigation] Opened active call screen:', { source, callId });
  return true;
};

/**
 * Status-aware call navigation for notification taps and pending intents.
 * Ringing → native CallKit/Android UI only. Active → in-app screen. Terminal → no-op.
 */
export const handleCallNotificationByStatus = async (
  params: CallNavigationParams,
  source: string,
  options?: { explicitAccept?: boolean },
): Promise<boolean> => {
  const callId = params.callId;
  const callerId = params.callerId;
  const receiverId = params.receiverId || params.userId;
  const explicitAccept = options?.explicitAccept === true;

  if (!callId || !callerId || !receiverId) {
    logger.warn('⚠️ [CallNavigation] Missing call navigation params:', { source, callId });
    return false;
  }

  if (terminalCalls.has(callId)) {
    logger.debug('📞 [CallNavigation] Call is terminal locally, skipping:', { source, callId });
    return false;
  }

  const freshStatus = await getFreshCallStatus(callId);
  if (freshStatus && terminalStatuses.has(freshStatus)) {
    markCallTerminal(callId);
    return false;
  }

  if (explicitAccept) {
    await dismissNativeCallUi(callId);
    if (freshStatus === 'active') {
      return openActiveCallScreen({ ...params, isCaller: false }, source);
    }
    if (emitCallAcceptRequest(callId)) {
      logger.debug('📞 [CallNavigation] Explicit accept forwarded to mounted screen:', { source, callId });
      return true;
    }
    return navigateToIncomingCallIfNeeded({ ...params, autoAccept: true }, source);
  }

  if (freshStatus === 'active') {
    return openActiveCallScreen({ ...params, isCaller: false }, source);
  }

  if (freshStatus === 'ringing' || freshStatus === undefined) {
    return navigateToIncomingCallIfNeeded({ ...params, autoAccept: false }, source);
  }

  logger.debug('📞 [CallNavigation] Unhandled call status, skipping:', { source, callId, freshStatus });
  return false;
};

export const navigateToIncomingCallIfNeeded = async (
  params: CallNavigationParams,
  source: string,
): Promise<boolean> => {
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
    logger.debug('📞 [CallNavigation] Call is terminal locally, skipping:', { source, callId });
    return false;
  }

  const currentCallId = getActiveCallIdFromNavigation();
  if (currentCallId === callId) {
    markCallHandled(callId);
    if (params.autoAccept) {
      const activeStatus = await getFreshCallStatus(callId);
      if (activeStatus === 'active') {
        return openActiveCallScreen({ ...params, isCaller: false }, source);
      }
      if (emitCallAcceptRequest(callId)) {
        logger.debug('📞 [CallNavigation] Accept forwarded to mounted call screen:', { source, callId });
        return true;
      }
      navigateHeadlessCallScreen(
        {
          ...params,
          callId,
          callerId,
          receiverId,
          isCaller: false,
          autoAccept: true,
        },
        source,
      );
      logger.debug('📞 [CallNavigation] Accept re-navigated with autoAccept (listener not ready):', {
        source,
        callId,
      });
      return true;
    }
    return false;
  }

  if (activeHandledCalls.has(callId) && !params.autoAccept) {
    logger.debug('📞 [CallNavigation] Call already handled, skipping:', { source, callId });
    return false;
  }

  const freshStatus = await getFreshCallStatus(callId);
  if (freshStatus && terminalStatuses.has(freshStatus)) {
    markCallTerminal(callId);
    return false;
  }

  if (freshStatus === 'active' && !params.autoAccept) {
    return openActiveCallScreen({ ...params, isCaller: false }, source);
  }

  if (params.autoAccept) {
    markCallHandled(callId);
    if (emitCallAcceptRequest(callId)) {
      logger.debug('📞 [CallNavigation] autoAccept forwarded to mounted screen:', { source, callId });
      return true;
    }
    navigateHeadlessCallScreen({
      ...params,
      callId,
      callerId,
      receiverId,
      isCaller: false,
      autoAccept: true,
    }, source);
    logger.debug('📞 [CallNavigation] Headless WebRTC after explicit accept:', { source, callId });
    return true;
  }

  markCallHandled(callId);

  navigateHeadlessCallScreen(
    {
      ...params,
      callId,
      callerId,
      receiverId,
      isCaller: false,
      autoAccept: false,
    },
    source,
  );

  if (usesNativeCallUi()) {
    if (Platform.OS === 'ios' && await hasActiveCallKitCall(callId)) {
      logger.debug('📞 [CallNavigation] CallKit already showing (ringing):', { source, callId });
      return true;
    }
    await presentIncomingCallNative({
      callId,
      callType: params.callType,
      callerId,
      receiverId,
      callerName: params.callerName || 'Incoming Call',
    });
    logger.debug('📞 [CallNavigation] Native incoming call UI presented:', { source, callId });
  } else {
    logger.debug('📞 [CallNavigation] In-app incoming call UI presented:', { source, callId });
  }

  return true;
};
