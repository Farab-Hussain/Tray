import { navigate } from '../navigator/navigationRef';
import { logger } from '../utils/logger';
import {
  markCallTerminal,
  navigateToIncomingCallIfNeeded,
} from './call-navigation.service';
import { endCall } from './call.service';

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
      markCallTerminal(callId);
      endCall(callId, 'missed').catch(() => {});
      return;
    }

    await navigateToIncomingCallIfNeeded(
      {
        callId,
        callType,
        callerId,
        receiverId,
        autoAccept: action === 'accept',
      },
      action === 'accept' ? 'notification-action-accept' : 'notification-open',
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
