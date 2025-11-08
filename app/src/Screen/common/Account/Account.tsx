import React, { useCallback, useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image, Text, View, TouchableOpacity, Alert } from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { authStyles } from '../../../constants/styles/authStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { Profile } from '../../../constants/styles/profile';
import ProfileList from '../../../components/ui/ProfileList';
import { ProfileListData } from '../../../constants/data/ProfileListData';
import { COLORS } from '../../../constants/core/colors';
import { useAuth } from '../../../contexts/AuthContext';
import { UserService } from '../../../services/user.service';
import { Camera, User } from 'lucide-react-native';
import Loader from '../../../components/ui/Loader';

const Account = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [backendProfile, setBackendProfile] = useState<any>(null);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchBackendProfile = useCallback(async () => {
    if (!user) {
      setLoadingProfile(false);
      return;
    }

    if (apiUnavailable) {
      setLoadingProfile(false);
      return;
    }
    
    try {
      setLoadingProfile(true);
      console.log('👤 Fetching user profile from backend...');
      const response = await UserService.getUserProfile();
      console.log('✅ Backend profile response:', response);
      setBackendProfile(response);
    } catch (error: any) {
      // Only log once and mark API as unavailable to prevent repeated calls
      if (error?.response?.status === 404) {
        console.log('⚠️ Backend profile API not available (404) - will not retry');
        setApiUnavailable(true);
      } else {
        console.log('⚠️ Backend profile error:', error?.message || error);
      }
    } finally {
      setLoadingProfile(false);
    }
  }, [user, apiUnavailable]);
  
  // Fetch backend profile only when component mounts (not on every focus)
  useEffect(() => {
    fetchBackendProfile();
  }, [fetchBackendProfile]);
  
  // Get user's name from backend profile, Firebase, or use email as fallback
  const displayName = backendProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'User';
  const email = backendProfile?.email || user?.email || 'No email available';
  
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

    // Normal navigation for other routes
    navigation.navigate(route);
  };
  
  if (loadingProfile) {
    return (
      <SafeAreaView style={screenStyles.safeAreaWhite}>
        <ScreenHeader title="Account" onBackPress={() => navigation.goBack()} />
        <Loader message="Loading your account..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite}>
      <ScreenHeader title="Account" onBackPress={() => navigation.goBack()} />
      <View style={Profile.container}>
        {/* <Text style={screenStyles.heading}>Account</Text> */}
        
        {/* Clickable Profile Image */}
        <TouchableOpacity
          onPress={() => navigation.navigate('EditProfile')}
          style={authStyles.profileImageWrapper}
        >
          {backendProfile?.profileImage || user?.photoURL ? (
            <Image
              source={
                backendProfile?.profileImage 
                  ? { uri: backendProfile.profileImage } 
                  : { uri: user?.photoURL }
              }
              style={Profile.avatar}
            />
          ) : (
            <View style={[Profile.avatar, { backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center' }]}>
              <User size={32} color={COLORS.gray} />
            </View>
          )}
          
          {/* Camera Icon Overlay */}
          <View style={authStyles.cameraButtonSmall}>
            <Camera size={16} color="white" />
          </View>
        </TouchableOpacity>
        
        <Text style={Profile.name}>{displayName}</Text>
        <Text style={Profile.email}>{email}</Text>
        <View style={Profile.listContainer}>
          {ProfileListData.length > 0 && (
            ProfileListData.map((item) => (
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
    </SafeAreaView>
  );
};

export default Account;
