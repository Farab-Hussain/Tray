import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import SearchBar from '../../../components/shared/SearchBar';
import { message } from '../../../constants/styles/message';
import Message from '../../../components/ui/Message';
import { useChatContext } from '../../../contexts/ChatContext';
import { formatFirestoreTimeRelative } from '../../../utils/time';
import { UserService } from '../../../services/user.service';
import { ConsultantService } from '../../../services/consultant.service';
import type { Chat } from '../../../types/chatTypes';

const Messages = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { chats, userId, refreshChats } = useChatContext();
  const [userNames, setUserNames] = useState<
    Map<string, { name: string; avatar?: string }>
  >(new Map());

  // Active users logic removed - not needed
  /* const activeUsers = useMemo(() => {
    // Strict check: if no userId or chats, return empty
    if (!userId || !chats || chats.length === 0) {
      console.log('🚫 [Active Users] No userId or chats');
      return [];
    }

    const seenUserIds = new Set<string>();
    const activeUserList: Array<{
      id: string;
      name: string;
      avatar: any;
      isOnline: boolean;
    }> = [];

    // Get unique users from recent chats
    for (const chat of chats) {
      if (!chat.participants || chat.participants.length === 0) continue;
      
      // Filter to get ONLY participants that are NOT the current user
      const otherParticipants = chat.participants.filter(
        (p: string): boolean => p !== userId,
      );
      
      // Get the first other user (should only be one in 1:1 chat)
      const otherUserId = otherParticipants[0];

      // Strict validation: must exist, must not be current user, must not be duplicate
      if (!otherUserId || otherUserId === userId || seenUserIds.has(otherUserId)) {
        continue;
      }

      const userInfo = userNames.get(otherUserId);

      activeUserList.push({
        id: otherUserId,
        name: userInfo?.name || 'User',
        avatar: userInfo?.avatar
          ? { uri: userInfo.avatar }
          : require('../../../assets/image/avatar.png'),
        isOnline: true,
      });

      seenUserIds.add(otherUserId);

      // Limit to 8 users
      if (activeUserList.length >= 8) {
        break;
      }
    }

    // Final safety check: remove any users that match current userId
    const filteredList = activeUserList.filter(user => {
      if (user.id === userId) {
        console.log('🚫 [Active Users] Removed self from list:', user.id);
        return false;
      }
      return true;
    });

    return filteredList;
  }, [chats, userId, userNames]); */

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
            // First, try to fetch consultant profile (has better profile image data)
            let consultantData = null;
            try {
              consultantData = await ConsultantService.getConsultantProfile(otherUserId);
              console.log('📥 [Messages] Fetched consultant profile:', consultantData);
            } catch {
              console.log('⚠️ [Messages] Not a consultant profile, trying user profile...');
            }

            // If we found consultant data, use it
            if (consultantData?.personalInfo) {
              const userName = consultantData.personalInfo.fullName || 'Consultant';
              const userAvatar = consultantData.personalInfo.profileImage;
              nameMap.set(otherUserId, {
                name: userName,
                avatar: userAvatar,
              });
            } else {
              // Fall back to regular user data
              const userData = await UserService.getUserById(otherUserId);
              if (userData) {
                const userName = userData.name || userData.displayName || 'User';
                
                // Try multiple possible profile image fields
                const profileImage = 
                  userData.profileImage || 
                  userData.avatarUrl ||
                  userData.avatar ||
                  userData.profile?.profileImage ||
                  userData.profile?.avatarUrl;
                
                nameMap.set(otherUserId, {
                  name: userName,
                  avatar: profileImage,
                });
              } else {
                nameMap.set(otherUserId, { name: 'User' });
              }
            }
          } catch (error) {
            console.error('❌ [Messages] Error fetching user info:', error);
            nameMap.set(otherUserId, { name: 'User' });
          }
        }
      }

      setUserNames(nameMap);
    };

    fetchUserNames();
  }, [chats, userId]);

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader title="Messages" onBackPress={() => navigation.goBack()} />

      <ScrollView
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search"
        />
         
         {/* Messages List */}
         <Text style={message.heading}>Messages</Text>
         <View style={message.messagesListContainer}>
          {chats.length > 0 ? (
            chats.map((chat: Chat) => {
              // Extract other user's ID
              const otherUserId =
                chat.participants?.find(p => p !== userId) || '';
              const userInfo = userNames.get(otherUserId);
              const displayName = userInfo?.name || 'User';
              const avatar = userInfo?.avatar
                ? { uri: userInfo.avatar }
                : require('../../../assets/image/avatar.png');

              return (
             <TouchableOpacity
               key={chat.id}
                  onPress={() =>
                    navigation.navigate('ChatScreen', {
                      chatId: chat.id,
                      otherUserId,
                 consultant: {
                        name: displayName,
                        title: 'Consultant',
                        avatar: avatar,
                        isOnline: true,
                      },
                    })
                  }
             >
               <Message
                 id={chat.id}
                    name={displayName}
                    avatar={avatar}
                    lastMessage={chat.lastMessage || 'Start conversation'}
                    time={formatFirestoreTimeRelative(chat.lastMessageAt)}
                    unreadCount={chat.unreadCount || 0}
               />
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

export default Messages;
