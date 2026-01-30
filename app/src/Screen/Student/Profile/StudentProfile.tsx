import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  User,
  Mail,
  Lock,
  FileText,
  Briefcase,
  Shield,
  GraduationCap,
  Award,
  Code,
  ExternalLink,
  Target,
  DollarSign,
  Car,
  AlertCircle,
  Edit2,
  CheckCircle,
  ChevronRight,
  BarChart3,
  Camera,
} from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { COLORS } from '../../../constants/core/colors';
import { studentProfileStyles as styles } from '../../../constants/styles/studentProfileStyles';
import ProfileSectionCard from '../../../components/ui/ProfileSectionCard';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { useRefresh } from '../../../hooks/useRefresh';
import Loader from '../../../components/ui/Loader';
import { UserService } from '../../../services/user.service';
import { ResumeService } from '../../../services/resume.service';

const StudentProfile = ({ navigation }: any) => {
  const { user } = useAuth();
  const [backendProfile, setBackendProfile] = useState<any>(null);
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [_updatingImage, _setUpdatingImage] = useState(false);
  const [_imageCacheKey, _setImageCacheKey] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState<any>(null);

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

      // Set default profile completion (no API call to avoid 404 errors)
      setProfileCompletion({
        overallCompletion: 0,
        basicProfile: false,
        workPreferences: false,
        authorization: false,
        careerGoals: false,
        externalProfiles: false
      });

      // Fetch resume if exists
      try {
        const resumeResponse = await ResumeService.getMyResume();
        if (resumeResponse.resume) {
          setResume(resumeResponse.resume);
        }
      } catch (error: any) {
        // Resume not found is okay - this is expected for new users
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

  // const handleImageUpdate = async (imageUrl: string | null) => {
  //   if (!auth.currentUser) return;

  //   setUpdatingImage(true);
  //   try {
  //     if (imageUrl) {
  //       await updateProfile(auth.currentUser, {
  //         photoURL: imageUrl,
  //       });
  //     }

  //     // Update backend profile
  //     try {
  //       await UserService.updateProfile({
  //         avatarUrl: imageUrl,
  //       });
  //     } catch  {
  //       if (__DEV__) {
  //         console.log('Backend update failed, but Firebase updated')
  //       };
  //     }

  //     await refreshUser();
  //     setImageCacheKey(prev => prev + 1);
  //     showSuccess('Profile image updated successfully');
  //     fetchProfileData();
  //   } catch (error: any) {
  //     if (__DEV__) {
  //       console.error('Error updating profile image:', error)
  //     };
  //     showError(error.message || 'Failed to update profile image');
  //   } finally {
  //     setUpdatingImage(false);
  //   }
  // };

  // const handleDeleteImage = async () => {
  //   Alert.alert(
  //     'Delete Profile Image',
  //     'Are you sure you want to remove your profile image?',
  //     [
  //       { text: 'Cancel', style: 'cancel' },
  //       {
  //         text: 'Delete',
  //         style: 'destructive',
  //         onPress: () => handleImageUpdate(null),
  //       },
  //     ]
  //   );
  // };

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

  // Calculate profile completion percentage
  const completionPercentage = profileCompletion?.overallCompletion || 0;
  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return COLORS.green;
    if (percentage >= 60) return COLORS.yellow;
    return COLORS.red;
  };

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
                source={{ uri: `${profileImage}?t=${_imageCacheKey}` }}
                style={styles.profileImage}
                key={`${profileImage}-${_imageCacheKey}`}
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
              disabled={_updatingImage}
            >
              {_updatingImage ? (
                <Loader message="" />
              ) : (
                <Camera size={20} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* Profile Completion Status - NEW */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Completion</Text>
            <BarChart3 size={20} color={getCompletionColor(completionPercentage)} />
          </View>

          <View style={styles.sectionContent}>
            <View style={styles.completionBar}>
              <View style={[styles.completionFill, {
                width: `${completionPercentage}%`,
                backgroundColor: getCompletionColor(completionPercentage)
              }]} />
            </View>
            <Text style={styles.completionText}>{completionPercentage}% Complete</Text>

            <Text style={styles.completionSubtext}>
              {completionPercentage < 100
                ? 'Complete your profile to increase job match chances!'
                : 'Excellent! Your profile is complete.'
              }
            </Text>
          </View>
        </View>

        {/* Profile Information Section */}
        <ProfileSectionCard
          title="Profile Information"
          icon={User}
          items={[
            {
              label: 'Username',
              value: displayName,
              onPress: () => navigation.navigate('ChangeUsername'),
              rightIcon: Edit2,
            },
            {
              label: 'Email',
              value: email,
              rightIcon: CheckCircle,
              rightIconColor: COLORS.green,
              showSeparator: false,
            },
          ]}
        />

        {/* Security Section */}
        <ProfileSectionCard
          title="Security"
          icon={Shield}
          items={[
            {
              label: 'Change Password',
              subtext: 'Update your account password',
              onPress: () => navigation.navigate('ChangePassword'),
              rightIcon: Edit2,
            },
          ]}
        />

        {/* Resume Section */}
        <ProfileSectionCard
          title="Resume"
          icon={FileText}
          items={[
            resume ? {
              label: 'My Resume',
              value: resume.personalInfo?.name || displayName,
              onPress: () => navigation.navigate('Resume'),
              rightIcon: Edit2,
            } : {
              label: 'Create Resume',
              subtext: 'Create your resume to apply for jobs',
              onPress: () => navigation.navigate('Resume'),
              rightIcon: Edit2,
              iconColor: COLORS.gray,
            },
          ]}
        />

        {/* Work Preferences Section */}
        <ProfileSectionCard
          title="Work Preferences"
          icon={Briefcase}
          items={[
            {
              label: 'Work Preferences',
              subtext: 'Set your work restrictions, transportation, and preferred job types',
              onPress: () => navigation.navigate('WorkPreferences'),
              rightIcon: ChevronRight,
            },
            ...(resume?.workRestrictions && resume.workRestrictions.length > 0 ? [{
              label: 'Work Restrictions',
              value: `${resume.workRestrictions.length} work restrictions set`,
              icon: AlertCircle,
              iconColor: COLORS.orange,
              showSeparator: false,
            }] : []),
            ...(resume?.transportationStatus ? [{
              label: 'Transportation',
              value: resume.transportationStatus.replace('-', ' '),
              icon: Car,
              iconColor: COLORS.green,
              showSeparator: false,
            }] : []),
          ]}
        />

        {/* Career Goals Section */}
        <ProfileSectionCard
          title="Career Goals"
          icon={Target}
          items={[
            {
              label: 'Career Goals',
              subtext: 'Define your career interests and salary expectations',
              onPress: () => navigation.navigate('CareerGoals'),
              rightIcon: ChevronRight,
            },
            ...(resume?.careerInterests && resume.careerInterests.length > 0 ? [{
              label: 'Career Interests',
              value: `${resume.careerInterests.length} interests selected`,
              icon: Target,
              iconColor: COLORS.purple,
              showSeparator: false,
            }] : []),
            ...(resume?.salaryExpectation ? [{
              label: 'Salary Expectation',
              value: resume.salaryExpectation,
              icon: DollarSign,
              iconColor: COLORS.green,
              showSeparator: false,
            }] : []),
          ]}
        />

        {/* Education Section */}
        <ProfileSectionCard
          title="Education"
          icon={GraduationCap}
          items={[
            {
              label: 'Education',
              subtext: 'Add your educational background and degrees',
              onPress: () => navigation.navigate('EducationScreen'),
              rightIcon: ChevronRight,
            },
            ...(resume?.education && resume.education.length > 0 ? [{
              label: 'Education History',
              value: `${resume.education.length} degree${resume.education.length > 1 ? 's' : ''} added`,
              icon: GraduationCap,
              iconColor: COLORS.blue,
              showSeparator: false,
            }] : []),
          ]}
        />

        {/* Certifications Section */}
        <ProfileSectionCard
          title="Certifications"
          icon={Award}
          items={[
            {
              label: 'Certifications',
              subtext: 'Add professional certifications and credentials',
              onPress: () => navigation.navigate('CertificationsScreen'),
              rightIcon: ChevronRight,
            },
            ...(resume?.certifications && resume.certifications.length > 0 ? [{
              label: 'Professional Certifications',
              value: `${resume.certifications.length} certification${resume.certifications.length > 1 ? 's' : ''}`,
              icon: Award,
              iconColor: COLORS.purple,
              showSeparator: false,
            }] : []),
          ]}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

export default StudentProfile;

