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
import { listenIncomingCalls, endCall, isCallEndable } from '../services/call.service';
import { navigateToIncomingCallIfNeeded, markCallTerminal } from '../services/call-navigation.service';
import { handleIncomingCallDetected } from '../services/call-incoming-handler.service';
import { syncMissedCallNotifications } from '../services/missed-call.service';
import { subscribeToCallKitActions } from '../services/native-intent.service';
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

  const lastMissedCallSyncAtRef = useRef(0);
  const MISSED_CALL_SYNC_COOLDOWN_MS = 60_000;

  // Check for missed calls when app comes to foreground
  const checkForMissedCalls = useCallback(async () => {
    if (!user?.uid) return;

    const now = Date.now();
    if (now - lastMissedCallSyncAtRef.current < MISSED_CALL_SYNC_COOLDOWN_MS) {
      return;
    }
    lastMissedCallSyncAtRef.current = now;

    try {
      logger.debug('📞 [NotificationContext] Checking for missed calls for user:', user.uid);
      const created = await syncMissedCallNotifications(user.uid);
      if (created > 0) {
        logger.debug('📞 [NotificationContext] Synced missed call notifications:', created);
      }
    } catch (error) {
      logger.error('❌ [NotificationContext] Error checking missed calls:', error);
    }
  }, [user?.uid]);

  // iOS CallKit accept / decline / end while app is open (receiver only for ringing actions)
  useEffect(() => {
    const unsubscribe = subscribeToCallKitActions(async payload => {
      const { action, callId, callType, callerId, receiverId } = payload;
      if (!callId || !user?.uid) return;

      logger.debug('📞 [NotificationContext] CallKit action:', payload);

      const isReceiver = receiverId === user.uid;
      const isCaller = callerId === user.uid;

      // Outgoing CallKit on the caller must not end the Firestore call as "missed".
      if ((action === 'decline' || action === 'cancel') && isCaller) {
        logger.debug('📞 [NotificationContext] Ignoring caller-side CallKit decline/cancel');
        return;
      }

      if (action === 'accept') {
        if (!isReceiver) return;
        await navigateToIncomingCallIfNeeded(
          {
            callId,
            callType: callType || 'audio',
            callerId,
            receiverId: receiverId || user.uid,
            autoAccept: true,
          },
          'callkit-action',
        );
        return;
      }

      if (action === 'decline') {
        if (!isReceiver) return;
        if (await isCallEndable(callId)) {
          markCallTerminal(callId);
          endCall(callId, 'missed').catch(() => {});
        }
        return;
      }

      if (action === 'cancel') {
        if (!isCaller) return;
        if (await isCallEndable(callId)) {
          markCallTerminal(callId);
          endCall(callId, 'ended').catch(() => {});
        }
        return;
      }

      if (action === 'end') {
        if (!isReceiver && !isCaller) return;
        if (await isCallEndable(callId)) {
          markCallTerminal(callId);
          endCall(callId, 'ended').catch(() => {});
        }
      }
    });

    return unsubscribe;
  }, [user?.uid]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      logger.debug('📱 [NotificationContext] App state changed:', appState, '->', nextAppState);
      
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        if (user?.uid) {
          logger.debug('📱 [NotificationContext] App came to foreground — re-registering FCM token');
          void NotificationService.ensurePushNotificationsRegistered({ forceRefresh: true });
          void NotificationService.processPendingNotificationLaunch();
          checkForMissedCalls();
        }
      }
      
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [appState, checkForMissedCalls, user?.uid]);

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
      return;
    }

    logger.debug('🔔 [NotificationContext] User authenticated, initializing notifications for:', user.uid);
    
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

        await handleIncomingCallDetected(callId, callData, user.uid, 'firestore-listener');
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
        logger.debug('📱 [NotificationContext] Ensuring FCM token is registered with backend...');
        const registered = await NotificationService.ensurePushNotificationsRegistered();

        if (registered) {
          logger.debug('✅ [NotificationContext] FCM token registration completed');

          // Setup token refresh listener
          const unsubscribeTokenRefresh =
            NotificationService.setupTokenRefreshListener();
          cleanupRef.current.push(unsubscribeTokenRefresh);

          // Setup foreground message handler
          const unsubscribeForeground =
            NotificationService.setupForegroundMessageHandler();
          cleanupRef.current.push(unsubscribeForeground);

          const unsubscribeNotificationOpened =
            NotificationService.setupNotificationOpenedHandler(() => {
              refreshChats();
            });
          cleanupRef.current.push(unsubscribeNotificationOpened);

          await NotificationService.processPendingNotificationLaunch();

          void checkForMissedCalls();

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
