import { Platform } from 'react-native';
import { navigate } from '../navigator/navigationRef';
import { logger } from '../utils/logger';
import {
  handleCallNotificationByStatus,
  markCallTerminal,
} from './call-navigation.service';
import { endCall, isCallEndable } from './call.service';

type NotificationData = Record<string, string | undefined>;

/**
 * Navigate from FCM notification payload (chat, call, booking).
 * Uses navigationRef so it works from NotificationContext without a screen navigation prop.
 */
export const handleNotificationOpen = async (
  remoteMessage: { data?: NotificationData; action?: string },
): Promise<void> => {
  const messageData = remoteMessage?.data || {};
  const action = messageData.action || remoteMessage?.action;

  if (messageData.type === 'call' || messageData.callId) {
    const callId = messageData.callId;
    const callType = messageData.callType || 'audio';
    const callerId = messageData.callerId;
    const receiverId = messageData.receiverId || messageData.userId;

    if (action === 'decline' && callId) {
      if (await isCallEndable(callId)) {
        markCallTerminal(callId);
        endCall(callId, 'missed').catch(() => {});
      }
      return;
    }

    const explicitAccept =
      action === 'accept' && Platform.OS === 'android';

    await handleCallNotificationByStatus(
      {
        callId,
        callType,
        callerId,
        receiverId,
        callerName: messageData.callerName,
      },
      explicitAccept ? 'notification-action-accept' : 'notification-open',
      { explicitAccept },
    );
    return;
  }

  if (messageData.type === 'chat_message' || messageData.chatId) {
    const chatId = messageData.chatId;
    const senderId = messageData.senderId;
    if (!chatId) return;

    setTimeout(() => {
      navigate('ChatScreen', {
        chatId,
        otherUserId: senderId,
        focusInput: action === 'reply',
      });
    }, 300);
    return;
  }

  if (messageData.type === 'booking' || messageData.bookingId) {
    logger.debug('ℹ️ [NotificationNavigation] Booking notification — open bookings from app menu');
    return;
  }

  logger.debug('ℹ️ [NotificationNavigation] Unhandled notification type:', messageData.type);
};
