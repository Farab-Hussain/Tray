import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Send, Phone, Video, ArrowLeft } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import { 
  createChatIfNotExists, 
  sendMessage, 
  listenMessages, 
  markMessagesSeen,
  Message 
} from '../../../services/chat.Service';
import { useAuth } from '../../../contexts/AuthContext';
import { UserService } from '../../../services/user.service';

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { consultantId }: { consultantId: string } = route.params as any;
  const [messages, setMessages] = useState<(Message & { id: string })[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState<string>('');
  const [consultantName, setConsultantName] = useState<string>('Consultant');

  useEffect(() => {
    initializeChat();
  }, [consultantId]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // Get consultant info
      if (consultantId) {
        try {
          const consultantData = await UserService.getUserById(consultantId);
          if (consultantData) {
            setConsultantName(consultantData.name || consultantData.displayName || 'Consultant');
          }
        } catch (error) {
          console.warn('Failed to fetch consultant info:', error);
        }
      }

      // Create or get chat
      const chat = await createChatIfNotExists(user?.uid || '', consultantId);
      setChatId(chat);
      
      // Mark messages as seen
      await markMessagesSeen(chat, user?.uid || '');
      
      // Listen for messages
      const unsubscribe = listenMessages(chat, (newMessages) => {
        setMessages(newMessages);
        // Auto scroll to bottom
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });
      
      return unsubscribe;
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !chatId) return;

    try {
      setSending(true);
      
      await sendMessage(chatId, {
        text: messageText.trim(),
        senderId: user?.uid || '',
        type: 'text',
        seenBy: [],
      });
      
      setMessageText('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleVideoCall = () => {
    Alert.alert('Coming Soon', 'Video call feature will be available soon!');
  };

  const handleAudioCall = () => {
    Alert.alert('Coming Soon', 'Audio call feature will be available soon!');
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.green} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: COLORS.black,
          }}>
            {consultantName}
          </Text>
          <Text style={{
            fontSize: 12,
            color: COLORS.gray,
          }}>
            Online
          </Text>
        </View>
        
        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: COLORS.green,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8,
          }}
          onPress={handleAudioCall}
        >
          <Phone size={20} color={COLORS.white} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: COLORS.blue,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={handleVideoCall}
        >
          <Video size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, padding: 16 }}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.length === 0 ? (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 40,
            }}>
              <Text style={{
                fontSize: 16,
                color: COLORS.gray,
                textAlign: 'center',
              }}>
                Start a conversation with {consultantName}
              </Text>
            </View>
          ) : (
            messages.map((message) => {
              const isMyMessage = message.senderId === user?.uid;
              return (
                <View
                  key={message.id}
                  style={{
                    flexDirection: isMyMessage ? 'row-reverse' : 'row',
                    marginBottom: 12,
                    alignItems: 'flex-end',
                  }}
                >
                  <View style={{
                    maxWidth: '70%',
                    backgroundColor: isMyMessage ? COLORS.green : COLORS.white,
                    padding: 12,
                    borderRadius: 16,
                    borderBottomLeftRadius: isMyMessage ? 16 : 4,
                    borderBottomRightRadius: isMyMessage ? 4 : 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  }}>
                    <Text style={{
                      fontSize: 14,
                      color: isMyMessage ? COLORS.white : COLORS.black,
                      lineHeight: 18,
                    }}>
                      {message.text}
                    </Text>
                    <Text style={{
                      fontSize: 10,
                      color: isMyMessage ? COLORS.white + '80' : COLORS.gray,
                      marginTop: 4,
                      textAlign: isMyMessage ? 'right' : 'left',
                    }}>
                      {formatTime(message.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Message Input */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.lightGray,
        }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: COLORS.lightGray,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              fontSize: 16,
              maxHeight: 40,
              marginRight: 12,
            }}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            onSubmitEditing={handleSendMessage}
          />
          
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: messageText.trim() ? COLORS.green : COLORS.gray,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Send size={20} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
