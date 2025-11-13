import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Image, ViewStyle } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../../constants/core/colors";
import { useAuth } from "../../contexts/AuthContext";
import { ConsultantService } from "../../services/consultant.service";
import { UserService } from "../../services/user.service";
import { getConsultantProfile } from "../../services/consultantFlow.service";
import { User } from "lucide-react-native";

interface HomeHeaderProps {
  name?: string;
  subtitle?: string;
  avatarUri?: string;
  style?: ViewStyle;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  name,
  subtitle = "start your productive day",
  avatarUri,
  style,
}) => {
  const { user, role } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageCacheKey, setImageCacheKey] = useState(0);
  
  // Fetch profile image based on user role
  const fetchProfileImage = useCallback(async () => {
    if (user?.uid && !avatarUri) {
      try {
        setLoading(true);
        console.log('🔍 [HomeHeader] Fetching profile image for role:', role);
        
        if (role === 'consultant') {
          // Fetch consultant profile image using the same service as ConsultantAccount
          const profile = await getConsultantProfile(user.uid);
          console.log('🔍 [HomeHeader] Consultant profile:', JSON.stringify({
            uid: profile.uid,
            hasPersonalInfo: !!profile.personalInfo,
            hasProfileImage: !!profile.personalInfo?.profileImage,
            profileImage: profile.personalInfo?.profileImage ? 'present' : 'missing'
          }, null, 2));
          
          const consultantImage = profile?.personalInfo?.profileImage;
          console.log('🔍 [HomeHeader] Consultant profileImage:', consultantImage);
          
          if (consultantImage && consultantImage.trim() !== '') {
            console.log('✅ [HomeHeader] Found consultant profile image:', consultantImage);
            setProfileImage(consultantImage.trim());
          } else {
            console.log('ℹ️ [HomeHeader] No consultant profile image found, will use fallback');
            setProfileImage(null);
          }
        } else if (role === 'student') {
          // Fetch student profile image
          const response = await UserService.getUserProfile();
          console.log('🔍 [HomeHeader] Student response:', JSON.stringify(response, null, 2));
          
          let studentImage = response?.profileImage;
          console.log('🔍 [HomeHeader] Student profileImage:', studentImage);
          
          // If student profile has no image, check consultant profile as fallback (if user has consultant role)
          if (!studentImage && response?.roles?.includes('consultant')) {
            try {
              console.log('🔄 [HomeHeader] Student profile has no image, checking consultant profile as fallback...');
              const consultantProfile = await getConsultantProfile(user.uid);
              const consultantImage = consultantProfile?.personalInfo?.profileImage;
              
              if (consultantImage && consultantImage.trim() !== '') {
                console.log('✅ [HomeHeader] Found consultant profile image as fallback:', consultantImage);
                studentImage = consultantImage.trim();
              } else {
                console.log('ℹ️ [HomeHeader] No consultant profile image found either');
              }
            } catch (consultantError) {
              // If consultant profile fetch fails, continue with student profile
              console.warn('⚠️ [HomeHeader] Failed to fetch consultant profile as fallback:', consultantError);
            }
          }
          
          if (studentImage) {
            console.log('✅ [HomeHeader] Found student profile image:', studentImage);
            setProfileImage(studentImage);
          } else {
            console.log('ℹ️ [HomeHeader] No student profile image found');
            setProfileImage(null);
          }
        }
      } catch (error: any) {
        console.log('⚠️ [HomeHeader] Could not fetch profile image:', error);
        console.log('⚠️ [HomeHeader] Error details:', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data
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
      console.log('🔄 [HomeHeader] user.photoURL changed, updating cache key');
      setImageCacheKey(prev => prev + 1);
    }
  }, [user?.photoURL]);

  // Reload profile image when screen comes into focus (to get updated image)
  useFocusEffect(
    useCallback(() => {
      fetchProfileImage();
      setImageCacheKey(prev => prev + 1);
    }, [fetchProfileImage])
  );
  
  // Use props if provided, otherwise fall back to user data
  const displayName = name || user?.displayName || user?.email?.split('@')[0] || "User";
  
  // Priority: props > fetched profile image > user.photoURL (from AuthContext, which includes backend profileImage)
  // Use user.photoURL as primary source since it's updated by refreshUser() and includes backend profileImage
  const userAvatarUri = avatarUri || 
                       user?.photoURL || 
                       profileImage;
  
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
            console.log('⚠️ [HomeHeader] Failed to load profile image');
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

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.green,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#222",
  },
  wave: {
    fontSize: 32,
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#444",
    marginTop: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginLeft: 16,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginLeft: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray,
  },
});

export default HomeHeader;
