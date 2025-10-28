import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Video, Phone, Mic, MicOff } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import { callingStyles } from '../../../constants/styles/callingStyles';

const CallingScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  
  // State for mute
  const [isMuted, setIsMuted] = useState(false);

  const handleHangup = () => {
    // Navigate back or end call
    navigation.goBack();
  };

  const handleVideoCall = () => {
    // Navigate to video call screen
    navigation.navigate('VideoCallingScreen');
  };

  const handleMute = () => {
    setIsMuted((prev) => !prev);
    console.log('Mute toggled:', !isMuted);
  };

  return (
    <SafeAreaView style={[callingStyles.container, { paddingTop: insets.top }]}>
      {/* Profile Section */}
      <View style={callingStyles.profileContainer}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          }}
          style={callingStyles.profileImage}
        />
        <Text style={callingStyles.name}>Viv Richards</Text>
        <Text style={callingStyles.status}>Ringing</Text>
      </View>

      {/* Action Buttons */}
      <View
        style={[
          callingStyles.buttonContainer,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        <TouchableOpacity
          style={callingStyles.iconButton}
          onPress={handleVideoCall}
        >
          <Video size={28} color={COLORS.black} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[callingStyles.iconButton, callingStyles.hangupButton]}
          onPress={handleHangup}
        >
          <Phone size={28} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity style={callingStyles.iconButton} onPress={handleMute}>
          {isMuted ? (
            <MicOff size={28} color={COLORS.black} />
          ) : (
            <Mic size={28} color={COLORS.black} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CallingScreen;
