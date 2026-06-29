import { collection, doc, setDoc, onSnapshot, addDoc, updateDoc, serverTimestamp, getDoc, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { logger } from '../utils/logger';
import { logCallState } from '../utils/call-state-logger';

export type CallStatus = 'ringing' | 'active' | 'ended' | 'missed';
export type CallEndReason = 'busy' | 'timeout' | 'declined' | 'normal';

export interface CallDocument {
  callerId: string;
  receiverId: string;
  type: 'audio' | 'video';
  status: CallStatus;
  delivered?: boolean;
  offer?: any;
  answer?: any;
  startedAt: any;
  endedAt?: any;
  endReason?: CallEndReason;
}

export const createCall = async (callId: string, payload: Omit<CallDocument, 'status' | 'startedAt'> & { offer: any }) => {
  const ref = doc(firestore, 'calls', callId);
  await setDoc(ref, {
    callerId: payload.callerId,
    receiverId: payload.receiverId,
    type: payload.type,
    status: 'ringing',
    offer: payload.offer,
    startedAt: serverTimestamp(),
  } as CallDocument);
  return ref;
};

/** Create ringing call doc before WebRTC offer is ready (so ICE candidates can be written). */
export const createCallSession = async (
  callId: string,
  payload: Pick<CallDocument, 'callerId' | 'receiverId' | 'type'>,
) => {
  const ref = doc(firestore, 'calls', callId);
  await setDoc(ref, {
    callerId: payload.callerId,
    receiverId: payload.receiverId,
    type: payload.type,
    status: 'ringing',
    startedAt: serverTimestamp(),
  });
  return ref;
};

export const updateCallOffer = async (callId: string, offer: any) => {
  const ref = doc(firestore, 'calls', callId);
  const serialized = offer?.toJSON
    ? offer.toJSON()
    : { type: offer?.type, sdp: offer?.sdp };
  await updateDoc(ref, { offer: serialized });
};

export const getCallOnce = async (callId: string) => {
  const ref = doc(firestore, 'calls', callId);
  return await getDoc(ref);
};

export const answerCall = async (callId: string, answer: any) => {
  const ref = doc(firestore, 'calls', callId);
  await updateDoc(ref, { answer, status: 'active' });
};

export const markCallDelivered = async (callId: string) => {
  const ref = doc(firestore, 'calls', callId);
  try {
    await updateDoc(ref, { delivered: true });
  } catch (error) {
    logger.error('❌ Error marking call as delivered:', error);
  }
};

export const isCallEndable = async (callId: string): Promise<boolean> => {
  try {
    const callDoc = await getCallOnce(callId);
    if (!callDoc.exists()) {
      return false;
    }
    const currentStatus = (callDoc.data() as CallDocument)?.status;
    return currentStatus === 'ringing' || currentStatus === 'active';
  } catch {
    return false;
  }
};

export const endCall = async (
  callId: string,
  status: CallStatus = 'ended',
  endedBy?: string,
  endReason?: CallEndReason,
) => {
  const ref = doc(firestore, 'calls', callId);
  const callDoc = await getCallOnce(callId);
  if (!callDoc.exists()) {
    logger.warn('⚠️ [endCall] Call document not found:', callId);
    return;
  }

  const currentStatus = (callDoc.data() as CallDocument)?.status;
  if (currentStatus === 'ended' || currentStatus === 'missed') {
    return;
  }
  if (currentStatus !== 'ringing' && currentStatus !== 'active') {
    return;
  }

  await setDoc(
    ref,
    {
      status,
      endedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(endedBy ? { endedBy } : {}),
      ...(endReason ? { endReason } : {}),
    },
    { merge: true },
  );
};

/** Receiver declines an incoming call because they are already in another call. */
export const rejectCallAsBusy = async (callId: string, endedBy?: string) => {
  await endCall(callId, 'missed', endedBy, 'busy');
};

/**
 * End other ringing calls for the current user before starting a new outbound call.
 * Only queries the authenticated user's calls (Firestore rules do not allow listing others').
 */
export const endOtherRingingCallsForParticipants = async (
  currentUserId: string,
  exceptCallId: string,
): Promise<void> => {
  if (!currentUserId) return;

  const callsRef = collection(firestore, 'calls');
  const endedIds = new Set<string>();
  const queries = [
    query(
      callsRef,
      where('callerId', '==', currentUserId),
      where('status', '==', 'ringing'),
    ),
    query(
      callsRef,
      where('receiverId', '==', currentUserId),
      where('status', '==', 'ringing'),
    ),
  ];

  for (const q of queries) {
    try {
      const snap = await getDocs(q);
      for (const docSnap of snap.docs) {
        if (docSnap.id === exceptCallId || endedIds.has(docSnap.id)) continue;
        endedIds.add(docSnap.id);
        try {
          await endCall(docSnap.id, 'ended', currentUserId);
        } catch (error) {
          logger.warn('⚠️ [endOtherRingingCalls] Failed to end call:', docSnap.id, error);
        }
      }
    } catch (error) {
      logger.warn('⚠️ [endOtherRingingCalls] Query failed:', error);
    }
  }
};

export const getRecentMissedCallsForUser = async (receiverId: string) => {
  const callsRef = collection(firestore, 'calls');
  const q = query(
    callsRef,
    where('receiverId', '==', receiverId),
    where('status', '==', 'missed'),
  );
  const snapshot = await getDocs(q);
  const results: Array<{ callId: string; data: CallDocument }> = [];
  snapshot.forEach(docSnap => {
    results.push({ callId: docSnap.id, data: docSnap.data() as CallDocument });
  });
  return results;
};

export const addIceCandidate = async (callId: string, senderId: string, candidate: any) => {
  try {
    const ref = collection(firestore, 'calls', callId, 'candidates');
    const candidateData = candidate
      ? {
          candidate: candidate.candidate || candidate.toString(),
          sdpMLineIndex: candidate.sdpMLineIndex ?? null,
          sdpMid: candidate.sdpMid ?? null,
        }
      : null;
    await addDoc(ref, { senderId, candidate: candidateData, createdAt: serverTimestamp() });
  } catch (error) {
    logger.warn('⚠️ [addIceCandidate] Failed to write candidate:', error);
  }
};

export const listenCall = (callId: string, cb: (data: CallDocument) => void) => {
  const ref = doc(firestore, 'calls', callId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as CallDocument;
      logCallState({
        callId,
        role: 'Firestore',
        event: 'document-snapshot',
        status: data.status,
        extra: {
          callerId: data.callerId,
          receiverId: data.receiverId,
          delivered: data.delivered,
          hasOffer: Boolean(data.offer),
          hasAnswer: Boolean(data.answer),
        },
      });
      cb(data);
    }
  });
};

export const listenCandidates = (callId: string, cb: (data: { senderId: string; candidate: any }) => void) => {
  const ref = collection(firestore, 'calls', callId, 'candidates');
  return onSnapshot(ref, (snap) => {
    snap.docChanges().forEach((change) => {
      cb(change.doc.data() as any);
    });
  });
};

export const getExistingCandidates = async (callId: string) => {
  const ref = collection(firestore, 'calls', callId, 'candidates');
  const snapshot = await getDocs(ref);
  const candidates: { senderId: string; candidate: any }[] = [];
  snapshot.forEach((doc) => {
    candidates.push(doc.data() as any);
  });
  return candidates;
};

/**
 * Listen for incoming calls where the current user is the receiver
 * This allows the app to detect incoming calls globally, not just when on the calling screen
 */
export const listenIncomingCalls = (receiverId: string, cb: (callId: string, callData: CallDocument) => void) => {
  logger.debug('📞 [listenIncomingCalls] Setting up listener for receiver:', receiverId);
  
  const callsRef = collection(firestore, 'calls');
  const q = query(
    callsRef,
    where('receiverId', '==', receiverId),
    where('status', '==', 'ringing')
  );
  
  let isFirstSnapshot = true;
  let pollInterval: any = null;
  
  const polledCallIds = new Set<string>();

  // Set up polling as fallback if listener fails
  const startPolling = () => {
    logger.debug('📞 [listenIncomingCalls] Starting polling fallback...');
    pollInterval = setInterval(async () => {
      try {
        const snapshot = await getDocs(q);
        snapshot.forEach((docSnap) => {
          const callData = docSnap.data() as CallDocument;
          const callId = docSnap.id;
          if (polledCallIds.has(callId) || callData.status !== 'ringing') {
            return;
          }
          polledCallIds.add(callId);
          logger.debug('📞 [Polling] Found ringing call:', callId);
          cb(callId, callData);
        });
      } catch (error: any) {
        logger.warn('⚠️ [Polling] Error checking calls:', error);
      }
    }, 2000); // Poll every 2 seconds
  };
  
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      // Stop polling if listener is working
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
        logger.debug('📞 [listenIncomingCalls] Stopped polling - listener is working');
      }
      
      // Get document changes (only actual changes, not metadata updates)
      const changes = snapshot.docChanges();
      
      // Skip processing if there are no actual document changes (metadata-only updates)
      // This prevents excessive logging and processing when Firestore sends metadata updates
      if (!isFirstSnapshot && changes.length === 0) {
        return; // No actual changes, just a metadata update
      }
      
      // Only log if there are actual document changes or on first snapshot
      if (isFirstSnapshot || changes.length > 0) {
        logger.debug('📞 [listenIncomingCalls] Snapshot received, docs:', snapshot.size, 'changes:', changes.length);
      }
      
      // Handle initial snapshot - check for existing ringing calls
      if (isFirstSnapshot) {
        isFirstSnapshot = false;
        logger.debug('📞 [listenIncomingCalls] Initial snapshot, checking for existing calls...');
        snapshot.forEach((doc) => {
          const callData = doc.data() as CallDocument;
          const callId = doc.id;
          
          // Check if call is stale (older than 60 seconds)
          const now = Date.now();
          const startedAt = callData.startedAt?.toMillis ? callData.startedAt.toMillis() : now;
          const isStale = (now - startedAt) > 60000; // 60 seconds timeout

          // Only trigger callback if status is still ringing and not stale
          if (callData.status === 'ringing' && !isStale) {
            logger.debug('📞 [Incoming Call] Existing ringing call detected:', callId, callData);
            cb(callId, callData);
          } else if (callData.status === 'ringing' && isStale) {
            logger.debug('📞 [listenIncomingCalls] Found stale ringing call', callId, '- skipping');
          } else {
            logger.debug('📞 [listenIncomingCalls] Existing call status is', callData.status, '- skipping');
          }
        });
        
        if (snapshot.size === 0) {
          logger.debug('📞 [listenIncomingCalls] No existing ringing calls found');
        }
        return; // Don't process changes on initial snapshot
      }
      
      // Handle new calls - only process 'added' changes (new incoming calls)
      changes.forEach((change) => {
        // Only process actual document changes, ignore metadata-only updates
        if (change.type === 'added') {
          const callData = change.doc.data() as CallDocument;
          const callId = change.doc.id;
          
          // Double-check status - only trigger if still ringing
          // This prevents race conditions where status changes between snapshot and callback
          if (callData.status === 'ringing') {
            logger.debug('📞 [Incoming Call] New incoming call detected:', callId, callData);
            cb(callId, callData);
          } else {
            logger.debug('📞 [listenIncomingCalls] Call status is', callData.status, '- skipping callback');
          }
        }
        // Note: We ignore 'modified' and 'removed' changes as they're handled elsewhere
        // (e.g., when call status changes from 'ringing' to 'active' or 'ended')
      });
    },
    (error) => {
      logger.error('❌ [listenIncomingCalls] Error listening to calls:', error);
      // Check if it's an index error
      if (error.code === 'failed-precondition') {
        logger.error('❌ [listenIncomingCalls] Firestore index required. Please check Firebase Console for index creation link.');
        logger.debug('📞 [listenIncomingCalls] Starting polling fallback due to index error...');
        // Start polling as fallback
        startPolling();
      } else {
        // Start polling as fallback for any error
        startPolling();
      }
    }
  );
  
  // Start polling as backup after a delay
  setTimeout(() => {
    if (pollInterval === null) {
      logger.debug('📞 [listenIncomingCalls] Starting polling as backup...');
      startPolling();
      // Stop polling after 30 seconds if listener is working
      setTimeout(() => {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
          logger.debug('📞 [listenIncomingCalls] Stopped backup polling');
        }
      }, 30000);
    }
  }, 5000);
  
  logger.debug('✅ [listenIncomingCalls] Listener set up successfully');
  
  // Return cleanup function
  return () => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    unsubscribe();
  };
};
