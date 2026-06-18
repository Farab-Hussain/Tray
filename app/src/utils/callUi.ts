import { Platform } from 'react-native';

/** iOS uses native CallKit for all call UI; RN screens run WebRTC only (headless). */
export const usesNativeCallUi = (): boolean => Platform.OS === 'ios';
