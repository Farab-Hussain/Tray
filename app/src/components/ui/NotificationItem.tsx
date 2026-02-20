import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { UserRound } from 'lucide-react-native';
import { notification } from '../../constants/styles/notification';
import { COLORS } from '../../constants/core/colors';
import type { AppNotification } from '../../services/notification-storage.service';
import { notificationItemStyles } from '../../constants/styles/notificationItemStyles';
import { normalizeAvatarUrl, normalizeTimestampToDate } from '../../utils/normalize';

type NotificationItemProps = {
  notification: AppNotification;
  onPress?: () => void;
};

const NotificationItem = ({ notification: notif, onPress }: NotificationItemProps) => {
  const formatTime = (dateValue: any) => {
    const date = normalizeTimestampToDate(dateValue) || new Date();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = () => {
    if (notif.type === 'booking_cancelled') {
      return '❌';
    }

    switch (notif.category) {
      case 'message':
        return '💬';
      case 'call':
        return '📞';
      case 'booking':
        return '📅';
      case 'payment':
        return '💳';
      case 'review':
        return '⭐';
      default:
        return '🔔';
    }
  };

  const senderAvatar = normalizeAvatarUrl({ profileImage: notif.senderAvatar });
  const avatarSource = senderAvatar ? { uri: senderAvatar } : null;

  return (
    <TouchableOpacity
      style={[
        notification.itemContainer,
        !notif.read && styles.unreadContainer,
        !notif.read && { paddingLeft: 4 } 
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {!notif.read && <View style={styles.unreadIndicator} />}
      
      <View style={styles.avatarContainer}>
        {avatarSource ? (
          <Image source={avatarSource} style={notification.avatar} />
        ) : (
          <View
            style={[
              notification.avatar,
              {
                backgroundColor: '#A5AFBD',
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            <UserRound size={20} color={COLORS.gray} />
          </View>
        )}
        <Text style={styles.iconBadge}>{getNotificationIcon()}</Text>
          {/* Unread badge on avatar */}
        {!notif.read && <View style={styles.avatarUnreadBadge} />}
      </View>
      <View style={notification.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={[
            notification.consultantName,
            !notif.read && styles.unreadText
          ]}>
            {notif.title}
          </Text>
        </View>
        <Text style={[
          notification.message,
          !notif.read && styles.unreadMessage
        ]} numberOfLines={2}>
          {notif.message}
        </Text>
      </View>
      <View style={styles.rightSection}>
        <Text style={[
          notification.time,
          !notif.read && styles.unreadTime
        ]}>
          {formatTime(notif.createdAt)}
        </Text>
        {!notif.read && (
          <View style={styles.unreadDot} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = notificationItemStyles;

export default NotificationItem;
