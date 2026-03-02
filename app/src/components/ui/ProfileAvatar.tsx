import React from 'react';
import { TouchableOpacity, Image, View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/core/colors';
import { normalizeAvatarUrl } from '../../utils/normalize';

type Props = {
  uid: string;
  role: 'student' | 'consultant' | 'recruiter';
  imageUri?: string | null;
  size?: number;
  fallbackText?: string;
  style?: any;
};

const ProfileAvatar: React.FC<Props> = ({
  uid,
  role,
  imageUri,
  size = 44,
  fallbackText,
  style,
}) => {
  const navigation = useNavigation<any>();
  const uri = normalizeAvatarUrl({ profileImage: imageUri });
  const dim = { width: size, height: size, borderRadius: size / 2 };

  const handlePress = () => {
    if (!uid || !role) return;
    navigation.navigate('PublicProfile', { uid, role });
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={style}>
      {uri ? (
        <Image source={{ uri: uri }} style={[styles.avatar, dim]} />
      ) : (
        <View style={[styles.placeholder, dim]}>
          <Text style={styles.placeholderText}>
            {(fallbackText || '').charAt(0).toUpperCase() || role.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: COLORS.lightGray,
  },
  placeholder: {
    backgroundColor: '#A5AFBD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: COLORS.white,
    fontWeight: '700',
  },
});

export default ProfileAvatar;

