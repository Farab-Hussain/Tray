import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { COLORS } from '../../../constants/core/colors';
import { useAuth } from '../../../contexts/AuthContext';
import { useRefresh } from '../../../hooks/useRefresh';
import { UserService } from '../../../services/user.service';
import { Camera, User, Lock, Edit2, Mail, CheckCircle, LogOut } from 'lucide-react-native';
import { showError } from '../../../utils/toast';
import Loader from '../../../components/ui/Loader';
import { recruiterProfileStyles } from '../../../constants/styles/recruiterProfileStyles';

const RecruiterProfile = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [backendProfile, setBackendProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingImage] = useState(false);
  const [imageCacheKey] = useState(0);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.replace('Auth', { screen: 'Login' });
            } catch {
              showError('Failed to logout');
            }
          },
        },
      ]
    );
  };

  const fetchProfileData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch user profile
      const profileResponse = await UserService.getUserProfile();
      setBackendProfile(profileResponse);
    } catch (error: any) {
            if (__DEV__) {
        console.error('Error fetching profile data:', error)
      };
      // Set fallback profile from Firebase
      setBackendProfile({
        name: user.displayName || null,
        email: user.email || null,
        profileImage: user.photoURL || null,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const { refreshing, handleRefresh } = useRefresh(fetchProfileData);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Profile" onBackPress={() => navigation.goBack()} />
        <Loader message="Loading profile..." />
      </SafeAreaView>
    );
  }

  const profileImage = backendProfile?.profileImage || user?.photoURL;
  const displayName = backendProfile?.name || user?.displayName || 'No name set';
  const email = backendProfile?.email || user?.email || 'No email';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Profile" onBackPress={() => navigation.goBack()} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Profile Image Section */}
        <View style={styles.profileImageSection}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image
                source={{ uri: `${profileImage}?t=${imageCacheKey}` }}
                style={styles.profileImage}
                key={`${profileImage}-${imageCacheKey}`}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <User size={60} color={COLORS.gray} />
              </View>
            )}
            
            {/* Camera Icon Overlay */}
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => navigation.navigate('EditProfile')}
              disabled={updatingImage}
            >
              {updatingImage ? (
                <Loader message="" />
              ) : (
                <Camera size={20} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* Profile Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.sectionContent}>
            {/* Username */}
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate('ChangeUsername')}
              activeOpacity={0.7}
            >
              <View style={styles.infoItemLeft}>
                <View style={styles.iconContainer}>
                  <User size={20} color={COLORS.green} />
                </View>
                <View style={styles.infoItemText}>
                  <Text style={styles.infoLabel}>Username</Text>
                  <Text style={styles.infoValue}>{displayName}</Text>
                </View>
              </View>
              <Edit2 size={18} color={COLORS.gray} />
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Email */}
            <View style={styles.infoItem}>
              <View style={styles.infoItemLeft}>
                <View style={styles.iconContainer}>
                  <Mail size={20} color={COLORS.green} />
                </View>
                <View style={styles.infoItemText}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{email}</Text>
                </View>
              </View>
              <CheckCircle size={18} color={COLORS.green} />
            </View>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate('ChangePassword')}
              activeOpacity={0.7}
            >
              <View style={styles.infoItemLeft}>
                <View style={styles.iconContainer}>
                  <Lock size={20} color={COLORS.green} />
                </View>
                <View style={styles.infoItemText}>
                  <Text style={styles.infoLabel}>Change Password</Text>
                  <Text style={styles.infoSubtext}>Update your account password</Text>
                </View>
              </View>
              <Edit2 size={18} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.infoItem}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={styles.infoItemLeft}>
                <View style={styles.iconContainer}>
                  <LogOut size={20} color={COLORS.red} />
                </View>
                <View style={styles.infoItemText}>
                  <Text style={styles.infoLabel}>Logout</Text>
                  <Text style={styles.infoSubtext}>Sign out of your account</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Hiring Tools</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate('RecruiterPostJob')}
              activeOpacity={0.7}
            >
              <View style={styles.infoItemLeft}>
                <View style={styles.iconContainer}>
                  <CheckCircle size={20} color={COLORS.green} />
                </View>
                <View style={styles.infoItemText}>
                  <Text style={styles.infoLabel}>Job Post Optimizer</Text>
                  <Text style={styles.infoSubtext}>
                    Improve job requirements, fair-chance wording, and salary range
                  </Text>
                </View>
              </View>
              <Edit2 size={18} color={COLORS.gray} />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate('RecruiterJobs')}
              activeOpacity={0.7}
            >
              <View style={styles.infoItemLeft}>
                <View style={styles.iconContainer}>
                  <CheckCircle size={20} color={COLORS.green} />
                </View>
                <View style={styles.infoItemText}>
                  <Text style={styles.infoLabel}>Candidate Ranking Engine</Text>
                  <Text style={styles.infoSubtext}>
                    Rank candidates and detect talent shortage risks by role
                  </Text>
                </View>
              </View>
              <Edit2 size={18} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = recruiterProfileStyles;

export default RecruiterProfile;
