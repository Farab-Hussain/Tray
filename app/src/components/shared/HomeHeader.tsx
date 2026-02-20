import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, ViewStyle } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants/core/colors';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/user.service';
import { getConsultantProfile } from '../../services/consultantFlow.service';
import { User } from 'lucide-react-native';
import { homeHeaderStyles } from '../../constants/styles/homeHeaderStyles';
import { normalizeAvatarUrl } from '../../utils/normalize';
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
  const [_loading, setLoading] = useState(false);
  const [imageCacheKey, setImageCacheKey] = useState(0);

  // Fetch profile image based on user role
  const fetchProfileImage = useCallback(async () => {
    if (user?.uid && !avatarUri) {
      try {
        setLoading(true);
        logger.debug('🔍 [HomeHeader] Fetching profile image for role:', role);

        if (role === 'consultant') {
          // Fetch consultant profile image using the same service as ConsultantAccount
          const profile = await getConsultantProfile(user.uid);
          logger.debug('🔍 [HomeHeader] Consultant profile loaded for:', profile?.uid);

          const consultantImage = normalizeAvatarUrl({
            profileImage: profile?.personalInfo?.profileImage,
          });

          if (consultantImage && consultantImage.trim() !== '') {
            logger.debug('✅ [HomeHeader] Found consultant profile image');
            setProfileImage(consultantImage.trim());
          } else {
            logger.debug('ℹ️ [HomeHeader] No consultant profile image found, will use fallback');
            setProfileImage(null);
          }
        } else if (role === 'student') {
          // Fetch student profile image
          const response = await UserService.getUserProfile();

          let studentImage = normalizeAvatarUrl(response);

          // If student profile has no image, check consultant profile as fallback (if user has consultant role)
          if (!studentImage && response?.roles?.includes('consultant')) {
            try {
              logger.debug('🔄 [HomeHeader] Student profile has no image, checking consultant profile as fallback...');
              const consultantProfile = await getConsultantProfile(user.uid);
              const consultantImage = normalizeAvatarUrl({
                profileImage: consultantProfile?.personalInfo?.profileImage,
              });

              if (consultantImage && consultantImage.trim() !== '') {
                logger.debug('✅ [HomeHeader] Found consultant profile image as fallback');
                studentImage = consultantImage.trim();
              } else {
                logger.debug('ℹ️ [HomeHeader] No consultant profile image found either');
              }
            } catch (consultantError) {
              // If consultant profile fetch fails, continue with student profile
              logger.warn('⚠️ [HomeHeader] Failed to fetch consultant profile as fallback:', consultantError);
            }
          }

          if (studentImage) {
            logger.debug('✅ [HomeHeader] Found student profile image');
            setProfileImage(studentImage);
          } else {
            logger.debug('ℹ️ [HomeHeader] No student profile image found');
            setProfileImage(null);
          }
        }
      } catch (error: any) {
        logger.warn('⚠️ [HomeHeader] Could not fetch profile image:', {
          message: error?.message,
          status: error?.response?.status,
        });
        // Don't show error to user, just fall back to default
        setProfileImage(null);
      } finally {
        setLoading(false);
      }
    }
  }, [user?.uid, role, avatarUri]);

  useEffect(() => {
    fetchProfileImage();
  }, [fetchProfileImage]);

  // Reload when user.photoURL changes (from AuthContext refreshUser)
  useEffect(() => {
    if (user?.photoURL) {
      logger.debug('🔄 [HomeHeader] user.photoURL changed, updating cache key');
      setImageCacheKey(prev => prev + 1);
    }
  }, [user?.photoURL]);

  // Reload profile image when screen comes into focus (to get updated image)
  useFocusEffect(
    useCallback(() => {
      fetchProfileImage();
      setImageCacheKey(prev => prev + 1);
    }, [fetchProfileImage]),
  );

  // Use props if provided, otherwise fall back to user data
  const displayName =
    name || user?.displayName || user?.email?.split('@')[0] || 'User';

  // Priority: props > fetched profile image > user.photoURL (from AuthContext, which includes backend profileImage)
  // Use user.photoURL as primary source since it's updated by refreshUser() and includes backend profileImage
  const userAvatarUri = avatarUri || user?.photoURL || profileImage;

  return (
    <View style={[styles.headerContainer, style]}>
      <View style={styles.textContainer}>
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>Hi {displayName}</Text>
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {userAvatarUri ? (
        <Image
          source={{ uri: `${userAvatarUri}?t=${imageCacheKey}` }}
          style={styles.avatar}
          key={`${userAvatarUri}-${imageCacheKey}`}
          onError={() => {
            logger.warn('⚠️ [HomeHeader] Failed to load profile image');
          }}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          {role === 'student' ? (
            <User size={24} color={COLORS.gray} />
          ) : (
            <Text style={styles.avatarPlaceholderText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = homeHeaderStyles;

export default HomeHeader;
