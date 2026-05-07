import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from './AuthContext';
import * as NotificationService from '../services/notification.service';
import * as NotificationStorage from '../services/notification-storage.service';
import { useChatContext } from './ChatContext';
import { listenIncomingCalls } from '../services/call.service';
import type { AppNotification } from '../services/notification-storage.service';
import { logger } from '../utils/logger';

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markChatAsRead: (chatId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { refreshChats } = useChatContext();
  const cleanupRef = useRef<(() => void)[]>([]);
  const chatUnreadNotificationCountRef = useRef<number>(0);
  const lastChatRefreshTriggerAtRef = useRef<number>(0);
  
  // Track handled calls to prevent duplicate navigation - persists across renders
  const handledCallsRef = useRef<Set<string>>(new Set());

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  const triggerChatRefreshIfNeeded = useCallback((nextNotifications: AppNotification[]) => {
    const unreadChatNotifications = nextNotifications.filter(
      n => !n.read && (n.type === 'chat_message' || n.category === 'message'),
    ).length;

    const previousUnreadChatNotifications = chatUnreadNotificationCountRef.current;
    chatUnreadNotificationCountRef.current = unreadChatNotifications;

    // Refresh only when unread chat-message count changes, with a short throttle.
    if (unreadChatNotifications === previousUnreadChatNotifications) return;
    const now = Date.now();
    if (now - lastChatRefreshTriggerAtRef.current < 1200) return;
    lastChatRefreshTriggerAtRef.current = now;
    refreshChats();
  }, [refreshChats]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      logger.debug('📱 [NotificationContext] App state changed:', appState, '->', nextAppState);
      
      if (appState === 'background' && nextAppState === 'active') {
        logger.debug('📱 [NotificationContext] App came to foreground - checking for missed calls');
        // Check for any calls that might have been missed while app was backgrounded
        checkForMissedCalls();
      }
      
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [appState]);

  // Check for missed calls when app comes to foreground
  const checkForMissedCalls = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      // This would query Firestore for any calls that were missed while backgrounded
      // Implementation depends on your call data structure
      logger.debug('📞 [NotificationContext] Checking for missed calls for user:', user.uid);
      // TODO: Implement missed call checking logic
    } catch (error) {
      logger.error('❌ [NotificationContext] Error checking missed calls:', error);
    }
  }, [user?.uid]);

  // Log provider mount
  useEffect(() => {
    logger.debug('🔔 [NotificationContext] Provider mounted');
    return () => {
      logger.debug('🔔 [NotificationContext] Provider unmounting');
    };
  }, []);

  useEffect(() => {
    logger.debug('🔔 [NotificationContext] Effect triggered - user:', user?.uid || 'null');

    if (!user?.uid) {
      logger.debug('⏳ [NotificationContext] Waiting for user authentication...');
      // Clear handled calls when user logs out
      handledCallsRef.current.clear();
      return;
    }

    logger.debug('🔔 [NotificationContext] User authenticated, initializing notifications for:', user.uid);
    
    // Clear handled calls when user changes (in case user switches accounts)
    handledCallsRef.current.clear();

    // Setup global incoming call listener (Firestore-based) - ALWAYS set up, regardless of FCM token
    // This is critical for incoming calls to work
    logger.debug('📞 [NotificationContext] Setting up incoming call listener for user:', user.uid);
    logger.debug('📞 [NotificationContext] Receiver ID for incoming calls:', user.uid);
    
    try {
      const unsubscribeIncomingCalls = listenIncomingCalls(user.uid, async (callId, callData) => {
        logger.debug('📞 [NotificationContext] ⚡ INCOMING CALL DETECTED VIA FIRESTORE!', {
          callId,
          callerId: callData.callerId,
          receiverId: callData.receiverId,
          type: callData.type,
          status: callData.status,
        });

        // Check current call status in Firestore to avoid race conditions
        try {
          const { getCallOnce } = require('../services/call.service');
          const callDoc = await getCallOnce(callId);
          if (callDoc.exists()) {
            const currentCallData = callDoc.data();
            const currentStatus = currentCallData?.status;
            logger.debug('📞 [NotificationContext] Current call status in Firestore:', currentStatus);
            
            // If call is already active, ended, or missed, don't navigate
            if (currentStatus === 'active' || currentStatus === 'ended' || currentStatus === 'missed') {
              logger.debug('📞 [NotificationContext] Call is already', currentStatus, '- skipping navigation');
              handledCallsRef.current.add(callId);
              return;
            }
          }
        } catch (error: any) {
          logger.warn('⚠️ [NotificationContext] Error checking call status:', error);
          // Continue anyway - might be a network issue
        }

        // Only navigate if call is still ringing (not already answered/ended)
        if (callData.status !== 'ringing') {
          logger.debug('📞 [NotificationContext] Call is not ringing anymore, skipping navigation');
          // Keep in handled set if call is active or ended (prevent re-navigation)
          if (callData.status === 'active' || callData.status === 'ended' || callData.status === 'missed') {
            handledCallsRef.current.add(callId);
            // Remove after 60 seconds to allow new calls with same ID
            setTimeout(() => {
              handledCallsRef.current.delete(callId);
              logger.debug('📞 [NotificationContext] Removed ended/active call from handled set:', callId);
            }, 60000);
          }
          return;
        }

        // Check if we've already handled this call
        if (handledCallsRef.current.has(callId)) {
          logger.debug('📞 [NotificationContext] Call already handled, skipping navigation:', callId);
          return;
        }

        // Navigate to calling screen
        try {
          const { navigate, getCurrentRoute } = require('../navigator/navigationRef');
          
          // Check if we're already on this specific call screen
          const currentRoute = getCurrentRoute?.();
          logger.debug('📞 [NotificationContext] Current route:', currentRoute?.name, currentRoute?.params);
          
          if (currentRoute?.name === 'CallingScreen' || currentRoute?.name === 'VideoCallingScreen') {
            // Check if it's the same call
            const currentCallId = currentRoute?.params?.callId;
            if (currentCallId === callId) {
              logger.debug('📞 [NotificationContext] Already on this call screen, skipping navigation');
              // Mark as handled and keep it in the set until call ends
              handledCallsRef.current.add(callId);
              // Don't remove it automatically - let it stay until call ends
              return;
            }
            // If it's a different call, we might want to navigate anyway
            logger.debug('📞 [NotificationContext] Different call detected, navigating to new call');
          }

          const screenName = callData.type === 'video' ? 'VideoCallingScreen' : 'CallingScreen';
          
          logger.debug('📞 [NotificationContext] ⚡ NAVIGATING TO CALLING SCREEN:', screenName);
          
          // Mark this call as handled immediately - don't remove it automatically
          // It will be removed when call status changes to active/ended/missed
          handledCallsRef.current.add(callId);
          
          // Navigate immediately
          navigate('Screen', {
            screen: screenName,
            params: {
              callId,
              isCaller: false,
              callerId: callData.callerId,
              receiverId: user.uid,
            },
          });
          
          logger.debug('✅ [NotificationContext] ⚡ NAVIGATED TO CALLING SCREEN');
          
          // Keep call in handled set - it will be removed when status changes to active/ended
          // Don't auto-remove it, as that allows the same call to trigger navigation again
        } catch (navError: any) {
          logger.error('❌ [NotificationContext] Error navigating:', navError);
          logger.error('❌ [NotificationContext] Navigation error details:', navError.message, navError.stack);
          // Remove from handled set on error so we can retry
          handledCallsRef.current.delete(callId);
          // Retry navigation
          setTimeout(() => {
            try {
              const { navigate, getCurrentRoute } = require('../navigator/navigationRef');
              
              // Check again if we're already on this call
              const currentRoute = getCurrentRoute?.();
              if (currentRoute?.name === 'CallingScreen' || currentRoute?.name === 'VideoCallingScreen') {
                const currentCallId = currentRoute?.params?.callId;
                if (currentCallId === callId) {
                  logger.debug('📞 [NotificationContext] Already on call screen during retry, skipping');
                  handledCallsRef.current.add(callId);
                  return;
                }
              }
              
              if (handledCallsRef.current.has(callId)) {
                logger.debug('📞 [NotificationContext] Call already handled during retry, skipping');
                return;
              }
              
              const screenName = callData.type === 'video' ? 'VideoCallingScreen' : 'CallingScreen';
              logger.debug('📞 [NotificationContext] Retrying navigation to:', screenName);
              
              handledCallsRef.current.add(callId);
              navigate('Screen', {
                screen: screenName,
                params: {
                  callId,
                  isCaller: false,
                  callerId: callData.callerId,
                  receiverId: user.uid,
                },
              });
              logger.debug('✅ [NotificationContext] Retry navigation successful');
            } catch (retryError: any) {
              logger.error('❌ [NotificationContext] Retry navigation failed:', retryError);
              handledCallsRef.current.delete(callId);
            }
          }, 500);
        }
      });
      cleanupRef.current.push(unsubscribeIncomingCalls);
      logger.debug('✅ [NotificationContext] Incoming call listener set up successfully');
    } catch (listenerError: any) {
      logger.error('❌ [NotificationContext] Error setting up incoming call listener:', listenerError);
      logger.error('❌ [NotificationContext] Listener error details:', listenerError.message, listenerError.code);
      // If Firestore listener fails (e.g., index not ready), we'll rely on push notifications
      if (listenerError.code === 'failed-precondition') {
        logger.warn('⚠️ [NotificationContext] Firestore index not ready. Incoming calls will work via push notifications.');
      }
    }

    const initializeNotifications = async () => {
      try {
        // Request permission and get FCM token
        logger.debug('📱 [NotificationContext] Requesting FCM token...');
        const fcmToken = await NotificationService.getFCMToken();

        if (fcmToken) {
          logger.debug('✅ [NotificationContext] FCM token obtained:', fcmToken.substring(0, 20) + '...');
          logger.debug('📤 [NotificationContext] Registering token with backend...');
          // Register token with backend
          await NotificationService.registerFCMToken(fcmToken);
          logger.debug('✅ [NotificationContext] FCM token registration completed');

          // Setup token refresh listener
          const unsubscribeTokenRefresh =
            NotificationService.setupTokenRefreshListener();
          cleanupRef.current.push(unsubscribeTokenRefresh);

          // Setup foreground message handler
          const unsubscribeForeground =
            NotificationService.setupForegroundMessageHandler();
          cleanupRef.current.push(unsubscribeForeground);

          // Setup notification opened handler
          const unsubscribeNotificationOpened =
            NotificationService.setupNotificationOpenedHandler(data => {
              logger.debug('📨 [NotificationContext] Notification opened with data:', data);
              // Navigate to chat screen or refresh chat list
              if (data?.chatId) {
                // You can navigate to the chat here
                logger.debug('📨 [NotificationContext] Should navigate to chat:', data.chatId);
              }
              // Refresh chats
              refreshChats();
            });
          cleanupRef.current.push(unsubscribeNotificationOpened);

          logger.debug('✅ [NotificationContext] Notification handlers set up successfully');
        } else {
          logger.debug('ℹ️ [NotificationContext] No FCM token obtained - push notifications disabled');
          // Don't throw error - app should continue working without push notifications
        }
      } catch (error: any) {
        logger.error('❌ [NotificationContext] Error initializing notifications:', error.message || error);
        logger.error('❌ [NotificationContext] Error stack:', error.stack);
        // Don't throw - allow app to continue without notifications
      }
    };

    // Call initialization
    initializeNotifications();

    // Cleanup on unmount or user change
    return () => {
      logger.debug('🧹 [NotificationContext] Cleaning up notification listeners');
      cleanupRef.current.forEach(cleanup => cleanup());
      cleanupRef.current = [];
    };
  }, [user?.uid, refreshChats]);

  // Chat refresh is event-driven (notification open, unread count change, and chat screen actions).
  // Avoid interval polling here to prevent excessive background refresh noise.

  // Load notifications from Firestore
  useEffect(() => {
    if (!user?.uid) {
      logger.debug('📬 [NotificationContext] No user, clearing notifications');
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    logger.debug('📬 [NotificationContext] Setting up notification listener for user:', user.uid);
    setIsLoading(true);

    // Listen to notifications in real-time
    let callbackFired = false;
    const unsubscribe = NotificationStorage.listenToNotifications(
      user.uid,
      fetchedNotifications => {
        if (!callbackFired) {
          callbackFired = true;
        }
        logger.debug('📬 [NotificationContext] Callback received:', fetchedNotifications.length, 'notifications');
        
        // Update notifications - React will handle re-renders efficiently
        setNotifications(fetchedNotifications);
        
        // Calculate and update unread count
        const newUnread = fetchedNotifications.filter(n => !n.read).length;
        setUnreadCount(newUnread);
        triggerChatRefreshIfNeeded(fetchedNotifications);
        
        setIsLoading(false);
        logger.debug(
          '📬 [NotificationContext] Notifications updated:',
          fetchedNotifications.length,
          'unread:',
          fetchedNotifications.filter(n => !n.read).length,
        );
      },
    );

    // Set a timeout to stop loading if no response after 10 seconds (fallback only)
    const timeoutId = setTimeout(() => {
      if (!callbackFired) {
        logger.warn('⚠️ [NotificationContext] Notification listener timeout, stopping loading');
        setIsLoading(false);
      }
    }, 10000);

    cleanupRef.current.push(() => {
      clearTimeout(timeoutId);
      unsubscribe();
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [user?.uid, triggerChatRefreshIfNeeded]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationStorage.markNotificationAsRead(notificationId);
      // Update local state
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      refreshChats();
    } catch (error) {
      logger.error('❌ [NotificationContext] Error marking notification as read:', error);
    }
  };

  // Mark all notifications for a chat as read
  const markChatAsRead = async (chatId: string) => {
    if (!user?.uid) return;
    try {
      await NotificationStorage.markChatNotificationsAsRead(user.uid, chatId);
      // Update local state
      setNotifications(prev => {
        const updated = prev.map(n =>
          n.data?.chatId === chatId ? { ...n, read: true } : n,
        );
        const unread = updated.filter(n => !n.read).length;
        setUnreadCount(unread);
        triggerChatRefreshIfNeeded(updated);
        return updated;
      });
    } catch (error) {
      logger.error('❌ [NotificationContext] Error marking chat notifications as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user?.uid) return;
    try {
      await NotificationStorage.markAllNotificationsAsRead(user.uid);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      chatUnreadNotificationCountRef.current = 0;
      refreshChats();
    } catch (error) {
      logger.error('❌ [NotificationContext] Error marking all notifications as read:', error);
    }
  };

  // Refresh notifications manually
  const refreshNotifications = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const fetched = await NotificationStorage.getUserNotifications(user.uid);
      setNotifications(fetched);
      const unread = fetched.filter(n => !n.read).length;
      setUnreadCount(unread);
      triggerChatRefreshIfNeeded(fetched);
    } catch (error) {
      logger.error('❌ [NotificationContext] Error refreshing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, triggerChatRefreshIfNeeded]);

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    markChatAsRead,
    refreshNotifications,
    isLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      'useNotificationContext must be used within NotificationProvider',
    );
  return ctx;
};
