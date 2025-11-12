import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Image,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { authStyles } from '../../../constants/styles/authStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { Profile } from '../../../constants/styles/profile';
import ProfileList from '../../../components/ui/ProfileList';
import { ProfileListData } from '../../../constants/data/ProfileListData';
import { COLORS } from '../../../constants/core/colors';
import { useAuth } from '../../../contexts/AuthContext';
import { useChatContext } from '../../../contexts/ChatContext';
import { useNotificationContext } from '../../../contexts/NotificationContext';
import { UserService } from '../../../services/user.service';
import { Camera, User, RefreshCw } from 'lucide-react-native';
import Loader from '../../../components/ui/Loader';
import { StyleSheet } from 'react-native';

const Account = ({ navigation }: any) => {
  const { user, logout, activeRole, roles, switchRole } = useAuth();
  const [switchingRole, setSwitchingRole] = useState(false);
  const [backendProfile, setBackendProfile] = useState<any>(null);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const { chats } = useChatContext();
  const { notifications, unreadCount: notificationUnreadCount } =
    useNotificationContext();

  const hasUnreadMessages = useMemo(() => {
    const chatUnreadViaChats =
      chats?.some(chat => (chat.unreadCount || 0) > 0) ?? false;
    const chatUnreadViaNotifications =
      notifications?.some(
        notification =>
          !notification.read &&
          (notification.type === 'chat_message' ||
            notification.category === 'message'),
      ) ?? false;
    return chatUnreadViaChats || chatUnreadViaNotifications;
  }, [chats, notifications]);

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
        console.log(
          '⚠️ Backend profile API not available (404) - will not retry',
        );
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
  const displayName =
    backendProfile?.name ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'User';
  const email = backendProfile?.email || user?.email || 'No email available';

  const handlePress = async (route: string) => {
    if (route === 'Logout') {
      Alert.alert('Logout', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Auth', { screen: 'Login' });
          },
        },
      ]);
      return;
    }

    if (route === 'Cart') {
      navigation.navigate('Services', { screen: 'Cart' });
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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
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
              <View
                style={[
                  Profile.avatar,
                  {
                    backgroundColor: COLORS.lightGray,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
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

          {/* Role Switcher - Always show when user is logged in */}
          {user && (
            <View style={styles.roleSwitcherContainer}>
              <Text style={styles.roleSwitcherLabel}>Switch Role</Text>
              <View style={styles.roleButtonsContainer}>
                {['student', 'consultant'].map(role => {
                  const currentActiveRole = activeRole || 'student';
                  const isActive = currentActiveRole === role;
                  const hasRole = roles.includes(role) || role === 'student'; // All users have student role by default

                  return (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleButton,
                        isActive && styles.roleButtonActive,
                        switchingRole && styles.roleButtonDisabled,
                        !hasRole &&
                          role === 'consultant' &&
                          styles.roleButtonInactive,
                      ]}
                      onPress={async () => {
                        if (isActive || switchingRole) return;
                        try {
                          setSwitchingRole(true);
                          await switchRole(role);

                          // Role switched successfully
                          Alert.alert(
                            'Role Switched',
                            `You are now viewing as ${
                              role === 'student' ? 'a student' : 'a consultant'
                            }.`,
                            [{ text: 'OK' }],
                          );
                        } catch (error: any) {
                          const errorMessage =
                            error?.response?.data?.error ||
                            error?.message ||
                            'Failed to switch role';
                          const action = error?.response?.data?.action;

                          if (action === 'create_consultant_profile') {
                            // Consultant profile is required - show alert to create profile
                            Alert.alert(
                              'Consultant Profile Required',
                              'You need to create your consultant profile before switching to consultant role.',
                              [
                                {
                                  text: 'Cancel',
                                  style: 'cancel',
                                  onPress: () => {
                                    // User cancels - remain on student role, do nothing
                                  },
                                },
                                {
                                  text: 'Create Profile',
                                  onPress: () =>
                                    navigation.navigate(
                                      'ConsultantProfileFlow',
                                    ),
                                },
                              ],
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
                          isActive && styles.roleButtonTextActive,
                          !hasRole &&
                            role === 'consultant' &&
                            styles.roleButtonTextInactive,
                        ]}
                      >
                        {role === 'student' ? 'Student' : 'Consultant'}
                        {isActive && ' ✓'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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
            {ProfileListData.length > 0 &&
              ProfileListData.map(item => {
                const showDot =
                  item.route === 'Messages'
                    ? hasUnreadMessages
                    : item.route === 'Notifications'
                    ? notificationUnreadCount > 0
                    : false;

                return (
                  <ProfileList
                    key={item.id}
                    icon={
                      <item.icon
                        size={24}
                        color={COLORS.green}
                        strokeWidth={1.5}
                      />
                    }
                    text={item.text}
                    onPress={() => handlePress(item.route)}
                    showDot={showDot}
                  />
                );
              })}
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
  roleButtonInactive: {
    opacity: 0.6,
    borderColor: COLORS.lightGray,
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

export default Account;
