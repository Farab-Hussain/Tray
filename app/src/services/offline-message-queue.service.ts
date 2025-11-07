import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, push, set, update, serverTimestamp } from 'firebase/database';
import { database } from '../lib/firebase';
import type { Message } from '../types/chatTypes';

const QUEUE_KEY = '@offline_message_queue';
const MAX_RETRIES = 3;

interface QueuedMessage {
  id: string;
  chatId: string;
  message: Omit<Message, 'createdAt' | 'id'>;
  timestamp: number;
  retries: number;
}

/**
 * Save a message to the offline queue
 */
export const queueMessage = async (
  chatId: string,
  message: Omit<Message, 'createdAt' | 'id'>
): Promise<string> => {
  const queueId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const queuedMessage: QueuedMessage = {
    id: queueId,
    chatId,
    message,
    timestamp: Date.now(),
    retries: 0,
  };

  try {
    const existingQueue = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: QueuedMessage[] = existingQueue ? JSON.parse(existingQueue) : [];
    queue.push(queuedMessage);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    
    if (__DEV__) {
      console.log('📦 [OfflineQueue] Message queued:', queueId);
    }
    
    return queueId;
  } catch (error) {
    console.error('❌ [OfflineQueue] Error queueing message:', error);
    throw error;
  }
};

/**
 * Get all queued messages
 */
export const getQueuedMessages = async (): Promise<QueuedMessage[]> => {
  try {
    const queueData = await AsyncStorage.getItem(QUEUE_KEY);
    return queueData ? JSON.parse(queueData) : [];
  } catch (error) {
    console.error('❌ [OfflineQueue] Error getting queued messages:', error);
    return [];
  }
};

/**
 * Remove a message from the queue
 */
export const removeQueuedMessage = async (queueId: string): Promise<void> => {
  try {
    const existingQueue = await AsyncStorage.getItem(QUEUE_KEY);
    if (!existingQueue) return;
    
    const queue: QueuedMessage[] = JSON.parse(existingQueue);
    const filteredQueue = queue.filter(msg => msg.id !== queueId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filteredQueue));
    
    if (__DEV__) {
      console.log('✅ [OfflineQueue] Message removed from queue:', queueId);
    }
  } catch (error) {
    console.error('❌ [OfflineQueue] Error removing queued message:', error);
  }
};

/**
 * Process all queued messages (called when connection is restored)
 */
export const processQueuedMessages = async (): Promise<void> => {
  try {
    const queue = await getQueuedMessages();
    if (queue.length === 0) return;

    if (__DEV__) {
      console.log(`📤 [OfflineQueue] Processing ${queue.length} queued messages...`);
    }

    const db = database;
    const successfulIds: string[] = [];
    const failedIds: QueuedMessage[] = [];

    for (const queuedMsg of queue) {
      try {
        // Try to send the message
        const messagesRef = ref(db, `chats/${queuedMsg.chatId}/messages`);
        const newMessageRef = push(messagesRef);

        const messageData = {
          ...queuedMsg.message,
          createdAt: serverTimestamp(),
        };

        await set(newMessageRef, messageData);

        // Update chat metadata
        const updates: Record<string, any> = {
          [`chats/${queuedMsg.chatId}/lastMessage`]: queuedMsg.message.type === 'text' 
            ? queuedMsg.message.text || '' 
            : `[${queuedMsg.message.type}]`,
          [`chats/${queuedMsg.chatId}/lastMessageAt`]: serverTimestamp(),
          [`chats/${queuedMsg.chatId}/lastMessageSenderId`]: queuedMsg.message.senderId,
        };

        await update(ref(db), updates);

        successfulIds.push(queuedMsg.id);
        
        if (__DEV__) {
          console.log('✅ [OfflineQueue] Successfully sent queued message:', queuedMsg.id);
        }
      } catch (error: any) {
        // Check if it's a network error or if max retries reached
        const isNetworkError = error?.code === 'unavailable' || 
                               error?.message?.includes('network') ||
                               error?.message?.includes('offline');
        
        if (isNetworkError && queuedMsg.retries < MAX_RETRIES) {
          // Increment retry count and keep in queue
          queuedMsg.retries++;
          failedIds.push(queuedMsg);
          if (__DEV__) {
            console.log(`⚠️ [OfflineQueue] Retry ${queuedMsg.retries}/${MAX_RETRIES} for message:`, queuedMsg.id);
          }
        } else {
          // Max retries reached or non-network error - remove from queue
          if (__DEV__) {
            console.error('❌ [OfflineQueue] Failed to send message after retries:', queuedMsg.id, error);
          }
        }
      }
    }

    // Update queue with failed messages (with incremented retry counts)
    if (failedIds.length > 0) {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failedIds));
    } else {
      await AsyncStorage.removeItem(QUEUE_KEY);
    }

    // Remove successful messages
    for (const id of successfulIds) {
      await removeQueuedMessage(id);
    }

    if (__DEV__) {
      console.log(`✅ [OfflineQueue] Processed ${successfulIds.length} messages, ${failedIds.length} still queued`);
    }
  } catch (error) {
    console.error('❌ [OfflineQueue] Error processing queued messages:', error);
  }
};

/**
 * Check if a message ID is a pending/queued message
 */
export const isQueuedMessage = (messageId: string | undefined | null): boolean => {
  if (!messageId || typeof messageId !== 'string') {
    return false;
  }
  return messageId.startsWith('pending_');
};

