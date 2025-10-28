import { ref, push, set, get, update, onValue, off, query, orderByChild, serverTimestamp, DataSnapshot } from 'firebase/database';
// @ts-ignore
import { database } from '../lib/firebase.ts';
import type { Message, Chat } from '../types/chatTypes';

// @ts-ignore
const db = database;

export const getChatIdFor = (uidA: string, uidB: string) => {
    return [uidA, uidB].sort().join('_');
};

export const createChatIfNotExists = async (uidA: string, uidB: string) => {
    const chatId = getChatIdFor(uidA, uidB);
    const chatRef = ref(db, `chats/${chatId}`);

    try {
        const snapshot = await get(chatRef);
        
        if (!snapshot.exists()) {
            const chatData: Chat = {
                id: chatId,
                participants: [uidA, uidB],
                lastMessage: '',
                lastMessageAt: serverTimestamp() as any,
            };
            await set(chatRef, chatData);
        }
    } catch (error) {
        console.error('Error creating chat:', error);
    }

    return chatId;
};


export const sendMessage = async (
    chatId: string,
    message: Omit<Message, 'createdAt' | 'id'>
) => {
    try {
        const messagesRef = ref(db, `chats/${chatId}/messages`);
        const newMessageRef = push(messagesRef);

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

        return newMessageRef.key || '';
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};


export const listenMessages = (
    chatId: string,
    cb: (messages: (Message & { id: string })[]) => void
) => {
    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const messagesQuery = query(messagesRef, orderByChild('createdAt'));

    const unsubscribe = onValue(messagesQuery, (snapshot: DataSnapshot) => {
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
            cb(messages);
        } else {
            cb([]);
        }
    });

    return () => {
        off(messagesRef);
    };
};


export const fetchUserChats = async (uid: string) => {
    try {
        const chatsRef = ref(db, 'chats');
        const snapshot = await get(chatsRef);

        if (!snapshot.exists()) {
            return [];
        }

        const allChats = snapshot.val();
        const userChats: (Chat & { unreadCount?: number })[] = [];

        // Filter chats where user is a participant
        for (const chatId in allChats) {
            const chat = allChats[chatId];
            if (chat.participants && chat.participants.includes(uid)) {
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
        return userChats.sort((a, b) => {
            const timeA = a.lastMessageAt || 0;
            const timeB = b.lastMessageAt || 0;
            return timeB - timeA;
        });
    } catch (error) {
        console.error('Error fetching user chats:', error);
        return [];
    }
};


export const markMessagesSeen = async (chatId: string, userId: string) => {
    try {
        const messagesRef = ref(db, `chats/${chatId}/messages`);
        const snapshot = await get(messagesRef);

        if (!snapshot.exists()) {
            return;
        }

        const messagesData = snapshot.val();
        const updates: Record<string, any> = {};

        for (const msgId in messagesData) {
            const msg = messagesData[msgId];
            if (msg.senderId !== userId && !msg.seenBy?.includes(userId)) {
                const seenBy = msg.seenBy || [];
                if (!seenBy.includes(userId)) {
                    seenBy.push(userId);
                    updates[`chats/${chatId}/messages/${msgId}/seenBy`] = seenBy;
                }
            }
        }

        if (Object.keys(updates).length > 0) {
            await update(ref(db), updates);
        }
    } catch (error) {
        console.error('Error marking messages as seen:', error);
    }
};