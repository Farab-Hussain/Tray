import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Phone, PhoneOff, UserRound, Video } from 'lucide-react-native';
import { COLORS } from '../../constants/core/colors';
import { incomingCallStyles as styles } from '../../constants/styles/incomingCallStyles';

type IncomingCallRingingViewProps = {
  callMode: 'audio' | 'video';
  displayName?: string;
  profileImage?: string;
  avatarLoadFailed?: boolean;
  onAvatarError?: () => void;
  isLoading?: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

export const IncomingCallRingingView = ({
  callMode,
  displayName,
  profileImage,
  avatarLoadFailed = false,
  onAvatarError,
  isLoading = false,
  onAccept,
  onDecline,
}: IncomingCallRingingViewProps) => {
  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(1)).current;

  const isVideo = callMode === 'video';
  const subtitle = isVideo ? 'Incoming video call' : 'Incoming audio call';

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.green} />
      <View style={styles.bottomFade} pointerEvents="none" />

      <View style={{ paddingTop: insets.top + 16, alignItems: 'center' }}>
        <View style={styles.topBadge}>
          <Text style={styles.topBadgeText}>Tray call</Text>
        </View>
      </View>

      <View style={styles.profileSection}>
        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.white} />
        ) : (
          <>
            <Animated.View
              style={[styles.avatarRingOuter, { transform: [{ scale: pulse }] }]}
            >
              <View style={styles.avatarRingInner}>
                {profileImage && !avatarLoadFailed ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.avatarImage}
                    onError={onAvatarError}
                  />
                ) : (
                  <UserRound size={64} color={COLORS.white} />
                )}
              </View>
            </Animated.View>

            <Text style={styles.callerName}>{displayName || 'Incoming call'}</Text>
            <View style={styles.callTypeRow}>
              {isVideo ? (
                <Video size={18} color={COLORS.white} />
              ) : (
                <Phone size={18} color={COLORS.white} />
              )}
              <Text style={styles.callTypeText}>{subtitle}</Text>
            </View>
          </>
        )}
      </View>

      <View
        style={[
          styles.actionsRow,
          { marginBottom: insets.bottom + 20 },
        ]}
      >
        <View style={styles.actionColumn}>
          <TouchableOpacity
            style={styles.declineButton}
            onPress={onDecline}
            accessibilityLabel="Decline call"
            activeOpacity={0.85}
          >
            <PhoneOff size={30} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.actionLabel}>Decline</Text>
        </View>

        <View style={styles.actionColumn}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={onAccept}
            accessibilityLabel="Accept call"
            activeOpacity={0.85}
          >
            {isVideo ? (
              <Video size={28} color={COLORS.green} />
            ) : (
              <Phone size={28} color={COLORS.green} />
            )}
          </TouchableOpacity>
          <Text style={styles.actionLabel}>Accept</Text>
        </View>
      </View>
    </View>
  );
};
