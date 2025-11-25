import { View, Text, Image } from 'react-native';
import { message } from '../../constants/styles/message';

type MessageProps = {
  id: string | number;
  name: string;
  avatar: any;
  lastMessage: string;
  time: string;
  unreadCount: number;
};

const Message = ({ name, avatar, lastMessage, time, unreadCount }: MessageProps) => {
  // Debug: Log unread count
  if (__DEV__ && unreadCount > 0) {
        if (__DEV__) {
      console.log(`🔔 [Message] Rendering badge for ${name}: unreadCount=${unreadCount}`)
    };
  }

  return (
    <View style={message.messageContainer}>
      <View style={message.messageHeader}>
        <Image
          source={avatar}
          style={message.messageAvatar}
        />
        <View style={message.messageNameContainer}>
          <Text style={message.messageName}>{name}</Text>
          <Text style={message.messageContent}>{lastMessage}</Text>
        </View>
        <View style={message.messageTimeContainer}>
          <Text style={message.messageTime}>{time}</Text>
          {unreadCount > 0 && (
            <View style={message.badgeContainer} testID="unread-badge">
              <Text style={message.badgeText} numberOfLines={1}>
                {unreadCount > 99 ? '99+' : unreadCount.toString()}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default Message;
