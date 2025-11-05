import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, ViewStyle } from "react-native";
import { COLORS } from "../../constants/core/colors";
import { useAuth } from "../../contexts/AuthContext";
import { ConsultantService } from "../../services/consultant.service";
import { UserService } from "../../services/user.service";
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
  
  // Fetch profile image based on user role
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (user?.uid && !avatarUri) {
        try {
          setLoading(true);
          console.log('🔍 [HomeHeader] Fetching profile image for role:', role);
          
          if (role === 'consultant') {
            // Fetch consultant profile image
            const response = await ConsultantService.getConsultantProfile(user.uid);
            console.log('🔍 [HomeHeader] Consultant response:', JSON.stringify(response, null, 2));
            
            const consultantImage = response?.profile?.personalInfo?.profileImage;
            console.log('🔍 [HomeHeader] Consultant profileImage:', consultantImage);
            
            if (consultantImage) {
              console.log('✅ [HomeHeader] Found consultant profile image:', consultantImage);
              setProfileImage(consultantImage);
            } else {
              console.log('ℹ️ [HomeHeader] No consultant profile image found');
            }
          } else if (role === 'student') {
            // Fetch student profile image
            const response = await UserService.getUserProfile();
            console.log('🔍 [HomeHeader] Student response:', JSON.stringify(response, null, 2));
            
            const studentImage = response?.profileImage;
            console.log('🔍 [HomeHeader] Student profileImage:', studentImage);
            
            if (studentImage) {
              console.log('✅ [HomeHeader] Found student profile image:', studentImage);
              setProfileImage(studentImage);
            } else {
              console.log('ℹ️ [HomeHeader] No student profile image found');
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
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfileImage();
  }, [user?.uid, role, avatarUri]);
  
  // Use props if provided, otherwise fall back to user data
  const displayName = name || user?.displayName || user?.email?.split('@')[0] || "User";
  
  // Priority: props > fetched profile image > Firebase photoURL > no image
  const userAvatarUri = avatarUri || 
                       profileImage || 
                       user?.photoURL;
  
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
          source={{ uri: userAvatarUri }} 
          style={styles.avatar}
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
