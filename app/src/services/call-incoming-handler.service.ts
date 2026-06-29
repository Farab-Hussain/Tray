import { isLocallyInCall } from './active-call.service';
import {
  markCallDelivered,
  rejectCallAsBusy,
  type CallDocument,
} from './call.service';
import {
  markCallTerminal,
  navigateToIncomingCallIfNeeded,
} from './call-navigation.service';
import { dismissNativeCallUi } from './native-intent.service';
import { logger } from '../utils/logger';

/**
 * Central handler for incoming calls — applies busy check before ringing UI.
 */
export const handleIncomingCallDetected = async (
  callId: string,
  callData: CallDocument,
  receiverId: string,
  source: string,
): Promise<void> => {
  if (isLocallyInCall(callId)) {
    logger.debug('📞 [Incoming] User busy — auto-rejecting:', { callId, source });
    markCallTerminal(callId);
    await rejectCallAsBusy(callId, receiverId);
    await dismissNativeCallUi(callId, 'missed');
    return;
  }

  try {
    if (!callData.delivered) {
      await markCallDelivered(callId);
    }
    await navigateToIncomingCallIfNeeded(
      {
        callId,
        callType: callData.type,
        callerId: callData.callerId,
        receiverId,
      },
      source,
    );
  } catch (error) {
    logger.warn('⚠️ [Incoming] Error handling call:', { callId, source, error });
  }
};
