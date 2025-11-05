import { useEffect, useState, useRef } from 'react';
import { listenMessages, sendMessage as sendMsg, deleteMessage as deleteMsg, deleteMessages as deleteMsgs } from '../services/chat.Service.ts';
import type { Message } from '../types/chatTypes';


export const useChat = (chatId?: string | null, userId?: string | null) => {
    const [messages, setMessages] = useState<(Message & { id: string })[]>([]);
    const unsubRef = useRef<(() => void) | null>(null);


    useEffect(() => {
        if (!chatId) return;
        unsubRef.current = listenMessages(chatId, (msgs: (Message & { id: string })[]) => {
            setMessages(msgs as (Message & { id: string })[]);
        });


        return () => {
            if (unsubRef.current) unsubRef.current();
        };
    }, [chatId]);


    const sendMessage = async (payload: Omit<Message, 'createdAt' | 'id'> & { chatId: string }) => {
        const { chatId: cId, ...msg } = payload;
        await sendMsg(cId, msg as any);
    };

    const deleteMessage = async (messageId: string) => {
        if (!chatId || !userId) {
            throw new Error('Chat ID and User ID are required');
        }
        await deleteMsg(chatId, messageId, userId);
    };

    const deleteMessages = async (messageIds: string[]) => {
        if (!chatId || !userId) {
            throw new Error('Chat ID and User ID are required');
        }
        await deleteMsgs(chatId, messageIds, userId);
    };


    return { messages, sendMessage, deleteMessage, deleteMessages };
};