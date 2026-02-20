import { Text, ScrollView, View, TouchableOpacity, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { screenStyles } from '../../../constants/styles/screenStyles';
import HomeHeader from '../../../components/shared/HomeHeader';
import { useChatContext } from '../../../contexts/ChatContext';
import { useEffect, useState } from 'react';
import { formatFirestoreTimeRelative } from '../../../utils/time';
import { UserService } from '../../../services/user.service';
import type { Chat } from '../../../types/chatTypes';
import { COLORS } from '../../../constants/core/colors';
import { Trash2 } from 'lucide-react-native';
import { logger } from '../../../utils/logger';
import { normalizeAvatarUrl } from '../../../utils/normalize';

const ConsultantMessages = ({ navigation }: any) => {
  const { chats, userId, refreshChats, deleteChat } = useChatContext();
  const [userNames, setUserNames] = useState<Map<string, { name: string; avatar?: string }>>(new Map());
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
            logger.debug('📥 [ConsultantMessages] User data loaded for', otherUserId);
            
            if (userData) {
              const userName = userData.name || userData.displayName || 'User';
              const profileImage =
                normalizeAvatarUrl(userData) ||
                normalizeAvatarUrl({
                  profileImage: userData?.profile?.profileImage,
                  avatarUrl: userData?.profile?.avatarUrl,
                });
              
              nameMap.set(otherUserId, {
                name: userName,
                avatar: profileImage
              });
            } else {
              logger.debug('⚠️ [ConsultantMessages] No user data for', otherUserId);
              nameMap.set(otherUserId, { name: 'Student' });
            }
          } catch (error) {
            logger.error('❌ [ConsultantMessages] Error fetching user name:', error);
            nameMap.set(otherUserId, { name: 'Student' });
          }
        }
      }

      setUserNames(nameMap);
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
      logger.error('❌ Error deleting chat:', error);
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
                : undefined;
              
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
                  onLongPress={() => handleChatLongPress(chat.id)}
                  delayLongPress={500}
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

export default ConsultantMessages;
