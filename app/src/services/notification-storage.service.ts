import { firestore } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, addDoc, updateDoc, doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { UserService } from './user.service';
import { showToast } from '../utils/toast';

const db = firestore;

export interface AppNotification {
  id: string;
  userId: string;
  type: 'chat_message' | 'booking' | 'booking_confirmed' | 'booking_cancelled' | 'review' | 'system';
  title: string;
  message: string;
  data?: {
    chatId?: string;
    bookingId?: string;
    consultantId?: string;
    studentId?: string;
    [key: string]: any;
  };
  read: boolean;
  createdAt: Date;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
}

/**
 * Get all notifications for a user
 */
export const getUserNotifications = async (userId: string, limitCount: number = 50): Promise<AppNotification[]> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const notifications: AppNotification[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const notification: AppNotification = {
        id: docSnap.id,
        userId: data.userId,
        type: data.type || 'system',
        title: data.title || 'Notification',
        message: data.message || '',
        data: data.data || {},
        read: data.read || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        senderId: data.senderId,
        senderName: data.senderName,
        senderAvatar: data.senderAvatar,
      };
      notifications.push(notification);
    }

    return notifications;
  } catch (error: any) {
    console.error('❌ [NotificationStorage] Error fetching notifications:', error);

    // Handle Firebase index errors gracefully
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      showToast.warning({
        title: 'Loading notifications',
        message: 'Your notifications are setting up. They\'ll appear shortly!',
      });
    } else {
      if (__DEV__) {
        console.log('ℹ️ [NotificationStorage] Couldn\'t load notifications');
      }
    }

    return [];
  }
};

/**
 * Create a notification for a user
 */
export const createNotification = async (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): Promise<void> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      ...notification,
      read: false,
      createdAt: Timestamp.now(),
    });
    console.log('✅ [NotificationStorage] Notification created for user:', notification.userId);
  } catch (error: any) {
    console.error('❌ [NotificationStorage] Error creating notification:', error);
    if (__DEV__) {
      console.log('ℹ️ [NotificationStorage] Notification creation failed');
    }
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
    console.log('✅ [NotificationStorage] Notification marked as read:', notificationId);
  } catch (error: any) {
    console.error('❌ [NotificationStorage] Error marking notification as read:', error);
    if (__DEV__) {
      console.log('ℹ️ [NotificationStorage] Mark as read failed');
    }
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map(docSnap =>
      updateDoc(docSnap.ref, { read: true })
    );

    await Promise.all(updatePromises);
    console.log('✅ [NotificationStorage] All notifications marked as read for user:', userId);
  } catch (error: any) {
    console.error('❌ [NotificationStorage] Error marking all notifications as read:', error);
    if (__DEV__) {
      console.log('ℹ️ [NotificationStorage] Mark all as read failed');
    }
    throw error;
  }
};

/**
 * Mark all notifications for a specific chat as read
 */
export const markChatNotificationsAsRead = async (userId: string, chatId: string): Promise<void> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs
      .filter(docSnap => {
        const data = docSnap.data();
        return data.data?.chatId === chatId;
      })
      .map(docSnap => updateDoc(docSnap.ref, { read: true }));

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      console.log('✅ [NotificationStorage] Chat notifications marked as read:', chatId, `${updatePromises.length} notifications`);
    }
  } catch (error: any) {
    console.error('❌ [NotificationStorage] Error marking chat notifications as read:', error);
    // Don't show toast - this is a background operation
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error: any) {
    console.error('❌ [NotificationStorage] Error getting unread count:', error);
    // Silently return 0 for unread count errors - don't show toast for this
    return 0;
  }
};

/**
 * Listen to notifications in real-time
 */
export const listenToNotifications = (
  userId: string,
  callback: (notifications: AppNotification[]) => void,
  limitCount: number = 50
): (() => void) => {
  try {
    console.log('📬 [NotificationStorage] Setting up listener for user:', userId);
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('📬 [NotificationStorage] Snapshot received:', snapshot.size, 'notifications');
      const notifications: AppNotification[] = [];

      if (snapshot.empty) {
        console.log('📬 [NotificationStorage] No notifications found for user');
        callback([]);
        return;
      }

      // Fetch user details for each notification in parallel
      const notificationPromises = snapshot.docs.map(async (docSnap) => {
        try {
          const data = docSnap.data();

          // If sender info is missing, fetch it (but don't block the callback)
          let senderName = data.senderName;
          let senderAvatar = data.senderAvatar;

          if (data.senderId && (!senderName || !senderAvatar)) {
            try {
              const userData = await UserService.getUserById(data.senderId);
              if (userData) {
                senderName = userData.name || userData.displayName;
                senderAvatar = userData.profileImage || userData.avatarUrl || userData.avatar;
              }
            } catch (error) {
              console.warn('⚠️ [NotificationStorage] Could not fetch sender info:', error);
            }
          }

          return {
            id: docSnap.id,
            userId: data.userId,
            type: data.type || 'system',
            title: data.title || 'Notification',
            message: data.message || '',
            data: data.data || {},
            read: data.read || false,
            createdAt: data.createdAt?.toDate() || new Date(),
            senderId: data.senderId,
            senderName: senderName || data.title || 'Someone',
            senderAvatar: senderAvatar || '',
          } as AppNotification;
        } catch (error) {
          console.error('❌ [NotificationStorage] Error processing notification:', error);
          return null;
        }
      });

      const fetchedNotifications = (await Promise.all(notificationPromises)).filter((n): n is AppNotification => n !== null);
      notifications.push(...fetchedNotifications);

      console.log('📬 [NotificationStorage] Notifications processed:', notifications.length);
      callback(notifications);
    }, (error: any) => {
      // If it's a missing index error, try without orderBy (expected behavior)
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        if (__DEV__) {
          console.log('ℹ️ [NotificationStorage] Firestore index missing, using fallback query (client-side sort)...');
        }
        // Don't show toast for missing index - it's expected and handled gracefully

        try {
          const altQ = query(
            notificationsRef,
            where('userId', '==', userId),
            limit(limitCount)
          );

          const altUnsubscribe = onSnapshot(altQ, async (snapshot) => {
            console.log('📬 [NotificationStorage] Alt query snapshot:', snapshot.size, 'notifications');
            const notifications: AppNotification[] = [];

            if (!snapshot.empty) {
              const notificationPromises = snapshot.docs.map(async (docSnap) => {
                try {
                  const data = docSnap.data();
                  return {
                    id: docSnap.id,
                    userId: data.userId,
                    type: data.type || 'system',
                    title: data.title || 'Notification',
                    message: data.message || '',
                    data: data.data || {},
                    read: data.read || false,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    senderId: data.senderId,
                    senderName: data.senderName || data.title || 'Someone',
                    senderAvatar: data.senderAvatar || '',
                  } as AppNotification;
                } catch {
                  return null;
                }
              });

              const fetched = (await Promise.all(notificationPromises))
                .filter((n): n is AppNotification => n !== null)
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort client-side

              notifications.push(...fetched);
            }

            callback(notifications);
          }, (fallbackError: any) => {
            console.error('❌ [NotificationStorage] Fallback query failed:', fallbackError.message || fallbackError);
            if (__DEV__) {
              console.log('ℹ️ [NotificationStorage] Fallback query failed');
            }
            callback([]);
          });

          return altUnsubscribe;
        } catch (fallbackSetupError: any) {
          console.error('❌ [NotificationStorage] Could not set up fallback query:', fallbackSetupError.message || fallbackSetupError);
          callback([]);
        }
        return undefined;
      }

      // Log unexpected errors
      if (error.code !== 'failed-precondition') {
        console.error('❌ [NotificationStorage] Error listening to notifications:', error.message || error);
        if (__DEV__) {
          console.log('ℹ️ [NotificationStorage] Notification listener error');
        }
      }

      // Call callback with empty array on error to stop loading
      callback([]);
    });

    return unsubscribe;
  } catch (error: any) {
    console.error('❌ [NotificationStorage] Error setting up notification listener:', error);
    console.error('❌ [NotificationStorage] Error details:', error.message);

    if (__DEV__) {
      console.log('ℹ️ [NotificationStorage] Couldn\'t set up notifications');
    }

    // Call callback with empty array on error to stop loading
    callback([]);

    return () => { }; // Return empty cleanup function
  }
};

