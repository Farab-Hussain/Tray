import React, { useState, useCallback, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { COLORS } from '../../../constants/core/colors';
import { useAuth } from '../../../contexts/AuthContext';
import { UserService } from '../../../services/user.service';
import { getConsultantProfile } from '../../../services/consultantFlow.service';
import { User, Lock, Mail, Edit2, CheckCircle } from 'lucide-react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { studentProfileStyles } from '../../../constants/styles/studentProfileStyles';
import Loader from '../../../components/ui/Loader';
import { useRefresh } from '../../../hooks/useRefresh';

const ConsultantProfile = ({ navigation }: any) => {
  const { user } = useAuth();
  const [backendProfile, setBackendProfile] = useState<any>(null);
  const [consultantProfile, setConsultantProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

      // Fetch consultant profile for fallback image
      try {
        const consultantResponse = await getConsultantProfile(user.uid);
        setConsultantProfile(consultantResponse);
      } catch (error: any) {
        // Consultant profile not found is okay
        if (error?.response?.status !== 404) {
                    if (__DEV__) {
            console.log('Error fetching consultant profile:', error)
          };
        }
        setConsultantProfile(null);
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

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Profile" onBackPress={() => navigation.goBack()} />
        <Loader message="Loading profile..." />
      </SafeAreaView>
    );
  }

  // Priority: backendProfile > consultantProfile > user
  const profileImage = backendProfile?.profileImage || user?.photoURL || consultantProfile?.personalInfo?.profileImage;
  const displayName = backendProfile?.name || consultantProfile?.personalInfo?.fullName || user?.displayName || 'No name set';
  const email = backendProfile?.email || consultantProfile?.personalInfo?.email || user?.email || 'No email';

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
          </View>

          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* Profile Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.sectionContent}>
            {/* Name */}
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
                  <Text style={styles.infoLabel}>Name</Text>
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

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = studentProfileStyles;

export default ConsultantProfile;

