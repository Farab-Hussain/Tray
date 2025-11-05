import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, StatusBar, Text, Image, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Phone, Mic, MicOff, FlipHorizontal } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import { callingStyles } from '../../../constants/styles/callingStyles';
import { createPeer, applyAnswer, addRemoteIce } from '../../../webrtc/peer';
import { addIceCandidate, answerCall, createCall, endCall, listenCall, listenCandidates, getCallOnce, type CallDocument } from '../../../services/call.service';
import { UserService } from '../../../services/user.service';
import { useAuth } from '../../../contexts/AuthContext';
// Avoid static RTCView import; require dynamically to prevent crashes if pod not installed

const VideoCallingScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { role } = useAuth();

  const [isSwapped, setIsSwapped] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user'); // 'user' = front, 'environment' = back
  const [status, setStatus] = useState<'ringing' | 'active' | 'ended' | 'missed'>('ringing');
  const [local, setLocal] = useState<any | null>(null);
  const [remote, setRemote] = useState<any | null>(null);
  const [otherUser, setOtherUser] = useState<{ name: string; profileImage?: string } | null>(null);

  const pcRef = useRef<any | null>(null);
  const localStreamRef = useRef<any | null>(null);
  const RTCViewRef = useRef<any>(null);
  const { callId, isCaller, callerId, receiverId } = route?.params || {};

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
      console.log('📞 Accepting video call...');
      
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
      const { pc, localDescription } = await createPeer({
        isCaller: false,
        audioOnly: false,
        onLocalStream: (stream) => {
          console.log('✅ Local stream created for receiver');
          setLocal(stream);
          localStreamRef.current = stream;
          const hasVideoTrack = stream.getVideoTracks().length > 0;
          if (hasVideoTrack) {
            setIsVideoEnabled(true);
          }
        },
        onRemoteStream: (stream) => {
          console.log('✅ Remote stream received by receiver');
          setRemote(stream);
        },
        onIce: (c: any) => {
          console.log('🧊 Sending ICE candidate from receiver');
          addIceCandidate(callId, receiverId, c);
        },
        offerSdp: callData.offer,
      });
      
      pcRef.current = pc;
      console.log('📞 Answering call...');
      // Serialize the answer for Firestore storage
      const answerToStore = localDescription.toJSON ? localDescription.toJSON() : {
        type: localDescription.type,
        sdp: localDescription.sdp,
      };
      await answerCall(callId, answerToStore);
      setStatus('active');
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
    
    audioTracks.forEach((track: any) => {
      track.enabled = !newMutedState;
    });
    
    setIsMuted(newMutedState);
  };

  const handleSwitchCamera = async () => {
    if (!localStreamRef.current || !pcRef.current || !isVideoEnabled) {
      if (__DEV__) {
        console.log('⚠️ Cannot switch camera: stream or peer connection not ready');
      }
      return;
    }
    
    // Check if peer connection is in a valid state
    if (pcRef.current.signalingState === 'closed' || pcRef.current.connectionState === 'closed') {
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
      
      // Find the video sender
      const sender = pcRef.current.getSenders().find((s: any) => s.track && s.track.kind === 'video');
      
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
      if (pcRef.current.signalingState === 'stable' && pcRef.current.connectionState !== 'closed') {
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
        console.log('⚠️ Peer connection already exists, skipping creation');
        return;
      }

      if (isCaller) {
        console.log('📞 Caller: Creating video peer connection...');
        const { pc, localDescription } = await createPeer({
          isCaller: true,
          audioOnly: false,
          onLocalStream: (stream) => {
            console.log('✅ Local stream created for caller');
            setLocal(stream);
            localStreamRef.current = stream;
            const hasVideoTrack = stream.getVideoTracks().length > 0;
            if (hasVideoTrack) {
              setIsVideoEnabled(true);
            }
          },
          onRemoteStream: (stream) => {
            console.log('✅ Remote stream received by caller');
            setRemote(stream);
          },
          onIce: (c: any) => {
            console.log('🧊 Sending ICE candidate from caller');
            addIceCandidate(callId, callerId, c);
          },
        });
        pcRef.current = pc;
        console.log('📞 Creating video call document...');
        await createCall(callId, { callerId, receiverId, type: 'video', offer: localDescription });
        
        // Send push notification to receiver
        try {
          const { api } = require('../../../lib/fetcher');
          await api.post('/notifications/send-call', {
            callId,
            callerId,
            receiverId,
            callType: 'video',
          });
          console.log('✅ Call notification sent to receiver');
        } catch (error) {
          console.warn('⚠️ Failed to send call notification:', error);
        }

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
              console.log('⚠️ Caller: Answer already applied, skipping');
              return;
            }
            
            try {
              console.log('📞 Caller: Received answer, applying...');
              console.log('📞 Caller: Answer data:', typeof data.answer, data.answer?.type || 'no type', data.answer?.sdp ? 'has SDP' : 'no SDP');
              
              // Validate answer before applying
              if (!data.answer || (typeof data.answer === 'object' && !data.answer.sdp && !data.answer.localDescription)) {
                console.warn('⚠️ Caller: Invalid answer format, skipping');
                return;
              }
              
              await applyAnswer(pcRef.current, data.answer);
              console.log('✅ Caller: Answer applied successfully');
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
          setStatus((prevStatus) => {
            // Only update if status actually changed
            if (prevStatus !== data.status) {
              return data.status;
            }
            return prevStatus;
          });
          
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
        if (c.senderId !== myId && pcRef.current) await addRemoteIce(pcRef.current, c.candidate);
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

  return (
    <View style={callingStyles.videoCallContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      {/* Main video feed (full screen) - shows remote by default, local when swapped */}
      {mainVideoStream && RTCViewRef.current && status === 'active' && isVideoEnabled ? (
        <RTCViewRef.current 
          streamURL={mainVideoStream.toURL()} 
          style={callingStyles.mainVideoFeed} 
          objectFit="cover" 
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
      {insetVideoStream && RTCViewRef.current && status === 'active' && isVideoEnabled && (
        <TouchableOpacity
          style={[
            callingStyles.insetVideoContainer,
            { bottom: insets.bottom + 100 },
          ]}
          onPress={handleSwap}
          activeOpacity={0.8}
        >
          <RTCViewRef.current 
            streamURL={insetVideoStream.toURL()} 
            style={callingStyles.insetVideo} 
            objectFit="cover" 
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
                <FlipHorizontal size={24} color={isVideoEnabled ? COLORS.black : COLORS.gray} />
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
