import {
  consumeNativePendingCallIntent,
  dismissNativeCallUi,
  peekNativePendingCallIntent,
  type PendingCallIntent,
} from './native-intent.service';
import { markCallHandled, markCallTerminal } from './call-navigation.service';
import { endCall } from './call.service';

export const getColdStartCallScreen = (callType?: string) =>
  callType === 'video' ? 'VideoCallingScreen' : 'CallingScreen';

export const buildColdStartCallParams = (intent: PendingCallIntent) => ({
  callId: intent.callId,
  callerId: intent.callerId,
  receiverId: intent.receiverId,
  isCaller: false,
  autoAccept: intent.action === 'accept',
});

export const hasColdStartCallIntent = async (): Promise<boolean> => {
  const pending = await peekNativePendingCallIntent();
  return Boolean(
    pending?.callId &&
      pending.callerId &&
      pending.receiverId &&
      pending.action !== 'decline',
  );
};

/**
 * On cold start from notification accept/open, consume native intent and return
 * navigation target. Handles decline without opening the call screen.
 */
export const resolveColdStartCallLaunch = async (): Promise<{
  screen: string;
  params: ReturnType<typeof buildColdStartCallParams>;
} | null> => {
  const pending = await consumeNativePendingCallIntent();
  if (!pending?.callId || !pending.callerId || !pending.receiverId) {
    return null;
  }

  if (pending.action === 'decline') {
    markCallTerminal(pending.callId);
    await dismissNativeCallUi(pending.callId, 'missed');
    endCall(pending.callId, 'missed').catch(() => {});
    return null;
  }

  markCallHandled(pending.callId);
  await dismissNativeCallUi(pending.callId);

  return {
    screen: getColdStartCallScreen(pending.callType),
    params: buildColdStartCallParams(pending),
  };
};
