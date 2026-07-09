/**
 * FairChance uses the in-app CallingScreen / VideoCallingScreen for incoming calls on
 * both iOS and Android (avatar, accept/decline controls).
 *
 * Native full-screen UI (CallKit / IncomingCallActivity) is disabled so both
 * platforms share the same React Native experience.
 */
export const usesNativeCallUi = (): boolean => false;
