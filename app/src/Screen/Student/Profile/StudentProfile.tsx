import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  Globe,
  Linkedin,
  Github,
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

      // Fetch resume if exists
      let resumeData = null;
      try {
        const resumeResponse = await ResumeService.getMyResume();
        if (resumeResponse.resume) {
          setResume(resumeResponse.resume);
          resumeData = resumeResponse.resume;
          if (__DEV__) {
            console.log('✅ [StudentProfile] Resume data loaded:', {
              careerInterests: resumeData.careerInterests,
              targetIndustries: resumeData.targetIndustries,
              salaryExpectation: resumeData.salaryExpectation
            });
          }
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

      // Calculate profile completion based on actual data
      const calculateProfileCompletion = (profileData: any, resumeData: any) => {
        let completion = 0;
        const maxCompletion = 100;
        
        // Basic profile (30%)
        if (profileData?.name || user?.displayName) completion += 10;
        if (profileData?.email || user?.email) completion += 10;
        if (profileData?.profileImage || user?.photoURL) completion += 10;
        
        // Resume (25%)
        if (resumeData) {
          if (resumeData.skills && resumeData.skills.length > 0) completion += 10;
          if (resumeData.experience && resumeData.experience.length > 0) completion += 10;
          if (resumeData.education && resumeData.education.length > 0) completion += 5;
        }
        
        // Work preferences (20%)
        // Check if work preferences exist in the resume data
        if (resumeData) {
          if (resumeData.shiftFlexibility?.days && resumeData.shiftFlexibility.days.length > 0) completion += 10;
          if (resumeData.transportationStatus && resumeData.transportationStatus !== 'none') completion += 5;
          if (resumeData.workRestrictions && resumeData.workRestrictions.length > 0) completion += 5;
        }
        
        // Career goals (15%)
        if (resumeData) {
          let careerGoalsCompletion = 0;
          
          if (resumeData.careerInterests && resumeData.careerInterests.length > 0) {
            careerGoalsCompletion += 8;
            if (__DEV__) {
              console.log('✅ [ProfileCompletion] Career interests found:', resumeData.careerInterests.length);
            }
          }
          if (resumeData.targetIndustries && resumeData.targetIndustries.length > 0) {
            careerGoalsCompletion += 7;
            if (__DEV__) {
              console.log('✅ [ProfileCompletion] Target industries found:', resumeData.targetIndustries.length);
            }
          }
          
          // If no interests or industries but salary is set, give partial credit
          if (careerGoalsCompletion === 0 && resumeData.salaryExpectation) {
            const hasValidSalary = (resumeData.salaryExpectation.min && resumeData.salaryExpectation.min > 0) ||
                                 (resumeData.salaryExpectation.max && resumeData.salaryExpectation.max > 0);
            if (hasValidSalary) {
              careerGoalsCompletion = 5; // Partial credit for salary only
              if (__DEV__) {
                console.log('✅ [ProfileCompletion] Salary expectation found, partial credit given');
              }
            }
          }
          
          completion += careerGoalsCompletion;
          
          if (__DEV__) {
            console.log('📊 [ProfileCompletion] Career goals data:', {
              hasCareerInterests: !!(resumeData.careerInterests && resumeData.careerInterests.length > 0),
              hasTargetIndustries: !!(resumeData.targetIndustries && resumeData.targetIndustries.length > 0),
              hasSalaryExpectation: !!(resumeData.salaryExpectation),
              careerGoalsCompletion
            });
          }
        }
        
        // External profiles (10%)
        if (profileData?.externalProfiles) {
          if (profileData.externalProfiles.linkedin || profileData.externalProfiles.github || profileData.externalProfiles.portfolio) {
            completion += 10;
          }
        }
        
        return {
          overallCompletion: Math.min(completion, maxCompletion),
          basicProfile: !!(profileData?.name || user?.displayName) && !!(profileData?.email || user?.email),
          workPreferences: !!(resumeData && (
            (resumeData.shiftFlexibility?.days && resumeData.shiftFlexibility.days.length > 0) ||
            resumeData.transportationStatus !== 'none' ||
            (resumeData.workRestrictions && resumeData.workRestrictions.length > 0)
          )),
          authorization: !!(resumeData?.workAuthorized),
          careerGoals: !!(resumeData && (
            (resumeData.careerInterests && resumeData.careerInterests.length > 0) ||
            (resumeData.targetIndustries && resumeData.targetIndustries.length > 0) ||
            (resumeData.salaryExpectation && (
              (resumeData.salaryExpectation.min && resumeData.salaryExpectation.min > 0) ||
              (resumeData.salaryExpectation.max && resumeData.salaryExpectation.max > 0)
            ))
          )),
          externalProfiles: !!(profileData?.externalProfiles),
          hasResume: !!resumeData,
          hasSkills: !!(resumeData?.skills && resumeData.skills.length > 0),
          hasExperience: !!(resumeData?.experience && resumeData.experience.length > 0),
          hasEducation: !!(resumeData?.education && resumeData.education.length > 0),
        };
      };

      const completionData = calculateProfileCompletion(profileResponse, resumeData);
      
      if (__DEV__) {
        console.log('🎯 [StudentProfile] Final completion data:', {
          overallCompletion: completionData.overallCompletion,
          careerGoals: completionData.careerGoals,
          hasResume: completionData.hasResume,
          resumeDataKeys: resumeData ? Object.keys(resumeData) : 'No resume data'
        });
      }
      
      setProfileCompletion(completionData);
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

      // Calculate completion with fallback data
      const calculateFallbackCompletion = (profileData: any) => {
        let completion = 0;
        
        // Basic profile (30%)
        if (profileData?.name || user?.displayName) completion += 10;
        if (profileData?.email || user?.email) completion += 10;
        if (profileData?.profileImage || user?.photoURL) completion += 10;
        
        return {
          overallCompletion: completion,
          basicProfile: !!(profileData?.name || user?.displayName) && !!(profileData?.email || user?.email),
          workPreferences: false,
          authorization: false,
          careerGoals: false,
          externalProfiles: false,
          hasResume: false,
          hasSkills: false,
          hasExperience: false,
          hasEducation: false,
        };
      };

      const fallbackData = {
        name: user.displayName || null,
        email: user.email || null,
        profileImage: user.photoURL || null,
      };
      
      const completionData = calculateFallbackCompletion(fallbackData);
      setProfileCompletion(completionData);
      setResume(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const { refreshing, handleRefresh } = useRefresh(fetchProfileData);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [user])
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

            {/* Detailed completion breakdown */}
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border }}>
              <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: COLORS.black }}>
                Profile Breakdown:
              </Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: COLORS.gray }}>Basic Info:</Text>
                <Text style={{ fontSize: 12, color: profileCompletion?.basicProfile ? COLORS.green : COLORS.red }}>
                  {profileCompletion?.basicProfile ? '✓ Complete' : '✗ Incomplete'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: COLORS.gray }}>Resume:</Text>
                <Text style={{ fontSize: 12, color: profileCompletion?.hasResume ? COLORS.green : COLORS.red }}>
                  {profileCompletion?.hasResume ? '✓ Complete' : '✗ Incomplete'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: COLORS.gray }}>Skills:</Text>
                <Text style={{ fontSize: 12, color: profileCompletion?.hasSkills ? COLORS.green : COLORS.red }}>
                  {profileCompletion?.hasSkills ? '✓ Complete' : '✗ Incomplete'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: COLORS.gray }}>Experience:</Text>
                <Text style={{ fontSize: 12, color: profileCompletion?.hasExperience ? COLORS.green : COLORS.red }}>
                  {profileCompletion?.hasExperience ? '✓ Complete' : '✗ Incomplete'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: COLORS.gray }}>Education:</Text>
                <Text style={{ fontSize: 12, color: profileCompletion?.hasEducation ? COLORS.green : COLORS.red }}>
                  {profileCompletion?.hasEducation ? '✓ Complete' : '✗ Incomplete'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: COLORS.gray }}>Work Preferences:</Text>
                <Text style={{ fontSize: 12, color: profileCompletion?.workPreferences ? COLORS.green : COLORS.red }}>
                  {profileCompletion?.workPreferences ? '✓ Complete' : '✗ Incomplete'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: COLORS.gray }}>Career Goals:</Text>
                <Text style={{ fontSize: 12, color: profileCompletion?.careerGoals ? COLORS.green : COLORS.red }}>
                  {profileCompletion?.careerGoals ? '✓ Complete' : '✗ Incomplete'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ fontSize: 12, color: COLORS.gray }}>External Profiles:</Text>
                <Text style={{ fontSize: 12, color: profileCompletion?.externalProfiles ? COLORS.green : COLORS.red }}>
                  {profileCompletion?.externalProfiles ? '✓ Complete' : '✗ Incomplete'}
                </Text>
              </View>
            </View>

            {/* Action buttons for incomplete sections */}
            {completionPercentage < 100 && (
              <View style={{ marginTop: 12 }}>
                {!profileCompletion?.hasResume && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: COLORS.green,
                      borderRadius: 6,
                      padding: 8,
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                    onPress={() => navigation.navigate('Resume')}
                  >
                    <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '600' }}>
                      Add Resume (+25%)
                    </Text>
                  </TouchableOpacity>
                )}

                {!profileCompletion?.workPreferences && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: COLORS.blue,
                      borderRadius: 6,
                      padding: 8,
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                    onPress={() => navigation.navigate('WorkPreferences')}
                  >
                    <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '600' }}>
                      Set Work Preferences (+20%)
                    </Text>
                  </TouchableOpacity>
                )}

                {!profileCompletion?.careerGoals && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: COLORS.purple,
                      borderRadius: 6,
                      padding: 8,
                      alignItems: 'center',
                    }}
                    onPress={() => navigation.navigate('CareerGoals')}
                  >
                    <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '600' }}>
                      Set Career Goals (+15%)
                    </Text>
                  </TouchableOpacity>
                )}

                {!profileCompletion?.externalProfiles && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: COLORS.blue,
                      borderRadius: 6,
                      padding: 8,
                      alignItems: 'center',
                      marginTop: 8,
                    }}
                    onPress={() => navigation.navigate('ExternalProfilesScreen')}
                  >
                    <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '600' }}>
                      Add External Profiles (+10%)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
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
              value: `$${resume.salaryExpectation.min?.toLocaleString() || 0} - $${resume.salaryExpectation.max?.toLocaleString() || 0}`,
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

        {/* External Profiles Section */}
        <ProfileSectionCard
          title="External Profiles"
          icon={Globe}
          items={[
            {
              label: 'External Profiles',
              subtext: 'Add your LinkedIn, GitHub, and portfolio links',
              onPress: () => navigation.navigate('ExternalProfilesScreen'),
              rightIcon: ChevronRight,
            },
            ...(backendProfile?.externalProfiles?.linkedin ? [{
              label: 'LinkedIn',
              value: 'LinkedIn profile connected',
              icon: Linkedin,
              iconColor: COLORS.blue,
              showSeparator: false,
            }] : []),
            ...(backendProfile?.externalProfiles?.github ? [{
              label: 'GitHub',
              value: 'GitHub profile connected',
              icon: Github,
              iconColor: COLORS.gray,
              showSeparator: false,
            }] : []),
            ...(backendProfile?.externalProfiles?.portfolio ? [{
              label: 'Portfolio',
              value: 'Portfolio website connected',
              icon: Globe,
              iconColor: COLORS.green,
              showSeparator: false,
            }] : []),
          ]}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

export default StudentProfile;

