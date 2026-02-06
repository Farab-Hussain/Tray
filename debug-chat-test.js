// Debug script to test chat functionality
// Run this script in your app's debug console or as a temporary component

import { useChatContext } from '../src/contexts/ChatContext';

// Add this debug function to any component where you can call it
export const debugCreateTestChat = async () => {
  try {
    const { createTestChat, userId } = useChatContext();
    
    console.log('🧪 [Debug] Current user ID:', userId);
    
    if (!userId) {
      console.error('❌ [Debug] No user authenticated');
      return;
    }
    
    console.log('🧪 [Debug] Creating test chat...');
    const chatId = await createTestChat();
    console.log('✅ [Debug] Test chat created:', chatId);
    
    // Refresh chats to see the new chat
    const { refreshChats } = useChatContext();
    await refreshChats();
    console.log('🔄 [Debug] Chats refreshed');
    
  } catch (error) {
    console.error('❌ [Debug] Error creating test chat:', error);
  }
};

// Alternative: Call this directly in your browser console or React Native debugger
export const directDebugTest = async () => {
  // Import the chat service directly
  const ChatService = require('../src/services/chat.Service.ts');
  
  // Test user ID (you can replace this with the actual current user ID)
  const testUserId = '2gRsQ9Y1rDRpx60Xjd8C1fLky3j2';
  const testOtherUserId = 'debug_test_user_12345';
  
  try {
    console.log('🧪 [Direct Debug] Creating chat between:', testUserId, 'and', testOtherUserId);
    const chatId = await ChatService.createChatIfNotExists(testUserId, testOtherUserId);
    console.log('✅ [Direct Debug] Chat created:', chatId);
    
    // Now test fetching chats
    const userChats = await ChatService.fetchUserChats(testUserId);
    console.log('📥 [Direct Debug] Fetched chats:', userChats.length);
    console.log('📋 [Direct Debug] Chat details:', userChats);
    
  } catch (error) {
    console.error('❌ [Direct Debug] Error:', error);
  }
};
