import { collection, doc, setDoc, onSnapshot, addDoc, updateDoc, serverTimestamp, getDoc, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../lib/firebase';

export type CallStatus = 'ringing' | 'active' | 'ended' | 'missed';

export interface CallDocument {
  callerId: string;
  receiverId: string;
  type: 'audio' | 'video';
  status: CallStatus;
  offer?: any;
  answer?: any;
  startedAt: any;
  endedAt?: any;
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

export const getCallOnce = async (callId: string) => {
  const ref = doc(firestore, 'calls', callId);
  return await getDoc(ref);
};

export const answerCall = async (callId: string, answer: any) => {
  const ref = doc(firestore, 'calls', callId);
  await updateDoc(ref, { answer, status: 'active' });
};

export const endCall = async (callId: string, status: CallStatus = 'ended') => {
  const ref = doc(firestore, 'calls', callId);
  await updateDoc(ref, { status, endedAt: serverTimestamp() });
};

export const addIceCandidate = async (callId: string, senderId: string, candidate: any) => {
  const ref = collection(firestore, 'calls', callId, 'candidates');
  // Serialize RTCIceCandidate to plain object for Firestore
  const candidateData = candidate ? {
    candidate: candidate.candidate || candidate.toString(),
    sdpMLineIndex: candidate.sdpMLineIndex ?? null,
    sdpMid: candidate.sdpMid ?? null,
  } : null;
  await addDoc(ref, { senderId, candidate: candidateData, createdAt: serverTimestamp() });
};

export const listenCall = (callId: string, cb: (data: CallDocument) => void) => {
  const ref = doc(firestore, 'calls', callId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) cb(snap.data() as CallDocument);
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
  console.log('📞 [listenIncomingCalls] Setting up listener for receiver:', receiverId);
  
  const callsRef = collection(firestore, 'calls');
  const q = query(
    callsRef,
    where('receiverId', '==', receiverId),
    where('status', '==', 'ringing')
  );
  
  let isFirstSnapshot = true;
  let pollInterval: any = null;
  
  // Set up polling as fallback if listener fails
  const startPolling = () => {
    console.log('📞 [listenIncomingCalls] Starting polling fallback...');
    pollInterval = setInterval(async () => {
      try {
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          const callData = doc.data() as CallDocument;
          const callId = doc.id;
          console.log('📞 [Polling] Found ringing call:', callId);
          cb(callId, callData);
        });
      } catch (error: any) {
        console.warn('⚠️ [Polling] Error checking calls:', error);
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
        console.log('📞 [listenIncomingCalls] Stopped polling - listener is working');
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
        console.log('📞 [listenIncomingCalls] Snapshot received, docs:', snapshot.size, 'changes:', changes.length);
      }
      
      // Handle initial snapshot - check for existing ringing calls
      if (isFirstSnapshot) {
        isFirstSnapshot = false;
        console.log('📞 [listenIncomingCalls] Initial snapshot, checking for existing calls...');
        snapshot.forEach((doc) => {
          const callData = doc.data() as CallDocument;
          const callId = doc.id;
          // Only trigger callback if status is still ringing
          if (callData.status === 'ringing') {
            console.log('📞 [Incoming Call] Existing ringing call detected:', callId, callData);
            cb(callId, callData);
          } else {
            console.log('📞 [listenIncomingCalls] Existing call status is', callData.status, '- skipping');
          }
        });
        
        if (snapshot.size === 0) {
          console.log('📞 [listenIncomingCalls] No existing ringing calls found');
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
            console.log('📞 [Incoming Call] New incoming call detected:', callId, callData);
            cb(callId, callData);
          } else {
            console.log('📞 [listenIncomingCalls] Call status is', callData.status, '- skipping callback');
          }
        }
        // Note: We ignore 'modified' and 'removed' changes as they're handled elsewhere
        // (e.g., when call status changes from 'ringing' to 'active' or 'ended')
      });
    },
    (error) => {
      console.error('❌ [listenIncomingCalls] Error listening to calls:', error);
      // Check if it's an index error
      if (error.code === 'failed-precondition') {
        console.error('❌ [listenIncomingCalls] Firestore index required. Please check Firebase Console for index creation link.');
        console.log('📞 [listenIncomingCalls] Starting polling fallback due to index error...');
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
      console.log('📞 [listenIncomingCalls] Starting polling as backup...');
      startPolling();
      // Stop polling after 30 seconds if listener is working
      setTimeout(() => {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
          console.log('📞 [listenIncomingCalls] Stopped backup polling');
        }
      }, 30000);
    }
  }, 5000);
  
  console.log('✅ [listenIncomingCalls] Listener set up successfully');
  
  // Return cleanup function
  return () => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    unsubscribe();
  };
};


