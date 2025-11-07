import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, BackHandler, Alert } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Phone, Mic, MicOff, Camera } from 'lucide-react-native';
// Safely import InCallManager - may not be available until native module is linked
let InCallManager: any = null;
try {
  InCallManager = require('react-native-incall-manager').default;
} catch (error) {
  if (__DEV__) {
    console.log('ℹ️ [InCallManager] Native module not linked yet - run pod install and rebuild');
  }
}
import { COLORS } from '../../../constants/core/colors';
import { callingStyles } from '../../../constants/styles/callingStyles';
import { createPeer, applyAnswer, addRemoteIce } from '../../../webrtc/peer';
import { addIceCandidate, answerCall, createCall, endCall, listenCall, listenCandidates, getCallOnce, getExistingCandidates, type CallDocument } from '../../../services/call.service';
import { UserService } from '../../../services/user.service';
import { useAuth } from '../../../contexts/AuthContext';

const CallingScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  
  // State for mute and video
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<'ringing' | 'active' | 'ended' | 'missed'>('ringing');
  const [_local, setLocal] = useState<any | null>(null);
  const [_remote, setRemote] = useState<any | null>(null);
  const [otherUser, setOtherUser] = useState<{ name: string; profileImage?: string } | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const pcRef = useRef<any | null>(null);
  const localStreamRef = useRef<any | null>(null);
  const statusRef = useRef<'ringing' | 'active' | 'ended' | 'missed'>('ringing');
  const iceCandidateQueueRef = useRef<Array<{ senderId: string; candidate: any }>>([]);
  const isMutedRef = useRef<boolean>(false);
  const { callId, isCaller, callerId, receiverId } = route?.params || {};
  const type: 'audio' = 'audio';

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
              console.log('✅ [Caller] Audio session started before peer connection (configured for recording and playback)');
            }
          } catch (error: any) {
            console.warn('⚠️ [Caller] Error starting audio session:', error.message);
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
              { cancelable: false }
            );
          },
          onLocalStream: (stream) => {
            console.log('✅ Local stream created for caller');
            setLocal(stream);
            localStreamRef.current = stream;
            
            // 🎧 Step 1: Verify local audio track after stream creation
            const audioTracks = stream.getAudioTracks();
            console.log('🎤 [Caller] Local stream audio tracks count:', audioTracks.length);
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
                  if (settings.sampleRate !== undefined) settingsInfo.sampleRate = settings.sampleRate;
                  if (settings.channelCount !== undefined) settingsInfo.channelCount = settings.channelCount;
                  if (Object.keys(settingsInfo).length > 0) {
                    console.log(`🎤 [Caller] Local audio track ${index + 1} settings:`, settingsInfo);
                  } else {
                    console.log(`🎤 [Caller] Local audio track ${index + 1} settings: (not available - normal for React Native WebRTC)`);
                  }
                } catch (e) {
                  // Settings might not be available
                }
              });
            } else {
              console.error('❌ [Caller] WARNING: Local stream has no audio tracks!');
            }
          },
          onRemoteStream: (stream) => {
            console.log('✅ Remote stream received by caller');
            setRemote(stream);
            // 🔎 Step 3: Verify Remote Audio Tracks
            const audioTracks = stream.getAudioTracks();
            console.log('🔎 [Caller] Remote stream audio tracks count:', audioTracks.length);
            if (audioTracks.length === 0) {
              console.error('❌ [Caller] WARNING: Remote stream has no audio tracks!');
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
                  if (settings.sampleRate !== undefined) settingsInfo.sampleRate = settings.sampleRate;
                  if (settings.channelCount !== undefined) settingsInfo.channelCount = settings.channelCount;
                  if (Object.keys(settingsInfo).length > 0) {
                    console.log(`🔎 [Caller] Remote audio track ${index + 1} settings:`, settingsInfo);
                  } else {
                    console.log(`🔎 [Caller] Remote audio track ${index + 1} settings: (not available - normal for remote tracks)`);
                  }
                } catch (e) {
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
                  console.log('✅ [Caller] Audio session refreshed on remote stream');
                  console.log('🔊 [Caller] Ensuring remote audio tracks are enabled and playing');
                }
                // Explicitly ensure all remote audio tracks are enabled
                audioTracks.forEach((track: any) => {
                  if (track) {
                    track.enabled = true;
                    // Force unmute if muted
                    if (track.muted !== undefined && track.muted) {
                      track.muted = false;
                    }
                  }
                });
              } catch (error: any) {
                console.warn('⚠️ [Caller] Error refreshing audio session:', error.message);
              }
            }
          },
          onIce: (c: any) => {
            console.log('🧊 Sending ICE candidate from caller');
            addIceCandidate(callId, callerId, c);
          },
        });
        pcRef.current = pc;
        
        // Monitor connection state to ensure audio is configured when connected
        pc.addEventListener('connectionstatechange', () => {
          const state = pc.connectionState;
          console.log('🔌 [Caller] Connection state:', state);
          
          if (state === 'connected') {
            console.log('✅ [Caller] ✅✅✅ CONNECTION ESTABLISHED ✅✅✅');
            
            // Ensure audio session is active when connected
            if (InCallManager && statusRef.current === 'active') {
              try {
                console.log('✅ [Caller] Connection established - ensuring audio session is active');
                InCallManager.start({ media: 'audio', auto: true });
                InCallManager.setForceSpeakerphoneOn(false);
                InCallManager.setMicrophoneMute(isMutedRef.current);
                InCallManager.setSpeakerphoneOn(false);
                console.log('✅ [Caller] Audio session reconfigured on connection');
              } catch (error: any) {
                console.warn('⚠️ [Caller] Error reconfiguring audio:', error.message);
              }
            }
            
            // Verify local and remote audio tracks are still active
            if (localStreamRef.current) {
              const localAudioTracks = localStreamRef.current.getAudioTracks();
              console.log('🎤 [Caller] Local audio tracks on connection:', localAudioTracks.length);
              localAudioTracks.forEach((t: any) => {
                t.enabled = true;
                console.log('🎤 [Caller] Local track:', { id: t.id, enabled: t.enabled, readyState: t.readyState });
              });
            }
            
            // Check remote stream if available and ensure audio is playing
            if (_remote) {
              const remoteAudioTracks = _remote.getAudioTracks();
              console.log('🔊 [Caller] Remote audio tracks on connection:', remoteAudioTracks.length);
              remoteAudioTracks.forEach((t: any) => {
                // Explicitly enable remote audio tracks
                t.enabled = true;
                if (t.muted !== undefined) {
                  t.muted = false;
                }
                console.log('🔊 [Caller] Remote track:', { id: t.id, enabled: t.enabled, readyState: t.readyState, muted: t.muted });
              });
              console.log('🔊 [Caller] All remote audio tracks enabled for playback');
            }
          } else if (state === 'failed' || state === 'disconnected') {
            console.error('❌ [Caller] Connection failed or disconnected:', state);
            console.warn('⚠️ [Caller] Connection failure may be due to NAT traversal issues. TURN servers are required for devices behind firewalls/symmetric NATs.');
          }
        });
        
        // Also monitor ICE connection state (separate from connection state)
        pc.addEventListener('iceconnectionstatechange', () => {
          const iceState = pc.iceConnectionState;
          console.log('🧊 [Caller] ICE connection state:', iceState);
          
          if (iceState === 'connected' || iceState === 'completed') {
            console.log('✅ [Caller] ✅✅✅ ICE CONNECTION ESTABLISHED ✅✅✅');
          } else if (iceState === 'failed') {
            console.error('❌ [Caller] ICE connection failed');
            console.warn('⚠️ [Caller] ICE failure likely due to NAT traversal. TURN servers are required for production use when devices are behind firewalls or symmetric NATs.');
          }
        });
        
        console.log('📞 Creating call document...');
        await createCall(callId, { callerId, receiverId, type, offer: localDescription });
        
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

        unsubCall = listenCall(callId, async (data) => {
          const callStatus = data.status;
          setStatus(callStatus);
          statusRef.current = callStatus;
          
          // Only apply answer if call is still active (not ended/missed)
          if (data.answer && pcRef.current && callStatus !== 'ended' && callStatus !== 'missed') {
            try {
              console.log('📞 Caller: Received answer, applying...');
              await applyAnswer(pcRef.current, data.answer);
              console.log('✅ Caller: Answer applied successfully');
              
              // Fetch and process existing ICE candidates from receiver
              // Wait a bit for the answer to be fully applied
              setTimeout(async () => {
                try {
                  console.log('📥 [Caller] Fetching existing ICE candidates from Firestore...');
                  const existingCandidates = await getExistingCandidates(callId);
                  console.log('📥 [Caller] Found', existingCandidates.length, 'existing ICE candidates');
                  
                  if (existingCandidates.length === 0) {
                    console.log('📊 [Caller] No existing ICE candidates to process');
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
                      const candidateKey = `${c.senderId}-${JSON.stringify(c.candidate)}`;
                      if (processedIds.has(candidateKey)) {
                        skippedCount++;
                        continue; // Skip duplicates
                      }
                      try {
                        await addRemoteIce(pcRef.current, c.candidate);
                        console.log(`✅ [Caller] Processed existing ICE candidate ${processedCount + 1} from:`, c.senderId);
                        processedIds.add(candidateKey);
                        processedCount++;
                      } catch (error: any) {
                        console.error(`❌ [Caller] Error processing existing ICE candidate from ${c.senderId}:`, error.message || error);
                        errorCount++;
                      }
                    }
                    
                    console.log(`📊 [Caller] ICE candidate processing summary: ${processedCount} processed, ${skippedCount} skipped (self/duplicates), ${errorCount} errors`);
                  }
                  
                  // Log connection state after processing candidates
                  console.log('🔌 [Caller] Connection state after processing ICE candidates:', {
                    connectionState: pcRef.current.connectionState,
                    iceConnectionState: pcRef.current.iceConnectionState,
                  });
                } catch (error: any) {
                  console.error('❌ [Caller] Error fetching existing ICE candidates:', error.message || error);
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
                          } else if (error.toString && typeof error.toString === 'function') {
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
                    if (errorMessage.includes('wrong state') || 
                        errorMessage.includes('stable') ||
                        errorMessage.includes('closed') ||
                        errorMessage.includes('InvalidStateError') ||
                        errorMessage.includes('receiver')) {
                      console.warn('⚠️ Caller: Ignoring answer error - connection state issue:', errorMessage);
                    } else {
                      console.error('❌ Caller: Error applying answer:', errorMessage);
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
        unsubCall = listenCall(callId, async (data) => {
          setStatus(data.status);
          statusRef.current = data.status;
          
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

      unsubCand = listenCandidates(callId, async (c) => {
        const myId = isCaller ? callerId : receiverId;
        const roleLabel = isCaller ? 'Caller' : 'Receiver';
        if (c.senderId !== myId) {
          if (pcRef.current) {
            console.log(`🧊 [${roleLabel}] Received ICE candidate from:`, c.senderId);
            try {
              await addRemoteIce(pcRef.current, c.candidate);
              console.log(`✅ [${roleLabel}] ICE candidate added successfully`);
              // Log connection state after adding candidate
              console.log(`🔌 [${roleLabel}] Connection state after ICE candidate:`, {
                connectionState: pcRef.current.connectionState,
                iceConnectionState: pcRef.current.iceConnectionState,
              });
            } catch (error: any) {
              console.error(`❌ [${roleLabel}] Error adding ICE candidate:`, error.message || error);
            }
          } else {
            // Queue the candidate for later processing
            console.log(`📦 [${roleLabel}] Queueing ICE candidate (peer connection not ready yet) from:`, c.senderId);
            iceCandidateQueueRef.current.push(c);
          }
        } else {
          console.log(`🧊 [${roleLabel}] Ignoring ICE candidate from self:`, c.senderId);
        }
      });

      // auto-timeout if ringing > 30s
      hangTimer = setTimeout(() => {
        if (statusRef.current === 'ringing') endCall(callId, 'missed').catch(() => {});
      }, 30000);
    })();

    return () => {
      unsubCall && unsubCall();
      unsubCand && unsubCand();
      pcRef.current?.getSenders().forEach((s: any) => s.track && s.track.stop());
      pcRef.current?.close();
      clearTimeout(hangTimer);
    };
  }, [callId, isCaller, callerId, receiverId, navigation, type, role]);

  // Prevent back navigation while call is active
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Prevent back navigation - user must use hangup button
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
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
    if (!callId || !callerId || !receiverId || pcRef.current) {
      // Already answered or missing parameters
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
            console.log('✅ [Receiver] Audio session started before peer connection (configured for recording and playback)');
          }
        } catch (error: any) {
          console.warn('⚠️ [Receiver] Error starting audio session:', error.message);
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
              { cancelable: false }
            );
        },
        onLocalStream: (stream) => {
          console.log('✅ Local stream created for receiver');
          setLocal(stream);
          localStreamRef.current = stream;
          
          // 🎧 Step 1: Verify local audio track after stream creation
          const audioTracks = stream.getAudioTracks();
          console.log('🎤 [Receiver] Local stream audio tracks count:', audioTracks.length);
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
                if (settings.sampleRate !== undefined) settingsInfo.sampleRate = settings.sampleRate;
                if (settings.channelCount !== undefined) settingsInfo.channelCount = settings.channelCount;
                if (Object.keys(settingsInfo).length > 0) {
                  console.log(`🎤 [Receiver] Local audio track ${index + 1} settings:`, settingsInfo);
                } else {
                  console.log(`🎤 [Receiver] Local audio track ${index + 1} settings: (not available - normal for React Native WebRTC)`);
                }
              } catch (e) {
                // Settings might not be available
              }
            });
          } else {
            console.error('❌ [Receiver] WARNING: Local stream has no audio tracks!');
          }
        },
        onRemoteStream: (stream) => {
          console.log('✅ Remote stream received by receiver');
          setRemote(stream);
          // 🔎 Step 3: Verify Remote Audio Tracks
          const audioTracks = stream.getAudioTracks();
          console.log('🔎 [Receiver] Remote stream audio tracks count:', audioTracks.length);
          if (audioTracks.length === 0) {
            console.error('❌ [Receiver] WARNING: Remote stream has no audio tracks!');
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
                if (settings.sampleRate !== undefined) settingsInfo.sampleRate = settings.sampleRate;
                if (settings.channelCount !== undefined) settingsInfo.channelCount = settings.channelCount;
                if (Object.keys(settingsInfo).length > 0) {
                  console.log(`🔎 [Receiver] Remote audio track ${index + 1} settings:`, settingsInfo);
                } else {
                  console.log(`🔎 [Receiver] Remote audio track ${index + 1} settings: (not available - normal for remote tracks)`);
                }
              } catch (e) {
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
                console.log('✅ [Receiver] Audio session refreshed on remote stream');
                console.log('🔊 [Receiver] Ensuring remote audio tracks are enabled and playing');
              }
              // Explicitly ensure all remote audio tracks are enabled
              audioTracks.forEach((track: any) => {
                if (track) {
                  track.enabled = true;
                  // Force unmute if muted
                  if (track.muted !== undefined && track.muted) {
                    track.muted = false;
                  }
                }
              });
            } catch (error: any) {
              console.warn('⚠️ [Receiver] Error refreshing audio session:', error.message);
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
        console.log(`📦 [Receiver] Processing ${iceCandidateQueueRef.current.length} queued ICE candidates...`);
        for (const c of iceCandidateQueueRef.current) {
          if (c.senderId !== myId && !processedIds.has(`${c.senderId}-${JSON.stringify(c.candidate)}`)) {
            try {
              await addRemoteIce(pc, c.candidate);
              console.log(`✅ [Receiver] Processed queued ICE candidate from:`, c.senderId);
              processedIds.add(`${c.senderId}-${JSON.stringify(c.candidate)}`);
            } catch (error: any) {
              console.error(`❌ [Receiver] Error processing queued ICE candidate:`, error.message || error);
            }
          }
        }
        iceCandidateQueueRef.current = [];
        
        // Fetch and process existing candidates from Firestore
        try {
          console.log(`📥 [Receiver] Fetching existing ICE candidates from Firestore...`);
          const existingCandidates = await getExistingCandidates(callId);
          console.log(`📥 [Receiver] Found ${existingCandidates.length} existing ICE candidates`);
          
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
              const candidateKey = `${c.senderId}-${JSON.stringify(c.candidate)}`;
              if (processedIds.has(candidateKey)) {
                skippedCount++;
                continue; // Skip duplicates
              }
              try {
                await addRemoteIce(pc, c.candidate);
                console.log(`✅ [Receiver] Processed existing ICE candidate ${processedCount + 1} from:`, c.senderId);
                processedIds.add(candidateKey);
                processedCount++;
              } catch (error: any) {
                console.error(`❌ [Receiver] Error processing existing ICE candidate from ${c.senderId}:`, error.message || error);
                errorCount++;
              }
            }
            console.log(`📊 [Receiver] ICE candidate processing summary: ${processedCount} processed, ${skippedCount} skipped (self/duplicates), ${errorCount} errors`);
          }
        } catch (error: any) {
          console.error(`❌ [Receiver] Error fetching existing ICE candidates:`, error.message || error);
        }
        
        // Log connection state after processing all candidates
        console.log(`🔌 [Receiver] Connection state after processing ICE candidates:`, {
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState,
        });
      };
      
      // Process candidates after a short delay to ensure peer connection is fully initialized
      setTimeout(() => {
        processIceCandidates();
      }, 500);
      
      // Monitor connection state to ensure audio is configured when connected
      pc.addEventListener('connectionstatechange', () => {
        const state = pc.connectionState;
        console.log('🔌 [Receiver] Connection state:', state);
        
        if (state === 'connected') {
          console.log('✅ [Receiver] ✅✅✅ CONNECTION ESTABLISHED ✅✅✅');
          
          // Ensure audio session is active when connected
          if (InCallManager && status === 'active') {
            try {
              console.log('✅ [Receiver] Connection established - ensuring audio session is active');
              InCallManager.start({ media: 'audio', auto: true });
              InCallManager.setForceSpeakerphoneOn(false);
              InCallManager.setMicrophoneMute(isMutedRef.current);
              InCallManager.setSpeakerphoneOn(false);
              console.log('✅ [Receiver] Audio session reconfigured on connection');
            } catch (error: any) {
              console.warn('⚠️ [Receiver] Error reconfiguring audio:', error.message);
            }
          }
          
          // Verify local and remote audio tracks are still active
          if (localStreamRef.current) {
            const localAudioTracks = localStreamRef.current.getAudioTracks();
            console.log('🎤 [Receiver] Local audio tracks on connection:', localAudioTracks.length);
            localAudioTracks.forEach((t: any) => {
              t.enabled = true;
              console.log('🎤 [Receiver] Local track:', { id: t.id, enabled: t.enabled, readyState: t.readyState });
            });
          }
          
          // Check remote stream if available and ensure audio is playing
          // Note: _remote state might not be updated yet, so we'll also check in useEffect
          setTimeout(() => {
            if (_remote) {
              const remoteAudioTracks = _remote.getAudioTracks();
              console.log('🔊 [Receiver] Remote audio tracks on connection:', remoteAudioTracks.length);
              remoteAudioTracks.forEach((t: any) => {
                t.enabled = true;
                if (t.muted !== undefined) {
                  t.muted = false;
                }
                console.log('🔊 [Receiver] Remote track:', { id: t.id, enabled: t.enabled, readyState: t.readyState, muted: t.muted });
              });
              console.log('🔊 [Receiver] All remote audio tracks enabled for playback');
            }
          }, 500);
        } else if (state === 'failed' || state === 'disconnected') {
          console.error('❌ [Receiver] Connection failed or disconnected:', state);
          console.warn('⚠️ [Receiver] Connection failure may be due to NAT traversal issues. TURN servers are required for devices behind firewalls/symmetric NATs.');
        }
      });
      
      // Also monitor ICE connection state (separate from connection state)
      pc.addEventListener('iceconnectionstatechange', () => {
        const iceState = pc.iceConnectionState;
        console.log('🧊 [Receiver] ICE connection state:', iceState);
        
        if (iceState === 'connected' || iceState === 'completed') {
          console.log('✅ [Receiver] ✅✅✅ ICE CONNECTION ESTABLISHED ✅✅✅');
        } else if (iceState === 'failed') {
          console.error('❌ [Receiver] ICE connection failed');
          console.warn('⚠️ [Receiver] ICE failure likely due to NAT traversal. TURN servers are required for production use when devices are behind firewalls or symmetric NATs.');
        }
      });
      
      console.log('📞 Answering call...');
            // Serialize the answer for Firestore storage
            const answerToStore = localDescription.toJSON ? localDescription.toJSON() : {
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
      console.log(`🎤 [Mute] Audio track ${track.id}: enabled=${!newMutedState}`);
    });
    
    // Sync with InCallManager
    if (InCallManager) {
      try {
        InCallManager.setMicrophoneMute(newMutedState);
        console.log(`🎤 [Mute] InCallManager microphone muted: ${newMutedState}`);
      } catch (error: any) {
        console.warn('⚠️ [Mute] Error setting InCallManager mute state:', error.message);
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
          console.warn('⚠️ [InCallManager] Native module not available - audio session management disabled');
          console.warn('⚠️ [InCallManager] Run: cd ios && pod install && cd .. && npm run ios');
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
          console.log('✅ [InCallManager] Audio session started (earpiece mode, recording and playback enabled)');
          console.log('✅ [InCallManager] Audio route should be: earpiece');
        }
      } catch (error: any) {
        console.error('❌ [InCallManager] Error starting audio session:', error.message || error);
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
          console.error('❌ [InCallManager] Error stopping audio session:', error.message || error);
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
          console.error('❌ [InCallManager] Error stopping audio session:', error.message || error);
        }
      }
    };
  }, [status]);
  
  // Monitor remote stream and connection state for audio verification and playback
  useEffect(() => {
    if (status === 'active' && _remote && pcRef.current) {
      const pc = pcRef.current;
      
      // Check connection state periodically to ensure audio is playing
      const checkAudioPlayback = () => {
        const connectionState = pc.connectionState;
        const iceConnectionState = pc.iceConnectionState;
        
        // Only proceed if connection is established
        if (connectionState === 'connected' && (iceConnectionState === 'connected' || iceConnectionState === 'completed')) {
          // Ensure audio session is properly configured
          if (InCallManager) {
            try {
              InCallManager.start({ media: 'audio', auto: true });
              InCallManager.setForceSpeakerphoneOn(false);
              InCallManager.setMicrophoneMute(isMutedRef.current);
              InCallManager.setSpeakerphoneOn(false);
            } catch (error: any) {
              console.warn('⚠️ [Audio Playback] Error configuring audio session:', error.message);
            }
          }
          
          // Ensure all remote audio tracks are enabled and unmuted
          const remoteAudioTracks = _remote.getAudioTracks();
          if (remoteAudioTracks.length > 0) {
            let audioConfigured = false;
            remoteAudioTracks.forEach((track: any) => {
              if (track) {
                if (!track.enabled || (track.muted !== undefined && track.muted)) {
                  track.enabled = true;
                  if (track.muted !== undefined) {
                    track.muted = false;
                  }
                  audioConfigured = true;
                }
              }
            });
            if (audioConfigured && __DEV__) {
              console.log(`🔊 [Audio Playback] ${remoteAudioTracks.length} remote audio track(s) enabled for playback`);
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
  }, [status, _remote]);
  
  // Original monitoring code
  useEffect(() => {
    if (status === 'active' && _remote && pcRef.current) {
      const pc = pcRef.current;
      const connectionState = pc.connectionState;
      const iceConnectionState = pc.iceConnectionState;
      const roleLabel = isCaller ? 'Caller' : 'Receiver';
      
      console.log(`🔍 [${roleLabel}] [Audio Check] Connection status:`, {
        connectionState,
        iceConnectionState,
        hasRemoteStream: !!_remote,
        remoteAudioTracks: _remote.getAudioTracks().length,
        hasLocalStream: !!localStreamRef.current,
        localAudioTracks: localStreamRef.current?.getAudioTracks().length || 0,
      });
      
      // Verify remote audio tracks
      const remoteAudioTracks = _remote.getAudioTracks();
      if (remoteAudioTracks.length > 0) {
        remoteAudioTracks.forEach((track: any, index: number) => {
          console.log(`🔊 [${roleLabel}] [Audio Check] Remote track ${index + 1}:`, {
            id: track.id,
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted,
          });
        });
      } else {
        console.warn(`⚠️ [${roleLabel}] [Audio Check] No remote audio tracks found!`);
      }
      
      // Verify local audio tracks
      if (localStreamRef.current) {
        const localAudioTracks = localStreamRef.current.getAudioTracks();
        if (localAudioTracks.length > 0) {
          localAudioTracks.forEach((track: any, index: number) => {
            console.log(`🎤 [${roleLabel}] [Audio Check] Local track ${index + 1}:`, {
              id: track.id,
              enabled: track.enabled,
              readyState: track.readyState,
              muted: track.muted,
            });
          });
        } else {
          console.warn(`⚠️ [${roleLabel}] [Audio Check] No local audio tracks found!`);
        }
      }
      
      // Warn if connection is in an unexpected state (but not "new" which is normal initially)
      if (connectionState !== 'connected' && connectionState !== 'connecting' && connectionState !== 'new') {
        console.warn(`⚠️ [${roleLabel}] Connection state is not connected/connecting/new:`, connectionState);
      }
      if (iceConnectionState !== 'connected' && iceConnectionState !== 'completed' && iceConnectionState !== 'checking' && iceConnectionState !== 'new') {
        console.warn(`⚠️ [${roleLabel}] ICE connection state is not connected/completed/checking/new:`, iceConnectionState);
      }
    }
  }, [status, _remote, isCaller]);
  
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
            console.log(`⏱️ [${roleLabel}] Connection still ${connectionState}, ICE: ${iceConnectionState}`);
          }
          
          if (iceConnectionState === 'checking' || iceConnectionState === 'new') {
            console.log(`⏱️ [${roleLabel}] ICE still ${iceConnectionState}, Connection: ${connectionState}`);
          }
          
          // Log if connection fails
          if (connectionState === 'failed' || connectionState === 'disconnected') {
            console.error(`❌ [${roleLabel}] Connection failed:`, connectionState);
            console.warn(`⚠️ [${roleLabel}] Connection failure may be due to NAT traversal issues. TURN servers are required for devices behind firewalls/symmetric NATs.`);
            clearInterval(interval);
            
            // Show user-friendly error alert (only once)
            if (!connectionError) {
              setConnectionError('Connection failed. This may be due to network restrictions.');
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
                { cancelable: false }
              );
            }
          }
          
          if (iceConnectionState === 'failed') {
            console.error(`❌ [${roleLabel}] ICE connection failed:`, iceConnectionState);
            console.warn(`⚠️ [${roleLabel}] ICE failure likely due to NAT traversal. TURN servers are required for production use when devices are behind firewalls or symmetric NATs.`);
            clearInterval(interval);
            
            // Show user-friendly error alert (only once)
            if (!connectionError) {
              setConnectionError('ICE connection failed. TURN servers may be required.');
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
                { cancelable: false }
              );
            }
          }
          
          // Stop checking if connected
          if (connectionState === 'connected' && (iceConnectionState === 'connected' || iceConnectionState === 'completed')) {
            console.log(`✅ [${roleLabel}] Connection fully established!`);
            clearInterval(interval);
          }
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [status, isCaller]);

  // Listen for audio route changes (for debugging)
  useEffect(() => {
    // 📱 Step 2: Listen to audio route changes (for debugging)
    // Note: This feature may not be available in all versions of react-native-incall-manager
    if (status === 'active' && InCallManager && __DEV__) {
      try {
        // Check if addListener method exists
        if (typeof InCallManager.addListener === 'function') {
          const subscription = InCallManager.addListener('onAudioRouteChange', (data: any) => {
            console.log('📱 [InCallManager] Audio route changed:', data);
            // Expected: Audio route changed: { name: 'Speaker' } or { name: 'Earpiece' }
          });
          
          // Also try to get current audio route if available
          try {
            if (typeof InCallManager.getAudioRoute === 'function') {
              const currentRoute = InCallManager.getAudioRoute();
              console.log('📱 [InCallManager] Current audio route:', currentRoute);
            }
          } catch (e) {
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
          console.warn('⚠️ [InCallManager] Could not set up audio route listener:', error.message);
        }
      }
    }
    return () => {};
  }, [status]);

  const handleSwitchToVideo = () => {
    // Navigate to video calling screen with the same call parameters
    navigation.replace('VideoCallingScreen', {
      callId,
      isCaller,
      callerId,
      receiverId,
    });
  };

  const statusText = status === 'ringing' ? 'Ringing...' : status === 'active' ? 'In Call' : status;

  return (
    <SafeAreaView style={[callingStyles.container, { paddingTop: insets.top }]}>
      {/* Profile Section */}
      <View style={callingStyles.profileContainer}>
        {isLoadingUser ? (
          <ActivityIndicator size="large" color={COLORS.blue} />
        ) : (
          <>
            <Image
              source={{
                uri: otherUser?.profileImage || 'https://via.placeholder.com/150',
              }}
              style={callingStyles.profileImage}
            />
            <Text style={callingStyles.name}>{otherUser?.name || 'Unknown'}</Text>
            <Text style={callingStyles.status}>{statusText}</Text>
          </>
        )}
      </View>

      {/* Action Buttons */}
      <View
        style={[
          callingStyles.buttonContainer,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        {!isCaller && status === 'ringing' ? (
          // Receiver: Show Accept and Decline buttons
          <>
            <TouchableOpacity
              style={[callingStyles.iconButton, callingStyles.declineButton]}
              onPress={handleHangup}
            >
              <Phone size={30} color={COLORS.white} style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[callingStyles.iconButton, callingStyles.acceptButton]}
              onPress={handleAccept}
            >
              <Phone size={30} color={COLORS.white} />
            </TouchableOpacity>
          </>
        ) : (
          // Caller or active call: Show normal controls
          <>
            {status === 'active' && (
        <TouchableOpacity
          style={callingStyles.iconButton}
                onPress={handleSwitchToVideo}
        >
            <Camera size={28} color={COLORS.black} />
              </TouchableOpacity>
          )}
        <TouchableOpacity
          style={[callingStyles.iconButton, callingStyles.hangupButton]}
          onPress={handleHangup}
        >
          <Phone size={28} color={COLORS.white} />
        </TouchableOpacity>
            {status === 'active' && (
        <TouchableOpacity style={callingStyles.iconButton} onPress={handleMute}>
          {isMuted ? (
            <MicOff size={28} color={COLORS.black} />
          ) : (
            <Mic size={28} color={COLORS.black} />
          )}
        </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default CallingScreen;
