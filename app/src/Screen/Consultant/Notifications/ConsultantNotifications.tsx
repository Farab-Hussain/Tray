import React, { useState } from 'react';
import { Text, ScrollView, View, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { screenStyles } from '../../../constants/styles/screenStyles';
import HomeHeader from '../../../components/shared/HomeHeader';
import NotificationItem from '../../../components/ui/NotificationItem';
import SearchBar from '../../../components/shared/SearchBar';
import { notification } from '../../../constants/styles/notification';
import { useNotificationContext } from '../../../contexts/NotificationContext';
import { useChatContext } from '../../../contexts/ChatContext';

const ConsultantNotifications = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications, isLoading } = useNotificationContext();
  const { openChatWith } = useChatContext();

  // Filter notifications based on search
  const filteredNotifications = notifications.filter(notif =>
    notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notif.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      navigation.navigate('BookingDetails', { bookingId: notif.data.bookingId });
    }
  };

  return (
    <SafeAreaView style={screenStyles.safeArea} edges={['top']}>
      <HomeHeader />
      <View style={styles.headerContainer}>
        <Text style={screenStyles.heading}>
          Notifications
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshNotifications} />
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
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>📭</Text>
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'You\'re all caught up!'}
            </Text>
          </View>
        ) : (
          <View style={notification.listContainer}>
            {filteredNotifications.map((notif) => (
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 16,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 8,
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});

export default ConsultantNotifications;
