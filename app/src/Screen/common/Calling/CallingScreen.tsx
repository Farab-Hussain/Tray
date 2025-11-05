import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, BackHandler } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Phone, Mic, MicOff, Camera } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import { callingStyles } from '../../../constants/styles/callingStyles';
import { createPeer, applyAnswer, addRemoteIce } from '../../../webrtc/peer';
import { addIceCandidate, answerCall, createCall, endCall, listenCall, listenCandidates, getCallOnce, type CallDocument } from '../../../services/call.service';
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

  const pcRef = useRef<any | null>(null);
  const localStreamRef = useRef<any | null>(null);
  const statusRef = useRef<'ringing' | 'active' | 'ended' | 'missed'>('ringing');
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
        console.log('📞 Caller: Creating peer connection...');
        const { pc, localDescription } = await createPeer({
          isCaller: true,
          audioOnly: true,
          onLocalStream: (stream) => {
            console.log('✅ Local stream created for caller');
            setLocal(stream);
            localStreamRef.current = stream;
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
        if (c.senderId !== myId && pcRef.current) await addRemoteIce(pcRef.current, c.candidate);
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
      const { pc, localDescription } = await createPeer({
        isCaller: false,
        audioOnly: true,
        onLocalStream: (stream) => {
          console.log('✅ Local stream created for receiver');
          setLocal(stream);
          localStreamRef.current = stream;
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
    
    audioTracks.forEach((track: any) => {
      track.enabled = !newMutedState;
    });
    
    setIsMuted(newMutedState);
  };

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
