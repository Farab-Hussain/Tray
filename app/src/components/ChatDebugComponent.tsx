import React from 'react';
import { View, Button, Text, Alert } from 'react-native';
import { useChatContext } from '../contexts/ChatContext';

/**
 * Temporary debug component to test chat functionality
 * Add this component to any screen in your app to test chat creation
 */
export const ChatDebugComponent: React.FC = () => {
  const { userId, chats, createTestChat, refreshChats } = useChatContext();

  const handleCreateTestChat = async () => {
    try {
      console.log('🧪 [ChatDebug] Creating test chat for user:', userId);
      const chatId = await createTestChat();
      console.log('✅ [ChatDebug] Test chat created:', chatId);
      Alert.alert('Success', `Test chat created: ${chatId}`);
    } catch (error) {
      console.error('❌ [ChatDebug] Error:', error);
      Alert.alert('Error', `Failed to create test chat: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleRefreshChats = async () => {
    try {
      console.log('🔄 [ChatDebug] Refreshing chats...');
      await refreshChats();
      console.log('✅ [ChatDebug] Chats refreshed');
    } catch (error) {
      console.error('❌ [ChatDebug] Error refreshing chats:', error);
      Alert.alert('Error', `Failed to refresh chats: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // return (
  //   <View style={{ padding: 20, backgroundColor: '#f0f0f0', margin: 10, borderRadius: 8 }}>
  //     <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
  //       Chat Debug Info
  //     </Text>
      
  //     <Text style={{ marginBottom: 5 }}>
  //       Current User ID: {userId || 'Not authenticated'}
  //     </Text>
      
  //     <Text style={{ marginBottom: 10 }}>
  //       Total Chats: {chats.length}
  //     </Text>

  //     <Button
  //       title="Create Test Chat"
  //       onPress={handleCreateTestChat}
  //       disabled={!userId}
  //     />
      
  //     <View style={{ height: 10 }} />
      
  //     <Button
  //       title="Refresh Chats"
  //       onPress={handleRefreshChats}
  //       disabled={!userId}
  //     />

  //     {chats.length > 0 && (
  //       <View style={{ marginTop: 10 }}>
  //         <Text style={{ fontWeight: 'bold' }}>Chat IDs:</Text>
  //         {chats.map((chat, index) => (
  //           <Text key={chat.id} style={{ fontSize: 12 }}>
  //             {index + 1}. {chat.id}
  //           </Text>
  //         ))}
  //       </View>
  //     )}
  //   </View>
  // );
};
