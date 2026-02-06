import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase.ts';
import * as ChatService from '../services/chat.Service.ts';
import type { Chat } from '../types/chatTypes';

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setUserId(user ? user.uid : null);
    });
    return () => unsub();
  }, []);

  const refreshTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const refreshChats = useCallback(async () => {
    if (!userId) {
            if (__DEV__) {
        console.log('⚠️ [ChatContext] No userId, skipping chat refresh')
      };
      return;
    }
    
    // Debounce: Clear any pending refresh
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    // Schedule refresh after 300ms (debounce)
    refreshTimeoutRef.current = setTimeout(async () => {
            if (__DEV__) {
        console.log('🔄 [ChatContext] Refreshing chats for user:', userId)
      };
      try {
        const userChats = await ChatService.fetchUserChats(userId);
                if (__DEV__) {
          console.log('📥 [ChatContext] Received chats:', userChats.length)
        };
        setChats(userChats);
      } catch (error) {
                if (__DEV__) {
          console.error('❌ [ChatContext] Error refreshing chats:', error)
        };
        setChats([]);
      }
    }, 300);
  }, [userId]);

  useEffect(() => {
    if (userId) {
            if (__DEV__) {
        console.log('🚀 [ChatContext] User authenticated, starting chat refresh. UserId:', userId)
      };
      refreshChats();
    } else {
            if (__DEV__) {
        console.log('⏳ [ChatContext] Waiting for user authentication...')
      };
    }
    // Optionally add a listener for real-time chat list updates (not implemented here)
  }, [refreshChats, userId]);

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
