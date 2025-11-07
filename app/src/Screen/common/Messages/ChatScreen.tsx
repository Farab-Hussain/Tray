import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  TextInput, 
  FlatList,
  KeyboardAvoidingView, 
  Platform,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/core/colors';
import { chatStyles } from '../../../constants/styles/chatStyles';
import { ChevronLeft, Phone, Video, Send, Trash2, X, Check, CheckCheck, Clock } from 'lucide-react-native';
import { useChat } from '../../../hooks/useChat';
import { useChatContext } from '../../../contexts/ChatContext';
import { useNotificationContext } from '../../../contexts/NotificationContext';
import { UserService } from '../../../services/user.service';
import { ConsultantService } from '../../../services/consultant.service';
import { markMessagesSeen, setTypingStatus, listenToTypingStatus } from '../../../services/chat.Service';
import * as OfflineQueue from '../../../services/offline-message-queue.service';
import type { Message } from '../../../types/chatTypes';
import { Modal, Alert } from 'react-native';

const ChatScreen = ({ navigation, route }: any) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [inputKey, setInputKey] = useState(0); // Key to force TextInput re-render
  const isSendingRef = useRef(false); // Ref-based lock to prevent race conditions
  const [otherUserName, setOtherUserName] = useState<string>('');
  const [otherUserAvatar, setOtherUserAvatar] = useState<any>(require('../../../assets/image/avatar.png'));
  const [otherUserTitle, setOtherUserTitle] = useState<string>('User');
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);
  
  const { chatId, otherUserId } = route?.params || {};
  const { userId, refreshChats } = useChatContext();
  const { markChatAsRead } = useNotificationContext();
  const { messages, sendMessage, deleteMessage, deleteMessages } = useChat(chatId, userId);
  
  // Merge queued messages with Firebase messages for display
  const [queuedMessages, setQueuedMessages] = useState<(Message & { id: string })[]>([]);
  
  useEffect(() => {
    const loadQueuedMessages = async () => {
      if (!chatId || !userId) return;
      
      try {
        const queue = await OfflineQueue.getQueuedMessages();
        const chatQueuedMessages = queue
          .filter(q => q.chatId === chatId)
          .map(q => ({
            id: q.id,
            ...q.message,
            createdAt: { toDate: () => new Date(q.timestamp) } as any,
          }));
        setQueuedMessages(chatQueuedMessages);
      } catch (error) {
        console.error('Error loading queued messages:', error);
      }
    };
    
    loadQueuedMessages();
    
    // Refresh queued messages periodically
    const interval = setInterval(loadQueuedMessages, 2000);
    return () => clearInterval(interval);
  }, [chatId, userId]);
  
  // Combine Firebase messages with queued messages
  const allMessages = React.useMemo(() => {
    const combined = [...messages, ...queuedMessages];
    // Sort by timestamp
    return combined.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
      return timeA - timeB;
    });
  }, [messages, queuedMessages]);
  
  // Selection mode state
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Typing indicator listener
  useEffect(() => {
    if (!chatId || !userId) return;
    
    const unsubscribe = listenToTypingStatus(chatId, userId, (typingUserId, isTyping) => {
      setIsOtherUserTyping(isTyping && typingUserId !== userId);
    });
    
    return () => {
      unsubscribe();
    };
  }, [chatId, userId]);
  
  // Handle typing status when user types
  useEffect(() => {
    if (!chatId || !userId) return;
    
    // Clear existing timeout
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }
    
    if (message.trim().length > 0) {
      // Set typing status
      setTypingStatus(chatId, userId, true);
      
      // Clear typing status after 3 seconds of no typing
      typingDebounceRef.current = setTimeout(() => {
        setTypingStatus(chatId, userId, false);
      }, 3000);
    } else {
      // Clear typing status immediately if message is empty
      setTypingStatus(chatId, userId, false);
    }
    
    return () => {
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }
      // Clear typing status on unmount
      if (chatId && userId) {
        setTypingStatus(chatId, userId, false);
      }
    };
  }, [message, chatId, userId]);
  
  // Clear typing status when message is sent
  useEffect(() => {
    if (isSending && chatId && userId) {
      setTypingStatus(chatId, userId, false);
    }
  }, [isSending, chatId, userId]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (allMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [allMessages]);
  
  // Mark messages as seen and notifications as read when chat is opened (only once per chatId)
  const markedChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (chatId && userId && markedChatIdRef.current !== chatId) {
      markedChatIdRef.current = chatId;
      console.log('👁️ [ChatScreen] Marking messages as seen for chat:', chatId);
      
      // Mark chat messages as seen
      markMessagesSeen(chatId, userId)
        .then(() => {
          console.log('✅ [ChatScreen] Messages marked as seen');
          // Force refresh messages after a short delay to ensure UI updates
          setTimeout(() => {
            refreshChats();
            // Also trigger a re-render by updating a state
            setQueuedMessages(prev => [...prev]);
          }, 500);
        })
        .catch(error => {
          console.error('❌ [ChatScreen] Error marking messages as seen:', error);
        });

      // Mark all notifications for this chat as read
      console.log('🔔 [ChatScreen] Marking chat notifications as read:', chatId);
      markChatAsRead(chatId);
    }
  }, [chatId, userId, refreshChats, markChatAsRead]);

  // Monitor network connection and process queued messages when online
  useEffect(() => {
    let connectionCheckInterval: NodeJS.Timeout;
    let connectionUnsubscribe: (() => void) | null = null;
    let wasOffline = false;

    try {
      // Use Firebase's connection state listener
      const { ref, onValue, off } = require('firebase/database');
      const { database } = require('../../lib/firebase');
      const connectedRef = ref(database, '.info/connected');
      
      connectionUnsubscribe = onValue(connectedRef, async (snapshot: any) => {
        const isConnected = snapshot.val() === true;
        
        if (isConnected && wasOffline) {
          // Connection restored - process queued messages
          console.log('🌐 [ChatScreen] Connection restored, processing queued messages...');
          wasOffline = false;
          try {
            await OfflineQueue.processQueuedMessages();
            // Refresh queued messages display
            const queue = await OfflineQueue.getQueuedMessages();
            const chatQueuedMessages = queue
              .filter(q => q.chatId === chatId)
              .map(q => ({
                id: q.id,
                ...q.message,
                createdAt: { toDate: () => new Date(q.timestamp) } as any,
              }));
            setQueuedMessages(chatQueuedMessages);
            // Refresh messages to update UI
            setTimeout(() => {
              refreshChats();
            }, 1000);
          } catch (error) {
            console.error('❌ [ChatScreen] Error processing queued messages:', error);
          }
        } else if (!isConnected) {
          wasOffline = true;
          if (__DEV__) {
            console.log('⚠️ [ChatScreen] Connection lost');
          }
        }
      });
    } catch (error) {
      console.warn('⚠️ [ChatScreen] Could not set up connection listener:', error);
    }

    // Fallback: Check periodically (every 5 seconds) to process queue
    connectionCheckInterval = setInterval(async () => {
      try {
        const queuedMessages = await OfflineQueue.getQueuedMessages();
        if (queuedMessages.length > 0) {
          // Try to process queue
          await OfflineQueue.processQueuedMessages();
          // Refresh queued messages display
          const queue = await OfflineQueue.getQueuedMessages();
          const chatQueuedMessages = queue
            .filter(q => q.chatId === chatId)
            .map(q => ({
              id: q.id,
              ...q.message,
              createdAt: { toDate: () => new Date(q.timestamp) } as any,
            }));
          setQueuedMessages(chatQueuedMessages);
          // Refresh messages
          setTimeout(() => {
            refreshChats();
          }, 500);
        }
      } catch (error) {
        // Silently fail - connection might still be down
      }
    }, 5000);

    return () => {
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
      }
      if (connectionUnsubscribe) {
        connectionUnsubscribe();
      }
    };
  }, [refreshChats]);
  
  // Get consultant info from route params
  const consultantFromParams = route?.params?.consultant;

  // Fetch real user name if not properly set
  useEffect(() => {
    const fetchOtherUserInfo = async () => {
      if (otherUserId) {
        try {
          // Try to fetch consultant profile (has better profile image data)
          // Returns null if user is not a consultant (expected for students)
          let consultantData = await ConsultantService.getConsultantProfile(otherUserId);
          if (consultantData) {
            console.log('📥 [ChatScreen] Fetched consultant profile:', consultantData);
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
        } catch (error: any) {
          // Only log unexpected errors (not 404s)
          if (error?.response?.status !== 404) {
            console.error('❌ [ChatScreen] Error fetching user info:', error);
          }
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
    // Prevent double-sending using ref (immediate check, no state delay)
    if (isSendingRef.current || !message.trim() || !chatId || !userId) {
      return;
    }

    const messageText = message.trim();
    
    // Set ref lock immediately (prevents race conditions)
    isSendingRef.current = true;
    setIsSending(true);
    
    // Dismiss keyboard immediately
    Keyboard.dismiss();
    
    // Clear input immediately BEFORE sending (prevents double send)
    // Force clear by resetting state and forcing TextInput re-render
    setMessage('');
    setInputKey(prev => prev + 1); // Force TextInput to re-render with empty value
    
    try {
      // Send message
      // Note: seenBy should be empty initially - it will be populated when the receiver opens the chat
      const messageId = await sendMessage({
        chatId,
        senderId: userId,
        text: messageText,
        type: 'text',
        seenBy: [],
      });
      
      // If message was queued (offline), refresh queued messages display
      // Only check if messageId exists and is a string
      if (messageId && typeof messageId === 'string' && OfflineQueue.isQueuedMessage(messageId)) {
        const queue = await OfflineQueue.getQueuedMessages();
        const chatQueuedMessages = queue
          .filter(q => q.chatId === chatId)
          .map(q => ({
            id: q.id,
            ...q.message,
            createdAt: { toDate: () => new Date(q.timestamp) } as any,
          }));
        setQueuedMessages(chatQueuedMessages);
      }
      
      // Refresh chat list to update unread counts
      setTimeout(() => {
        refreshChats();
      }, 300);
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message if send fails so user can retry
      setMessage(messageText);
    } finally {
      // Reset sending state and ref
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  const handleCall = () => {
    if (!chatId || !userId || !otherUserId) return;
    const callId = `${chatId}-${Date.now()}`;
    navigation.navigate('CallingScreen', {
      callId,
      isCaller: true,
      callerId: userId,
      receiverId: otherUserId,
    });
  };

  const handleVideoCall = () => {
    if (!chatId || !userId || !otherUserId) return;
    const callId = `${chatId}-${Date.now()}`;
    navigation.navigate('VideoCallingScreen', {
      callId,
      isCaller: true,
      callerId: userId,
      receiverId: otherUserId,
    });
  };

  // Handle long press on message to enter selection mode or select message
  const handleMessageLongPress = (messageId: string, message: Message & { id?: string }) => {
    // Only allow selection of user's own messages
    if (message.senderId !== userId) {
      return;
    }

    if (!isSelectionMode) {
      // Enter selection mode and select this message
      setIsSelectionMode(true);
      setSelectedMessages(new Set([messageId]));
    } else {
      // Toggle selection of this message
      const newSelected = new Set(selectedMessages);
      if (newSelected.has(messageId)) {
        newSelected.delete(messageId);
      } else {
        newSelected.add(messageId);
      }
      setSelectedMessages(newSelected);
      
      // Exit selection mode if no messages are selected
      if (newSelected.size === 0) {
        setIsSelectionMode(false);
      }
    }
  };

  // Handle message press in selection mode
  const handleMessagePress = (messageId: string, message: Message & { id?: string }) => {
    if (!isSelectionMode) {
      return; // Normal press does nothing
    }

    // Only allow selection of user's own messages
    if (message.senderId !== userId) {
      return;
    }

    // Toggle selection
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
    
    // Exit selection mode if no messages are selected
    if (newSelected.size === 0) {
      setIsSelectionMode(false);
    }
  };

  // Exit selection mode
  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedMessages(new Set());
  };

  // Show delete confirmation
  const handleDeletePress = () => {
    if (selectedMessages.size === 0) {
      return;
    }
    setShowDeleteConfirm(true);
  };

  // Confirm and delete messages
  const confirmDelete = async () => {
    if (selectedMessages.size === 0 || !chatId || !userId) {
      return;
    }

    setIsDeleting(true);
    setShowDeleteConfirm(false);

    try {
      const messageIds = Array.from(selectedMessages);
      
      if (messageIds.length === 1) {
        await deleteMessage(messageIds[0]);
      } else {
        await deleteMessages(messageIds);
      }

      // Exit selection mode and refresh chats
      exitSelectionMode();
      
      // Refresh chat list to update last message
      setTimeout(() => {
        refreshChats();
      }, 300);
    } catch (error: any) {
      console.error('Error deleting messages:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to delete messages. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

 




  return (
    <SafeAreaView style={chatStyles.container} edges={['top']}>
      {/* Selection Mode Bar */}
      {isSelectionMode && (
        <View style={chatStyles.selectionModeContainer}>
          <TouchableOpacity 
            style={chatStyles.cancelButton}
            onPress={exitSelectionMode}
          >
            <X size={20} color={COLORS.black} />
          </TouchableOpacity>
          
          <Text style={chatStyles.selectionModeText}>
            {selectedMessages.size} {selectedMessages.size === 1 ? 'message' : 'messages'} selected
          </Text>
          
          <TouchableOpacity 
            style={[
              chatStyles.deleteButton,
              selectedMessages.size === 0 && { opacity: 0.5 }
            ]}
            onPress={handleDeletePress}
            disabled={selectedMessages.size === 0 || isDeleting}
          >
            <Trash2 size={16} color={COLORS.white} />
            <Text style={chatStyles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Header */}
      {!isSelectionMode && (
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
      )}

      {/* Chat Messages */}
      <KeyboardAvoidingView 
        style={chatStyles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList 
          ref={flatListRef}
          style={chatStyles.messagesContainer}
          contentContainerStyle={chatStyles.messagesContent}
          data={allMessages}
          keyExtractor={(item) => {
            // Include seenBy in key to force re-render when seen status changes
            const seenByKey = item.seenBy ? JSON.stringify(item.seenBy.sort()) : '';
            return `${item.id || `msg-${Math.random()}`}-${seenByKey}`;
          }}
          onContentSizeChange={() => {
            if (allMessages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
          renderItem={({ item }: { item: Message & { id?: string } }) => {
            const isUser = item.senderId === userId;
            const messageId = item.id || '';
            const isSelected = selectedMessages.has(messageId);
            const canSelect = isUser; // Can only select own messages
            
            // Format timestamp
            const formatTime = (timestamp: any) => {
              if (!timestamp) return '';
              try {
                const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                const now = new Date();
                const isToday = date.toDateString() === now.toDateString();
                if (isToday) {
                  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                }
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
              } catch {
                return '';
              }
            };
            
                      // Determine message status for user's own messages
            const getMessageStatus = () => {
              if (!isUser || !otherUserId) return null;
              
              // Check if message is pending (queued for offline sending)
              const isPending = OfflineQueue.isQueuedMessage(messageId);
              if (isPending) {
                return 'pending';
              }
              
              const seenBy = item.seenBy || [];
              const isSeen = seenBy.includes(otherUserId);
              
              if (__DEV__ && isUser) {
                console.log('📊 [MessageStatus]', {
                  messageId,
                  senderId: item.senderId,
                  userId,
                  otherUserId,
                  seenBy,
                  isSeen,
                  status: isSeen ? 'seen' : 'sent'
                });
              }
              
              // Message is seen if the other user is in seenBy array
              return isSeen ? 'seen' : 'sent';
            };
            
            const messageStatus = getMessageStatus();
            
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onLongPress={() => canSelect && handleMessageLongPress(messageId, item)}
                onPress={() => isSelectionMode && canSelect && handleMessagePress(messageId, item)}
                disabled={!canSelect && !isSelectionMode}
                style={[
                  chatStyles.messageBubble,
                  isUser ? chatStyles.userMessage : chatStyles.otherMessage,
                  isSelected && chatStyles.messageBubbleSelected
                ]}
              >
                {item.type === 'text' && (
                  <>
                    <Text style={[
                      chatStyles.messageText,
                      isUser ? chatStyles.userMessageText : chatStyles.otherMessageText
                    ]}>
                      {item.text}
                    </Text>
                    {item.createdAt && (
                      <View style={[
                        chatStyles.timestampContainer,
                        isUser ? chatStyles.timestampContainerRight : chatStyles.timestampContainerLeft
                      ]}>
                        <Text style={[
                          chatStyles.timestampText,
                          isUser ? chatStyles.timestampRight : chatStyles.timestampLeft
                        ]}>
                          {formatTime(item.createdAt)}
                        </Text>
                        {isUser && messageStatus && (
                          <View style={chatStyles.statusIndicator}>
                            {messageStatus === 'pending' ? (
                              <Clock 
                                size={13} 
                                color={COLORS.orange || '#FF9500'} 
                                strokeWidth={2.5}
                              />
                            ) : messageStatus === 'seen' ? (
                              <CheckCheck 
                                size={16} 
                                color={COLORS.blue || '#007AFF'} 
                                strokeWidth={2}
                              />
                            ) : (
                              <Check 
                                size={13} 
                                color={COLORS.gray || '#8E8E93'} 
                                strokeWidth={2.5}
                              />
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </>
                )}
                {item.type !== 'text' && (
                  <>
                    <Text style={[
                      chatStyles.messageText,
                      isUser ? chatStyles.userMessageText : chatStyles.otherMessageText
                    ]}>
                      [{item.type}]
                    </Text>
                    {item.createdAt && (
                      <View style={[
                        chatStyles.timestampContainer,
                        isUser ? chatStyles.timestampContainerRight : chatStyles.timestampContainerLeft
                      ]}>
                        <Text style={[
                          chatStyles.timestampText,
                          isUser ? chatStyles.timestampRight : chatStyles.timestampLeft
                        ]}>
                          {formatTime(item.createdAt)}
                        </Text>
                        {isUser && messageStatus && (
                          <View style={chatStyles.statusIndicator}>
                            {messageStatus === 'pending' ? (
                              <Clock 
                                size={13} 
                                color={COLORS.orange || '#FF9500'} 
                                strokeWidth={2.5}
                              />
                            ) : messageStatus === 'seen' ? (
                              <CheckCheck 
                                size={16} 
                                color={COLORS.blue || '#007AFF'} 
                                strokeWidth={2}
                              />
                            ) : (
                              <Check 
                                size={13} 
                                color={COLORS.gray || '#8E8E93'} 
                                strokeWidth={2.5}
                              />
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </>
                )}
              </TouchableOpacity>
            );
          }}
        />

        {/* Typing Indicator */}
        {isOtherUserTyping && !isSelectionMode && (
          <View style={chatStyles.typingIndicatorContainer}>
            <View style={chatStyles.typingIndicatorBubble}>
              <View style={chatStyles.typingIndicatorDot} />
              <View style={[chatStyles.typingIndicatorDot, { marginLeft: 4 }]} />
              <View style={[chatStyles.typingIndicatorDot, { marginLeft: 4 }]} />
            </View>
            <Text style={chatStyles.typingIndicatorText}>
              {otherUserName || 'Someone'} is typing...
            </Text>
          </View>
        )}

        {/* Message Input - Hidden in selection mode */}
        {!isSelectionMode && (
          <View style={chatStyles.inputContainer}>
          <View style={chatStyles.inputWrapper}>
            
            <TextInput
              key={`chat-input-${inputKey}`}
              ref={textInputRef}
              style={chatStyles.textInput}
              placeholder="Write here"
              placeholderTextColor={COLORS.gray}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
              editable={!isSending}
            />
       
          </View>
          
          <TouchableOpacity 
            style={[
              chatStyles.sendButton,
              (message.trim() && !isSending && !isSendingRef.current) ? chatStyles.sendButtonActive : chatStyles.sendButtonInactive
            ]}
            onPress={() => {
              // Double-check before sending (prevents rapid taps)
              if (!isSendingRef.current && message.trim() && !isSending) {
                handleSendMessage();
              }
            }}
            disabled={!message.trim() || isSending || isSendingRef.current}
            activeOpacity={0.7}
          >
            <Send size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        )}
      </KeyboardAvoidingView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <TouchableOpacity
          style={chatStyles.modalOverlay}
          activeOpacity={1}
          onPress={isDeleting ? undefined : cancelDelete}
          disabled={isDeleting}
        >
          <View
            style={chatStyles.modalContainer}
          >
            <Text style={chatStyles.modalTitle}>
              Delete {selectedMessages.size === 1 ? 'Message' : 'Messages'}?
            </Text>
            <Text style={chatStyles.modalMessage}>
              {selectedMessages.size === 1
                ? 'This message will be permanently deleted. This action cannot be undone.'
                : `These ${selectedMessages.size} messages will be permanently deleted. This action cannot be undone.`}
            </Text>
            <View style={chatStyles.modalActions}>
              <TouchableOpacity
                style={[chatStyles.modalButton, chatStyles.modalButtonCancel]}
                onPress={cancelDelete}
                disabled={isDeleting}
              >
                <Text style={[chatStyles.modalButtonText, chatStyles.modalButtonTextCancel]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[chatStyles.modalButton, chatStyles.modalButtonDelete]}
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                <Text style={[chatStyles.modalButtonText, chatStyles.modalButtonTextDelete]}>
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

export default ChatScreen;
