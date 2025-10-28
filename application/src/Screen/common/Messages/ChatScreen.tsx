import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  TextInput, 
  FlatList,
  KeyboardAvoidingView, 
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/core/colors';
import { chatStyles } from '../../../constants/styles/chatStyles';
import { ChevronLeft, Phone, Video, Smile, Camera, Send } from 'lucide-react-native';
import { useChat } from '../../../hooks/useChat';
import { useChatContext } from '../../../contexts/ChatContext';
import { UserService } from '../../../services/user.service';
import { ConsultantService } from '../../../services/consultant.service';
import { markMessagesSeen } from '../../../services/chat.Service';
import type { Message } from '../../../types/chatTypes';

const ChatScreen = ({ navigation, route }: any) => {
  const [message, setMessage] = useState('');
  const [otherUserName, setOtherUserName] = useState<string>('');
  const [otherUserAvatar, setOtherUserAvatar] = useState<any>(require('../../../assets/image/avatar.png'));
  const [otherUserTitle, setOtherUserTitle] = useState<string>('User');
  
  const { chatId, otherUserId } = route?.params || {};
  const { userId } = useChatContext();
  const { messages, sendMessage } = useChat(chatId);
  
  // Mark messages as seen when chat is opened
  useEffect(() => {
    if (chatId && userId) {
      markMessagesSeen(chatId, userId).catch(error => {
        console.error('Error marking messages as seen:', error);
      });
    }
  }, [chatId, userId]);
  
  // Get consultant info from route params
  const consultantFromParams = route?.params?.consultant;

  // Fetch real user name if not properly set
  useEffect(() => {
    const fetchOtherUserInfo = async () => {
      if (otherUserId) {
        try {
          // First, try to fetch consultant profile (has better profile image data)
          let consultantData = null;
          try {
            consultantData = await ConsultantService.getConsultantProfile(otherUserId);
            console.log('📥 [ChatScreen] Fetched consultant profile:', consultantData);
          } catch {
            console.log('⚠️ [ChatScreen] Not a consultant profile, trying user profile...');
          }

          // If we found consultant data, use it
          if (consultantData?.personalInfo) {
            setOtherUserName(consultantData.personalInfo.fullName || consultantFromParams?.name || 'User');
            setOtherUserAvatar(
              consultantData.personalInfo.profileImage
                ? { uri: consultantData.personalInfo.profileImage }
                : consultantFromParams?.avatar || require('../../../assets/image/avatar.png')
            );
            setOtherUserTitle(consultantData.professionalInfo?.title || consultantFromParams?.title || 'Consultant');
          } else {
            // Fall back to regular user data
            const userData = await UserService.getUserById(otherUserId);
            if (userData) {
              console.log('📥 [ChatScreen] Fetched user data:', userData);
              setOtherUserName(userData.name || consultantFromParams?.name || 'User');
              setOtherUserAvatar(
                userData.profileImage || userData.avatarUrl 
                  ? { uri: userData.profileImage || userData.avatarUrl }
                  : consultantFromParams?.avatar || require('../../../assets/image/avatar.png')
              );
              setOtherUserTitle(userData.role || consultantFromParams?.title || 'User');
            } else if (consultantFromParams) {
              setOtherUserName(consultantFromParams.name || 'User');
              setOtherUserAvatar(consultantFromParams.avatar);
              setOtherUserTitle(consultantFromParams.title || 'User');
            }
          }
        } catch (error) {
          console.error('❌ [ChatScreen] Error fetching user info:', error);
          if (consultantFromParams) {
            setOtherUserName(consultantFromParams.name || 'User');
            setOtherUserAvatar(consultantFromParams.avatar);
            setOtherUserTitle(consultantFromParams.title || 'User');
          }
        }
      } else if (consultantFromParams) {
        setOtherUserName(consultantFromParams.name || 'User');
        setOtherUserAvatar(consultantFromParams.avatar);
        setOtherUserTitle(consultantFromParams.title || 'User');
      }
    };

    fetchOtherUserInfo();
  }, [otherUserId, consultantFromParams]);

  // Final consultant info to display
  const consultant = {
    name: otherUserName || consultantFromParams?.name || 'User',
    title: otherUserTitle || consultantFromParams?.title || 'User',
    avatar: otherUserAvatar || consultantFromParams?.avatar || require('../../../assets/image/avatar.png'),
    isOnline: consultantFromParams?.isOnline || true
  };

  const handleSendMessage = async () => {
    if (message.trim() && chatId && userId) {
      const messageText = message.trim();
      // Clear input immediately for better UX
      setMessage('');
      
      // Send message in background
      sendMessage({
        chatId,
        senderId: userId,
        text: messageText,
        type: 'text',
        seenBy: [userId],
      }).catch(error => {
        console.error('Error sending message:', error);
        // Optionally restore the message if send fails
      });
    }
  };

  const handleCall = () => {
    console.log('Initiating call...');
    navigation.navigate('CallingScreen');
  };

  const handleVideoCall = () => {
    console.log('Initiating video call...');
    navigation.navigate('VideoCallingScreen');
  };

  return (
    <SafeAreaView style={chatStyles.container} edges={['top']}>
      {/* Header */}
      <View style={chatStyles.header}>
        <TouchableOpacity 
          style={chatStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        
        <View style={chatStyles.contactInfo}>
          <View style={chatStyles.avatarContainer}>
            <Image source={consultant.avatar} style={chatStyles.avatar} />
            {consultant.isOnline && <View style={chatStyles.onlineIndicator} />}
          </View>
          <View style={chatStyles.contactDetails}>
            <Text style={chatStyles.contactName}>{consultant.name}</Text>
            <Text style={chatStyles.contactTitle}>{consultant.title}</Text>
          </View>
        </View>
        
        <View style={chatStyles.headerActions}>
          <TouchableOpacity style={chatStyles.actionButton} onPress={handleCall}>
            <Phone size={20} color={COLORS.black} />
          </TouchableOpacity>
          <TouchableOpacity style={chatStyles.actionButton} onPress={handleVideoCall}>
            <Video size={20} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView 
        style={chatStyles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList 
          style={chatStyles.messagesContainer}
          contentContainerStyle={chatStyles.messagesContent}
          data={messages}
          keyExtractor={(item) => item.id || ''}
          renderItem={({ item }: { item: Message & { id?: string } }) => {
            const isUser = item.senderId === userId;
            return (
              <View 
                style={[
                  chatStyles.messageBubble,
                  isUser ? chatStyles.userMessage : chatStyles.otherMessage
                ]}
              >
                {item.type === 'text' && (
                  <Text style={[
                    chatStyles.messageText,
                    isUser ? chatStyles.userMessageText : chatStyles.otherMessageText
                  ]}>
                    {item.text}
                  </Text>
                )}
                {item.type !== 'text' && (
                  <Text style={[
                    chatStyles.messageText,
                    isUser ? chatStyles.userMessageText : chatStyles.otherMessageText
                  ]}>
                    [{item.type}]
                  </Text>
                )}
              </View>
            );
          }}
        />

        {/* Message Input */}
        <View style={chatStyles.inputContainer}>
          <View style={chatStyles.inputWrapper}>
            <TouchableOpacity style={chatStyles.emojiButton}>
              <Smile size={20} color={COLORS.gray} />
            </TouchableOpacity>
            
            <TextInput
              style={chatStyles.textInput}
              placeholder="Write here"
              placeholderTextColor={COLORS.gray}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
            
            <TouchableOpacity style={chatStyles.cameraButton}>
              <Camera size={20} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[
              chatStyles.sendButton,
              message.trim() ? chatStyles.sendButtonActive : chatStyles.sendButtonInactive
            ]}
            onPress={handleSendMessage}
            disabled={!message.trim()}
          >
            <Send size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
