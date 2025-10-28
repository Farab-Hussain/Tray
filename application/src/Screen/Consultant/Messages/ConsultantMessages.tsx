import { Text, ScrollView, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { screenStyles } from '../../../constants/styles/screenStyles';
import HomeHeader from '../../../components/shared/HomeHeader';
import { useChatContext } from '../../../contexts/ChatContext';
import { useEffect, useState } from 'react';
import { formatFirestoreTimeRelative } from '../../../utils/time';
import { UserService } from '../../../services/user.service';
import type { Chat } from '../../../types/chatTypes';

const ConsultantMessages = ({ navigation }: any) => {
  const { chats, userId, refreshChats } = useChatContext();
  const [userNames, setUserNames] = useState<Map<string, { name: string; avatar?: string }>>(new Map());

  useEffect(() => {
    refreshChats();
  }, [refreshChats]);

  // Fetch user names for all chat participants
  useEffect(() => {
    const fetchUserNames = async () => {
      if (!chats || !userId) return;

      const nameMap = new Map<string, { name: string; avatar?: string }>();

      for (const chat of chats) {
        const otherUserId = chat.participants?.find(p => p !== userId);
        if (otherUserId && !nameMap.has(otherUserId)) {
          try {
            const userData = await UserService.getUserById(otherUserId);
            console.log('📥 [ConsultantMessages] User data for', otherUserId, ':', userData);
            
            if (userData) {
              const userName = userData.name || userData.displayName || 'User';
              console.log('✅ [ConsultantMessages] Setting name:', userName);
              
              // Try multiple possible profile image fields
              const profileImage = 
                userData.profileImage || 
                userData.avatarUrl ||
                userData.avatar ||
                userData.profile?.profileImage ||
                userData.profile?.avatarUrl;
              
              console.log('🖼️ [ConsultantMessages] Profile image:', profileImage);
              
              nameMap.set(otherUserId, {
                name: userName,
                avatar: profileImage
              });
            } else {
              console.log('⚠️ [ConsultantMessages] No user data for', otherUserId);
              nameMap.set(otherUserId, { name: 'Student' });
            }
          } catch (error) {
            console.error('❌ [ConsultantMessages] Error fetching user name:', error);
            nameMap.set(otherUserId, { name: 'Student' });
          }
        }
      }

      setUserNames(nameMap);
    };

    fetchUserNames();
  }, [chats, userId]);

  return (
    <SafeAreaView style={screenStyles.safeArea} edges={['top']}>
      <HomeHeader />
      <ScrollView
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={screenStyles.container}>
          <Text style={screenStyles.heading}>Messages</Text>
          
          {chats.length > 0 ? (
            chats.map((chat: Chat) => {
              // Extract other user's ID
              const otherUserId = chat.participants?.find(p => p !== userId) || '';
              const userInfo = userNames.get(otherUserId);
              const displayName = userInfo?.name || 'Student';
              const avatar = userInfo?.avatar 
                ? { uri: userInfo.avatar } 
                : require('../../../assets/image/avatar.png');
              
              return (
                <TouchableOpacity
                  key={chat.id}
                  style={{ 
                    padding: 15, 
                    borderBottomWidth: 1, 
                    borderBottomColor: '#eee',
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                  }}
                  onPress={() => navigation.navigate('ChatScreen', {
                    chatId: chat.id,
                    otherUserId,
                    consultant: {
                      name: displayName,
                      title: 'Student',
                      avatar: avatar,
                      isOnline: true
                    }
                  })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600' }}>{displayName}</Text>
                    <Text style={{ color: '#666', marginTop: 4 }} numberOfLines={1}>
                      {chat.lastMessage || 'Start conversation'}
                    </Text>
                  </View>
                  <Text style={{ color: '#999', fontSize: 12 }}>
                    {formatFirestoreTimeRelative(chat.lastMessageAt)}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#999' }}>No messages yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ConsultantMessages;
