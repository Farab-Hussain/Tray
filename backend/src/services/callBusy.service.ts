import { admin, db } from '../config/firebase';

const RINGING_STALE_MS = 60_000;
/** Active calls older than this are treated as zombie sessions (crash / no hangup). */
const ACTIVE_STALE_MS = 2 * 60 * 60 * 1000;

const isTimestampFresh = (
  startedAt: admin.firestore.Timestamp | undefined,
  maxAgeMs: number,
): boolean => {
  // Missing startedAt = zombie doc; treat as stale so cleanup can end it.
  if (!startedAt?.toMillis) return false;
  return Date.now() - startedAt.toMillis() < maxAgeMs;
};

const endStaleCall = async (callId: string, reason: string): Promise<void> => {
  try {
    await db.collection('calls').doc(callId).set(
      {
        status: 'ended',
        endedAt: admin.firestore.FieldValue.serverTimestamp(),
        endReason: 'timeout',
        staleCleanup: reason,
      },
      { merge: true },
    );
  } catch {
    // non-fatal
  }
};

const isDocBusy = async (
  doc: admin.firestore.QueryDocumentSnapshot,
  excludeCallId?: string,
): Promise<boolean> => {
  if (doc.id === excludeCallId) return false;

  const data = doc.data();
  if (data.status === 'active') {
    if (isTimestampFresh(data.startedAt, ACTIVE_STALE_MS)) {
      return true;
    }
    await endStaleCall(doc.id, 'active_stale');
    return false;
  }

  if (data.status === 'ringing') {
    if (isTimestampFresh(data.startedAt, RINGING_STALE_MS)) {
      return true;
    }
    await endStaleCall(doc.id, 'ringing_stale');
    return false;
  }

  return false;
};

/**
 * Returns true if user is in an active call or a non-stale ringing call.
 */
export const isUserBusy = async (
  userId: string,
  excludeCallId?: string,
): Promise<boolean> => {
  const statuses: Array<'ringing' | 'active'> = ['ringing', 'active'];

  for (const status of statuses) {
    const receiverSnap = await db
      .collection('calls')
      .where('receiverId', '==', userId)
      .where('status', '==', status)
      .limit(5)
      .get();

    for (const doc of receiverSnap.docs) {
      if (await isDocBusy(doc, excludeCallId)) return true;
    }

    const callerSnap = await db
      .collection('calls')
      .where('callerId', '==', userId)
      .where('status', '==', status)
      .limit(5)
      .get();

    for (const doc of callerSnap.docs) {
      if (await isDocBusy(doc, excludeCallId)) return true;
    }
  }

  return false;
};

/** End zombie ringing/active calls for users before placing a new call. */
export const cleanupStaleCallsForUsers = async (userIds: string[]): Promise<void> => {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  for (const userId of uniqueIds) {
    await isUserBusy(userId);
  }
};

/**
 * End every other ringing call involving either participant.
 * A new outbound call supersedes prior ringing attempts (same pair or solo zombies).
 */
export const endOtherRingingCallsForParticipants = async (
  callerId: string,
  receiverId: string,
  exceptCallId: string,
): Promise<void> => {
  const participantIds = [...new Set([callerId, receiverId].filter(Boolean))];
  const endedIds = new Set<string>();

  for (const userId of participantIds) {
    const asReceiver = await db
      .collection('calls')
      .where('receiverId', '==', userId)
      .where('status', '==', 'ringing')
      .limit(10)
      .get();

    for (const doc of asReceiver.docs) {
      if (doc.id === exceptCallId || endedIds.has(doc.id)) continue;
      endedIds.add(doc.id);
      await endStaleCall(doc.id, 'superseded_by_new_call');
    }

    const asCaller = await db
      .collection('calls')
      .where('callerId', '==', userId)
      .where('status', '==', 'ringing')
      .limit(10)
      .get();

    for (const doc of asCaller.docs) {
      if (doc.id === exceptCallId || endedIds.has(doc.id)) continue;
      endedIds.add(doc.id);
      await endStaleCall(doc.id, 'superseded_by_new_call');
    }
  }
};
