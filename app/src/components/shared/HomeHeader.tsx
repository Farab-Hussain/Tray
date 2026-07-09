import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/user.service';
import { getConsultantProfile } from '../../services/consultantFlow.service';
import { homeHeaderStyles } from '../../constants/styles/homeHeaderStyles';
import { normalizeAvatarUrl } from '../../utils/normalize';
import ProfileAvatar from '../ui/ProfileAvatar';
import { logger } from '../../utils/logger';

interface HomeHeaderProps {
  name?: string;
  subtitle?: string;
  avatarUri?: string;
  style?: ViewStyle;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  name,
  subtitle = 'start your productive day',
  avatarUri,
  style,
}) => {
  const { user, role } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [_loading, setLoading] = useState(false);
  const [imageCacheKey, setImageCacheKey] = useState(0);

  const fetchHeaderProfile = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      logger.debug('🔍 [HomeHeader] Fetching header profile for role:', role);

      let nextName: string | null = null;
      let nextImage: string | null = null;

      // Always prefer consultantProfiles for consultants (onboarding source of truth)
      if (role === 'consultant') {
        try {
          const profile = await getConsultantProfile(user.uid);
          const fullName = profile?.personalInfo?.fullName?.trim();
          if (fullName) nextName = fullName;

          const consultantImage = normalizeAvatarUrl({
            profileImage: profile?.personalInfo?.profileImage,
          });
          if (consultantImage?.trim()) {
            nextImage = consultantImage.trim();
          }
        } catch (consultantError) {
          logger.warn('⚠️ [HomeHeader] Consultant profile fetch failed:', consultantError);
        }
      }

      // Fallback / students: users doc via /auth/me
      if (!nextName || !nextImage) {
        try {
          const response = await UserService.getUserProfile();
          if (!nextName) {
            const userName = String(response?.name || response?.displayName || '').trim();
            if (userName && userName !== 'User') nextName = userName;
          }
          if (!nextImage) {
            const studentImage = normalizeAvatarUrl(response);
            if (studentImage?.trim()) nextImage = studentImage.trim();
          }

          // Student with consultant role but no image yet
          if (
            !nextImage &&
            role !== 'consultant' &&
            response?.roles?.includes('consultant')
          ) {
            try {
              const consultantProfile = await getConsultantProfile(user.uid);
              const consultantImage = normalizeAvatarUrl({
                profileImage: consultantProfile?.personalInfo?.profileImage,
              });
              if (consultantImage?.trim()) nextImage = consultantImage.trim();
              if (!nextName) {
                const fullName = consultantProfile?.personalInfo?.fullName?.trim();
                if (fullName) nextName = fullName;
              }
            } catch {
              // ignore
            }
          }
        } catch (userError) {
          logger.warn('⚠️ [HomeHeader] User profile fetch failed:', userError);
        }
      }

      setResolvedName(nextName);
      setProfileImage(nextImage);
    } catch (error: any) {
      logger.warn('⚠️ [HomeHeader] Could not fetch header profile:', {
        message: error?.message,
        status: error?.response?.status,
      });
    } finally {
      setLoading(false);
    }
  }, [user?.uid, role]);

  useEffect(() => {
    fetchHeaderProfile();
  }, [fetchHeaderProfile]);

  useEffect(() => {
    if (user?.photoURL || user?.displayName) {
      setImageCacheKey(prev => prev + 1);
    }
  }, [user?.photoURL, user?.displayName]);

  useFocusEffect(
    useCallback(() => {
      fetchHeaderProfile();
      setImageCacheKey(prev => prev + 1);
    }, [fetchHeaderProfile]),
  );

  const displayName =
    (name && name.trim()) ||
    resolvedName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'User';

  const userAvatarUri = avatarUri || profileImage || user?.photoURL;

  return (
    <View style={[styles.headerContainer, style]}>
      <View style={styles.textContainer}>
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>Hi {displayName}</Text>
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <ProfileAvatar
        uid={user?.uid || ''}
        role={role || 'student'}
        imageUri={userAvatarUri ? `${userAvatarUri}?t=${imageCacheKey}` : undefined}
        fallbackText={displayName}
        size={44}
      />
    </View>
  );
};

const styles = homeHeaderStyles;

export default HomeHeader;
