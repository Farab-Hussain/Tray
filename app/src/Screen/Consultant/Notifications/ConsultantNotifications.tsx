import React, { useState } from 'react';
import { Text, ScrollView, View, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { screenStyles } from '../../../constants/styles/screenStyles';
import HomeHeader from '../../../components/shared/HomeHeader';
import NotificationItem from '../../../components/ui/NotificationItem';
import SearchBar from '../../../components/shared/SearchBar';
import { notification } from '../../../constants/styles/notification';
import { useNotificationContext } from '../../../contexts/NotificationContext';
import { useChatContext } from '../../../contexts/ChatContext';
import { consultantNotificationsStyles } from '../../../constants/styles/consultantNotificationsStyles';
import LoadingState from '../../../components/ui/LoadingState';

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
          <LoadingState message="Loading notifications..." color="#3B82F6" />
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

const styles = consultantNotificationsStyles;

export default ConsultantNotifications;
