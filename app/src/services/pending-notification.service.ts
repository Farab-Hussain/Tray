import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const PENDING_CALL_KEY = '@tray_pending_call_notification';
const PENDING_CHAT_KEY = '@tray_pending_chat_notification';

export type PendingCallPayload = {
  callId: string;
  callType?: string;
  callerId?: string;
  receiverId?: string;
  autoAccept?: boolean;
};

export type PendingChatPayload = {
  chatId: string;
  senderId?: string;
};

export const storePendingCall = async (payload: PendingCallPayload): Promise<void> => {
  try {
    await AsyncStorage.setItem(PENDING_CALL_KEY, JSON.stringify(payload));
  } catch (error) {
    logger.warn('⚠️ [PendingNotification] Failed to store pending call:', error);
  }
};

export const consumePendingCall = async (): Promise<PendingCallPayload | null> => {
  try {
    const raw = await AsyncStorage.getItem(PENDING_CALL_KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(PENDING_CALL_KEY);
    return JSON.parse(raw) as PendingCallPayload;
  } catch (error) {
    logger.warn('⚠️ [PendingNotification] Failed to read pending call:', error);
    return null;
  }
};

export const storePendingChat = async (payload: PendingChatPayload): Promise<void> => {
  try {
    await AsyncStorage.setItem(PENDING_CHAT_KEY, JSON.stringify(payload));
  } catch (error) {
    logger.warn('⚠️ [PendingNotification] Failed to store pending chat:', error);
  }
};

export const consumePendingChat = async (): Promise<PendingChatPayload | null> => {
  try {
    const raw = await AsyncStorage.getItem(PENDING_CHAT_KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(PENDING_CHAT_KEY);
    return JSON.parse(raw) as PendingChatPayload;
  } catch (error) {
    logger.warn('⚠️ [PendingNotification] Failed to read pending chat:', error);
    return null;
  }
};
