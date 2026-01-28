import React, { useState, useCallback, useEffect } from 'react';
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
import { UserService } from '../../../services/user.service';
import { ResumeService } from '../../../services/resume.service';
import { Camera, User, Lock, FileText, Edit2, Mail, CheckCircle } from 'lucide-react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { showError, showSuccess } from '../../../utils/toast';
import Loader from '../../../components/ui/Loader';
import ImageUpload from '../../../components/ui/ImageUpload';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { studentProfileStyles } from '../../../constants/styles/studentProfileStyles';
import { useRefresh } from '../../../hooks/useRefresh';

const StudentProfile = ({ navigation }: any) => {
  const { user, refreshUser } = useAuth();
  const [backendProfile, setBackendProfile] = useState<any>(null);
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingImage, setUpdatingImage] = useState(false);
  const [imageCacheKey, setImageCacheKey] = useState(0);

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

      // Fetch resume if exists
      try {
        const resumeResponse = await ResumeService.getMyResume();
        if (resumeResponse.resume) {
          setResume(resumeResponse.resume);
        }
      } catch (error: any) {
        // Resume not found is okay
        if (error?.response?.status !== 404) {
          if (__DEV__) {
            console.log('Error fetching resume:', error)
          };
        }
        setResume(null);
      }
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

  const handleImageUpdate = async (imageUrl: string | null) => {
    if (!auth.currentUser) return;

    setUpdatingImage(true);
    try {
      if (imageUrl) {
        await updateProfile(auth.currentUser, {
          photoURL: imageUrl,
        });
      }

      // Update backend profile
      try {
        await UserService.updateProfile({
          avatarUrl: imageUrl,
        });
      } catch (error: unknown) {
        if (__DEV__) {
          console.log('Backend update failed, but Firebase updated')
        };
      }

      await refreshUser();
      setImageCacheKey(prev => prev + 1);
      showSuccess('Profile image updated successfully');
      fetchProfileData();
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error updating profile image:', error)
      };
      showError(error.message || 'Failed to update profile image');
    } finally {
      setUpdatingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    Alert.alert(
      'Delete Profile Image',
      'Are you sure you want to remove your profile image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleImageUpdate(null),
        },
      ]
    );
  };

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
        </View>

        {/* Resume Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resume</Text>

          <View style={styles.sectionContent}>
            {resume ? (
              <TouchableOpacity
                style={styles.infoItem}
                onPress={() => navigation.navigate('Resume')}
                activeOpacity={0.7}
              >
                <View style={styles.infoItemLeft}>
                  <View style={styles.iconContainer}>
                    <FileText size={20} color={COLORS.green} />
                  </View>
                  <View style={styles.infoItemText}>
                    <Text style={styles.infoLabel}>My Resume</Text>
                    <Text style={styles.infoValue}>
                      {resume.personalInfo?.name || displayName}
                    </Text>
                  </View>
                </View>
                <Edit2 size={18} color={COLORS.gray} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.infoItem}
                onPress={() => navigation.navigate('Resume')}
                activeOpacity={0.7}
              >
                <View style={styles.infoItemLeft}>
                  <View style={styles.iconContainer}>
                    <FileText size={20} color={COLORS.gray} />
                  </View>
                  <View style={styles.infoItemText}>
                    <Text style={styles.infoLabel}>Create Resume</Text>
                    <Text style={styles.infoSubtext}>Create your resume to apply for jobs</Text>
                  </View>
                </View>
                <Edit2 size={18} color={COLORS.gray} />
              </TouchableOpacity>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = studentProfileStyles;

export default StudentProfile;

