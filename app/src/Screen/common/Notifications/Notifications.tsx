import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import SearchBar from '../../../components/shared/SearchBar';
import NotificationItem from '../../../components/ui/NotificationItem';
import Loader from '../../../components/ui/Loader';
import { notification } from '../../../constants/styles/notification';
import { COLORS } from '../../../constants/core/colors';
import { useNotificationContext } from '../../../contexts/NotificationContext';
import { useChatContext } from '../../../contexts/ChatContext';

const Notifications = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    isLoading,
  } = useNotificationContext();
  const { openChatWith } = useChatContext();

  // Filter notifications based on search and category
  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch =
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const handleNotificationPress = async (notif: any) => {
    // Mark as read
    if (!notif.read) {
      await markAsRead(notif.id);
    }

    // Navigate based on notification type
    if (notif.type === 'chat_message' && notif.data?.chatId) {
      // Open chat
      if (notif.senderId) {
        openChatWith(notif.senderId);
      }
      navigation.navigate('ChatScreen', {
        chatId: notif.data.chatId,
        otherUserId: notif.senderId,
      });
    } else if (notif.type === 'booking' && notif.data?.bookingId) {
      // Navigate to booking details
      navigation.navigate('BookingDetails', {
        bookingId: notif.data.bookingId,
      });
    }
    // Add more navigation cases as needed
  };

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader
        title={
          <View style={styles.headerContainer}>
            <Text style={screenStyles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        }
        onBackPress={() => navigation.goBack()}
        rightComponent={
          unreadCount > 0 ? (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={styles.markAllButton}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshNotifications}
            tintColor={COLORS.green}
            colors={[COLORS.green]}
          />
        }
      >
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search notifications"
        />

        {/* Notifications List */}
        {isLoading && notifications.length === 0 ? (
          <Loader message="Loading notifications..." />
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>📭</Text>
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try a different search term'
                : "You're all caught up!"}
            </Text>
          </View>
        ) : (
          <View style={notification.listContainer}>
            {filteredNotifications.map(notif => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onPress={() => handleNotificationPress(notif)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: COLORS.red,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
  },
});

export default Notifications;
