import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import type { CallDocument } from './call.service';
import * as NotificationStorage from './notification-storage.service';
import { UserService } from './user.service';
import { logger } from '../utils/logger';

const PROCESSED_MISSED_CALLS_KEY = 'tray_processed_missed_call_ids';
const MISSED_CALL_WINDOW_MS = 24 * 60 * 60 * 1000;

type MissedCallEntry = {
  callId: string;
  callData: CallDocument;
};

const readProcessedIds = async (): Promise<Set<string>> => {
  try {
    const raw = await AsyncStorage.getItem(PROCESSED_MISSED_CALLS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter(Boolean) : []);
  } catch {
    return new Set();
  }
};

const writeProcessedIds = async (ids: Set<string>) => {
  const trimmed = [...ids].slice(-200);
  await AsyncStorage.setItem(PROCESSED_MISSED_CALLS_KEY, JSON.stringify(trimmed));
};

export const getRecentMissedCalls = async (userId: string): Promise<MissedCallEntry[]> => {
  const callsRef = collection(firestore, 'calls');
  const q = query(
    callsRef,
    where('receiverId', '==', userId),
    where('status', '==', 'missed'),
  );
  const snapshot = await getDocs(q);
  const now = Date.now();
  const entries: MissedCallEntry[] = [];

  snapshot.forEach(docSnap => {
    const callData = docSnap.data() as CallDocument;
    const endedAtMs = callData.endedAt?.toMillis?.() ?? 0;
    if (endedAtMs && now - endedAtMs > MISSED_CALL_WINDOW_MS) {
      return;
    }
    entries.push({ callId: docSnap.id, callData });
  });

  return entries;
};

/**
 * Create in-app missed-call notifications for calls the user hasn't been notified about yet.
 */
export const syncMissedCallNotifications = async (userId: string): Promise<number> => {
  const processed = await readProcessedIds();
  const missedCalls = await getRecentMissedCalls(userId);
  let created = 0;
  let dirty = false;

  for (const { callId, callData } of missedCalls) {
    if (processed.has(callId)) continue;

    let callerName = 'Someone';
    let callerAvatar = '';
    try {
      const caller = await UserService.getUserById(callData.callerId);
      if (caller) {
        callerName = caller.name || caller.displayName || callerName;
        callerAvatar =
          caller.profileImage || caller.avatarUrl || caller.avatar || '';
      }
    } catch {
      // non-critical
    }

    const callLabel = callData.type === 'video' ? 'video' : 'audio';

    try {
      await NotificationStorage.createNotification({
        userId,
        type: 'call',
        category: 'call',
        title: 'Missed call',
        message: `Missed ${callLabel} call from ${callerName}`,
        data: {
          callId,
          callerId: callData.callerId,
          receiverId: callData.receiverId,
          callType: callData.type,
          missed: true,
        },
        senderId: callData.callerId,
        senderName: callerName,
        senderAvatar: callerAvatar,
      });
      created += 1;
    } catch (error) {
      logger.warn('⚠️ [MissedCall] Failed to create notification:', { callId, error });
    }

    // Always mark processed so permission/rate-limit failures do not retry forever.
    processed.add(callId);
    dirty = true;
  }

  if (dirty) {
    await writeProcessedIds(processed);
  }

  return created;
};
