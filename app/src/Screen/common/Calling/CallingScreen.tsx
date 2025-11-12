import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Alert,
  StatusBar,
} from 'react-native';
import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Phone, Mic, MicOff } from 'lucide-react-native';
// Safely import InCallManager - may not be available until native module is linked
let InCallManager: any = null;
try {
  InCallManager = require('react-native-incall-manager').default;
} catch (error) {
  if (__DEV__) {
    console.log(
      'ℹ️ [InCallManager] Native module not linked yet - run pod install and rebuild',
      error,
    );
  }
}
import { COLORS } from '../../../constants/core/colors';
import { callingStyles } from '../../../constants/styles/callingStyles';
import { createPeer, applyAnswer, addRemoteIce } from '../../../webrtc/peer';
import {
  addIceCandidate,
  answerCall,
  createCall,
  endCall,
  listenCall,
  listenCandidates,
  getCallOnce,
  getExistingCandidates,
  type CallDocument,
} from '../../../services/call.service';
import { UserService } from '../../../services/user.service';
import * as NotificationStorage from '../../../services/notification-storage.service';
import { useAuth } from '../../../contexts/AuthContext';

const CallingScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { user, role } = useAuth();

  // State for mute and video
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<
    'ringing' | 'active' | 'ended' | 'missed'
  >('ringing');
  const [_local, setLocal] = useState<any | null>(null);
  const [_remote, setRemote] = useState<any | null>(null);
  const [otherUser, setOtherUser] = useState<{
    name: string;
    profileImage?: string;
  } | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const pcRef = useRef<any | null>(null);
  const localStreamRef = useRef<any | null>(null);
  const remoteStreamRef = useRef<any | null>(null);
  const statusRef = useRef<'ringing' | 'active' | 'ended' | 'missed'>(
    'ringing',
  );
  const iceCandidateQueueRef = useRef<
    Array<{ senderId: string; candidate: any }>
  >([]);
  const isMutedRef = useRef<boolean>(false);
  const { callId, isCaller, callerId, receiverId } = route?.params || {};
  const type: 'audio' = 'audio';
  const callerNameDefault = useMemo(() => {
    if (user?.displayName && user.displayName.trim()) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Someone';
  }, [user?.displayName, user?.email]);

  const callerAvatarDefault = useMemo(
    () => user?.photoURL ?? '',
    [user?.photoURL],
  );

  // Fetch other user's profile data
  useEffect(() => {
    const fetchOtherUser = async () => {
      try {
        const otherUserId = isCaller ? receiverId : callerId;
        const userData = await UserService.getUserById(otherUserId);
        if (userData) {
          setOtherUser({
            name: userData.name || 'Unknown',
            profileImage: userData.profileImage || userData.avatarUrl,
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoadingUser(false);
      }
    };
    if (callId && callerId && receiverId) {
      fetchOtherUser();
    }
  }, [callId, callerId, receiverId, isCaller]);

  useEffect(() => {
    let unsubCall: any, unsubCand: any;
    let hangTimer: any;

    (async () => {
      if (!callId || !callerId || !receiverId) return;

      if (isCaller) {
        // Start audio session BEFORE creating peer connection
        if (InCallManager) {
          try {
            InCallManager.start({ media: 'audio', auto: true });
            InCallManager.setForceSpeakerphoneOn(false);
            InCallManager.setMicrophoneMute(isMutedRef.current);
            InCallManager.setSpeakerphoneOn(false);
            if (__DEV__) {
              console.log(
                '✅ [Caller] Audio session started before peer connection (configured for recording and playback)',
              );
            }
          } catch (error: any) {
            console.warn(
              '⚠️ [Caller] Error starting audio session:',
              error.message,
            );
          }
        }

        console.log('📞 Caller: Creating peer connection...');
        const { pc, localDescription } = await createPeer({
          isCaller: true,
          audioOnly: true,
          onError: (error: string) => {
            console.error('❌ [Caller] Peer connection error:', error);
            setConnectionError(error);
            Alert.alert(
              'Connection Failed',
              'Unable to establish connection. This usually happens when devices are on different networks.\n\n' +
                'To fix this, you need to configure a TURN server. See docs/TURN_SERVER_QUICK_SETUP.md for setup instructions.\n\n' +
                'Quick options:\n' +
                '• Use Twilio TURN (free tier available)\n' +
                '• Use Metered.ca paid TURN\n' +
                '• Self-host Coturn server',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Optionally navigate back or end call
                    if (navigation.canGoBack()) {
                      navigation.goBack();
                    }
                  },
                },
              ],
              { cancelable: false },
            );
          },
          onLocalStream: stream => {
            console.log('✅ Local stream created for caller');
            setLocal(stream);
            localStreamRef.current = stream;

            // 🎧 Step 1: Verify local audio track after stream creation
            const audioTracks = stream.getAudioTracks();
            console.log(
              '🎤 [Caller] Local stream audio tracks count:',
              audioTracks.length,
            );
            if (audioTracks.length > 0) {
              audioTracks.forEach((track: any, index: number) => {
                console.log(`🎤 [Caller] Local audio track ${index + 1}:`, {
                  id: track.id,
                  enabled: track.enabled,
                  readyState: track.readyState,
                });
                try {
                  const settings = track.getSettings();
                  const settingsInfo: any = {};
                  if (settings.sampleRate !== undefined)
                    settingsInfo.sampleRate = settings.sampleRate;
                  if (settings.channelCount !== undefined)
                    settingsInfo.channelCount = settings.channelCount;
                  if (Object.keys(settingsInfo).length > 0) {
                    console.log(
                      `🎤 [Caller] Local audio track ${index + 1} settings:`,
                      settingsInfo,
                    );
                  } else {
                    console.log(
                      `🎤 [Caller] Local audio track ${
                        index + 1
                      } settings: (not available - normal for React Native WebRTC)`,
                    );
                  }
                } catch {
                  // Settings might not be available
                }
              });
            } else {
              console.error(
                '❌ [Caller] WARNING: Local stream has no audio tracks!',
              );
            }
          },
          onRemoteStream: stream => {
            console.log('✅ Remote stream received by caller');
            setRemote(stream);
            remoteStreamRef.current = stream;
            // 🔎 Step 3: Verify Remote Audio Tracks
            const audioTracks = stream.getAudioTracks();
            console.log(
              '🔎 [Caller] Remote stream audio tracks count:',
              audioTracks.length,
            );
            if (audioTracks.length === 0) {
              console.error(
                '❌ [Caller] WARNING: Remote stream has no audio tracks!',
              );
            } else {
              audioTracks.forEach((track: any, index: number) => {
                track.enabled = true;
                console.log(`🔎 [Caller] Remote audio track ${index + 1}:`, {
                  id: track.id,
                  enabled: track.enabled,
                  readyState: track.readyState,
                });
                try {
                  const settings = track.getSettings();
                  const settingsInfo: any = {};
                  if (settings.sampleRate !== undefined)
                    settingsInfo.sampleRate = settings.sampleRate;
                  if (settings.channelCount !== undefined)
                    settingsInfo.channelCount = settings.channelCount;
                  if (Object.keys(settingsInfo).length > 0) {
                    console.log(
                      `🔎 [Caller] Remote audio track ${index + 1} settings:`,
                      settingsInfo,
                    );
                  } else {
                    console.log(
                      `🔎 [Caller] Remote audio track ${
                        index + 1
                      } settings: (not available - normal for remote tracks)`,
                    );
                  }
                } catch {
                  // Settings might not be available
                }
              });
            }
            // Ensure audio session is still active and configured for playback
            if (InCallManager) {
              try {
                // Start audio session with both recording and playback
                InCallManager.start({ media: 'audio', auto: true });
                InCallManager.setForceSpeakerphoneOn(false);
                // Respect mute state
                InCallManager.setMicrophoneMute(isMutedRef.current);
                // Force audio route to earpiece for phone calls
                InCallManager.setSpeakerphoneOn(false);
                if (__DEV__) {
                  console.log(
                    '✅ [Caller] Audio session refreshed on remote stream',
                  );
                  console.log(
                    '🔊 [Caller] Ensuring remote audio tracks are enabled and playing',
                  );
                }
                // Explicitly ensure all remote audio tracks are enabled
                audioTracks.forEach((track: any) => {
                  if (track) {
                    track.enabled = true;
                    // Note: muted is a read-only property, we can only control enabled
                  }
                });
              } catch (error: any) {
                console.warn(
                  '⚠️ [Caller] Error refreshing audio session:',
                  error.message,
                );
              }
            }
          },
          onIce: (c: any) => {
            console.log('🧊 Sending ICE candidate from caller');
            addIceCandidate(callId, callerId, c);
          },
        });
        pcRef.current = pc;

        // Track disconnection timeout to allow recovery
        let disconnectTimeout: any = null;
        let wasConnected = false;

        // Monitor connection state to ensure audio is configured when connected
        pc.addEventListener('connectionstatechange', () => {
          const state = pc.connectionState;
          console.log('🔌 [Caller] Connection state:', state);

          if (state === 'connected') {
            wasConnected = true;
            // Clear any pending disconnect timeout
            if (disconnectTimeout) {
              clearTimeout(disconnectTimeout);
              disconnectTimeout = null;
            }
            
            console.log('✅ [Caller] ✅✅✅ CONNECTION ESTABLISHED ✅✅✅');

            // Ensure audio session is active when connected
            if (InCallManager && statusRef.current === 'active') {
              try {
                console.log(
                  '✅ [Caller] Connection established - ensuring audio session is active',
                );
                InCallManager.start({ media: 'audio', auto: true });
                InCallManager.setForceSpeakerphoneOn(false);
                InCallManager.setMicrophoneMute(isMutedRef.current);
                InCallManager.setSpeakerphoneOn(false);
                console.log(
                  '✅ [Caller] Audio session reconfigured on connection',
                );
              } catch (error: any) {
                console.warn(
                  '⚠️ [Caller] Error reconfiguring audio:',
                  error.message,
                );
              }
            }

            // Verify local and remote audio tracks are still active
            if (localStreamRef.current) {
              const localAudioTracks = localStreamRef.current.getAudioTracks();
              console.log(
                '🎤 [Caller] Local audio tracks on connection:',
                localAudioTracks.length,
              );
              localAudioTracks.forEach((t: any) => {
                t.enabled = true;
                console.log('🎤 [Caller] Local track:', {
                  id: t.id,
                  enabled: t.enabled,
                  readyState: t.readyState,
                });
              });
            }

            // Check remote stream if available and ensure audio is playing
            const remoteStream = remoteStreamRef.current;
            if (remoteStream) {
              const remoteAudioTracks = remoteStream.getAudioTracks();
              console.log(
                '🔊 [Caller] Remote audio tracks on connection:',
                remoteAudioTracks.length,
              );
              remoteAudioTracks.forEach((t: any) => {
                // Explicitly enable remote audio tracks
                t.enabled = true;
                // Note: muted is a read-only property, we can only control enabled
                console.log('🔊 [Caller] Remote track:', {
                  id: t.id,
                  enabled: t.enabled,
                  readyState: t.readyState,
                  muted: t.muted, // Read-only property
                });
              });
              console.log(
                '🔊 [Caller] All remote audio tracks enabled for playback',
              );
            }
          } else if (state === 'disconnected') {
            // Only log error if we were previously connected and it stays disconnected
            if (wasConnected) {
              console.warn(
                '⚠️ [Caller] Connection disconnected - waiting for recovery...',
              );
              // Give it 5 seconds to recover before treating as failure
              disconnectTimeout = setTimeout(() => {
                const currentState = pc.connectionState;
                if (currentState === 'disconnected' || currentState === 'failed') {
                  console.error(
                    '❌ [Caller] Connection failed after disconnection:',
                    currentState,
                  );
                  console.warn(
                    '⚠️ [Caller] Connection failure may be due to NAT traversal issues. TURN servers are required for devices behind firewalls/symmetric NATs.',
                  );
                }
              }, 5000);
            }
          } else if (state === 'failed') {
            console.error(
              '❌ [Caller] Connection failed:',
              state,
            );
            console.warn(
              '⚠️ [Caller] Connection failure may be due to NAT traversal issues. TURN servers are required for devices behind firewalls/symmetric NATs.',
            );
          }
        });

        // Track ICE disconnection to allow recovery and restart
        let iceDisconnectTimeout: any = null;
        let iceWasConnected = false;
        let iceRestartAttempted = false;

        // Helper function to restart ICE
        const attemptIceRestart = async () => {
          if (iceRestartAttempted || !pcRef.current) {
            return;
          }

          try {
            const peerConnection = pcRef.current;
            const signalingState = peerConnection.signalingState;
            
            // Only restart if in stable state
            if (signalingState !== 'stable') {
              console.log('⚠️ [Caller] Cannot restart ICE - signaling state:', signalingState);
              return;
            }

            iceRestartAttempted = true;
            console.log('🔄 [Caller] Attempting ICE restart...');
            
            // Create new offer with ICE restart
            const newOffer = await peerConnection.createOffer({ iceRestart: true });
            await peerConnection.setLocalDescription(newOffer);
            
            // Update call document with new offer
            const { updateDoc, doc } = require('firebase/firestore');
            const { firestore } = require('../../../lib/firebase');
            const ref = doc(firestore, 'calls', callId);
            
            const offerToStore = newOffer.toJSON
              ? newOffer.toJSON()
              : {
                  type: newOffer.type,
                  sdp: newOffer.sdp,
                };
            
            await updateDoc(ref, { offer: offerToStore });
            console.log('✅ [Caller] ICE restart - new offer created and sent');
          } catch (error: any) {
            console.error('❌ [Caller] ICE restart failed:', error.message);
            iceRestartAttempted = false; // Allow retry
          }
        };

        // Also monitor ICE connection state (separate from connection state)
        pc.addEventListener('iceconnectionstatechange', () => {
          const iceState = pc.iceConnectionState;
          console.log('🧊 [Caller] ICE connection state:', iceState);

          if (iceState === 'connected' || iceState === 'completed') {
            iceWasConnected = true;
            iceRestartAttempted = false; // Reset on successful connection
            // Clear any pending disconnect timeout
            if (iceDisconnectTimeout) {
              clearTimeout(iceDisconnectTimeout);
              iceDisconnectTimeout = null;
            }
            console.log('✅ [Caller] ✅✅✅ ICE CONNECTION ESTABLISHED ✅✅✅');
          } else if (iceState === 'disconnected') {
            // Only attempt recovery if we were previously connected
            if (iceWasConnected) {
              console.warn(
                '⚠️ [Caller] ICE connection disconnected - attempting recovery...',
              );
              // Clear any existing timeout
              if (iceDisconnectTimeout) {
                clearTimeout(iceDisconnectTimeout);
              }
              // Wait 2 seconds, then attempt ICE restart
              iceDisconnectTimeout = setTimeout(async () => {
                const currentIceState = pc.iceConnectionState;
                if (currentIceState === 'disconnected' || currentIceState === 'checking') {
                  // Attempt ICE restart
                  await attemptIceRestart();
                } else if (currentIceState === 'failed') {
                  console.error('❌ [Caller] ICE connection failed after disconnection');
                  console.warn(
                    '⚠️ [Caller] ICE failure likely due to NAT traversal. TURN servers are required for production use when devices are behind firewalls or symmetric NATs.',
                  );
                }
              }, 2000);
            }
          } else if (iceState === 'failed') {
            console.error('❌ [Caller] ICE connection failed');
            console.warn(
              '⚠️ [Caller] ICE failure likely due to NAT traversal. TURN servers are required for production use when devices are behind firewalls or symmetric NATs.',
            );
          }
        });

        console.log('📞 Creating call document...');
        await createCall(callId, {
          callerId,
          receiverId,
          type,
          offer: localDescription,
        });

        // Create in-app notification for receiver
        try {
          let callerName = callerNameDefault;
          let callerAvatar = callerAvatarDefault;

          if (!callerName || callerName === 'Someone' || !callerAvatar) {
            try {
              const callerData = await UserService.getUserById(callerId);
              if (callerData) {
                callerName =
                  callerData.name || callerData.displayName || callerName;
                callerAvatar =
                  callerAvatar ||
                  callerData.profileImage ||
                  callerData.avatarUrl ||
                  callerData.avatar ||
                  '';
              }
            } catch (callerInfoError) {
              console.warn(
                '⚠️ Failed to fetch caller info for notification:',
                callerInfoError,
              );
            }
          }

          await NotificationStorage.createNotification({
            userId: receiverId,
            type: 'call',
            category: 'call',
            title: callerName || 'Incoming call',
            message: `${callerName || 'Someone'} is calling you`,
            data: {
              callId,
              callerId,
              receiverId,
              callType: type,
            },
            senderId: callerId,
            senderName: callerName || 'Someone',
            senderAvatar: callerAvatar || '',
          });
        } catch (notifError) {
          console.warn('⚠️ Failed to create call notification:', notifError);
        }

        // Send push notification to receiver
        try {
          const { api } = require('../../../lib/fetcher');
          await api.post('/notifications/send-call', {
            callId,
            callerId,
            receiverId,
            callType: type,
          });
          console.log('✅ Call notification sent to receiver');
        } catch (error) {
          console.warn('⚠️ Failed to send call notification:', error);
          // Don't block call creation if notification fails
        }

        unsubCall = listenCall(callId, async data => {
          const callStatus = data.status;
          setStatus(callStatus);
          statusRef.current = callStatus;

          // Only apply answer if call is still active (not ended/missed)
          if (
            data.answer &&
            pcRef.current &&
            callStatus !== 'ended' &&
            callStatus !== 'missed'
          ) {
            try {
              console.log('📞 Caller: Received answer, applying...');
              await applyAnswer(pcRef.current, data.answer);
              console.log('✅ Caller: Answer applied successfully');

              // Fetch and process existing ICE candidates from receiver
              // Wait a bit for the answer to be fully applied
              setTimeout(async () => {
                try {
                  console.log(
                    '📥 [Caller] Fetching existing ICE candidates from Firestore...',
                  );
                  const existingCandidates = await getExistingCandidates(
                    callId,
                  );
                  console.log(
                    '📥 [Caller] Found',
                    existingCandidates.length,
                    'existing ICE candidates',
                  );

                  if (existingCandidates.length === 0) {
                    console.log(
                      '📊 [Caller] No existing ICE candidates to process',
                    );
                  } else {
                    const myId = callerId;
                    const processedIds = new Set<string>();
                    let processedCount = 0;
                    let skippedCount = 0;
                    let errorCount = 0;

                    for (const c of existingCandidates) {
                      if (c.senderId === myId) {
                        skippedCount++;
                        continue; // Skip own candidates
                      }
                      const candidateKey = `${c.senderId}-${JSON.stringify(
                        c.candidate,
                      )}`;
                      if (processedIds.has(candidateKey)) {
                        skippedCount++;
                        continue; // Skip duplicates
                      }
                      try {
                        await addRemoteIce(pcRef.current, c.candidate);
                        console.log(
                          `✅ [Caller] Processed existing ICE candidate ${
                            processedCount + 1
                          } from:`,
                          c.senderId,
                        );
                        processedIds.add(candidateKey);
                        processedCount++;
                      } catch (error: any) {
                        console.error(
                          `❌ [Caller] Error processing existing ICE candidate from ${c.senderId}:`,
                          error.message || error,
                        );
                        errorCount++;
                      }
                    }

                    console.log(
                      `📊 [Caller] ICE candidate processing summary: ${processedCount} processed, ${skippedCount} skipped (self/duplicates), ${errorCount} errors`,
                    );
                  }

                  // Log connection state after processing candidates
                  console.log(
                    '🔌 [Caller] Connection state after processing ICE candidates:',
                    {
                      connectionState: pcRef.current.connectionState,
                      iceConnectionState: pcRef.current.iceConnectionState,
                    },
                  );
                } catch (error: any) {
                  console.error(
                    '❌ [Caller] Error fetching existing ICE candidates:',
                    error.message || error,
                  );
                }
              }, 500);
            } catch (error: any) {
              // Safely extract error message
              let errorMessage = '';
              try {
                if (error) {
                  if (typeof error === 'string') {
                    errorMessage = error;
                  } else if (typeof error === 'object') {
                    if (error.message && typeof error.message === 'string') {
                      errorMessage = error.message;
                    } else if (
                      error.toString &&
                      typeof error.toString === 'function'
                    ) {
                      try {
                        errorMessage = error.toString();
                      } catch {
                        errorMessage = 'Error object';
                      }
                    } else {
                      errorMessage = 'Error applying answer';
                    }
                  } else {
                    errorMessage = String(error);
                  }
                }
              } catch {
                errorMessage = 'Unknown error occurred';
              }

              // Ignore errors related to wrong state or closed connection
              // These can happen if the call ends while processing the answer
              if (
                errorMessage.includes('wrong state') ||
                errorMessage.includes('stable') ||
                errorMessage.includes('closed') ||
                errorMessage.includes('InvalidStateError') ||
                errorMessage.includes('receiver')
              ) {
                console.warn(
                  '⚠️ Caller: Ignoring answer error - connection state issue:',
                  errorMessage,
                );
              } else {
                console.error(
                  '❌ Caller: Error applying answer:',
                  errorMessage,
                );
              }
            }
          }

          if (callStatus === 'ended' || callStatus === 'missed') {
            // Use reset to prevent showing verification screen again
            // Reset navigation stack directly to home screen based on role
            if (role === 'consultant') {
              navigation.reset({
                index: 0,
                routes: [{ name: 'ConsultantTabs' as never }],
              });
            } else {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' as never }],
              });
            }
          }
        });
      } else {
        // Receiver: Wait for user to accept/decline - don't auto-answer
        unsubCall = listenCall(callId, async data => {
          setStatus(data.status);
          statusRef.current = data.status;

          // Handle new offer (for ICE restart scenarios when call is already active)
          if (data.offer && pcRef.current && data.status === 'active') {
            try {
              const currentState = pcRef.current.signalingState;
              // Only apply if we're in a state that can accept a new offer
              if (currentState === 'stable' || currentState === 'have-local-answer') {
                console.log('📞 Receiver: Received new offer (ICE restart), applying...');
                await pcRef.current.setRemoteDescription(data.offer);
                const newAnswer = await pcRef.current.createAnswer({ iceRestart: true });
                await pcRef.current.setLocalDescription(newAnswer);
                
                // Update call document with new answer
                const answerToStore = newAnswer.toJSON
                  ? newAnswer.toJSON()
                  : {
                      type: newAnswer.type,
                      sdp: newAnswer.sdp,
                    };
                await answerCall(callId, answerToStore);
                console.log('✅ Receiver: New answer created and sent for ICE restart');
              }
            } catch (error: any) {
              console.error('❌ Receiver: Error handling new offer:', error.message);
            }
          }

          // Only setup peer connection when user accepts (status becomes 'active')
          // Don't auto-answer - wait for user to press accept button
          // The receiver will create peer when they press accept button

          if (data.status === 'ended' || data.status === 'missed') {
            // Use reset to prevent showing verification screen again
            // Reset navigation stack directly to home screen based on role
            if (role === 'consultant') {
              navigation.reset({
                index: 0,
                routes: [{ name: 'ConsultantTabs' as never }],
              });
            } else {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' as never }],
              });
            }
          }
        });
      }

      unsubCand = listenCandidates(callId, async c => {
        const myId = isCaller ? callerId : receiverId;
        const roleLabel = isCaller ? 'Caller' : 'Receiver';
        if (c.senderId !== myId) {
          if (pcRef.current) {
            console.log(
              `🧊 [${roleLabel}] Received ICE candidate from:`,
              c.senderId,
            );
            try {
              await addRemoteIce(pcRef.current, c.candidate);
              console.log(`✅ [${roleLabel}] ICE candidate added successfully`);
              // Log connection state after adding candidate
              console.log(
                `🔌 [${roleLabel}] Connection state after ICE candidate:`,
                {
                  connectionState: pcRef.current.connectionState,
                  iceConnectionState: pcRef.current.iceConnectionState,
                },
              );
            } catch (error: any) {
              console.error(
                `❌ [${roleLabel}] Error adding ICE candidate:`,
                error.message || error,
              );
            }
          } else {
            // Queue the candidate for later processing
            console.log(
              `📦 [${roleLabel}] Queueing ICE candidate (peer connection not ready yet) from:`,
              c.senderId,
            );
            iceCandidateQueueRef.current.push(c);
          }
        } else {
          console.log(
            `🧊 [${roleLabel}] Ignoring ICE candidate from self:`,
            c.senderId,
          );
        }
      });

      // auto-timeout if ringing > 30s
      hangTimer = setTimeout(() => {
        if (statusRef.current === 'ringing')
          endCall(callId, 'missed').catch(() => {});
      }, 30000);
    })();

    return () => {
      unsubCall && unsubCall();
      unsubCand && unsubCand();
      pcRef.current
        ?.getSenders()
        .forEach((s: any) => s.track && s.track.stop());
      pcRef.current?.close();
      clearTimeout(hangTimer);
    };
  }, [
    callId,
    isCaller,
    callerId,
    receiverId,
    navigation,
    type,
    role,
    callerNameDefault,
    callerAvatarDefault,
  ]);

  // Prevent back navigation while call is active
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Prevent back navigation - user must use hangup button
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => subscription.remove();
    }, []),
  );

  const handleHangup = async () => {
    if (callId) {
      if (isCaller) {
        // Caller cancels call
        await endCall(callId, 'ended').catch(() => {});
      } else {
        // Receiver declines call
        await endCall(callId, 'missed').catch(() => {});
      }
    }

    // Use reset to prevent showing verification screen again
    // Reset navigation stack directly to home screen based on role
    if (role === 'consultant') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'ConsultantTabs' as never }],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' as never }],
      });
    }
  };

  const handleAccept = async () => {
    console.log('🔘 [handleAccept] Accept button pressed', { callId, callerId, receiverId, hasPc: !!pcRef.current, status });
    
    if (!callId || !callerId || !receiverId) {
      console.error('❌ [handleAccept] Missing required parameters');
      return;
    }
    
    if (pcRef.current) {
      console.warn('⚠️ [handleAccept] Peer connection already exists - call may already be accepted');
      return;
    }

    // Create peer connection and answer the call
    try {
      console.log('📞 Accepting call...');

      // Get the call document to retrieve the offer
      const callDoc = await getCallOnce(callId);
      if (!callDoc.exists()) {
        console.error('Call document not found');
        return;
      }

      const callData = callDoc.data() as CallDocument;
      if (!callData.offer) {
        console.error('No offer found in call document');
        return;
      }

      console.log('📞 Creating peer connection for receiver...');

      // Start audio session BEFORE creating peer connection
      if (InCallManager) {
        try {
          InCallManager.start({ media: 'audio', auto: true });
          InCallManager.setForceSpeakerphoneOn(false);
          InCallManager.setMicrophoneMute(isMutedRef.current);
          InCallManager.setSpeakerphoneOn(false);
          if (__DEV__) {
            console.log(
              '✅ [Receiver] Audio session started before peer connection (configured for recording and playback)',
            );
          }
        } catch (error: any) {
          console.warn(
            '⚠️ [Receiver] Error starting audio session:',
            error.message,
          );
        }
      }

      const { pc, localDescription } = await createPeer({
        isCaller: false,
        audioOnly: true,
        onError: (error: string) => {
          console.error('❌ [Receiver] Peer connection error:', error);
          setConnectionError(error);
          Alert.alert(
            'Connection Failed',
            'Unable to establish connection. This usually happens when devices are on different networks.\n\n' +
              'To fix this, you need to configure a TURN server. See docs/TURN_SERVER_QUICK_SETUP.md for setup instructions.\n\n' +
              'Quick options:\n' +
              '• Use Twilio TURN (free tier available)\n' +
              '• Use Metered.ca paid TURN\n' +
              '• Self-host Coturn server',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Optionally navigate back or end call
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  }
                },
              },
            ],
            { cancelable: false },
          );
        },
        onLocalStream: stream => {
          console.log('✅ Local stream created for receiver');
          setLocal(stream);
          localStreamRef.current = stream;

          // 🎧 Step 1: Verify local audio track after stream creation
          const audioTracks = stream.getAudioTracks();
          console.log(
            '🎤 [Receiver] Local stream audio tracks count:',
            audioTracks.length,
          );
          if (audioTracks.length > 0) {
            audioTracks.forEach((track: any, index: number) => {
              console.log(`🎤 [Receiver] Local audio track ${index + 1}:`, {
                id: track.id,
                enabled: track.enabled,
                readyState: track.readyState,
              });
              try {
                const settings = track.getSettings();
                const settingsInfo: any = {};
                if (settings.sampleRate !== undefined)
                  settingsInfo.sampleRate = settings.sampleRate;
                if (settings.channelCount !== undefined)
                  settingsInfo.channelCount = settings.channelCount;
                if (Object.keys(settingsInfo).length > 0) {
                  console.log(
                    `🎤 [Receiver] Local audio track ${index + 1} settings:`,
                    settingsInfo,
                  );
                } else {
                  console.log(
                    `🎤 [Receiver] Local audio track ${
                      index + 1
                    } settings: (not available - normal for React Native WebRTC)`,
                  );
                }
              } catch {
                // Settings might not be available
              }
            });
          } else {
            console.error(
              '❌ [Receiver] WARNING: Local stream has no audio tracks!',
            );
          }
        },
        onRemoteStream: stream => {
          console.log('✅ Remote stream received by receiver');
          setRemote(stream);
            remoteStreamRef.current = stream;
          // 🔎 Step 3: Verify Remote Audio Tracks
          const audioTracks = stream.getAudioTracks();
          console.log(
            '🔎 [Receiver] Remote stream audio tracks count:',
            audioTracks.length,
          );
          if (audioTracks.length === 0) {
            console.error(
              '❌ [Receiver] WARNING: Remote stream has no audio tracks!',
            );
          } else {
            audioTracks.forEach((track: any, index: number) => {
              track.enabled = true;
              console.log(`🔎 [Receiver] Remote audio track ${index + 1}:`, {
                id: track.id,
                enabled: track.enabled,
                readyState: track.readyState,
              });
              try {
                const settings = track.getSettings();
                const settingsInfo: any = {};
                if (settings.sampleRate !== undefined)
                  settingsInfo.sampleRate = settings.sampleRate;
                if (settings.channelCount !== undefined)
                  settingsInfo.channelCount = settings.channelCount;
                if (Object.keys(settingsInfo).length > 0) {
                  console.log(
                    `🔎 [Receiver] Remote audio track ${index + 1} settings:`,
                    settingsInfo,
                  );
                } else {
                  console.log(
                    `🔎 [Receiver] Remote audio track ${
                      index + 1
                    } settings: (not available - normal for remote tracks)`,
                  );
                }
              } catch {
                // Settings might not be available
              }
            });
          }
          // Ensure audio session is still active and configured for playback
          if (InCallManager) {
            try {
              // Start audio session with both recording and playback
              InCallManager.start({ media: 'audio', auto: true });
              InCallManager.setForceSpeakerphoneOn(false);
              // Respect mute state
              InCallManager.setMicrophoneMute(isMutedRef.current);
              // Force audio route to earpiece for phone calls
              InCallManager.setSpeakerphoneOn(false);
              if (__DEV__) {
                console.log(
                  '✅ [Receiver] Audio session refreshed on remote stream',
                );
                console.log(
                  '🔊 [Receiver] Ensuring remote audio tracks are enabled and playing',
                );
              }
              // Explicitly ensure all remote audio tracks are enabled
              audioTracks.forEach((track: any) => {
                if (track) {
                  track.enabled = true;
                  // Note: muted is a read-only property, we can only control enabled
                }
              });
            } catch (error: any) {
              console.warn(
                '⚠️ [Receiver] Error refreshing audio session:',
                error.message,
              );
            }
          }
        },
        onIce: (c: any) => {
          console.log('🧊 Sending ICE candidate from receiver');
          addIceCandidate(callId, receiverId, c);
        },
        offerSdp: callData.offer,
      });

      pcRef.current = pc;

      // Process queued ICE candidates and fetch existing ones
      const processIceCandidates = async () => {
        const myId = receiverId;
        const processedIds = new Set<string>();

        // Process queued candidates
        console.log(
          `📦 [Receiver] Processing ${iceCandidateQueueRef.current.length} queued ICE candidates...`,
        );
        for (const c of iceCandidateQueueRef.current) {
          if (
            c.senderId !== myId &&
            !processedIds.has(`${c.senderId}-${JSON.stringify(c.candidate)}`)
          ) {
            try {
              await addRemoteIce(pc, c.candidate);
              console.log(
                `✅ [Receiver] Processed queued ICE candidate from:`,
                c.senderId,
              );
              processedIds.add(`${c.senderId}-${JSON.stringify(c.candidate)}`);
            } catch (error: any) {
              console.error(
                `❌ [Receiver] Error processing queued ICE candidate:`,
                error.message || error,
              );
            }
          }
        }
        iceCandidateQueueRef.current = [];

        // Fetch and process existing candidates from Firestore
        try {
          console.log(
            `📥 [Receiver] Fetching existing ICE candidates from Firestore...`,
          );
          const existingCandidates = await getExistingCandidates(callId);
          console.log(
            `📥 [Receiver] Found ${existingCandidates.length} existing ICE candidates`,
          );

          if (existingCandidates.length === 0) {
            console.log(`📊 [Receiver] No existing ICE candidates to process`);
          } else {
            let processedCount = 0;
            let skippedCount = 0;
            let errorCount = 0;

            for (const c of existingCandidates) {
              if (c.senderId === myId) {
                skippedCount++;
                continue; // Skip own candidates
              }
              const candidateKey = `${c.senderId}-${JSON.stringify(
                c.candidate,
              )}`;
              if (processedIds.has(candidateKey)) {
                skippedCount++;
                continue; // Skip duplicates
              }
              try {
                await addRemoteIce(pc, c.candidate);
                console.log(
                  `✅ [Receiver] Processed existing ICE candidate ${
                    processedCount + 1
                  } from:`,
                  c.senderId,
                );
                processedIds.add(candidateKey);
                processedCount++;
              } catch (error: any) {
                console.error(
                  `❌ [Receiver] Error processing existing ICE candidate from ${c.senderId}:`,
                  error.message || error,
                );
                errorCount++;
              }
            }
            console.log(
              `📊 [Receiver] ICE candidate processing summary: ${processedCount} processed, ${skippedCount} skipped (self/duplicates), ${errorCount} errors`,
            );
          }
        } catch (error: any) {
          console.error(
            `❌ [Receiver] Error fetching existing ICE candidates:`,
            error.message || error,
          );
        }

        // Log connection state after processing all candidates
        console.log(
          `🔌 [Receiver] Connection state after processing ICE candidates:`,
          {
            connectionState: pc.connectionState,
            iceConnectionState: pc.iceConnectionState,
          },
        );
      };

      // Process candidates after a short delay to ensure peer connection is fully initialized
      setTimeout(() => {
        processIceCandidates();
      }, 500);

      // Track disconnection timeout to allow recovery
      let disconnectTimeout: any = null;
      let wasConnected = false;

      // Monitor connection state to ensure audio is configured when connected
      pc.addEventListener('connectionstatechange', () => {
        const state = pc.connectionState;
        console.log('🔌 [Receiver] Connection state:', state);

        if (state === 'connected') {
          wasConnected = true;
          // Clear any pending disconnect timeout
          if (disconnectTimeout) {
            clearTimeout(disconnectTimeout);
            disconnectTimeout = null;
          }
          
          console.log('✅ [Receiver] ✅✅✅ CONNECTION ESTABLISHED ✅✅✅');

          // Ensure audio session is active when connected
          if (InCallManager && status === 'active') {
            try {
              console.log(
                '✅ [Receiver] Connection established - ensuring audio session is active',
              );
              InCallManager.start({ media: 'audio', auto: true });
              InCallManager.setForceSpeakerphoneOn(false);
              InCallManager.setMicrophoneMute(isMutedRef.current);
              InCallManager.setSpeakerphoneOn(false);
              console.log(
                '✅ [Receiver] Audio session reconfigured on connection',
              );
            } catch (error: any) {
              console.warn(
                '⚠️ [Receiver] Error reconfiguring audio:',
                error.message,
              );
            }
          }

          // Verify local and remote audio tracks are still active
          if (localStreamRef.current) {
            const localAudioTracks = localStreamRef.current.getAudioTracks();
            console.log(
              '🎤 [Receiver] Local audio tracks on connection:',
              localAudioTracks.length,
            );
            localAudioTracks.forEach((t: any) => {
              t.enabled = true;
              console.log('🎤 [Receiver] Local track:', {
                id: t.id,
                enabled: t.enabled,
                readyState: t.readyState,
              });
            });
          }

          // Check remote stream if available and ensure audio is playing
          // Note: _remote state might not be updated yet, so we'll also check in useEffect
          setTimeout(() => {
            const remoteStream = remoteStreamRef.current;
            if (remoteStream) {
              const remoteAudioTracks = remoteStream.getAudioTracks();
              console.log(
                '🔊 [Receiver] Remote audio tracks on connection:',
                remoteAudioTracks.length,
              );
              remoteAudioTracks.forEach((t: any) => {
                t.enabled = true;
                // Note: muted is a read-only property, we can only control enabled
                console.log('🔊 [Receiver] Remote track:', {
                  id: t.id,
                  enabled: t.enabled,
                  readyState: t.readyState,
                  muted: t.muted, // Read-only property
                });
              });
              console.log(
                '🔊 [Receiver] All remote audio tracks enabled for playback',
              );
            }
          }, 500);
        } else if (state === 'disconnected') {
          // Only log error if we were previously connected and it stays disconnected
          if (wasConnected) {
            console.warn(
              '⚠️ [Receiver] Connection disconnected - waiting for recovery...',
            );
            // Give it 5 seconds to recover before treating as failure
            disconnectTimeout = setTimeout(() => {
              const currentState = pc.connectionState;
              if (currentState === 'disconnected' || currentState === 'failed') {
                console.error(
                  '❌ [Receiver] Connection failed after disconnection:',
                  currentState,
                );
                console.warn(
                  '⚠️ [Receiver] Connection failure may be due to NAT traversal issues. TURN servers are required for devices behind firewalls/symmetric NATs.',
                );
              }
            }, 5000);
          }
        } else if (state === 'failed') {
          console.error(
            '❌ [Receiver] Connection failed:',
            state,
          );
          console.warn(
            '⚠️ [Receiver] Connection failure may be due to NAT traversal issues. TURN servers are required for devices behind firewalls/symmetric NATs.',
          );
        }
      });

      // Track ICE disconnection to allow recovery and restart
      let iceDisconnectTimeout: any = null;
      let iceWasConnected = false;
      let iceRestartAttempted = false;

      // Helper function to restart ICE
      const attemptIceRestart = async () => {
        if (iceRestartAttempted || !pcRef.current) {
          return;
        }

        try {
          const peerConnection = pcRef.current;
          const signalingState = peerConnection.signalingState;
          
          // Only restart if in stable state
          if (signalingState !== 'stable') {
            console.log('⚠️ [Receiver] Cannot restart ICE - signaling state:', signalingState);
            return;
          }

          iceRestartAttempted = true;
          console.log('🔄 [Receiver] Attempting ICE restart...');
          
          // Create new answer with ICE restart
          const newAnswer = await peerConnection.createAnswer({ iceRestart: true });
          await peerConnection.setLocalDescription(newAnswer);
          
          // Update call document with new answer
          const answerToStore = newAnswer.toJSON
            ? newAnswer.toJSON()
            : {
                type: newAnswer.type,
                sdp: newAnswer.sdp,
              };
          
          await answerCall(callId, answerToStore);
          console.log('✅ [Receiver] ICE restart - new answer created and sent');
        } catch (error: any) {
          console.error('❌ [Receiver] ICE restart failed:', error.message);
          iceRestartAttempted = false; // Allow retry
        }
      };

      // Also monitor ICE connection state (separate from connection state)
      pc.addEventListener('iceconnectionstatechange', () => {
        const iceState = pc.iceConnectionState;
        console.log('🧊 [Receiver] ICE connection state:', iceState);

        if (iceState === 'connected' || iceState === 'completed') {
          iceWasConnected = true;
          iceRestartAttempted = false; // Reset on successful connection
          // Clear any pending disconnect timeout
          if (iceDisconnectTimeout) {
            clearTimeout(iceDisconnectTimeout);
            iceDisconnectTimeout = null;
          }
          console.log('✅ [Receiver] ✅✅✅ ICE CONNECTION ESTABLISHED ✅✅✅');
        } else if (iceState === 'disconnected') {
          // Only attempt recovery if we were previously connected
          if (iceWasConnected) {
            console.warn(
              '⚠️ [Receiver] ICE connection disconnected - attempting recovery...',
            );
            // Clear any existing timeout
            if (iceDisconnectTimeout) {
              clearTimeout(iceDisconnectTimeout);
            }
            // Wait 2 seconds, then attempt ICE restart
            iceDisconnectTimeout = setTimeout(async () => {
              const currentIceState = pc.iceConnectionState;
              if (currentIceState === 'disconnected' || currentIceState === 'checking') {
                // Attempt ICE restart
                await attemptIceRestart();
              } else if (currentIceState === 'failed') {
                console.error('❌ [Receiver] ICE connection failed after disconnection');
                console.warn(
                  '⚠️ [Receiver] ICE failure likely due to NAT traversal. TURN servers are required for production use when devices are behind firewalls or symmetric NATs.',
                );
              }
            }, 2000);
          }
        } else if (iceState === 'failed') {
          console.error('❌ [Receiver] ICE connection failed');
          console.warn(
            '⚠️ [Receiver] ICE failure likely due to NAT traversal. TURN servers are required for production use when devices are behind firewalls or symmetric NATs.',
          );
        }
      });

      console.log('📞 Answering call...');
      // Serialize the answer for Firestore storage
      const answerToStore = localDescription.toJSON
        ? localDescription.toJSON()
        : {
            type: localDescription.type,
            sdp: localDescription.sdp,
          };
      await answerCall(callId, answerToStore);
      setStatus('active');
      statusRef.current = 'active';
      console.log('✅ Call accepted successfully');
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      await endCall(callId, 'missed').catch(() => {});
      // Use reset to prevent showing verification screen again
      if (role === 'consultant') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ConsultantTabs' as never }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' as never }],
        });
      }
    }
  };

  const handleMute = () => {
    if (!localStreamRef.current) return;

    const audioTracks = localStreamRef.current.getAudioTracks();
    const newMutedState = !isMuted;

    // Update WebRTC audio tracks
    audioTracks.forEach((track: any) => {
      track.enabled = !newMutedState;
      console.log(
        `🎤 [Mute] Audio track ${track.id}: enabled=${!newMutedState}`,
      );
    });

    // Sync with InCallManager
    if (InCallManager) {
      try {
        InCallManager.setMicrophoneMute(newMutedState);
        console.log(
          `🎤 [Mute] InCallManager microphone muted: ${newMutedState}`,
        );
      } catch (error: any) {
        console.warn(
          '⚠️ [Mute] Error setting InCallManager mute state:',
          error.message,
        );
      }
    }

    setIsMuted(newMutedState);
    isMutedRef.current = newMutedState;
    console.log(`🎤 [Mute] Mute state changed to: ${newMutedState}`);
  };

  // 📱 Step 2: Verify InCallManager Session Starts
  useEffect(() => {
    const callActive = status === 'active' && pcRef.current;

    if (callActive) {
      // Check if InCallManager is available
      if (!InCallManager) {
        if (__DEV__) {
          console.warn(
            '⚠️ [InCallManager] Native module not available - audio session management disabled',
          );
          console.warn(
            '⚠️ [InCallManager] Run: cd ios && pod install && cd .. && npm run ios',
          );
        }
        return;
      }

      // Start audio session when call becomes active
      try {
        console.log('✅ [InCallManager] Starting audio session...');
        InCallManager.start({ media: 'audio', auto: true });
        // Use earpiece (receiver) by default for audio calls, user can toggle if needed
        InCallManager.setForceSpeakerphoneOn(false);
        InCallManager.setMicrophoneMute(isMutedRef.current);
        InCallManager.setSpeakerphoneOn(false);
        if (__DEV__) {
          console.log(
            '✅ [InCallManager] Audio session started (earpiece mode, recording and playback enabled)',
          );
          console.log('✅ [InCallManager] Audio route should be: earpiece');
        }
      } catch (error: any) {
        console.error(
          '❌ [InCallManager] Error starting audio session:',
          error.message || error,
        );
      }
    } else {
      // Stop audio session when call is not active
      if (InCallManager) {
        try {
          InCallManager.stop();
          if (__DEV__) {
            console.log('🛑 [InCallManager] Stopped audio session');
          }
        } catch (error: any) {
          console.error(
            '❌ [InCallManager] Error stopping audio session:',
            error.message || error,
          );
        }
      }
    }

    return () => {
      // Cleanup: Stop audio session when component unmounts
      if (InCallManager && callActive) {
        try {
          InCallManager.stop();
          if (__DEV__) {
            console.log('🛑 [InCallManager] Audio session stopped (cleanup)');
          }
        } catch (error: any) {
          console.error(
            '❌ [InCallManager] Error stopping audio session:',
            error.message || error,
          );
        }
      }
    };
  }, [status]);

  // Monitor remote stream and connection state for audio verification and playback
  useEffect(() => {
    const remoteStream = remoteStreamRef.current;
    if (status === 'active' && remoteStream && pcRef.current) {
      const pc = pcRef.current;

      // Check connection state periodically to ensure audio is playing
      const checkAudioPlayback = () => {
        const connectionState = pc.connectionState;
        const iceConnectionState = pc.iceConnectionState;

        // Only proceed if connection is established
        if (
          connectionState === 'connected' &&
          (iceConnectionState === 'connected' ||
            iceConnectionState === 'completed')
        ) {
          // Ensure audio session is properly configured
          if (InCallManager) {
            try {
              InCallManager.start({ media: 'audio', auto: true });
              InCallManager.setForceSpeakerphoneOn(false);
              InCallManager.setMicrophoneMute(isMutedRef.current);
              InCallManager.setSpeakerphoneOn(false);
            } catch (error: any) {
              console.warn(
                '⚠️ [Audio Playback] Error configuring audio session:',
                error.message,
              );
            }
          }

          // Ensure all remote audio tracks are enabled and unmuted
          const remoteAudioTracks = remoteStream.getAudioTracks();
          if (remoteAudioTracks.length > 0) {
            let audioConfigured = false;
            remoteAudioTracks.forEach((track: any) => {
              if (track) {
                if (!track.enabled) {
                  track.enabled = true;
                  // Note: muted is a read-only property, we can only control enabled
                  audioConfigured = true;
                }
              }
            });
            if (audioConfigured && __DEV__) {
              console.log(
                `🔊 [Audio Playback] ${remoteAudioTracks.length} remote audio track(s) enabled for playback`,
              );
            }
          }
        }
      };

      // Check immediately
      checkAudioPlayback();

      // Check periodically (every 2 seconds) to ensure audio stays enabled
      const interval = setInterval(checkAudioPlayback, 2000);

      return () => clearInterval(interval);
    }
  }, [status]);

  // Original monitoring code
  useEffect(() => {
    const remoteStream = remoteStreamRef.current;
    if (status === 'active' && remoteStream && pcRef.current) {
      const pc = pcRef.current;
      const connectionState = pc.connectionState;
      const iceConnectionState = pc.iceConnectionState;
      const roleLabel = isCaller ? 'Caller' : 'Receiver';

      console.log(`🔍 [${roleLabel}] [Audio Check] Connection status:`, {
        connectionState,
        iceConnectionState,
        hasRemoteStream: !!remoteStream,
        remoteAudioTracks: remoteStream ? remoteStream.getAudioTracks().length : 0,
        hasLocalStream: !!localStreamRef.current,
        localAudioTracks: localStreamRef.current?.getAudioTracks().length || 0,
      });

      // Verify remote audio tracks
      const remoteAudioTracks = remoteStream.getAudioTracks();
      if (remoteAudioTracks.length > 0) {
        remoteAudioTracks.forEach((track: any, index: number) => {
          console.log(
            `🔊 [${roleLabel}] [Audio Check] Remote track ${index + 1}:`,
            {
              id: track.id,
              enabled: track.enabled,
              readyState: track.readyState,
              muted: track.muted,
            },
          );
        });
      } else {
        console.warn(
          `⚠️ [${roleLabel}] [Audio Check] No remote audio tracks found!`,
        );
      }

      // Verify local audio tracks
      if (localStreamRef.current) {
        const localAudioTracks = localStreamRef.current.getAudioTracks();
        if (localAudioTracks.length > 0) {
          localAudioTracks.forEach((track: any, index: number) => {
            console.log(
              `🎤 [${roleLabel}] [Audio Check] Local track ${index + 1}:`,
              {
                id: track.id,
                enabled: track.enabled,
                readyState: track.readyState,
                muted: track.muted,
              },
            );
          });
        } else {
          console.warn(
            `⚠️ [${roleLabel}] [Audio Check] No local audio tracks found!`,
          );
        }
      }

      // Warn if connection is in an unexpected state (but not "new" which is normal initially)
      if (
        connectionState !== 'connected' &&
        connectionState !== 'connecting' &&
        connectionState !== 'new'
      ) {
        console.warn(
          `⚠️ [${roleLabel}] Connection state is not connected/connecting/new:`,
          connectionState,
        );
      }
      if (
        iceConnectionState !== 'connected' &&
        iceConnectionState !== 'completed' &&
        iceConnectionState !== 'checking' &&
        iceConnectionState !== 'new'
      ) {
        console.warn(
          `⚠️ [${roleLabel}] ICE connection state is not connected/completed/checking/new:`,
          iceConnectionState,
        );
      }
    }
  }, [status, isCaller, connectionError, navigation]);

  // Periodic connection state check (every 2 seconds) to monitor connection progress
  useEffect(() => {
    if (status === 'active' && pcRef.current) {
      const roleLabel = isCaller ? 'Caller' : 'Receiver';
      const interval = setInterval(() => {
        const pc = pcRef.current;
        if (pc) {
          const connectionState = pc.connectionState;
          const iceConnectionState = pc.iceConnectionState;

          // Only log if state changes or if stuck in connecting/checking for a while
          if (connectionState === 'connecting' || connectionState === 'new') {
            console.log(
              `⏱️ [${roleLabel}] Connection still ${connectionState}, ICE: ${iceConnectionState}`,
            );
          }

          if (
            iceConnectionState === 'checking' ||
            iceConnectionState === 'new'
          ) {
            console.log(
              `⏱️ [${roleLabel}] ICE still ${iceConnectionState}, Connection: ${connectionState}`,
            );
          }

          // Log if connection fails
          if (
            connectionState === 'failed' ||
            connectionState === 'disconnected'
          ) {
            console.error(
              `❌ [${roleLabel}] Connection failed:`,
              connectionState,
            );
            console.warn(
              `⚠️ [${roleLabel}] Connection failure may be due to NAT traversal issues. TURN servers are required for devices behind firewalls/symmetric NATs.`,
            );
            clearInterval(interval);

            // Show user-friendly error alert (only once)
            if (!connectionError) {
              setConnectionError(
                'Connection failed. This may be due to network restrictions.',
              );
              Alert.alert(
                'Connection Failed',
                'Unable to establish connection. This may be due to network issues or firewall restrictions. Please try again or check your network connection.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Optionally navigate back
                      if (navigation.canGoBack()) {
                        navigation.goBack();
                      }
                    },
                  },
                ],
                { cancelable: false },
              );
            }
          }

          if (iceConnectionState === 'failed') {
            console.error(
              `❌ [${roleLabel}] ICE connection failed:`,
              iceConnectionState,
            );
            console.warn(
              `⚠️ [${roleLabel}] ICE failure likely due to NAT traversal. TURN servers are required for production use when devices are behind firewalls or symmetric NATs.`,
            );
            clearInterval(interval);

            // Show user-friendly error alert (only once)
            if (!connectionError) {
              setConnectionError(
                'ICE connection failed. TURN servers may be required.',
              );
              Alert.alert(
                'Connection Failed',
                'Unable to establish connection. This may be due to network issues or firewall restrictions. Please try again or check your network connection.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Optionally navigate back
                      if (navigation.canGoBack()) {
                        navigation.goBack();
                      }
                    },
                  },
                ],
                { cancelable: false },
              );
            }
          }

          // Stop checking if connected
          if (
            connectionState === 'connected' &&
            (iceConnectionState === 'connected' ||
              iceConnectionState === 'completed')
          ) {
            console.log(`✅ [${roleLabel}] Connection fully established!`);
            clearInterval(interval);
          }
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [status, isCaller, connectionError, navigation]);

  // Listen for audio route changes (for debugging)
  useEffect(() => {
    // 📱 Step 2: Listen to audio route changes (for debugging)
    // Note: This feature may not be available in all versions of react-native-incall-manager
    if (status === 'active' && InCallManager && __DEV__) {
      try {
        // Check if addListener method exists
        if (typeof InCallManager.addListener === 'function') {
          const subscription = InCallManager.addListener(
            'onAudioRouteChange',
            (data: any) => {
              console.log('📱 [InCallManager] Audio route changed:', data);
              // Expected: Audio route changed: { name: 'Speaker' } or { name: 'Earpiece' }
            },
          );

          // Also try to get current audio route if available
          try {
            if (typeof InCallManager.getAudioRoute === 'function') {
              const currentRoute = InCallManager.getAudioRoute();
              console.log(
                '📱 [InCallManager] Current audio route:',
                currentRoute,
              );
            }
          } catch {
            // getAudioRoute might not be available in all versions
          }

          return () => {
            if (subscription && typeof subscription.remove === 'function') {
              subscription.remove();
            }
          };
        }
        // Silently skip if addListener is not available - this is optional debug functionality
      } catch (error: any) {
        // Silently fail - audio route listener is optional debug feature
        if (__DEV__) {
          console.warn(
            '⚠️ [InCallManager] Could not set up audio route listener:',
            error.message,
          );
        }
      }
    }
    return () => {};
  }, [status]);

  return (
    <View style={callingStyles.videoCallContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      {/* Black background with profile picture centered */}
      <View style={[callingStyles.mainVideoFeed, { backgroundColor: COLORS.black, justifyContent: 'center', alignItems: 'center' }]}>
        {isLoadingUser ? (
          <ActivityIndicator size="large" color={COLORS.white} />
        ) : (
          <>
            <Image
              source={{
                uri:
                  otherUser?.profileImage || 'https://via.placeholder.com/150',
              }}
              style={callingStyles.profileImage}
            />
            <Text style={callingStyles.name}>
              {otherUser?.name || 'Unknown'}
            </Text>
          </>
        )}
      </View>

      {/* User info overlay at top - matching video call screen */}
      {otherUser && (
        <View style={{ position: 'absolute', top: insets.top + 20, left: 20, right: 20, zIndex: 5 }}>
          <Text style={{ color: COLORS.white, fontSize: 24, fontWeight: 'bold' }}>
            {otherUser.name}
          </Text>
          <Text style={{ color: COLORS.white, fontSize: 14, marginTop: 4 }}>
            {status === 'ringing' ? 'Ringing...' : status === 'active' ? 'In Call' : status}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View
        style={[
          callingStyles.bottomControls,
          { bottom: insets.bottom + 20 },
        ]}
      >
        {!isCaller && status === 'ringing' ? (
          // Receiver: Show Accept and Decline buttons
          <>
            <TouchableOpacity
              style={[callingStyles.controlButton, callingStyles.videoDeclineButton]}
              onPress={handleHangup}
            >
              <Phone
                size={28}
                color={COLORS.white}
                style={{ transform: [{ rotate: '135deg' }] }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[callingStyles.controlButton, callingStyles.videoAcceptButton]}
              onPress={handleAccept}
            >
              <Phone size={28} color={COLORS.white} />
            </TouchableOpacity>
          </>
        ) : (
          // Caller or active call: Show normal controls
          <>
            <TouchableOpacity
              style={[
                callingStyles.controlButton,
                callingStyles.videoHangupButton,
              ]}
              onPress={handleHangup}
            >
              <Phone
                size={24}
                color={COLORS.white}
                style={{ transform: [{ rotate: '135deg' }] }}
              />
            </TouchableOpacity>
            {status === 'active' && (
              <TouchableOpacity
                style={callingStyles.controlButton}
                onPress={handleMute}
              >
                {isMuted ? (
                  <MicOff size={24} color={COLORS.black} />
                ) : (
                  <Mic size={24} color={COLORS.black} />
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default CallingScreen;
