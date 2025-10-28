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

  const refreshChats = useCallback(async () => {
    if (!userId) return;
    const userChats = await ChatService.fetchUserChats(userId);
    setChats(userChats);
  }, [userId]);

  useEffect(() => {
    refreshChats();
    // Optionally add a listener for real-time chat list updates (not implemented here)
  }, [refreshChats]);

  const openChatWith = useCallback(async (otherUid: string) => {
    if (!userId) throw new Error('User not authenticated');
    const chatId = await ChatService.createChatIfNotExists(userId, otherUid);
    // refresh list so UI shows the chat
    await refreshChats();
    return chatId;
  }, [userId, refreshChats]);

  const value = useMemo(
    () => ({ userId, chats, refreshChats, openChatWith }),
    [userId, chats, refreshChats, openChatWith],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
};
