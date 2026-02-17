import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, ArrowLeft } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import { 
  createCall, 
  answerCall, 
  endCall, 
  listenCall,
  CallDocument 
} from '../../../services/call.service';
import { useAuth } from '../../../contexts/AuthContext';

export default function CallScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  const { consultantId, callType }: { consultantId: string; callType: 'audio' | 'video' } = route.params as any;
  const [callStatus, setCallStatus] = useState<'ringing' | 'active' | 'ended' | 'missed'>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [callId, setCallId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const callStartTime = useRef<number>(Date.now());
  const durationInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    initializeCall();
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [consultantId, callType]);

  useEffect(() => {
    if (callStatus === 'active') {
      callStartTime.current = Date.now();
      durationInterval.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
      }, 1000);
    } else {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    }
  }, [callStatus]);

  const initializeCall = async () => {
    try {
      setLoading(true);
      
      // Generate unique call ID
      const newCallId = `call_${user?.uid}_${consultantId}_${Date.now()}`;
      setCallId(newCallId);
      
      // Create call document
      await createCall(newCallId, {
        callerId: user?.uid || '',
        receiverId: consultantId,
        type: callType,
        offer: {}, // WebRTC offer would go here
      });
      
      // Listen for call status changes
      const unsubscribe = listenCall(newCallId, (callData: CallDocument) => {
        setCallStatus(callData.status);
        
        if (callData.status === 'ended' || callData.status === 'missed') {
          setTimeout(() => {
            navigation.goBack();
          }, 2000);
        }
      });
      
      return unsubscribe;
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize call');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = async () => {
    try {
      await endCall(callId, 'ended');
      setCallStatus('ended');
    } catch (error) {
      Alert.alert('Error', 'Failed to end call');
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    // WebRTC implementation would go here
  };

  const handleToggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    // WebRTC implementation would go here
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={styles.loadingText}>Initializing call...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {callType === 'video' ? 'Video Call' : 'Audio Call'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Video/Audio Placeholder */}
        <View style={styles.mediaContainer}>
          {callType === 'video' && !isVideoOff ? (
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>Video Feed</Text>
            </View>
          ) : (
            <View style={styles.audioPlaceholder}>
              <Phone size={80} color={COLORS.white} />
              <Text style={styles.audioPlaceholderText}>
                {callType === 'video' ? 'Video Off' : 'Audio Call'}
              </Text>
            </View>
          )}
        </View>

        {/* Call Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {callStatus === 'ringing' && 'Ringing...'}
            {callStatus === 'active' && formatDuration(callDuration)}
            {callStatus === 'ended' && 'Call Ended'}
            {callStatus === 'missed' && 'Call Missed'}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={handleToggleMute}
          >
            <MicOff size={24} color={COLORS.white} />
          </TouchableOpacity>
          
          {callType === 'video' && (
            <TouchableOpacity
              style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
              onPress={handleToggleVideo}
            >
              <VideoOff size={24} color={COLORS.white} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.endCallButton, callStatus === 'ended' && styles.endCallButtonDisabled]}
            onPress={handleEndCall}
            disabled={callStatus === 'ended' || callStatus === 'missed'}
          >
            <PhoneOff size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    color: COLORS.white,
    fontSize: 16,
  },
  audioPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioPlaceholderText: {
    color: COLORS.white,
    fontSize: 18,
    marginTop: 16,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statusText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gray + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: COLORS.red + '40',
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
});
