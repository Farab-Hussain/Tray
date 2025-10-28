import React from 'react';
import { View, Text, Image } from 'react-native';
import { notification } from '../../constants/styles/notification';

type NotificationItemProps = {
  id: number;
  consultantName: string;
  consultantAvatar: any;
  message: string;
  time: string;
};

const NotificationItem = ({ consultantName, consultantAvatar, message, time }: NotificationItemProps) => {
  return (
    <View style={notification.itemContainer}>
      <Image
        source={consultantAvatar}
        style={notification.avatar}
      />
      <View style={notification.contentContainer}>
        <Text style={notification.consultantName}>{consultantName}</Text>
        <Text style={notification.message}>{message}</Text>
      </View>
      <Text style={notification.time}>{time}</Text>
    </View>
  );
};

export default NotificationItem;
