import { useEffect, useState, useRef } from 'react';
import { listenMessages, sendMessage as sendMsg } from '../services/chat.Service.ts';
import type { Message } from '../types/chatTypes';


export const useChat = (chatId?: string | null) => {
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


    return { messages, sendMessage };
};