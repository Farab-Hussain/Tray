import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, StatusBar, Text, Image, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
// Avoid static RTCView import; require dynamically to prevent crashes if pod not installed

const VideoCallingScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { role } = useAuth();

  const [isSwapped, setIsSwapped] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [status, setStatus] = useState<'ringing' | 'active' | 'ended' | 'missed'>('ringing');
  const [local, setLocal] = useState<any | null>(null);
  const [remote, setRemote] = useState<any | null>(null);
  const [otherUser, setOtherUser] = useState<{ name: string; profileImage?: string } | null>(null);

  const pcRef = useRef<any | null>(null);
  const localStreamRef = useRef<any | null>(null);
  const RTCViewRef = useRef<any>(null);
  const iceCandidateQueueRef = useRef<Array<{ senderId: string; candidate: any }>>([]);
  const isMutedRef = useRef<boolean>(false);
  const { callId, isCaller, callerId, receiverId, switchingFromAudio } = route?.params || {};

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
            if (__DEV__) {
        console.log('📞 Accepting video call...')
      };
      
      // Get the call document to retrieve the offer
      const callDoc = await getCallOnce(callId);
      if (!callDoc.exists()) {
                if (__DEV__) {
          console.error('Call document not found')
        };
        return;
      }
      
      const callData = callDoc.data() as CallDocument;
      if (!callData.offer) {
                if (__DEV__) {
          console.error('No offer found in call document')
        };
        return;
      }

            if (__DEV__) {
        console.log('📞 Creating peer connection for receiver...')
      };
      const { pc, localDescription } = await createPeer({
        isCaller: false,
        audioOnly: false,
        onLocalStream: (stream) => {
                    if (__DEV__) {
            console.log('✅ Local stream created for receiver')
          };
                    if (__DEV__) {
            console.log('📹 Local stream ID:', stream.id, 'Video tracks:', stream.getVideoTracks().length)
          };
          setLocal(stream);
          localStreamRef.current = stream;
          const hasVideoTrack = stream.getVideoTracks().length > 0;
          if (hasVideoTrack) {
            setIsVideoEnabled(true);
          }
          
          // 🎧 Step 1: Verify local audio track after stream creation
          const audioTracks = stream.getAudioTracks();
                    if (__DEV__) {
            console.log('🎤 [Receiver] Local stream audio tracks count:', audioTracks.length)
          };
          if (audioTracks.length > 0) {
            audioTracks.forEach((track: any, index: number) => {
                            if (__DEV__) {
                console.log(`🎤 [Receiver] Local audio track ${index + 1}:`, {
                id: track.id,
                enabled: track.enabled,
                readyState: track.readyState,
              })
              };
              try {
                const settings = track.getSettings();
                                if (__DEV__) {
                  console.log(`🎤 [Receiver] Local audio track ${index + 1} settings:`, {
                  sampleRate: settings.sampleRate,
                  channelCount: settings.channelCount,
                })
                };
              } catch (e) {
                // Settings might not be available
              }
            });
          } else {
                        if (__DEV__) {
              console.error('❌ [Receiver] WARNING: Local stream has no audio tracks!')
            };
          }
        },
        onRemoteStream: (stream) => {
                    if (__DEV__) {
            console.log('✅ Remote stream received by receiver')
          };
                    if (__DEV__) {
            console.log('📹 Remote stream ID:', stream.id, 'Video tracks:', stream.getVideoTracks().length)
          };
          // Ensure video tracks are enabled
          const videoTracks = stream.getVideoTracks();
          videoTracks.forEach((track: any) => {
            track.enabled = true;
                        if (__DEV__) {
              console.log('📹 Remote video track enabled:', track.id, track.enabled)
            };
          });
          // Update video enabled state if remote has video
          if (videoTracks.length > 0) {
            setIsVideoEnabled(true);
                        if (__DEV__) {
              console.log('📹 Remote video detected, enabling video display')
            };
          }
          // Verify this is different from local stream
          if (localStreamRef.current && stream.id === localStreamRef.current.id) {
                        if (__DEV__) {
              console.error('⚠️ WARNING: Remote stream has same ID as local stream!')
            };
          }
          
          // 🔎 Step 3: Verify Remote Audio Tracks
          const audioTracks = stream.getAudioTracks();
                    if (__DEV__) {
            console.log('🔎 [Receiver] Remote stream audio tracks count:', audioTracks.length)
          };
          if (audioTracks.length === 0) {
                        if (__DEV__) {
              console.error('❌ [Receiver] WARNING: Remote stream has no audio tracks!')
            };
          } else {
            audioTracks.forEach((track: any, index: number) => {
              track.enabled = true;
                            if (__DEV__) {
                console.log(`🔎 [Receiver] Remote audio track ${index + 1}:`, {
                id: track.id,
                enabled: track.enabled,
                readyState: track.readyState,
              })
              };
              try {
                const settings = track.getSettings();
                                if (__DEV__) {
                  console.log(`🔎 [Receiver] Remote audio track ${index + 1} settings:`, {
                  sampleRate: settings.sampleRate,
                  channelCount: settings.channelCount,
                })
                };
              } catch (e) {
                // Settings might not be available
              }
            });
          }
          
          // Force update by setting remote stream - this triggers re-render
          setRemote(stream);
          // Log track count for debugging
                    if (__DEV__) {
            console.log('📹 Remote stream set with', stream.getTracks().length, 'total tracks')
          };
        },
        onIce: (c: any) => {
                    if (__DEV__) {
            console.log('🧊 Sending ICE candidate from receiver')
          };
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
                if (__DEV__) {
          console.log(`📦 [Receiver] Processing ${iceCandidateQueueRef.current.length} queued ICE candidates...`)
        };
        for (const c of iceCandidateQueueRef.current) {
          if (c.senderId !== myId && !processedIds.has(`${c.senderId}-${JSON.stringify(c.candidate)}`)) {
            try {
              await addRemoteIce(pc, c.candidate);
                            if (__DEV__) {
                console.log(`✅ [Receiver] Processed queued ICE candidate from:`, c.senderId)
              };
              processedIds.add(`${c.senderId}-${JSON.stringify(c.candidate)}`);
            } catch (error: any) {
                            if (__DEV__) {
                console.error(`❌ [Receiver] Error processing queued ICE candidate:`, error.message || error)
              };
            }
          }
        }
        iceCandidateQueueRef.current = [];
        
        // Fetch and process existing candidates from Firestore
        try {
                    if (__DEV__) {
            console.log(`📥 [Receiver] Fetching existing ICE candidates from Firestore...`)
          };
          const existingCandidates = await getExistingCandidates(callId);
                    if (__DEV__) {
            console.log(`📥 [Receiver] Found ${existingCandidates.length} existing ICE candidates`)
          };
          
          if (existingCandidates.length === 0) {
                        if (__DEV__) {
              console.log(`📊 [Receiver] No existing ICE candidates to process`)
            };
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
                                if (__DEV__) {
                  console.log(`✅ [Receiver] Processed existing ICE candidate ${processedCount + 1} from:`, c.senderId)
                };
                processedIds.add(candidateKey);
                processedCount++;
              } catch (error: any) {
                                if (__DEV__) {
                  console.error(`❌ [Receiver] Error processing existing ICE candidate from ${c.senderId}:`, error.message || error)
                };
                errorCount++;
              }
            }
                        if (__DEV__) {
              console.log(`📊 [Receiver] ICE candidate processing summary: ${processedCount} processed, ${skippedCount} skipped (self/duplicates), ${errorCount} errors`)
            };
          }
        } catch (error: any) {
                    if (__DEV__) {
            console.error(`❌ [Receiver] Error fetching existing ICE candidates:`, error.message || error)
          };
        }
        
        // Log connection state after processing all candidates
                if (__DEV__) {
          console.log(`🔌 [Receiver] Connection state after processing ICE candidates:`, {
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState,
        })
        };
      };
      
      // Process candidates after a short delay to ensure peer connection is fully initialized
      setTimeout(() => {
        processIceCandidates();
      }, 500);
      
      // Monitor connection state to ensure audio is configured when connected
      pc.addEventListener('connectionstatechange', () => {
        const state = pc.connectionState;
                if (__DEV__) {
          console.log('🔌 [Receiver] Connection state:', state)
        };
        
        if (state === 'connected') {
                    if (__DEV__) {
            console.log('✅ [Receiver] ✅✅✅ CONNECTION ESTABLISHED ✅✅✅')
          };
        } else if (state === 'failed' || state === 'disconnected') {
                    if (__DEV__) {
            console.error('❌ [Receiver] Connection failed or disconnected:', state)
          };
                    if (__DEV__) {
            console.warn('⚠️ [Receiver] Connection failure may be due to NAT traversal issues. TURN servers are required for devices behind firewalls/symmetric NATs.')
          };
        }
      });
      
      // Also monitor ICE connection state (separate from connection state)
      pc.addEventListener('iceconnectionstatechange', () => {
        const iceState = pc.iceConnectionState;
                if (__DEV__) {
          console.log('🧊 [Receiver] ICE connection state:', iceState)
        };
        
        if (iceState === 'connected' || iceState === 'completed') {
                    if (__DEV__) {
            console.log('✅ [Receiver] ✅✅✅ ICE CONNECTION ESTABLISHED ✅✅✅')
          };
        } else if (iceState === 'failed') {
                    if (__DEV__) {
            console.error('❌ [Receiver] ICE connection failed')
          };
                    if (__DEV__) {
            console.warn('⚠️ [Receiver] ICE failure likely due to NAT traversal. TURN servers are required for production use when devices are behind firewalls or symmetric NATs.')
          };
        }
      });
      
            if (__DEV__) {
        console.log('📞 Answering call...')
      };
      // Serialize the answer for Firestore storage
      const answerToStore = localDescription.toJSON ? localDescription.toJSON() : {
        type: localDescription.type,
        sdp: localDescription.sdp,
      };
      await answerCall(callId, answerToStore);
      setStatus('active');
            if (__DEV__) {
        console.log('✅ Call accepted successfully')
      };
    } catch (error) {
            if (__DEV__) {
        console.error('❌ Error accepting call:', error)
      };
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
                if (__DEV__) {
          console.error('Error fetching user data:', error)
        };
      }
    };
    if (callId && callerId && receiverId) {
      fetchOtherUser();
    }
  }, [callId, callerId, receiverId, isCaller]);

  const handleMute = () => {
    if (!localStreamRef.current) return;
    
    const audioTracks = localStreamRef.current.getAudioTracks();
    const newMutedState = !isMuted;
    
    // Update WebRTC audio tracks
    audioTracks.forEach((track: any) => {
      track.enabled = !newMutedState;
            if (__DEV__) {
        console.log(`🎤 [Mute] Audio track ${track.id}: enabled=${!newMutedState}`)
      };
    });
    
    // Sync with InCallManager
    if (InCallManager) {
      try {
        InCallManager.setMicrophoneMute(newMutedState);
                if (__DEV__) {
          console.log(`🎤 [Mute] InCallManager microphone muted: ${newMutedState}`)
        };
      } catch (error: any) {
                if (__DEV__) {
          console.warn('⚠️ [Mute] Error setting InCallManager mute state:', error.message)
        };
      }
    }
    
    setIsMuted(newMutedState);
    isMutedRef.current = newMutedState;
        if (__DEV__) {
      console.log(`🎤 [Mute] Mute state changed to: ${newMutedState}`)
    };
  };

  const handleSwitchCamera = async () => {
    if (!localStreamRef.current || !pcRef.current || !isVideoEnabled) {
      if (__DEV__) {
        console.log('⚠️ Cannot switch camera: stream or peer connection not ready');
      }
      return;
    }
    
    // Double-check peer connection is still valid before proceeding
    const pc = pcRef.current;
    if (!pc) {
      if (__DEV__) {
        console.warn('⚠️ Cannot switch camera: peer connection is null');
      }
      return;
    }
    
    // Check if peer connection is in a valid state
    if (pc.signalingState === 'closed' || pc.connectionState === 'closed') {
      if (__DEV__) {
        console.warn('⚠️ Cannot switch camera: peer connection is closed');
      }
      return;
    }
    
    try {
      const rnWebRTC = require('react-native-webrtc');
      const mediaDevices = rnWebRTC.mediaDevices;
      const MediaStream = rnWebRTC.MediaStream;
      
      // Switch to the opposite camera
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
      
      if (__DEV__) {
        console.log('📷 Switching camera to:', newFacingMode === 'user' ? 'front' : 'back');
      }
      
      // Get the old video track before replacing
      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      
      // Get new video stream with the new camera
      const videoStream = await mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false,
      });
      const newVideoTrack = videoStream.getVideoTracks()[0];
      
      if (!newVideoTrack) {
        throw new Error('Failed to get new video track');
      }
      
      // Verify peer connection is still valid before accessing getSenders
      if (!pcRef.current) {
        throw new Error('Peer connection was closed during camera switch');
      }
      
      // Check connection state again
      if (pcRef.current.signalingState === 'closed' || pcRef.current.connectionState === 'closed') {
        throw new Error('Peer connection closed during camera switch');
      }
      
      // Find the video sender
      const senders = pcRef.current.getSenders();
      if (!senders || senders.length === 0) {
        throw new Error('No senders available in peer connection');
      }
      
      const sender = senders.find((s: any) => s.track && s.track.kind === 'video');
      
      if (!sender) {
        if (__DEV__) {
          console.warn('⚠️ No video sender found, cannot switch camera');
        }
        // Clean up the new track if we can't use it
        newVideoTrack.stop();
        videoStream.getTracks().forEach((track: any) => track.stop());
        return;
      }
      
      // Replace the track in the peer connection
      await sender.replaceTrack(newVideoTrack);
      
      // Get audio tracks from current stream to preserve them
      const audioTracks = localStreamRef.current.getAudioTracks();
      
      // Create a new stream with the new video track and existing audio tracks
      // This ensures React detects the change since it's a new object reference
      const newStream = new MediaStream();
      
      // Add the new video track
      newStream.addTrack(newVideoTrack);
      
      // Add all audio tracks from the old stream
      audioTracks.forEach((track: any) => {
        newStream.addTrack(track);
      });
      
      // Stop and remove old video track from the old stream
      if (oldVideoTrack) {
        localStreamRef.current.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
      }
      
      // Update the ref and state with the new stream
      localStreamRef.current = newStream;
      setLocal(newStream);
      
      // Update facing mode state
      setFacingMode(newFacingMode);
      
      // Trigger renegotiation if connection is active
      // Only create offer if we're in a stable state (not already negotiating)
      // Verify peer connection is still valid before creating offer
      if (pcRef.current && pcRef.current.signalingState === 'stable' && pcRef.current.connectionState !== 'closed') {
        try {
          const offer = await pcRef.current.createOffer();
          await pcRef.current.setLocalDescription(offer);
          if (__DEV__) {
            console.log('📷 Camera switch: Created new offer for renegotiation');
          }
        } catch (offerError: any) {
          // If offer creation fails, it's okay - the track replacement should still work
          if (__DEV__) {
            console.warn('⚠️ Camera switch: Could not create offer for renegotiation:', offerError.message || offerError);
          }
        }
      }
      
      // The newVideoTrack is now part of localStreamRef, so don't stop it
      // Only stop any other tracks from the temporary stream if there are any
      // (shouldn't be any since we only requested video, but just in case)
      
      if (__DEV__) {
        console.log('✅ Camera switched successfully');
      }
    } catch (error: any) {
      console.error('❌ Error switching camera:', error.message || error);
      // Don't throw - allow user to try again
    }
  };

  const handleSwap = () => {
    setIsSwapped(!isSwapped);
  };

  // 📱 Step 2: Verify InCallManager Session Starts (Video Call)
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
                if (__DEV__) {
          console.log('✅ [InCallManager] Starting audio session for video call...')
        };
        InCallManager.start({ media: 'audio', auto: true });
        // For video calls, optionally use speakerphone by default
        // User can toggle via UI if needed
        InCallManager.setForceSpeakerphoneOn(false); // Use earpiece by default, user can toggle
        if (__DEV__) {
          console.log('✅ [InCallManager] Audio session started for video call (earpiece mode)');
          console.log('✅ [InCallManager] Audio route should be: earpiece');
        }
      } catch (error: any) {
                if (__DEV__) {
          console.error('❌ [InCallManager] Error starting audio session:', error.message || error)
        };
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

  // Listen for audio route changes (for debugging)
  useEffect(() => {
    // Optional: Listen to audio route changes (for debugging)
    // Note: This feature may not be available in all versions of react-native-incall-manager
    if (status === 'active' && InCallManager && __DEV__) {
      try {
        // Check if addListener method exists
        if (typeof InCallManager.addListener === 'function') {
          const subscription = InCallManager.addListener('onAudioRouteChange', (data: any) => {
                        if (__DEV__) {
              console.log('📱 [InCallManager] Audio route changed:', data)
            };
          });
          
          return () => {
            if (subscription && typeof subscription.remove === 'function') {
              subscription.remove();
            }
          };
        }
        // Silently skip if addListener is not available - this is optional debug functionality
      } catch (error: any) {
        // Silently fail - audio route listener is optional debug feature
      }
    }
    return () => {};
  }, [status]);

  useEffect(() => {
    // Load RTCView lazily
    try {
      RTCViewRef.current = require('react-native-webrtc').RTCView;
    } catch {
      RTCViewRef.current = null;
    }

    let unsubCall: any, unsubCand: any, hangTimer: any;

    (async () => {
      if (!callId || !callerId || !receiverId) return;

      // Prevent re-creating peer connection if it already exists
      if (pcRef.current) {
                if (__DEV__) {
          console.log('⚠️ Peer connection already exists, skipping creation')
        };
        return;
      }

      if (isCaller) {
        // If switching from audio call, check if call is already active
        // If active, we should reuse the existing call instead of creating a new one
        if (switchingFromAudio) {
          const callDoc = await getCallOnce(callId);
          if (callDoc.exists()) {
            const callData = callDoc.data() as CallDocument;
            // If call is already active, don't create a new call - just set up video
            if (callData.status === 'active') {
                            if (__DEV__) {
                console.log('📞 Switching from audio to video - call already active, setting up video...')
              };
              // We'll create a new peer connection for video, but won't overwrite the call document
              // The call document type will remain as 'audio' but we'll add video tracks
            } else {
                            if (__DEV__) {
                console.log('📞 Switching from audio to video - call not active yet, creating video call...')
              };
            }
          }
        }
        
                if (__DEV__) {
          console.log('📞 Caller: Creating video peer connection...')
        };
        const { pc, localDescription } = await createPeer({
          isCaller: true,
          audioOnly: false,
          onLocalStream: (stream) => {
                        if (__DEV__) {
              console.log('✅ Local stream created for caller')
            };
                        if (__DEV__) {
              console.log('📹 Local stream ID:', stream.id, 'Video tracks:', stream.getVideoTracks().length)
            };
            setLocal(stream);
            localStreamRef.current = stream;
            const hasVideoTrack = stream.getVideoTracks().length > 0;
            if (hasVideoTrack) {
              setIsVideoEnabled(true);
            }
            
            // 🎧 Step 1: Verify local audio track after stream creation
            const audioTracks = stream.getAudioTracks();
                        if (__DEV__) {
              console.log('🎤 [Caller] Local stream audio tracks count:', audioTracks.length)
            };
            if (audioTracks.length > 0) {
              audioTracks.forEach((track: any, index: number) => {
                                if (__DEV__) {
                  console.log(`🎤 [Caller] Local audio track ${index + 1}:`, {
                  id: track.id,
                  enabled: track.enabled,
                  readyState: track.readyState,
                })
                };
                try {
                  const settings = track.getSettings();
                                    if (__DEV__) {
                    console.log(`🎤 [Caller] Local audio track ${index + 1} settings:`, {
                    sampleRate: settings.sampleRate,
                    channelCount: settings.channelCount,
                  })
                  };
                } catch (e) {
                  // Settings might not be available
                }
              });
            } else {
                            if (__DEV__) {
                console.error('❌ [Caller] WARNING: Local stream has no audio tracks!')
              };
            }
          },
          onRemoteStream: (stream) => {
                        if (__DEV__) {
              console.log('✅ Remote stream received by caller')
            };
                        if (__DEV__) {
              console.log('📹 Remote stream ID:', stream.id, 'Video tracks:', stream.getVideoTracks().length)
            };
            // Ensure video tracks are enabled
            const videoTracks = stream.getVideoTracks();
            videoTracks.forEach((track: any) => {
              track.enabled = true;
                            if (__DEV__) {
                console.log('📹 Remote video track enabled:', track.id, track.enabled)
              };
            });
            // Update video enabled state if remote has video
            if (videoTracks.length > 0) {
              setIsVideoEnabled(true);
                            if (__DEV__) {
                console.log('📹 Remote video detected, enabling video display')
              };
            }
            // Verify this is different from local stream
            if (localStreamRef.current && stream.id === localStreamRef.current.id) {
                            if (__DEV__) {
                console.error('⚠️ WARNING: Remote stream has same ID as local stream!')
              };
            }
            
            // 🔎 Step 3: Verify Remote Audio Tracks
            const audioTracks = stream.getAudioTracks();
                        if (__DEV__) {
              console.log('🔎 [Caller] Remote stream audio tracks count:', audioTracks.length)
            };
            if (audioTracks.length === 0) {
                            if (__DEV__) {
                console.error('❌ [Caller] WARNING: Remote stream has no audio tracks!')
              };
            } else {
              audioTracks.forEach((track: any, index: number) => {
                track.enabled = true;
                                if (__DEV__) {
                  console.log(`🔎 [Caller] Remote audio track ${index + 1}:`, {
                  id: track.id,
                  enabled: track.enabled,
                  readyState: track.readyState,
                })
                };
                try {
                  const settings = track.getSettings();
                                    if (__DEV__) {
                    console.log(`🔎 [Caller] Remote audio track ${index + 1} settings:`, {
                    sampleRate: settings.sampleRate,
                    channelCount: settings.channelCount,
                  })
                  };
                } catch (e) {
                  // Settings might not be available
                }
              });
            }
            
            // Force update by setting remote stream - this triggers re-render
            setRemote(stream);
            // Log track count for debugging
                        if (__DEV__) {
              console.log('📹 Remote stream set with', stream.getTracks().length, 'total tracks')
            };
          },
          onIce: (c: any) => {
                        if (__DEV__) {
              console.log('🧊 Sending ICE candidate from caller')
            };
            addIceCandidate(callId, callerId, c);
          },
        });
        pcRef.current = pc;
        
        // Monitor connection state to ensure audio is configured when connected
        pc.addEventListener('connectionstatechange', () => {
          const state = pc.connectionState;
                    if (__DEV__) {
            console.log('🔌 [Caller] Connection state:', state)
          };
          
          if (state === 'connected') {
                        if (__DEV__) {
              console.log('✅ [Caller] ✅✅✅ CONNECTION ESTABLISHED ✅✅✅')
            };
          } else if (state === 'failed' || state === 'disconnected') {
                        if (__DEV__) {
              console.error('❌ [Caller] Connection failed or disconnected:', state)
            };
                        if (__DEV__) {
              console.warn('⚠️ [Caller] Connection failure may be due to NAT traversal issues. TURN servers are required for devices behind firewalls/symmetric NATs.')
            };
          }
        });
        
        // Also monitor ICE connection state (separate from connection state)
        pc.addEventListener('iceconnectionstatechange', () => {
          const iceState = pc.iceConnectionState;
                    if (__DEV__) {
            console.log('🧊 [Caller] ICE connection state:', iceState)
          };
          
          if (iceState === 'connected' || iceState === 'completed') {
                        if (__DEV__) {
              console.log('✅ [Caller] ✅✅✅ ICE CONNECTION ESTABLISHED ✅✅✅')
            };
          } else if (iceState === 'failed') {
                        if (__DEV__) {
              console.error('❌ [Caller] ICE connection failed')
            };
                        if (__DEV__) {
              console.warn('⚠️ [Caller] ICE failure likely due to NAT traversal. TURN servers are required for production use when devices are behind firewalls or symmetric NATs.')
            };
          }
        });
        
        // Only create/update call document if not switching from active audio call
        if (switchingFromAudio) {
          const callDoc = await getCallOnce(callId);
          if (callDoc.exists()) {
            const callData = callDoc.data() as CallDocument;
            if (callData.status === 'active') {
              // Call is already active - just update the offer for video, don't reset status
                            if (__DEV__) {
                console.log('📞 Updating existing active call to video...')
              };
              const { updateDoc, doc } = require('firebase/firestore');
              const { firestore } = require('../../../lib/firebase');
              const ref = doc(firestore, 'calls', callId);
              await updateDoc(ref, { 
                type: 'video', 
                offer: localDescription.toJSON ? localDescription.toJSON() : {
                  type: localDescription.type,
                  sdp: localDescription.sdp,
                }
              });
            } else {
              // Call is still ringing - create video call (will overwrite audio call)
                            if (__DEV__) {
                console.log('📞 Creating video call document (replacing audio call)...')
              };
              await createCall(callId, { callerId, receiverId, type: 'video', offer: localDescription });
            }
          } else {
            // Call document doesn't exist - create new video call
                        if (__DEV__) {
              console.log('📞 Creating new video call document...')
            };
            await createCall(callId, { callerId, receiverId, type: 'video', offer: localDescription });
          }
        } else {
                    if (__DEV__) {
            console.log('📞 Creating video call document...')
          };
          await createCall(callId, { callerId, receiverId, type: 'video', offer: localDescription });
        }
        
        // Send push notification to receiver
        try {
          const { api } = require('../../../lib/fetcher');
          await api.post('/notifications/send-call', {
            callId,
            callerId,
            receiverId,
            callType: 'video',
          });
                    if (__DEV__) {
            console.log('✅ Call notification sent to receiver')
          };
        } catch (error) {
                    if (__DEV__) {
            console.warn('⚠️ Failed to send call notification:', error)
          };
        }

        let lastAnswerSdp: string | null = null;
        unsubCall = listenCall(callId, async (data) => {
          const callStatus = data.status;
          setStatus((prevStatus) => {
            // Only update if status actually changed to avoid unnecessary re-renders
            if (prevStatus !== callStatus) {
              return callStatus;
            }
            return prevStatus;
          });
          
          // Only apply answer if call is still active (not ended/missed) and peer connection exists
          if (data.answer && pcRef.current && callStatus !== 'ended' && callStatus !== 'missed') {
            // Check if answer was already applied (prevent duplicate application)
            const currentState = pcRef.current.signalingState;
            if (currentState === 'stable' || currentState === 'have-remote-answer') {
                            if (__DEV__) {
                console.log('⚠️ Caller: Answer already applied, skipping')
              };
              return;
            }
            
            // Check if this is the same answer we already tried to apply
            const currentAnswerSdp = typeof data.answer === 'string' ? data.answer : data.answer.sdp || '';
            if (lastAnswerSdp === currentAnswerSdp) {
                            if (__DEV__) {
                console.log('⚠️ Caller: Same answer already processed, skipping')
              };
              return;
            }
            lastAnswerSdp = currentAnswerSdp;
            
            try {
                            if (__DEV__) {
                console.log('📞 Caller: Received answer, applying...')
              };
                            if (__DEV__) {
                console.log('📞 Caller: Answer data:', typeof data.answer, data.answer?.type || 'no type', data.answer?.sdp ? 'has SDP' : 'no SDP')
              };
              
              // Validate answer before applying
              if (!data.answer || (typeof data.answer === 'object' && !data.answer.sdp && !data.answer.localDescription)) {
                                if (__DEV__) {
                  console.warn('⚠️ Caller: Invalid answer format, skipping')
                };
                return;
              }
              
              await applyAnswer(pcRef.current, data.answer);
                            if (__DEV__) {
                console.log('✅ Caller: Answer applied successfully')
              };
              
              // Fetch and process existing ICE candidates from receiver
              // Wait a bit for the answer to be fully applied
              setTimeout(async () => {
                try {
                                    if (__DEV__) {
                    console.log('📥 [Caller] Fetching existing ICE candidates from Firestore...')
                  };
                  const existingCandidates = await getExistingCandidates(callId);
                                    if (__DEV__) {
                    console.log('📥 [Caller] Found', existingCandidates.length, 'existing ICE candidates')
                  };
                  
                  if (existingCandidates.length === 0) {
                                        if (__DEV__) {
                      console.log('📊 [Caller] No existing ICE candidates to process')
                    };
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
                                                if (__DEV__) {
                          console.log(`✅ [Caller] Processed existing ICE candidate ${processedCount + 1} from:`, c.senderId)
                        };
                        processedIds.add(candidateKey);
                        processedCount++;
                      } catch (error: any) {
                                                if (__DEV__) {
                          console.error(`❌ [Caller] Error processing existing ICE candidate from ${c.senderId}:`, error.message || error)
                        };
                        errorCount++;
                      }
                    }
                    
                                        if (__DEV__) {
                      console.log(`📊 [Caller] ICE candidate processing summary: ${processedCount} processed, ${skippedCount} skipped (self/duplicates), ${errorCount} errors`)
                    };
                  }
                  
                  // Log connection state after processing candidates
                                    if (__DEV__) {
                    console.log('🔌 [Caller] Connection state after processing ICE candidates:', {
                    connectionState: pcRef.current.connectionState,
                    iceConnectionState: pcRef.current.iceConnectionState,
                  })
                  };
                } catch (error: any) {
                                    if (__DEV__) {
                    console.error('❌ [Caller] Error fetching existing ICE candidates:', error.message || error)
                  };
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
                                if (__DEV__) {
                  console.warn('⚠️ Caller: Ignoring answer error - connection state issue:', errorMessage)
                };
              } else {
                                if (__DEV__) {
                  console.error('❌ Caller: Error applying answer:', errorMessage)
                };
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
        let lastOfferSdp: string | null = null;
        unsubCall = listenCall(callId, async (data) => {
          setStatus((prevStatus) => {
            // Only update if status actually changed
            if (prevStatus !== data.status) {
              return data.status;
            }
            return prevStatus;
          });
          
          // Detect if offer has changed (e.g., switching from audio to video)
          if (data.offer && pcRef.current && data.status === 'active') {
            const currentOfferSdp = typeof data.offer === 'string' ? data.offer : data.offer.sdp || '';
            if (lastOfferSdp && lastOfferSdp !== currentOfferSdp) {
                            if (__DEV__) {
                console.log('🔄 [Receiver] Offer changed during active call - recreating peer connection for video')
              };
              try {
                // Close old peer connection
                if (pcRef.current) {
                  pcRef.current.getSenders().forEach((s: any) => s.track && s.track.stop());
                  pcRef.current.close();
                  pcRef.current = null;
                }
                if (localStreamRef.current) {
                  localStreamRef.current.getTracks().forEach((track: any) => track.stop());
                  localStreamRef.current = null;
                }
                
                // Recreate peer connection with new offer (video)
                                if (__DEV__) {
                  console.log('📞 [Receiver] Creating new peer connection with video offer...')
                };
                const { pc, localDescription } = await createPeer({
                  isCaller: false,
                  audioOnly: false,
                  onLocalStream: (stream) => {
                                        if (__DEV__) {
                      console.log('✅ [Receiver] New local stream created for video')
                    };
                    setLocal(stream);
                    localStreamRef.current = stream;
                    const hasVideoTrack = stream.getVideoTracks().length > 0;
                    if (hasVideoTrack) {
                      setIsVideoEnabled(true);
                    }
                  },
                  onRemoteStream: (stream) => {
                                        if (__DEV__) {
                      console.log('✅ [Receiver] New remote stream received for video')
                    };
                    const videoTracks = stream.getVideoTracks();
                    videoTracks.forEach((track: any) => {
                      track.enabled = true;
                    });
                    if (videoTracks.length > 0) {
                      setIsVideoEnabled(true);
                    }
                    setRemote(stream);
                  },
                  onIce: (c: any) => {
                    addIceCandidate(callId, receiverId, c);
                  },
                  offerSdp: data.offer,
                });
                
                pcRef.current = pc;
                
                // Create new answer
                const answerToStore = localDescription.toJSON ? localDescription.toJSON() : {
                  type: localDescription.type,
                  sdp: localDescription.sdp,
                };
                await answerCall(callId, answerToStore);
                                if (__DEV__) {
                  console.log('✅ [Receiver] New answer created and sent for video call')
                };
              } catch (error: any) {
                                if (__DEV__) {
                  console.error('❌ [Receiver] Error recreating peer connection:', error.message || error)
                };
              }
            }
            lastOfferSdp = currentOfferSdp;
          } else if (data.offer) {
            const currentOfferSdp = typeof data.offer === 'string' ? data.offer : data.offer.sdp || '';
            lastOfferSdp = currentOfferSdp;
          }
          
          // Don't auto-answer - wait for user to press accept button
          
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
                        if (__DEV__) {
              console.log(`🧊 [${roleLabel}] Received ICE candidate from:`, c.senderId)
            };
            try {
              await addRemoteIce(pcRef.current, c.candidate);
                            if (__DEV__) {
                console.log(`✅ [${roleLabel}] ICE candidate added successfully`)
              };
              // Log connection state after adding candidate
                            if (__DEV__) {
                console.log(`🔌 [${roleLabel}] Connection state after ICE candidate:`, {
                connectionState: pcRef.current.connectionState,
                iceConnectionState: pcRef.current.iceConnectionState,
              })
              };
            } catch (error: any) {
                            if (__DEV__) {
                console.error(`❌ [${roleLabel}] Error adding ICE candidate:`, error.message || error)
              };
            }
          } else {
            // Queue the candidate for later processing
                        if (__DEV__) {
              console.log(`📦 [${roleLabel}] Queueing ICE candidate (peer connection not ready yet) from:`, c.senderId)
            };
            iceCandidateQueueRef.current.push(c);
          }
        } else {
                    if (__DEV__) {
            console.log(`🧊 [${roleLabel}] Ignoring ICE candidate from self:`, c.senderId)
          };
        }
      });

      hangTimer = setTimeout(() => {
        // Use functional update to get current status
        setStatus((currentStatus) => {
          if (currentStatus === 'ringing') {
            endCall(callId, 'missed').catch(() => {});
          }
          return currentStatus;
        });
      }, 30000);
    })();

    return () => {
      unsubCall && unsubCall();
      unsubCand && unsubCand();
      if (pcRef.current) {
        pcRef.current.getSenders().forEach((s: any) => s.track && s.track.stop());
        pcRef.current.close();
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track: any) => track.stop());
        localStreamRef.current = null;
      }
      clearTimeout(hangTimer);
    };
  }, [callId, isCaller, callerId, receiverId, navigation, role]); // Removed 'status' from dependencies

  // Determine which video to show in main view and inset view
  // By default: remote in main (full screen), local in inset (small)
  // When swapped: local in main (full screen), remote in inset (small)
  const mainVideoStream = isSwapped ? local : remote;
  const insetVideoStream = isSwapped ? remote : local;
  
  // Check if streams have video tracks - but also check if stream exists
  // Show stream if it exists, even if tracks haven't arrived yet (they might arrive separately)
  const mainHasVideo = mainVideoStream && mainVideoStream.getVideoTracks().length > 0;
  const insetHasVideo = insetVideoStream && insetVideoStream.getVideoTracks().length > 0;
  
  // For main view: show if stream exists and has video, or if it's local (we know local has video)
  const shouldShowMainVideo = mainVideoStream && RTCViewRef.current && status === 'active' && isVideoEnabled && (
    mainHasVideo || mainVideoStream === local
  );
  
  // For inset view: show if stream exists and has video, or if it's local (we know local has video)
  const shouldShowInsetVideo = insetVideoStream && RTCViewRef.current && status === 'active' && isVideoEnabled && (
    insetHasVideo || insetVideoStream === local
  );

  // Debug logging for stream identification
  useEffect(() => {
    if (__DEV__ && status === 'active') {
      const localStreamId = local?.id || 'none';
      const remoteStreamId = remote?.id || 'none';
      const mainStreamId = mainVideoStream?.id || 'none';
      const insetStreamId = insetVideoStream?.id || 'none';
      
            if (__DEV__) {
        console.log('📹 Video Streams Status:', {
        hasLocal: !!local,
        hasRemote: !!remote,
        localStreamId,
        remoteStreamId,
        localVideoTracks: local?.getVideoTracks().length || 0,
        remoteVideoTracks: remote?.getVideoTracks().length || 0,
        isSwapped,
        mainStream: mainVideoStream === local ? 'LOCAL' : 'REMOTE',
        mainStreamId,
        insetStream: insetVideoStream === local ? 'LOCAL' : 'REMOTE',
        insetStreamId,
        mainHasVideo,
        insetHasVideo,
        shouldShowMainVideo,
        shouldShowInsetVideo,
        mainStreamURL: mainVideoStream?.toURL(),
        insetStreamURL: insetVideoStream?.toURL(),
      })
      };
      
      // Verify streams are different
      if (local && remote && local.id === remote.id) {
                if (__DEV__) {
          console.error('⚠️ CRITICAL: Local and remote streams have the same ID!')
        };
      }
      if (mainVideoStream && insetVideoStream && mainVideoStream.id === insetVideoStream.id && !isSwapped) {
                if (__DEV__) {
          console.warn('⚠️ Main and inset streams are the same when not swapped')
        };
      }
    }
  }, [local, remote, isSwapped, status, mainVideoStream, insetVideoStream, mainHasVideo, insetHasVideo, shouldShowMainVideo, shouldShowInsetVideo]);

  // Force re-render when remote stream tracks change
  const [remoteTrackCount, setRemoteTrackCount] = useState(0);
  const [remoteVideoTrackIds, setRemoteVideoTrackIds] = useState<string[]>([]);
  const [streamVersion, setStreamVersion] = useState(0); // Version counter to force RTCView updates
  const prevTrackDataRef = useRef<{ count: number; videoTrackIds: string; streamId: string }>({ 
    count: 0, 
    videoTrackIds: '',
    streamId: ''
  });
  
  useEffect(() => {
    if (remote && status === 'active') {
      const currentTrackCount = remote.getTracks().length;
      const currentVideoTracks = remote.getVideoTracks();
      const currentVideoTrackIds = currentVideoTracks.map((t: any) => t.id).sort();
      const currentVideoTrackIdsStr = JSON.stringify(currentVideoTrackIds);
      const currentStreamId = remote.id;
      
      // Check if stream ID changed (new stream reference) or tracks changed
      const streamIdChanged = currentStreamId !== prevTrackDataRef.current.streamId;
      const tracksChanged = currentTrackCount !== prevTrackDataRef.current.count || 
                           currentVideoTrackIdsStr !== prevTrackDataRef.current.videoTrackIds;
      
      if (streamIdChanged || tracksChanged) {
        prevTrackDataRef.current = {
          count: currentTrackCount,
          videoTrackIds: currentVideoTrackIdsStr,
          streamId: currentStreamId,
        };
        setRemoteTrackCount(currentTrackCount);
        setRemoteVideoTrackIds(currentVideoTrackIds);
        // Increment version to force RTCView to remount
        setStreamVersion(prev => prev + 1);
        if (__DEV__) {
          const audioTracks = remote.getAudioTracks();
          console.log('📹 Remote stream changed:', {
            streamId: currentStreamId,
            streamIdChanged,
            tracksChanged,
            videoTracks: currentVideoTracks.length,
            audioTracks: audioTracks.length,
            totalTracks: currentTrackCount,
            videoTrackIds: currentVideoTrackIds,
            streamURL: remote.toURL(),
          });
        }
      }
    } else if (!remote) {
      // Reset when remote stream is cleared
      prevTrackDataRef.current = { count: 0, videoTrackIds: '', streamId: '' };
      setRemoteTrackCount(0);
      setRemoteVideoTrackIds([]);
      setStreamVersion(0);
    }
  }, [remote, status]); // Removed remoteTrackCount and remoteVideoTrackIds from dependencies

  return (
    <View style={callingStyles.videoCallContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      {/* Main video feed (full screen) - shows remote by default, local when swapped */}
      {shouldShowMainVideo && mainVideoStream ? (
        <RTCViewRef.current 
          key={`main-${mainVideoStream.id || 'main'}-${isSwapped ? 'local' : 'remote'}-${mainVideoStream === local ? (local?.getVideoTracks().map((t: any) => t.id).join('-') || '') : `${remoteVideoTrackIds.join('-')}-v${streamVersion}`}`}
          streamURL={mainVideoStream.toURL()} 
          style={callingStyles.mainVideoFeed} 
          objectFit="cover" 
          mirror={mainVideoStream === local && facingMode === 'user'}
          zOrder={0}
        />
      ) : (
        <View style={[callingStyles.mainVideoFeed, { backgroundColor: COLORS.black, justifyContent: 'center', alignItems: 'center' }]}>
          {otherUser && (
            <>
              <Image
                source={{
                  uri: otherUser.profileImage || 'https://via.placeholder.com/150',
                }}
                style={{ width: 120, height: 120, borderRadius: 60 }}
              />
              <Text style={{ color: COLORS.white, marginTop: 16, fontSize: 18, fontWeight: '600' }}>
                {otherUser.name}
              </Text>
            </>
          )}
        </View>
      )}

      {/* User info overlay - only show when no remote video */}
      {!remote && otherUser && (
        <View style={{ position: 'absolute', top: insets.top + 20, left: 20, right: 20, zIndex: 5 }}>
          <Text style={{ color: COLORS.white, fontSize: 24, fontWeight: 'bold' }}>
            {otherUser.name}
          </Text>
          <Text style={{ color: COLORS.white, fontSize: 14, marginTop: 4 }}>
            {status === 'ringing' ? 'Ringing...' : status === 'active' ? 'In Call' : status}
          </Text>
        </View>
      )}

      {/* Inset video preview (small) - shows local by default, remote when swapped */}
      {/* Only show when call is active and video is enabled */}
      {shouldShowInsetVideo && (
        <TouchableOpacity
          style={[
            callingStyles.insetVideoContainer,
            { bottom: insets.bottom + 100 },
          ]}
          onPress={handleSwap}
          activeOpacity={0.8}
        >
          <RTCViewRef.current 
            key={`inset-${insetVideoStream.id || 'inset'}-${isSwapped ? 'remote' : 'local'}-${insetVideoStream === local ? (local?.getVideoTracks().map((t: any) => t.id).join('-') || '') : `${remoteVideoTrackIds.join('-')}-v${streamVersion}`}`}
            streamURL={insetVideoStream.toURL()} 
            style={callingStyles.insetVideo} 
            objectFit="cover" 
            mirror={insetVideoStream === local && facingMode === 'user'}
            zOrder={1}
          />
        </TouchableOpacity>
      )}

      {/* Call Control Buttons - Bottom */}
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
                     <Phone size={28} color={COLORS.white} style={{ transform: [{ rotate: '135deg' }] }} />
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
            {status === 'active' && (
        <TouchableOpacity
          style={callingStyles.controlButton}
                onPress={handleSwitchCamera}
                disabled={!isVideoEnabled}
              >
                <Camera size={24} color={isVideoEnabled ? COLORS.black : COLORS.gray} />
              </TouchableOpacity>
            )}
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

export default VideoCallingScreen;
