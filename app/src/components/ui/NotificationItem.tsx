import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { notification } from '../../constants/styles/notification';
import { COLORS } from '../../constants/core/colors';
import type { AppNotification } from '../../services/notification-storage.service';

type NotificationItemProps = {
  notification: AppNotification;
  onPress?: () => void;
};

const NotificationItem = ({ notification: notif, onPress }: NotificationItemProps) => {
  const formatTime = (date: Date) => {
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

  const avatarSource = notif.senderAvatar
    ? { uri: notif.senderAvatar }
    : require('../../assets/image/avatar.png');

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
        <Image
          source={avatarSource}
          style={notification.avatar}
        />
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

const styles = StyleSheet.create({
  unreadContainer: {
    backgroundColor: COLORS.white,
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.green,
  },
  unreadText: {
    fontWeight: '700',
    color: COLORS.green,
  },
  unreadMessage: {
    fontWeight: '600',
    color: COLORS.green,
  },
  unreadTime: {
    fontWeight: '600',
    color: COLORS.green,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatarUnreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.red,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    fontSize: 14,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 70,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.green,
    marginTop: 6,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default NotificationItem;
