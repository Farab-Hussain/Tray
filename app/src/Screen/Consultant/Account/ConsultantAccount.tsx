import React, { useCallback, useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image, Text, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { authStyles } from '../../../constants/styles/authStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { Profile } from '../../../constants/styles/profile';
import ProfileList from '../../../components/ui/ProfileList';
import { ConsultantProfileListData } from '../../../constants/data/ConsultantProfileListData';
import { COLORS } from '../../../constants/core/colors';
import { useAuth } from '../../../contexts/AuthContext';
import { Camera, RefreshCw } from 'lucide-react-native';
import { getConsultantProfile } from '../../../services/consultantFlow.service';
import { StyleSheet } from 'react-native';

const ConsultantAccount = ({ navigation }: any) => {
  const { user, logout, activeRole, roles, switchRole } = useAuth();
  const [switchingRole, setSwitchingRole] = useState(false);
  const [consultantProfile, setConsultantProfile] = useState<any>(null);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  
  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchConsultantProfile = useCallback(async () => {
    if (!user || apiUnavailable) return;
    
    try {
      console.log('👤 Fetching consultant profile from backend...');
      const response = await getConsultantProfile(user.uid);
      console.log('✅ Consultant profile response:', response);
      setConsultantProfile(response);
    } catch (error: any) {
      // Only log once and mark API as unavailable to prevent repeated calls
      if (error?.response?.status === 404) {
        console.log('⚠️ Consultant profile API not available (404) - will not retry');
        setApiUnavailable(true);
      } else {
        console.log('⚠️ Consultant profile error:', error?.message || error);
      }
    }
  }, [user, apiUnavailable]);
  
  // Fetch consultant profile only when component mounts (not on every focus)
  useEffect(() => {
    fetchConsultantProfile();
  }, [fetchConsultantProfile]);
  
  // Get user's name from consultant profile, Firebase, or use email as fallback
  const displayName = consultantProfile?.personalInfo?.fullName || user?.displayName || user?.email?.split('@')[0] || 'Consultant';
  const email = consultantProfile?.personalInfo?.email || user?.email || 'No email available';
  
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
        // Navigate to Services tab
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
            onPress={() => navigation.navigate('EditProfile')}
            style={authStyles.profileImageWrapper}
          >
            <Image
              source={
                consultantProfile?.personalInfo?.profileImage 
                  ? { uri: consultantProfile.personalInfo.profileImage } 
                  : user?.photoURL 
                    ? { uri: user.photoURL } 
                    : require('../../../assets/image/profile.png')
              }
              style={Profile.avatar}
            />
            
            {/* Camera Icon Overlay */}
            <View style={authStyles.cameraButtonSmall}>
              <Camera size={16} color="white" />
            </View>
          </TouchableOpacity>
          
          <Text style={Profile.name}>{displayName}</Text>
          <Text style={Profile.email}>{email}</Text>
          
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
          
          {/* Role Switcher - Always show (email verification already required at login) */}
          {activeRole && (
            <View style={styles.roleSwitcherContainer}>
              <Text style={styles.roleSwitcherLabel}>Switch Role</Text>
              <View style={styles.roleButtonsContainer}>
                {[activeRole === 'student' ? 'consultant' : 'student'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleButton,
                      activeRole === role && styles.roleButtonActive,
                      switchingRole && styles.roleButtonDisabled,
                    ]}
                    onPress={async () => {
                      if (activeRole === role || switchingRole) return;
                      
                      try {
                        setSwitchingRole(true);
                        await switchRole(role);
                        
                        // Role switched successfully
                        Alert.alert(
                          'Role Switched',
                          `You are now viewing as ${role === 'student' ? 'a student' : 'a consultant'}.`,
                          [{ text: 'OK' }]
                        );
                      } catch (error: any) {
                        const errorMessage = error?.response?.data?.error || error?.message || 'Failed to switch role';
                        const action = error?.response?.data?.action;
                        
                        if (action === 'create_consultant_profile') {
                          // Consultant profile is required - show alert to create profile
                          Alert.alert(
                            'Consultant Profile Required',
                            'You need to create your consultant profile before switching to consultant role.',
                            [
                              {
                                text: 'Create Profile',
                                onPress: () => navigation.navigate('ConsultantProfileFlow'),
                              },
                            ]
                          );
                        } else {
                          Alert.alert('Error', errorMessage);
                        }
                      } finally {
                        setSwitchingRole(false);
                      }
                    }}
                    disabled={switchingRole}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        activeRole === role && styles.roleButtonTextActive,
                        !roles.includes(role) && role === 'consultant' && styles.roleButtonTextInactive,
                      ]}
                    >
                      {role === 'student' ? 'Student' : 'Consultant'}
                      {activeRole === role && ' ✓'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {switchingRole && (
                <View style={styles.switchingIndicator}>
                  <RefreshCw size={16} color={COLORS.green} />
                  <Text style={styles.switchingText}>Switching...</Text>
                </View>
              )}
            </View>
          )}
          
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

const styles = StyleSheet.create({
  roleSwitcherContainer: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleSwitcherLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 10,
  },
  roleButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    width: 100,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  roleButtonActive: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.lightBackground,
  },
  roleButtonDisabled: {
    opacity: 0.5,
  },
  roleButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray,
    textAlign: 'center',
  },
  roleButtonTextActive: {
    color: COLORS.green,
    fontWeight: '600',
  },
  roleButtonTextInactive: {
    opacity: 0.7,
  },
  switchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  switchingText: {
    fontSize: 12,
    color: COLORS.green,
  },
});

export default ConsultantAccount;