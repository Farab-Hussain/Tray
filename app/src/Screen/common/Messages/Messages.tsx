import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import SearchBar from '../../../components/shared/SearchBar';
import { message } from '../../../constants/styles/message';
import Message from '../../../components/ui/Message';
import Loader from '../../../components/ui/Loader';
import { useChatContext } from '../../../contexts/ChatContext';
import { formatFirestoreTimeRelative } from '../../../utils/time';
import { UserService } from '../../../services/user.service';
import { ConsultantService } from '../../../services/consultant.service';
import type { Chat } from '../../../types/chatTypes';
import { COLORS } from '../../../constants/core/colors';
import { Trash2 } from 'lucide-react-native';

const Messages = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { chats, userId, refreshChats, deleteChat } = useChatContext();
  const [userNames, setUserNames] = useState<
    Map<string, { name: string; avatar?: string }>
  >(new Map());
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingUserNames, setIsLoadingUserNames] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  console.log('📱 [Messages] Component render - userId:', userId, 'chats count:', chats?.length || 0);
  
  // Debug: Log unread counts
  useEffect(() => {
    if (chats && chats.length > 0) {
      console.log(`📊 [Messages] Total chats: ${chats.length}`);
      chats.forEach(chat => {
        const unread = chat.unreadCount || 0;
        console.log(`📊 [Messages] Chat ${chat.id}: unreadCount=${unread}, lastMessage="${chat.lastMessage}"`);
        if (unread > 0) {
          console.log(`🔔 [Messages] ⚠️ Chat ${chat.id} has ${unread} unread messages!`);
        }
      });
    }
  }, [chats]);

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
    const loadChats = async () => {
      console.log('🔄 [Messages] Refresh chats triggered');
      if (userId) {
        setIsLoadingChats(true);
        try {
          await refreshChats();
        } finally {
          setIsLoadingChats(false);
        }
      } else {
        console.warn('⚠️ [Messages] No userId available, cannot refresh chats');
        setIsLoadingChats(false);
      }
    };
    loadChats();
  }, [refreshChats, userId]);
  
  // Refresh chats when screen comes into focus (navigation back from chat)
  useFocusEffect(
    useCallback(() => {
      console.log('📱 [Messages] Screen focused, refreshing chats...');
      if (userId) {
        refreshChats();
      }
    }, [userId, refreshChats])
  );
  
  // Track initial load completion
  useEffect(() => {
    if (!isLoadingChats && !isLoadingUserNames && isInitialLoad) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoadingChats, isLoadingUserNames, isInitialLoad]);
  
  // Reset initial load when user changes
  useEffect(() => {
    if (!userId) {
      setIsInitialLoad(true);
      setIsLoadingChats(false);
      setIsLoadingUserNames(false);
    }
  }, [userId]);

  // Fetch user names for all chat participants
  useEffect(() => {
    const fetchUserNames = async () => {
      if (!chats || !userId) {
        setIsLoadingUserNames(false);
        return;
      }

      if (chats.length === 0) {
        setIsLoadingUserNames(false);
        return;
      }

      setIsLoadingUserNames(true);
      const nameMap = new Map<string, { name: string; avatar?: string }>();

      try {
        for (const chat of chats) {
          const otherUserId = chat.participants?.find(p => p !== userId);
          if (otherUserId && !nameMap.has(otherUserId)) {
            try {
              // First, try to fetch consultant profile (has better profile image data)
              let consultantData = null;
              // Try to fetch consultant profile (returns null if not a consultant)
              consultantData = await ConsultantService.getConsultantProfile(otherUserId);
              if (consultantData) {
                console.log('📥 [Messages] Fetched consultant profile:', consultantData);
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
            } catch (error: any) {
              // Only log unexpected errors (not 404s)
              if (error?.response?.status !== 404) {
                console.error('❌ [Messages] Error fetching user info:', error);
              }
              nameMap.set(otherUserId, { name: 'User' });
            }
          }
        }
      } finally {
        setUserNames(nameMap);
        setIsLoadingUserNames(false);
      }
    };

    fetchUserNames();
  }, [chats, userId]);

  // Handle long press on chat to show delete option
  const handleChatLongPress = (chatId: string) => {
    setSelectedChatId(chatId);
    setShowDeleteModal(true);
  };

  // Handle chat deletion
  const handleDeleteChat = async () => {
    if (!selectedChatId) return;

    setIsDeleting(true);
    try {
      await deleteChat(selectedChatId);
      setShowDeleteModal(false);
      setSelectedChatId(null);
    } catch (error: any) {
      console.error('❌ Error deleting chat:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to delete chat. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedChatId(null);
  };

  // Get selected chat name for confirmation
  const selectedChatName = selectedChatId
    ? userNames.get(
        chats.find(c => c.id === selectedChatId)?.participants?.find(p => p !== userId) || ''
      )?.name || 'this chat'
    : 'this chat';

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader title="Messages" onBackPress={() => navigation.goBack()} />

      <ScrollView
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              console.log('🔄 [Messages] Manual refresh triggered');
              refreshChats();
            }}
          />
        }
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
          {/* Show loader during initial load only */}
          {isInitialLoad && isLoadingChats ? (
            <Loader message="Loading messages..." containerStyle={{ minHeight: 200 }} />
          ) : chats.length > 0 && isLoadingUserNames && isInitialLoad ? (
            // Show loader while fetching user names for chats
            <Loader message="Loading messages..." containerStyle={{ minHeight: 200 }} />
          ) : chats.length > 0 ? (
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
                  onLongPress={() => handleChatLongPress(chat.id)}
                  delayLongPress={500}
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
              <Text style={{ color: '#999', marginBottom: 10 }}>No messages yet</Text>
              <Text style={{ color: '#666', fontSize: 12, textAlign: 'center' }}>
                Accept a booking request or start a chat with a consultant to see messages here.
              </Text>
            </View>
          )}
         </View>
      </ScrollView>

      {/* Delete Chat Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={isDeleting ? undefined : cancelDelete}
          disabled={isDeleting}
        >
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 24,
              width: '85%',
              maxWidth: 400,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: COLORS.red + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 16,
                }}
              >
                <Trash2 size={24} color={COLORS.red} />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: COLORS.black,
                  flex: 1,
                }}
              >
                Delete Chat?
              </Text>
            </View>

            <Text
              style={{
                fontSize: 14,
                color: COLORS.gray,
                marginBottom: 24,
                lineHeight: 20,
              }}
            >
              Are you sure you want to delete the chat with {selectedChatName}? This will
              permanently delete all messages in this conversation. This action cannot be undone.
            </Text>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 12,
              }}
            >
              <TouchableOpacity
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: COLORS.lightGray,
                }}
                onPress={cancelDelete}
                disabled={isDeleting}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: COLORS.black,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: COLORS.red,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
                onPress={handleDeleteChat}
                disabled={isDeleting}
              >
                <Trash2 size={16} color={COLORS.white} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: COLORS.white,
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default Messages;
