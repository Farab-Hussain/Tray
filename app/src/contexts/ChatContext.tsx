import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import * as ChatService from '../services/chat.Service';
import type { Chat } from '../types/chatTypes';
import { logger } from '../utils/logger';

interface ChatContextValue {
  userId: string | null;
  chats: Chat[];
  refreshChats: () => Promise<void>;
  openChatWith: (otherUid: string) => Promise<string>; // returns chatId
  deleteChat: (chatId: string) => Promise<void>;
  createTestChat: () => Promise<string>; // debug function
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const inFlightRefreshRef = React.useRef<Promise<void> | null>(null);
  const lastRefreshAtRef = React.useRef<number>(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setUserId(user ? user.uid : null);
    });
    return () => unsub();
  }, []);

  const refreshChatsRef = React.useRef<(() => Promise<void>) | null>(null);
  
  const refreshChats = useCallback(async () => {
    if (!userId) {
      logger.debug('⚠️ [ChatContext] No userId, skipping chat refresh');
      return;
    }

    if (inFlightRefreshRef.current) {
      await inFlightRefreshRef.current;
      return;
    }

    const now = Date.now();
    // Throttle bursts from multiple contexts/screens calling refresh simultaneously.
    if (now - lastRefreshAtRef.current < 1500) {
      return;
    }

    const task = (async () => {
      logger.debug('🔄 [ChatContext] Refreshing chats for user:', userId);
      try {
        const userChats = await ChatService.fetchUserChats(userId);
        logger.debug('📥 [ChatContext] Received chats:', userChats.length);
        setChats(userChats);
      } catch (error) {
        logger.error('❌ [ChatContext] Error refreshing chats:', error);
        setChats([]);
      } finally {
        lastRefreshAtRef.current = Date.now();
      }
    })();

    inFlightRefreshRef.current = task;
    try {
      await task;
    } finally {
      inFlightRefreshRef.current = null;
    }
  }, [userId]);

  // Update ref whenever refreshChats changes
  useEffect(() => {
    refreshChatsRef.current = refreshChats;
  }, [refreshChats]);

  useEffect(() => {
    if (userId) {
      logger.debug('🚀 [ChatContext] User authenticated, starting chat refresh. UserId:', userId);
      refreshChatsRef.current?.();
    } else {
      logger.debug('⏳ [ChatContext] Waiting for user authentication...');
    }
    // Optionally add a listener for real-time chat list updates (not implemented here)
  }, [userId]);

  const openChatWith = useCallback(async (otherUid: string) => {
    if (!userId) throw new Error('User not authenticated');
    const chatId = await ChatService.createChatIfNotExists(userId, otherUid);
    // refresh list so UI shows the chat
    await refreshChats();
    return chatId;
  }, [userId, refreshChats]);

  const deleteChat = useCallback(async (chatId: string) => {
    if (!userId) throw new Error('User not authenticated');
    await ChatService.deleteChat(chatId, userId);
    // Refresh chat list after deletion
    await refreshChats();
  }, [userId, refreshChats]);

  const createTestChat = useCallback(async () => {
    if (!userId) throw new Error('User not authenticated');
    const chatId = await ChatService.createTestChat(userId);
    // Refresh chat list after creating test chat
    await refreshChats();
    return chatId;
  }, [userId, refreshChats]);

  const value = useMemo(
    () => ({ userId, chats, refreshChats, openChatWith, deleteChat, createTestChat }),
    [userId, chats, refreshChats, openChatWith, deleteChat, createTestChat],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
};
