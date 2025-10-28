import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import * as NotificationService from '../services/notification.service';
import { useChatContext } from './ChatContext';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

interface NotificationContextValue {
  // No public API needed for now
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { refreshChats } = useChatContext();

  useEffect(() => {
    if (!user?.uid) return;

    const initializeNotifications = async () => {
      try {
        // Request permission and get FCM token
        const fcmToken = await NotificationService.getFCMToken();
        if (fcmToken) {
            // Register token with backend
            await NotificationService.registerFCMToken(fcmToken);
            
            // Setup token refresh listener
            const unsubscribeTokenRefresh = NotificationService.setupTokenRefreshListener();
          
          // Setup foreground message handler
          const unsubscribeForeground = NotificationService.setupForegroundMessageHandler();
          
          // Setup notification opened handler
          const unsubscribeNotificationOpened = NotificationService.setupNotificationOpenedHandler(
            (data) => {
              console.log('Notification opened with data:', data);
              // Navigate to chat screen or refresh chat list
              if (data?.chatId) {
                // You can navigate to the chat here
                console.log('Should navigate to chat:', data.chatId);
              }
              // Refresh chats
              refreshChats();
            }
          );

          return () => {
            unsubscribeTokenRefresh();
            unsubscribeForeground();
            unsubscribeNotificationOpened();
          };
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();

    // Cleanup on unmount
    return () => {
      if (user?.uid) {
        // Optionally delete FCM token on logout
        // NotificationService.deleteFCMToken(user.uid);
      }
    };
  }, [user?.uid, refreshChats]);

  // Listen for incoming messages and refresh chat list
  useEffect(() => {
    if (!user?.uid) return;

    let intervalId: NodeJS.Timeout;
    
    // Check for new messages every 30 seconds
    intervalId = setInterval(() => {
      refreshChats();
    }, 30000); // 30 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [user?.uid, refreshChats]);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationContext must be used within NotificationProvider');
  return ctx;
};

