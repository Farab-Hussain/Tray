import { Timestamp } from 'firebase/firestore';


export type MessageType = 'text' | 'image' | 'system';


export interface Message {
    id?: string;
    senderId: string;
    text?: string;
    type: MessageType;
    createdAt: Timestamp | any;
    seenBy?: string[]; // user ids
    metadata?: Record<string, any>;
}


export interface Chat {
    id: string;
    participants: string[]; // [uid1, uid2]
    lastMessage?: string;
    lastMessageAt?: Timestamp | any;
    lastMessageSenderId?: string; // Track who sent the last message
    unreadCount?: number; // Number of unread messages for current user
}