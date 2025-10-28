import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Phone, Mic, MicOff } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import { callingStyles } from '../../../constants/styles/callingStyles';

const VideoCallingScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  // State for swapping videos
  const [isSwapped, setIsSwapped] = useState(false);

  // State for mute
  const [isMuted, setIsMuted] = useState(false);

  const handleHangup = () => {
    navigation.goBack();
  };

  // Shift to audio call
  const handleAudioCall = () => {
    navigation.replace('CallingScreen');
  };

  const handleMute = () => {
    setIsMuted((prev) => !prev);
    console.log('Mute toggle');
  };

  const handleSwap = () => {
    setIsSwapped(!isSwapped);
  };

  // Video URIs
  const mainVideo = isSwapped
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&h=1500&fit=crop&crop=face'
    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&h=1500&fit=crop&crop=face';

  const insetVideo = isSwapped
    ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=150&fit=crop&crop=face'
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=150&fit=crop&crop=face';

  return (
    <View style={callingStyles.videoCallContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      {/* Main Video Feed */}
      <Image
        source={{ uri: mainVideo }}
        style={callingStyles.mainVideoFeed}
        resizeMode="cover"
      />

      {/* Call Control Buttons - Bottom */}
      <View
        style={[
          callingStyles.bottomControls,
          { bottom: insets.bottom + 20 },
        ]}
      >
        <TouchableOpacity
          style={callingStyles.controlButton}
          onPress={handleAudioCall}
        >
          <Phone size={24} color={COLORS.black} />
        </TouchableOpacity>
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
      </View>

      {/* Inset Video Feed - Click to Swap */}
      <TouchableOpacity
        style={[
          callingStyles.insetVideoContainer,
          { bottom: insets.bottom + 100 },
        ]}
        onPress={handleSwap}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: insetVideo }}
          style={callingStyles.insetVideo}
          resizeMode="cover"
        />
      </TouchableOpacity>
    </View>
  );
};

export default VideoCallingScreen;
