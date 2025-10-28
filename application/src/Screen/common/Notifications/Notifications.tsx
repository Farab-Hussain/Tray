import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View } from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import SearchBar from '../../../components/shared/SearchBar';
import NotificationItem from '../../../components/ui/NotificationItem';
import { notification } from '../../../constants/styles/notification';
import { notificationData } from '../../../constants/data/notificationData';

const Notifications = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader title="Notifications" onBackPress={() => navigation.goBack()} />

      <ScrollView
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search Consultant"
        />

        {/* Notifications List */}
        <View style={notification.listContainer}>
          {notificationData.map((notification) => (
            <NotificationItem
              key={notification.id}
              id={notification.id}
              consultantName={notification.consultantName}
              consultantAvatar={notification.consultantAvatar}
              message={notification.message}
              time={notification.time}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Notifications;
