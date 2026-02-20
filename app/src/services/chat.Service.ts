import { ref, push, set, get, update, onValue, off, query, orderByChild, serverTimestamp } from 'firebase/database';
// @ts-ignore
import { database, auth } from '../lib/firebase.ts';
import { api } from '../lib/fetcher';
import * as NotificationStorage from './notification-storage.service';
import { UserService } from './user.service';
import * as OfflineQueue from './offline-message-queue.service';
import type { Message, Chat } from '../types/chatTypes';
import { normalizeAvatarUrl } from '../utils/normalize';
import { logger } from '../utils/logger';

// @ts-ignore
const db = database;

/**
 * Set typing status for a user in a chat
 */
export const setTypingStatus = async (chatId: string, userId: string, isTyping: boolean) => {
    try {
        const typingRef = ref(db, `chats/${chatId}/typing/${userId}`);
        if (isTyping) {
            await set(typingRef, {
                userId,
                isTyping: true,
                timestamp: serverTimestamp(),
            });
        } else {
            await set(typingRef, null);
        }
    } catch (error) {
                if (__DEV__) {
          logger.error('❌ [ChatService] Error setting typing status:', error)
        };
    }
};

/**
 * Listen to typing status changes in a chat
 */
export const listenToTypingStatus = (
    chatId: string,
    currentUserId: string,
    callback: (userId: string, isTyping: boolean) => void
) => {
    const typingRef = ref(db, `chats/${chatId}/typing`);
    
    const unsubscribe = onValue(typingRef, (snapshot) => {
        if (snapshot.exists()) {
            const typingData = snapshot.val();
            // Check each user's typing status
            Object.keys(typingData).forEach((userId) => {
                if (userId !== currentUserId) {
                    const typingInfo = typingData[userId];
                    callback(userId, typingInfo?.isTyping || false);
                }
            });
        } else {
            // No one is typing
            callback('', false);
        }
    });
    
    return () => {
        off(typingRef);
        unsubscribe();
    };
};

export const getChatIdFor = (uidA: string, uidB: string) => {
    return [uidA, uidB].sort().join('_');
};

export const createChatIfNotExists = async (uidA: string, uidB: string) => {
    const chatId = getChatIdFor(uidA, uidB);
    const chatRef = ref(db, `chats/${chatId}`);

    try {
                if (__DEV__) {
          logger.debug('🔨 [ChatService] Creating/checking chat:', chatId, 'between', uidA, 'and', uidB)
        };
        const snapshot = await get(chatRef);
        
        if (!snapshot.exists()) {
                        if (__DEV__) {
              logger.debug('📝 [ChatService] Chat does not exist, creating new chat')
            };
            const chatData: Chat = {
                id: chatId,
                participants: [uidA, uidB],
                lastMessage: '',
                lastMessageAt: serverTimestamp() as any,
            };
            await set(chatRef, chatData);
                        if (__DEV__) {
              logger.debug('✅ [ChatService] Chat created successfully:', chatId)
            };
        } else {
                        if (__DEV__) {
              logger.debug('✅ [ChatService] Chat already exists:', chatId)
            };
        }
    } catch (error) {
                if (__DEV__) {
          logger.error('❌ [ChatService] Error creating chat:', error)
        };
        throw error;
    }

    return chatId;
};


export const sendMessage = async (
    chatId: string,
    message: Omit<Message, 'createdAt' | 'id'>
): Promise<string> => {
    try {
        const messagesRef = ref(db, `chats/${chatId}/messages`);
        const newMessageRef = push(messagesRef);
        const messageId = newMessageRef.key || '';

        const messageData = {
            ...message,
            createdAt: serverTimestamp(),
        };

        await set(newMessageRef, messageData);

        // Update chat metadata
        const updates: Record<string, any> = {
            [`chats/${chatId}/lastMessage`]: message.type === 'text' ? message.text || '' : `[${message.type}]`,
            [`chats/${chatId}/lastMessageAt`]: serverTimestamp(),
            [`chats/${chatId}/lastMessageSenderId`]: message.senderId,
        };

        await update(ref(db), updates);

        // Send push notification via backend API (no Cloud Functions needed)
        // Get recipient ID from chat participants
        try {
            const chatSnapshot = await get(ref(db, `chats/${chatId}`));
            if (chatSnapshot.exists()) {
                const chatData = chatSnapshot.val();
                const participants = chatData?.participants || [];
                const recipientId = participants.find((p: string) => p !== message.senderId);
                
                if (recipientId) {
                                        if (__DEV__) {
                      logger.debug('📤 Preparing to send notification...', {
                        chatId,
                        senderId: message.senderId,
                        recipientId,
                        messageText: message.text?.substring(0, 50)
                    })
                    };
                    
                    // Get sender info for notification
                    let senderName = 'Someone';
                    let senderAvatar = '';
                    try {
                        const senderData = await UserService.getUserById(message.senderId);
                        if (senderData) {
                            senderName = senderData.name || senderData.displayName || 'Someone';
                            senderAvatar = normalizeAvatarUrl(senderData);
                        }
                    } catch (error) {
                                                if (__DEV__) {
                          logger.warn('⚠️ Could not fetch sender info:', error)
                        };
                    }

                    // Create app notification in Firestore (stored notification)
                    NotificationStorage.createNotification({
                        userId: recipientId,
                        type: 'chat_message',
                        category: 'message',
                        title: senderName,
                        message: message.text || 'New message',
                        data: { chatId, senderId: message.senderId },
                        senderId: message.senderId,
                        senderName,
                        senderAvatar,
                    }).catch((err) => {
                                                if (__DEV__) {
                          logger.warn('⚠️ Failed to create app notification:', err)
                        };
                    });

                    // Call notification API for push notification (don't wait for response)
                    api.post('/notifications/send-message', {
                        chatId,
                        senderId: message.senderId,
                        recipientId,
                        messageText: message.text || ''
                    })
                    .then((response) => {
                                                if (__DEV__) {
                          logger.debug('✅ Push notification sent successfully:', response.data)
                        };
                    })
                    .catch((err) => {
                                                if (__DEV__) {
                          logger.warn('⚠️ Failed to send push notification (non-critical):', err.response?.data || err.message)
                        };
                    });
                } else {
                                        if (__DEV__) {
                      logger.warn('⚠️ No recipient found for notification')
                    };
                }
            } else {
                                if (__DEV__) {
                  logger.warn('⚠️ Chat not found, skipping notification')
                };
            }
        } catch (notifError) {
                        if (__DEV__) {
              logger.warn('⚠️ Error sending notification (non-critical):', notifError)
            };
        }

        return messageId;
    } catch (error: any) {
        // Check if it's a network/offline error
        const isNetworkError = error?.code === 'unavailable' || 
                               error?.code === 'network-error' ||
                               error?.message?.toLowerCase().includes('network') ||
                               error?.message?.toLowerCase().includes('offline') ||
                               error?.message?.toLowerCase().includes('failed to fetch');
        
        if (isNetworkError) {
            // Queue the message for offline sending
            if (__DEV__) {
                logger.debug('📦 [ChatService] Network error detected, queueing message for offline sending');
            }
            
            try {
                const queueId = await OfflineQueue.queueMessage(chatId, message);
                // Return queue ID so UI can show pending status
                return queueId;
            } catch (queueError) {
                                if (__DEV__) {
                  logger.error('❌ [ChatService] Error queueing message:', queueError)
                };
                throw new Error('Failed to send message. Please check your internet connection.');
            }
        }
        
                if (__DEV__) {
          logger.error('Error sending message:', error)
        };
        throw error;
    }
};


export const listenMessages = (
    chatId: string,
    cb: (messages: (Message & { id: string })[]) => void
) => {
    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const messagesQuery = query(messagesRef, orderByChild('createdAt'));

    const unsubscribe = onValue(messagesQuery, (snapshot) => {
        if (snapshot.exists()) {
            const messagesData = snapshot.val();
            const messages: (Message & { id: string })[] = Object.keys(messagesData).map((key) => ({
                id: key,
                ...messagesData[key],
            })).sort((a, b) => {
                const timeA = a.createdAt || 0;
                const timeB = b.createdAt || 0;
                return timeA - timeB; // ascending order
            });
            
            if (__DEV__) {
                // Log seenBy status for debugging
                messages.forEach(msg => {
                    if (msg.seenBy && msg.seenBy.length > 0) {
                        logger.debug(`📬 [listenMessages] Message ${msg.id} seenBy:`, msg.seenBy);
                    }
                });
            }
            
            cb(messages);
        } else {
            cb([]);
        }
    });

    return () => {
        off(messagesRef);
        unsubscribe();
    };
};


/**
 * Fetch all chats for a user
 * 
 * NOTE: This function requires Realtime Database security rules that allow authenticated users
 * to read the 'chats' path. The rules should be configured in Firebase Console:
 * 
 * {
 *   "rules": {
 *     "chats": {
 *       ".read": "auth != null",
 *       ".write": "auth != null"
 *     }
 *   }
 * }
 * 
 * Or more restrictively, only allow reading chats where the user is a participant:
 * {
 *   "rules": {
 *     "chats": {
 *       "$chatId": {
 *         ".read": "auth != null && (auth.uid == data.child('participants').child(0).val() || auth.uid == data.child('participants').child(1).val())",
 *         ".write": "auth != null"
 *       }
 *     }
 *   }
 * }
 */
export const fetchUserChats = async (uid: string) => {
    try {
        // Verify user is authenticated before making database calls
        const currentUser = auth.currentUser;
        if (!currentUser) {
            if (__DEV__) {
                logger.warn('⚠️ [ChatService] User not authenticated, cannot fetch chats');
            }
            return [];
        }
        
        if (currentUser.uid !== uid) {
            if (__DEV__) {
                logger.warn('⚠️ [ChatService] User ID mismatch. Current user:', currentUser.uid, 'Requested:', uid);
            }
            return [];
        }
        
        if (__DEV__) {
          logger.debug('🔍 [ChatService] Fetching chats for user:', uid);
        }
        
        const chatsRef = ref(db, 'chats');
        const snapshot = await get(chatsRef);

        if (!snapshot.exists()) {
            if (__DEV__) {
              logger.debug('ℹ️ [ChatService] No chats found in database');
            }
            // Try to check if database connection is working by checking root
            try {
                const rootRef = ref(db, '/');
                const rootSnapshot = await get(rootRef);
                if (__DEV__) {
                  logger.debug('🔍 [ChatService] Root snapshot exists:', rootSnapshot.exists());
                }
            } catch (rootError) {
                                if (__DEV__) {
                  logger.error('❌ [ChatService] Error accessing root:', rootError)
                };
            }
            return [];
        }

        const allChats = snapshot.val();
        const userChats: (Chat & { unreadCount?: number })[] = [];

        // Filter chats where user is a participant
        for (const chatId in allChats) {
            const chat = allChats[chatId];
            // Check if user is in participants (case-sensitive and exact match)
            const isUserParticipant = chat.participants && chat.participants.includes(uid);
            
            if (isUserParticipant) {
                const chatWithDetails: Chat & { unreadCount?: number } = {
                    id: chatId,
                    participants: chat.participants,
                    lastMessage: chat.lastMessage || '',
                    lastMessageAt: chat.lastMessageAt,
                    lastMessageSenderId: chat.lastMessageSenderId,
                    unreadCount: 0,
                };

                // Get messages to count unread and get last message
                const messagesRef = ref(db, `chats/${chatId}/messages`);
                const messagesSnapshot = await get(messagesRef);

                if (messagesSnapshot.exists()) {
                    const messagesData = messagesSnapshot.val();
                    let unreadCount = 0;
                    let lastMessage: Message | null = null;
                    let lastMessageTime = 0;

                    for (const msgId in messagesData) {
                        const msg = messagesData[msgId];
                        // Count unread: message not from current user AND not seen by current user
                        if (msg.senderId !== uid && !msg.seenBy?.includes(uid)) {
                            unreadCount++;
                        }
                        // Track last message
                        const msgTime = msg.createdAt || 0;
                        if (msgTime > lastMessageTime) {
                            lastMessageTime = msgTime;
                            lastMessage = msg;
                        }
                    }

                    chatWithDetails.unreadCount = unreadCount;
                    if (lastMessage) {
                        chatWithDetails.lastMessage = lastMessage.text || chat.lastMessage || '';
                        chatWithDetails.lastMessageAt = lastMessage.createdAt || chat.lastMessageAt;
                        chatWithDetails.lastMessageSenderId = lastMessage.senderId;
                    }
                }

                userChats.push(chatWithDetails);
            }
        }

        // Sort by lastMessageAt (descending)
        const sortedChats = userChats.sort((a, b) => {
            const timeA = a.lastMessageAt || 0;
            const timeB = b.lastMessageAt || 0;
            return timeB - timeA;
        });
        if (__DEV__) {
          logger.debug(`✅ [ChatService] Found ${sortedChats.length} chats for user ${uid}`);
        }
        
        return sortedChats;
    } catch (error: any) {
        // Check if it's a permission error
        if (error?.code === 'PERMISSION_DENIED' || error?.message?.includes('Permission denied')) {
            if (__DEV__) {
                logger.error('❌ [ChatService] Permission denied. This usually means:');
                logger.error('   1. User is not authenticated (check auth.currentUser)');
                logger.error('   2. Realtime Database security rules are blocking access');
                logger.error('   Please configure Realtime Database rules in Firebase Console to allow authenticated users to read chats.');
                logger.error('❌ [ChatService] Error details:', error);
            }
            // Return empty array instead of throwing to prevent app crash
            return [];
        }
        
        // Check if user is authenticated
        const currentUser = auth.currentUser;
        if (!currentUser) {
            if (__DEV__) {
                logger.error('❌ [ChatService] User not authenticated when error occurred');
            }
            return [];
        }
        
        if (__DEV__) {
          logger.error('❌ [ChatService] Error fetching user chats:', error);
        }
        return [];
    }
};


export const markMessagesSeen = async (chatId: string, userId: string) => {
    try {
        if (__DEV__) {
            logger.debug('👁️ [markMessagesSeen] Marking messages as seen:', { chatId, userId });
        }
        
        const messagesRef = ref(db, `chats/${chatId}/messages`);
        const snapshot = await get(messagesRef);

        if (!snapshot.exists()) {
            if (__DEV__) {
                logger.debug('⚠️ [markMessagesSeen] No messages found in chat');
            }
            return;
        }

        const messagesData = snapshot.val();
        const updates: Record<string, any> = {};

        for (const msgId in messagesData) {
            const msg = messagesData[msgId];
            // Mark messages as seen if they're NOT from the current user
            // Only add the current user's ID to seenBy if they haven't seen it yet
            if (msg.senderId !== userId) {
                const seenBy = msg.seenBy || [];
                if (!seenBy.includes(userId)) {
                    seenBy.push(userId);
                    updates[`chats/${chatId}/messages/${msgId}/seenBy`] = seenBy;
                    
                    if (__DEV__) {
                        logger.debug(`✅ [markMessagesSeen] Marking message ${msgId} as seen by ${userId}`, {
                            messageSenderId: msg.senderId,
                            currentUserId: userId,
                            seenByBefore: msg.seenBy || [],
                            seenByAfter: seenBy
                        });
                    }
                } else {
                    if (__DEV__) {
                        logger.debug(`ℹ️ [markMessagesSeen] Message ${msgId} already marked as seen by ${userId}`);
                    }
                }
            } else {
                if (__DEV__) {
                    logger.debug(`⏭️ [markMessagesSeen] Skipping message ${msgId} - sent by current user`);
                }
            }
        }

        if (Object.keys(updates).length > 0) {
            await update(ref(db), updates);
            if (__DEV__) {
                logger.debug(`✅ [markMessagesSeen] Updated ${Object.keys(updates).length} messages as seen`);
            }
        } else {
            if (__DEV__) {
                logger.debug('ℹ️ [markMessagesSeen] No messages to update (all already seen or no messages from others)');
            }
        }
    } catch (error) {
        logger.error('❌ [markMessagesSeen] Error marking messages as seen:', error);
        throw error;
    }
};


/**
 * Delete a single message
 * Only allows deletion of messages sent by the current user
 */
export const deleteMessage = async (
    chatId: string,
    messageId: string,
    userId: string
) => {
    try {
        const messageRef = ref(db, `chats/${chatId}/messages/${messageId}`);
        const snapshot = await get(messageRef);

        if (!snapshot.exists()) {
            throw new Error('Message not found');
        }

        const messageData = snapshot.val();
        
        // Verify that the user is the sender of the message
        if (messageData.senderId !== userId) {
            throw new Error('You can only delete your own messages');
        }

        // Delete the message permanently
        await set(messageRef, null);

        // Update chat metadata if this was the last message
        await updateChatLastMessage(chatId);

                if (__DEV__) {
          logger.debug('✅ [ChatService] Message deleted successfully:', messageId)
        };
        return true;
    } catch (error) {
                if (__DEV__) {
          logger.error('❌ [ChatService] Error deleting message:', error)
        };
        throw error;
    }
};


/**
 * Delete multiple messages
 * Only allows deletion of messages sent by the current user
 */
export const deleteMessages = async (
    chatId: string,
    messageIds: string[],
    userId: string
) => {
    try {
        if (!messageIds || messageIds.length === 0) {
            throw new Error('No messages to delete');
        }

        const updates: Record<string, null> = {};
        
        // Verify all messages belong to the user before deleting
        for (const messageId of messageIds) {
            const messageRef = ref(db, `chats/${chatId}/messages/${messageId}`);
            const snapshot = await get(messageRef);

            if (!snapshot.exists()) {
                                if (__DEV__) {
                  logger.warn(`⚠️ [ChatService] Message ${messageId} not found, skipping`)
                };
                continue;
            }

            const messageData = snapshot.val();
            
            // Verify that the user is the sender of the message
            if (messageData.senderId !== userId) {
                throw new Error(`You can only delete your own messages. Message ${messageId} was not sent by you.`);
            }

            // Mark for deletion
            updates[`chats/${chatId}/messages/${messageId}`] = null;
        }

        // Delete all messages in a single transaction
        if (Object.keys(updates).length > 0) {
            await update(ref(db), updates);
            
            // Update chat metadata if any of these were the last message
            await updateChatLastMessage(chatId);

                        if (__DEV__) {
              logger.debug(`✅ [ChatService] ${Object.keys(updates).length} messages deleted successfully`)
            };
            return true;
        }

        return false;
    } catch (error) {
                if (__DEV__) {
          logger.error('❌ [ChatService] Error deleting messages:', error)
        };
        throw error;
    }
};


/**
 * Delete an entire chat conversation
 * This will permanently delete the chat and all its messages
 * Only the participants can delete their own chats
 */
export const deleteChat = async (chatId: string, userId: string) => {
    try {
        const chatRef = ref(db, `chats/${chatId}`);
        const snapshot = await get(chatRef);

        if (!snapshot.exists()) {
            throw new Error('Chat not found');
        }

        const chatData = snapshot.val();
        
        // Verify that the user is a participant in the chat
        if (!chatData.participants || !chatData.participants.includes(userId)) {
            throw new Error('You are not a participant in this chat');
        }

        // Delete the entire chat (this will also delete all messages under chats/{chatId}/messages)
        await set(chatRef, null);

                if (__DEV__) {
          logger.debug('✅ [ChatService] Chat deleted successfully:', chatId)
        };
        return true;
    } catch (error) {
                if (__DEV__) {
          logger.error('❌ [ChatService] Error deleting chat:', error)
        };
        throw error;
    }
};


/**
 * Debug function to create a test chat for the current user
 * This helps verify that chat creation and fetching works correctly
 */
export const createTestChat = async (currentUserId: string, testUserId: string = 'test_user_12345') => {
    try {
        if (__DEV__) {
            logger.debug('🧪 [ChatService] Creating test chat for user:', currentUserId, 'with test user:', testUserId);
        }
        
        const chatId = await createChatIfNotExists(currentUserId, testUserId);
        
        if (__DEV__) {
            logger.debug('✅ [ChatService] Test chat created successfully:', chatId);
        }
        
        return chatId;
    } catch (error) {
        if (__DEV__) {
            logger.error('❌ [ChatService] Error creating test chat:', error);
        }
        throw error;
    }
};

/**
 * Update chat lastMessage metadata after message deletion
 */
const updateChatLastMessage = async (chatId: string) => {
    try {
        const messagesRef = ref(db, `chats/${chatId}/messages`);
        const snapshot = await get(messagesRef);

        if (!snapshot.exists()) {
            // No messages left, clear last message
            await update(ref(db), {
                [`chats/${chatId}/lastMessage`]: '',
                [`chats/${chatId}/lastMessageAt`]: serverTimestamp(),
            });
            return;
        }

        const messagesData = snapshot.val();
        let lastMessage: Message | null = null;
        let lastMessageTime = 0;

        // Find the most recent message
        for (const msgId in messagesData) {
            const msg = messagesData[msgId];
            const msgTime = msg.createdAt || 0;
            if (msgTime > lastMessageTime) {
                lastMessageTime = msgTime;
                lastMessage = msg;
            }
        }

        // Update chat metadata with the new last message
        if (lastMessage) {
            const updates: Record<string, any> = {
                [`chats/${chatId}/lastMessage`]: lastMessage.type === 'text' ? lastMessage.text || '' : `[${lastMessage.type}]`,
                [`chats/${chatId}/lastMessageAt`]: lastMessage.createdAt || serverTimestamp(),
                [`chats/${chatId}/lastMessageSenderId`]: lastMessage.senderId,
            };
            await update(ref(db), updates);
        } else {
            // No messages left
            await update(ref(db), {
                [`chats/${chatId}/lastMessage`]: '',
                [`chats/${chatId}/lastMessageAt`]: serverTimestamp(),
            });
        }
    } catch (error) {
                if (__DEV__) {
          logger.error('⚠️ [ChatService] Error updating chat last message:', error)
        };
        // Non-critical error, don't throw
    }
};
