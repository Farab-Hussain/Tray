import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image, Text, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { authStyles } from '../../../constants/styles/authStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { Profile } from '../../../constants/styles/profile';
import ProfileList from '../../../components/ui/ProfileList';
import { ConsultantProfileListData } from '../../../constants/data/ConsultantProfileListData';
import { COLORS } from '../../../constants/core/colors';
import { useAuth } from '../../../contexts/AuthContext';
import { Camera } from 'lucide-react-native';
import { getConsultantProfile } from '../../../services/consultantFlow.service';
import { UserService } from '../../../services/user.service';
import { logger } from '../../../utils/logger';

const ConsultantAccount = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  // const [switchingRole, setSwitchingRole] = useState(false);
  const [consultantProfile, setConsultantProfile] = useState<any>(null);
  const [backendProfile, setBackendProfile] = useState<any>(null);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [imageCacheKey, setImageCacheKey] = useState(0);
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const lastLoadTimeRef = useRef(0);
  
  // Fetch consultant profile - defined as a stable function
  const fetchConsultantProfile = useCallback(async () => {
    const currentUser = user;
    if (!currentUser || apiUnavailable || isLoadingRef.current) return;
    
    try {
      isLoadingRef.current = true;
            if (__DEV__) {
        logger.debug('👤 Fetching consultant profile from backend...')
      };
      const response = await getConsultantProfile(currentUser.uid);
            if (__DEV__) {
        logger.debug('✅ Consultant profile response:', response)
      };
      setConsultantProfile(response);
    } catch (error: any) {
      // Only log once and mark API as unavailable to prevent repeated calls
      if (error?.response?.status === 404) {
                if (__DEV__) {
          logger.debug('⚠️ Consultant profile API not available (404) - will not retry')
        };
        setApiUnavailable(true);
      } else {
                if (__DEV__) {
          logger.debug('⚠️ Consultant profile error:', error?.message || error)
        };
      }
    } finally {
      isLoadingRef.current = false;
    }
  }, [user, apiUnavailable]);

  // Fetch user profile to get updated profileImage
  const fetchUserProfile = useCallback(async () => {
    const currentUser = user;
    if (!currentUser || isLoadingRef.current) return;
    
    try {
      isLoadingRef.current = true;
      const response = await UserService.getUserProfile();
            if (__DEV__) {
        logger.debug('✅ User profile response:', response)
      };
      // Always update backendProfile - this is the source of truth for profileImage
      // If response has profileImage, use it; otherwise keep existing if it exists
      setBackendProfile((prev: any) => {
        // If new response has profileImage, always use it (it's the most recent)
        if (response?.profileImage) {
                    if (__DEV__) {
            logger.debug('✅ Updating backendProfile with new profileImage:', response.profileImage)
          };
          return response;
        }
        // If new response doesn't have profileImage but prev does, keep prev (don't clear it)
        if (prev?.profileImage && !response?.profileImage) {
                    if (__DEV__) {
            logger.debug('⚠️ New response has no profileImage, keeping existing:', prev.profileImage)
          };
          return { ...response, profileImage: prev.profileImage };
        }
        // Otherwise use the new response
        return response;
      });
    } catch (error: any) {
            if (__DEV__) {
        logger.debug('⚠️ User profile error:', error?.message || error)
      };
    } finally {
      isLoadingRef.current = false;
    }
  }, [user]);
  
  // Fetch profiles when component mounts (only once)
  useEffect(() => {
    if (!hasLoadedRef.current && user?.uid) {
      hasLoadedRef.current = true;
      lastLoadTimeRef.current = Date.now();
      fetchConsultantProfile();
      fetchUserProfile();
    }
  }, [user?.uid, fetchConsultantProfile, fetchUserProfile]);

  // Reload when user.photoURL changes (from AuthContext refreshUser) - reload data and update cache key
  useEffect(() => {
    if (user?.photoURL && hasLoadedRef.current) {
            if (__DEV__) {
        logger.debug('🔄 [ConsultantAccount] user.photoURL changed, reloading profiles')
      };
      const now = Date.now();
      // Only reload if it's been more than 500ms since last load (prevent rapid reloads)
      if (now - lastLoadTimeRef.current > 500) {
        lastLoadTimeRef.current = now;
        fetchConsultantProfile();
        fetchUserProfile();
        setImageCacheKey(prev => prev + 1);
      }
    }
  }, [user?.photoURL, fetchConsultantProfile, fetchUserProfile]);

  // Reload profiles when screen comes into focus (e.g., after editing profile)
  // Use timestamp to prevent rapid reloads but allow refresh after navigation
  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return;
      
      const now = Date.now();
      // Reload if:
      // 1. Never loaded before, OR
      // 2. It's been more than 1 second since last load (allows refresh after coming back from EditProfile)
      if (!hasLoadedRef.current || (now - lastLoadTimeRef.current > 1000)) {
        hasLoadedRef.current = true;
        lastLoadTimeRef.current = now;
                if (__DEV__) {
          logger.debug('🔄 [ConsultantAccount] Screen focused, reloading profiles')
        };
        fetchConsultantProfile();
        fetchUserProfile();
        setImageCacheKey(prev => prev + 1);
      }
    }, [user?.uid, fetchConsultantProfile, fetchUserProfile])
  );
  
  // Memoize the profile image URL to always prioritize backendProfile.profileImage
  // This ensures the most recently updated image is always used
  const profileImageUrl = useMemo(() => {
    // Priority: backendProfile.profileImage > user.photoURL > consultantProfile.personalInfo.profileImage
    // backendProfile.profileImage is always the most up-to-date since it's updated first
    const imageUrl = backendProfile?.profileImage || user?.photoURL || consultantProfile?.personalInfo?.profileImage || '';
        if (__DEV__) {
      logger.debug('🖼️ [ConsultantAccount] Profile image URL computed:', {
      backendProfile: backendProfile?.profileImage ? 'has' : 'none',
      userPhotoURL: user?.photoURL ? 'has' : 'none',
      consultantProfile: consultantProfile?.personalInfo?.profileImage ? 'has' : 'none',
      final: imageUrl ? 'has' : 'none'
    })
    };
    return imageUrl;
  }, [backendProfile?.profileImage, user?.photoURL, consultantProfile?.personalInfo?.profileImage]);

  const handlePress = async (route: string) => {
    if (route === "Logout") {
      Alert.alert("Logout", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            navigation.replace("Auth", { screen: "Login" });
          },
        },
      ]);
      return;
    }

    // Handle navigation to existing screens
    switch (route) {
      case "ConsultantMessages":
        // Navigate to Messages tab
        navigation.navigate("ConsultantMessages");
        break;
      case "MyClients":
        // Navigate to MyClients screen (exists in stack)
        navigation.navigate("MyClients");
        break;
      case "MyReviews":
        // Navigate to ConsultantReviews screen for consultants
        navigation.navigate("ConsultantReviews");
        break;
      case "ConsultantServices":
        // Navigate to Services tab - ConsultantAccount is in ConsultantTabs, so direct navigation works
        navigation.navigate("ConsultantServices");
        break;
      case "ConsultantNotifications":
        // Navigate to Notifications screen (exists in stack)
        navigation.navigate("ConsultantNotifications");
        break;
      case "Help":
        // Navigate to Help screen (exists in stack)
        navigation.navigate("Help");
        break;
      case "Earnings":
        // Navigate to Earnings screen (exists in stack)
        navigation.navigate("Earnings");
        break;
      case "StripePaymentSetup":
        // Navigate to Stripe Payment Setup screen
        navigation.navigate("StripePaymentSetup");
        break;
      case "ConsultantAllApplications":
        // Navigate to All Applications screen
        navigation.navigate("ConsultantAllApplications");
        break;
      default:
        // Default navigation for other routes
        navigation.navigate(route);
        break;
    }
  };
  
  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader title="Account" onBackPress={() => navigation.goBack()} />
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={Profile.container}>
          
          {/* Clickable Profile Image */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ConsultantProfile')}
            style={authStyles.profileImageWrapper}
          >
            <Image
              source={{
                uri: profileImageUrl ? `${profileImageUrl}?t=${imageCacheKey}` : ''
              }}
              style={Profile.avatar}
              key={`profile-${profileImageUrl}-${imageCacheKey}`} // Force re-render when image URL or cache key changes
              defaultSource={require('../../../assets/image/profile.png')}
            />
            
            {/* Camera Icon Overlay */}
            <View style={authStyles.cameraButtonSmall}>
              <Camera size={16} color="white" />
            </View>
          </TouchableOpacity>
          
          {/* Consultant Status Badge */}
          {consultantProfile?.status && (
            <View style={[Profile.statusBadge, { 
              backgroundColor: consultantProfile.status === 'approved' ? '#ECFDF5' : 
                             consultantProfile.status === 'pending' ? '#FEF3C7' : '#FEE2E2'
            }]}>
              <Text style={[Profile.statusText, { 
                color: consultantProfile.status === 'approved' ? '#059669' : 
                       consultantProfile.status === 'pending' ? '#D97706' : '#DC2626'
              }]}>
                {consultantProfile.status.charAt(0).toUpperCase() + consultantProfile.status.slice(1)}
              </Text>
            </View>
          )}
          
          {/* Role Switcher - Always show (email verification already required at login)
          // {activeRole && (
          //   <View style={styles.roleSwitcherContainer}>
          //     <Text style={styles.roleSwitcherLabel}>Switch Role</Text>
          //     <View style={styles.roleButtonsContainer}>
          //       {['student', 'consultant'].map((role) => {
          //         const currentActiveRole = activeRole || 'student';
          //         const isActive = currentActiveRole === role;
          //         const hasRole = roles.includes(role) || role === 'student'; // All users have student role by default

          //         return (
          //           <TouchableOpacity
          //             key={role}
          //             style={[
          //               styles.roleButton,
          //               isActive && styles.roleButtonActive,
          //               switchingRole && styles.roleButtonDisabled,
          //               !hasRole &&
          //                 role === 'consultant' &&
          //                 styles.roleButtonInactive,
          //             ]}
          //             onPress={async () => {
          //               if (isActive || switchingRole) return;
                        
          //               try {
          //                 setSwitchingRole(true);
          //                 const result = await switchRole(role);
                          
          //                 // Check if result indicates an error (for missing consultant profile)
          //                 if (result?.error && result?.action === 'create_consultant_profile') {
          //                   // Consultant profile is required - show alert to create profile
          //                   Alert.alert(
          //                     'Consultant Profile Required',
          //                     'You need to create your consultant profile before switching to consultant role.',
          //                     [
          //                       {
          //                         text: 'Cancel',
          //                         style: 'cancel',
          //                         onPress: () => {
          //                           // User cancels - remain on current role, do nothing
          //                         },
          //                       },
          //                       {
          //                         text: 'Create Profile',
          //                         onPress: () => navigation.navigate('ConsultantProfileFlow'),
          //                       },
          //                     ]
          //                   );
          //                 } else if (!result?.error) {
          //                   // Role switched successfully
          //                   Alert.alert(
          //                     'Role Switched',
          //                     `You are now viewing as ${role === 'student' ? 'a student' : 'a consultant'}.`,
          //                     [{ text: 'OK' }]
          //                   );
          //                 }
          //               } catch (error: any) {
          //                 // Handle unexpected errors
          //                 const errorMessage = error?.response?.data?.error || error?.message || 'Failed to switch role';
          //                 Alert.alert('Error', errorMessage);
          //               } finally {
          //                 setSwitchingRole(false);
          //               }
          //             }}
          //             disabled={switchingRole || (!hasRole && role === 'consultant')}
          //           >
          //             <Text
          //               style={[
          //                 styles.roleButtonText,
          //                 isActive && styles.roleButtonTextActive,
          //                 !hasRole && role === 'consultant' && styles.roleButtonTextInactive,
          //               ]}
          //             >
          //               {role === 'student' ? 'Student' : 'Consultant'}
          //               {isActive && ' ✓'}
          //             </Text>
          //           </TouchableOpacity>
          //         );
          //       })}
          //     </View>
          //     {switchingRole && (
          //       <View style={styles.switchingIndicator}>
          //         <RefreshCw size={16} color={COLORS.green} />
          //         <Text style={styles.switchingText}>Switching...</Text>
          //       </View>
          //     )}
          //   </View>
          // )} */}
          
          <View style={Profile.listContainer}>
            {ConsultantProfileListData.length > 0 && (
              ConsultantProfileListData.map((item) => (
                <ProfileList
                  key={item.id}
                  icon={<item.icon size={24} color={COLORS.green} strokeWidth={1.5} />}
                  text={item.text}
                  onPress={() => handlePress(item.route)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles removed - role switcher code is commented out
// If needed in the future, uncomment the role switcher code and add styles back

export default ConsultantAccount;