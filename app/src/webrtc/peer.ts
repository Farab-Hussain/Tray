// Avoid static import from 'react-native-webrtc' because it throws if pods aren't installed
import { Alert, Platform } from 'react-native';

// WebRTC ICE servers configuration
// Using Google's public STUN servers for NAT traversal
// For production, add TURN servers for better connectivity behind firewalls
const iceServers = [
  { urls: ['stun:stun.l.google.com:19302'] },
  { urls: ['stun:stun1.l.google.com:19302'] },
  { urls: ['stun:stun2.l.google.com:19302'] },
  // Add TURN servers here for production
  // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' }
];

export interface CreatePeerParams {
  isCaller: boolean;
  audioOnly?: boolean;
  onLocalStream?: (s: any) => void;
  onRemoteStream?: (s: any) => void;
  onIce?: (c: any) => void;
  offerSdp?: any;
}

export async function createPeer({ isCaller, audioOnly, onLocalStream, onRemoteStream, onIce, offerSdp }: CreatePeerParams) {
  let RTCPeerConnection: any, mediaDevices: any;
  try {
    const rnWebRTC = require('react-native-webrtc');
    RTCPeerConnection = rnWebRTC.RTCPeerConnection;
    mediaDevices = rnWebRTC.mediaDevices;
  } catch {
    const installHint = Platform.OS === 'ios'
      ? 'Run: cd ios && export LANG=en_US.UTF-8 && export LC_ALL=en_US.UTF-8 && pod install, then rebuild the app.'
      : 'Rebuild the app to link native modules.';
    Alert.alert('WebRTC native module not found', installHint);
    throw new Error('WebRTC native module missing');
  }

  // Create peer connection with better configuration
  const pc = new RTCPeerConnection({
    iceServers,
    iceCandidatePoolSize: 10, // Pre-gather ICE candidates for faster connection
    bundlePolicy: 'max-bundle', // Bundle RTP and RTCP for efficiency
    rtcpMuxPolicy: 'require',
  });

  // Get user media with better constraints
  const constraints: any = audioOnly
    ? {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false
    }
    : {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
        frameRate: { ideal: 30 },
      }
    };

  const stream = await mediaDevices.getUserMedia(constraints);

  // Add tracks to peer connection
  stream.getTracks().forEach((t: any) => {
    pc.addTrack(t, stream);
    // Log track info for debugging
    if (__DEV__) {
      console.log(`📹 Added ${t.kind} track:`, t.enabled ? 'enabled' : 'disabled');
    }
  });

  onLocalStream?.(stream);

  // Handle remote stream
  pc.ontrack = (e: any) => {
    const remote = e.streams?.[0];
    if (remote) {
      if (__DEV__) {
        console.log('📹 Remote stream received:', remote.getTracks().length, 'tracks');
      }
      onRemoteStream?.(remote);
    }
  };

  // Handle ICE candidates
  pc.addEventListener('icecandidate', (e: any) => {
    if (e.candidate) {
      if (__DEV__) {
        console.log('🧊 ICE candidate generated:', e.candidate.candidate.substring(0, 50));
      }
      onIce?.(e.candidate);
    } else {
      if (__DEV__) {
        console.log('✅ ICE gathering complete');
      }
    }
  });

  // Handle connection state changes
  pc.addEventListener('connectionstatechange', () => {
    if (__DEV__) {
      console.log('🔌 Connection state:', pc.connectionState);
    }
  });

  // Handle ICE connection state changes
  pc.addEventListener('iceconnectionstatechange', () => {
    if (__DEV__) {
      console.log('🧊 ICE connection state:', pc.iceConnectionState);
    }
  });

  if (isCaller) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return { pc, localDescription: offer };
  } else {
    if (!offerSdp) throw new Error('Missing offer SDP for callee');
    await pc.setRemoteDescription(offerSdp);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return { pc, localDescription: answer };
  }
}

export async function applyAnswer(pc: any, answerSdp: any) {
  try {
    // Check if peer connection is still valid and in a state where we can set remote description
    if (!pc) {
      console.warn('⚠️ [applyAnswer] Peer connection is null');
      return;
    }

    // Check if peer connection is closed
    if (pc.signalingState === 'closed' || pc.connectionState === 'closed') {
      console.warn(`⚠️ [applyAnswer] Peer connection is closed, skipping`);
      return;
    }

    // Check signaling state - can only set remote description if in 'have-local-offer' or 'have-remote-offer' state
    const signalingState = pc.signalingState;
    if (signalingState === 'closed' || signalingState === 'stable') {
      console.warn(`⚠️ [applyAnswer] Cannot set remote answer in state: ${signalingState}`);
      return;
    }

    // Check connection state - don't set if already closed or failed
    const connectionState = pc.connectionState;
    if (connectionState === 'closed' || connectionState === 'failed') {
      console.warn(`⚠️ [applyAnswer] Cannot set remote answer, connection state: ${connectionState}`);
      return;
    }

    // Validate answerSdp exists and is valid
    if (!answerSdp) {
      console.warn('⚠️ [applyAnswer] Answer SDP is null or undefined');
      return;
    }

    // Convert answerSdp to RTCSessionDescription if needed
    let answer = answerSdp;
    const rnWebRTC = require('react-native-webrtc');
    const RTCSessionDescription = rnWebRTC.RTCSessionDescription;

    // If answerSdp is already an RTCSessionDescription instance, use it directly
    if (answerSdp && typeof answerSdp === 'object' && answerSdp.toJSON && answerSdp.sdp) {
      // It's already an RTCSessionDescription instance with valid SDP
      answer = answerSdp;
    } else if (answerSdp && typeof answerSdp === 'object') {
      // It's a plain object, convert to RTCSessionDescription
      // Try to get sdp and type from various possible formats
      let sdp = '';
      let type = 'answer';

      // Try to extract SDP from different possible locations
      if (answerSdp.sdp && typeof answerSdp.sdp === 'string') {
        sdp = answerSdp.sdp;
      } else if (answerSdp.localDescription && answerSdp.localDescription.sdp && typeof answerSdp.localDescription.sdp === 'string') {
        sdp = answerSdp.localDescription.sdp;
      }

      // Try to extract type
      if (answerSdp.type && typeof answerSdp.type === 'string') {
        type = answerSdp.type;
      } else if (answerSdp.localDescription && answerSdp.localDescription.type && typeof answerSdp.localDescription.type === 'string') {
        type = answerSdp.localDescription.type;
      }

      // Validate SDP before creating RTCSessionDescription
      if (sdp && sdp.length > 0 && sdp.includes('v=') && sdp.includes('m=')) {
        try {
          answer = new RTCSessionDescription({ type, sdp });
          console.log('✅ [applyAnswer] Created RTCSessionDescription from plain object');
        } catch (createError: any) {
          console.warn('⚠️ [applyAnswer] Failed to create RTCSessionDescription:', createError?.message || createError);
          return;
        }
      } else {
        console.warn('⚠️ [applyAnswer] Invalid SDP format - missing or malformed SDP');
        return;
      }
    } else {
      console.warn('⚠️ [applyAnswer] Invalid answer format:', typeof answerSdp);
      return;
    }

    // Final validation before setting
    if (!answer || !answer.sdp || typeof answer.sdp !== 'string' || answer.sdp.length === 0) {
      console.warn('⚠️ [applyAnswer] Invalid answer object - missing or invalid SDP');
      return;
    }

    // Set remote description with additional error handling
    try {
      await pc.setRemoteDescription(answer);
    } catch (setError: any) {
      // Re-throw to be caught by outer catch block
      throw setError;
    }
    console.log('✅ [applyAnswer] Remote answer set successfully');
  } catch (error: any) {
    // Safely extract error message without accessing nested properties
    let errorMessage = '';
    try {
      // Try to get error message safely
      if (error) {
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (typeof error === 'object') {
          // Try message property first
          if (error.message && typeof error.message === 'string') {
            errorMessage = error.message;
          } else if (error.toString && typeof error.toString === 'function') {
            try {
              errorMessage = error.toString();
            } catch {
              errorMessage = 'Error object';
            }
          } else {
            errorMessage = 'Error setting remote description';
          }
        } else {
          errorMessage = String(error);
        }
      }
    } catch  {
      // If we can't extract the error message, use a generic one
      errorMessage = 'Unknown error occurred';
    }

    // Ignore errors if connection is already closed or in wrong state
    if (errorMessage.includes('wrong state') ||
      errorMessage.includes('stable') ||
      errorMessage.includes('closed') ||
      errorMessage.includes('InvalidStateError') ||
      errorMessage.includes('receiver')) {
      console.warn('⚠️ [applyAnswer] Ignoring error - connection state issue:', errorMessage);
      return;
    }

    // Log error safely without accessing nested properties
    console.error('❌ [applyAnswer] Error setting remote answer:', errorMessage);
    // Don't throw - just log the error to prevent uncaught promise rejections
    return;
  }
}

export async function addRemoteIce(pc: any, candidate: any) {
  try {
    // If candidate is a plain object (from Firestore), reconstruct RTCIceCandidate
    let iceCandidate = candidate;
    if (candidate && typeof candidate === 'object' && candidate.candidate && typeof candidate.candidate === 'string') {
      // Check if it's already an RTCIceCandidate instance by checking for WebRTC-specific properties
      // If not, reconstruct it from the plain object
      const rnWebRTC = require('react-native-webrtc');
      const RTCIceCandidate = rnWebRTC.RTCIceCandidate;
      // If candidate doesn't have native WebRTC methods, it's a plain object from Firestore
      if (!candidate.toJSON && typeof candidate.candidate === 'string') {
        iceCandidate = new RTCIceCandidate({
          candidate: candidate.candidate,
          sdpMLineIndex: candidate.sdpMLineIndex ?? undefined,
          sdpMid: candidate.sdpMid ?? undefined,
        });
      }
    }
    await pc.addIceCandidate(iceCandidate);
  } catch { }
}


