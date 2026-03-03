import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  User,
  FileText,
  Briefcase,
  Shield,
  GraduationCap,
  Award,
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
import { AIService } from '../../../services/ai.service';
import { logger } from '../../../utils/logger';

const StudentProfile = ({ navigation }: any) => {
  const { user } = useAuth();
  const [backendProfile, setBackendProfile] = useState<any>(null);
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [_updatingImage, _setUpdatingImage] = useState(false);
  const [_imageCacheKey, _setImageCacheKey] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState<any>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [jobInterestModalVisible, setJobInterestModalVisible] = useState(false);
  const [jobInterestInput, setJobInterestInput] = useState('');

  const getExternalProfilesList = (externalProfiles: any) => {
    if (!externalProfiles) return [];

    const linksFromArray = Array.isArray(externalProfiles.links)
      ? externalProfiles.links
          .filter((item: any) => item?.url && item?.platform)
          .map((item: any, index: number) => ({
            id: item.id || `${item.platform}-${index}`,
            platform: item.platform,
            url: item.url,
          }))
      : [];

    if (linksFromArray.length > 0) {
      return linksFromArray;
    }

    const fallback = [];
    if (externalProfiles.linkedin) {
      fallback.push({ id: 'linkedin', platform: 'linkedin', url: externalProfiles.linkedin });
    }
    if (externalProfiles.github) {
      fallback.push({ id: 'github', platform: 'github', url: externalProfiles.github });
    }
    if (externalProfiles.portfolio) {
      fallback.push({ id: 'portfolio', platform: 'portfolio', url: externalProfiles.portfolio });
    }
    return fallback;
  };
  const getWorkEligibilitySummaryStatus = (): string => {
    const statuses = Object.values(
      resume?.workEligibilityChecklist?.verificationStatusBySection || {},
    );
    if (statuses.includes('rejected')) return 'Evidence rejected';
    if (statuses.includes('verified')) return 'Partially verified';
    if (statuses.includes('pending')) return 'Verification pending';
    if (resume?.workEligibilityChecklist?.selfAttestationAccepted) return 'Self-attested';
    return 'Not started';
  };

  const handleAnalyzeProfile = async () => {
    try {
      setAiAnalyzing(true);
      const experience = Array.isArray(resume?.experience)
        ? resume.experience
            .map((exp: any) => `${exp?.title || 'N/A'} at ${exp?.company || 'N/A'}`)
            .filter(Boolean)
        : [];
      const education = Array.isArray(resume?.education)
        ? resume.education
            .map((edu: any) => `${edu?.degree || 'N/A'} - ${edu?.institution || 'N/A'}`)
            .filter(Boolean)
        : [];
      const certifications = Array.isArray(resume?.certifications)
        ? resume.certifications
            .map((cert: any) => cert?.name)
            .filter(Boolean)
        : [];

      const result = await AIService.profileInsights({
        provider: 'openai',
        name: backendProfile?.name || user?.displayName || '',
        email: backendProfile?.email || user?.email || '',
        phone: backendProfile?.phone || '',
        location: backendProfile?.location || '',
        skills: Array.isArray(resume?.skills) ? resume.skills : [],
        certifications,
        experience,
        education,
        target_role: experience[0] || undefined,
      });

      const missing = Array.isArray(result?.missing_critical_fields)
        ? result.missing_critical_fields
        : [];
      const skillTags = Array.isArray(result?.suggested_skill_tags)
        ? result.suggested_skill_tags
        : [];
      const certs = Array.isArray(result?.suggested_certifications)
        ? result.suggested_certifications
        : [];

      Alert.alert(
        'Profile AI Insights',
        [
          missing.length ? `Missing: ${missing.join(', ')}` : 'Missing: none',
          skillTags.length
            ? `Suggested skills: ${skillTags.slice(0, 5).join(', ')}`
            : 'Suggested skills: none',
          certs.length
            ? `Suggested certs: ${certs.slice(0, 4).join(', ')}`
            : 'Suggested certs: none',
        ].join('\n\n'),
        [
          { text: 'Close', style: 'cancel' },
          {
            text: 'Open Resume',
            onPress: () => navigation.navigate('Resume'),
          },
        ],
      );
    } catch (error: any) {
      if (__DEV__) {
        console.error('Profile AI insights failed:', error);
      }
      Alert.alert(
        'AI Error',
        error?.response?.data?.detail ||
          error?.message ||
          'Failed to analyze profile',
      );
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!user) return;
    try {
      const updatedProfile = await UserService.updateProfile({ location: locationInput.trim() });
      setBackendProfile(updatedProfile);
      setLocationModalVisible(false);
      Alert.alert('Success', 'Location updated');
    } catch (error: any) {
      Alert.alert('Issue', error?.message || 'Failed to update location');
    }
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
      setLocationInput(profileResponse?.location || '');
      setLocationInput(profileResponse?.location || '');

      // Fetch resume if exists
      let resumeData = null;
      try {
        const resumeResponse = await ResumeService.getMyResume();
        if (resumeResponse.resume) {
          setResume(resumeResponse.resume);
          resumeData = resumeResponse.resume;
          // Pre-fill job interest from the first career interest if available
          const firstInterest = resumeResponse.resume?.careerInterests?.[0] || '';
          setJobInterestInput(firstInterest);
          if (__DEV__) {
            logger.debug('✅ [StudentProfile] Resume data loaded:', {
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
            logger.debug('Error fetching resume:', error)
          };
        }
        setResume(null);
      }

      // Calculate profile completion based on actual data
      const calculateProfileCompletion = (profileData: any, resumePayload: any) => {
        let completion = 0;
        const maxCompletion = 100;
        
        // Basic profile (30%)
        if (profileData?.name || user?.displayName) completion += 10;
        if (profileData?.email || user?.email) completion += 10;
        if (profileData?.profileImage || user?.photoURL) completion += 10;
        
        // Resume (25%)
        if (resumePayload) {
          if (resumePayload.skills && resumePayload.skills.length > 0) completion += 10;
          if (resumePayload.experience && resumePayload.experience.length > 0) completion += 10;
          if (resumePayload.education && resumePayload.education.length > 0) completion += 5;
        }
        
        // Work preferences (20%)
        // Check if work preferences exist in the resume data
        if (resumePayload) {
          if (resumePayload.shiftFlexibility?.days && resumePayload.shiftFlexibility.days.length > 0) completion += 10;
          if (resumePayload.transportationStatus && resumePayload.transportationStatus !== 'none') completion += 5;
          if (resumePayload.workRestrictions && resumePayload.workRestrictions.length > 0) completion += 5;
        }
        
        // Career goals (15%)
        if (resumePayload) {
          let careerGoalsCompletion = 0;
          
          if (resumePayload.careerInterests && resumePayload.careerInterests.length > 0) {
            careerGoalsCompletion += 8;
            if (__DEV__) {
              logger.debug('✅ [ProfileCompletion] Career interests found:', resumePayload.careerInterests.length);
            }
          }
          if (resumePayload.targetIndustries && resumePayload.targetIndustries.length > 0) {
            careerGoalsCompletion += 7;
            if (__DEV__) {
              logger.debug('✅ [ProfileCompletion] Target industries found:', resumePayload.targetIndustries.length);
            }
          }
          
          // If no interests or industries but salary is set, give partial credit
          if (careerGoalsCompletion === 0 && resumePayload.salaryExpectation) {
            const hasValidSalary = (resumePayload.salaryExpectation.min && resumePayload.salaryExpectation.min > 0) ||
                                 (resumePayload.salaryExpectation.max && resumePayload.salaryExpectation.max > 0);
            if (hasValidSalary) {
              careerGoalsCompletion = 5; // Partial credit for salary only
              if (__DEV__) {
                logger.debug('✅ [ProfileCompletion] Salary expectation found, partial credit given');
              }
            }
          }
          
          completion += careerGoalsCompletion;
          
          if (__DEV__) {
            logger.debug('📊 [ProfileCompletion] Career goals data:', {
              hasCareerInterests: !!(resumePayload.careerInterests && resumePayload.careerInterests.length > 0),
              hasTargetIndustries: !!(resumePayload.targetIndustries && resumePayload.targetIndustries.length > 0),
              hasSalaryExpectation: !!(resumePayload.salaryExpectation),
              careerGoalsCompletion
            });
          }
        }
        
        // External profiles (10%)
        if (profileData?.externalProfiles) {
          const links = getExternalProfilesList(profileData.externalProfiles);
          if (links.length > 0) completion += 10;
        }
        
        return {
          overallCompletion: Math.min(completion, maxCompletion),
          basicProfile: !!(profileData?.name || user?.displayName) && !!(profileData?.email || user?.email),
          workPreferences: !!(resumePayload && (
            (resumePayload.shiftFlexibility?.days && resumePayload.shiftFlexibility.days.length > 0) ||
            resumePayload.transportationStatus !== 'none' ||
            (resumePayload.workRestrictions && resumePayload.workRestrictions.length > 0)
          )),
          authorization: !!(resumePayload?.workAuthorized),
          careerGoals: !!(resumePayload && (
            (resumePayload.careerInterests && resumePayload.careerInterests.length > 0) ||
            (resumePayload.targetIndustries && resumePayload.targetIndustries.length > 0) ||
            (resumePayload.salaryExpectation && (
              (resumePayload.salaryExpectation.min && resumePayload.salaryExpectation.min > 0) ||
              (resumePayload.salaryExpectation.max && resumePayload.salaryExpectation.max > 0)
            ))
          )),
          externalProfiles: !!(profileData?.externalProfiles) && getExternalProfilesList(profileData.externalProfiles).length > 0,
          hasResume: !!resumePayload,
          hasSkills: !!(resumePayload?.skills && resumePayload.skills.length > 0),
          hasExperience: !!(resumePayload?.experience && resumePayload.experience.length > 0),
          hasEducation: !!(resumePayload?.education && resumePayload.education.length > 0),
        };
      };

      const completionData = calculateProfileCompletion(profileResponse, resumeData);
      
      if (__DEV__) {
        logger.debug('🎯 [StudentProfile] Final completion data:', {
          overallCompletion: completionData.overallCompletion,
          careerGoals: completionData.careerGoals,
          hasResume: completionData.hasResume,
          resumeDataKeys: resumeData ? Object.keys(resumeData) : 'No resume data'
        });
      }
      
      setProfileCompletion(completionData);
    } catch (error: any) {
      if (__DEV__) {
        logger.error('Error fetching profile data:', error)
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
  const location = backendProfile?.location || '';
  const externalProfileList = getExternalProfilesList(backendProfile?.externalProfiles);
  const primaryJobInterest = resume?.careerInterests?.[0] || '';

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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          keyboardShouldPersistTaps="handled"
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
            <TouchableOpacity
              style={{
                marginTop: 10,
                backgroundColor: COLORS.green,
                borderRadius: 8,
                alignSelf: 'flex-start',
                paddingVertical: 8,
                paddingHorizontal: 12,
                opacity: aiAnalyzing ? 0.7 : 1,
              }}
              onPress={handleAnalyzeProfile}
              disabled={aiAnalyzing}
            >
              <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '700' }}>
                {aiAnalyzing ? 'Analyzing...' : 'Profile AI Insights'}
              </Text>
            </TouchableOpacity>

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
          {
            label: 'Location',
            value: location || 'Add your city, state',
            onPress: () => {
              setLocationInput(location || '');
              setLocationModalVisible(true);
            },
            rightIcon: Edit2,
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
              label: 'Manage Preferences',
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
            ...(resume?.transportationStatus && !['none', 'unknown'].includes(resume.transportationStatus) ? [{
              label: 'Transportation',
              value: resume.transportationStatus.replace('-', ' '),
              icon: Car,
              iconColor: COLORS.green,
              showSeparator: false,
            }] : []),
          ]}
        />

        {/* Work Eligibility (Private) */}
        <ProfileSectionCard
          title="Work Eligibility (Private)"
          icon={Shield}
          items={[
            {
              label: 'Client-Side Eligibility Checklist',
              subtext: 'Private self-attested compatibility details used for matching only',
              onPress: () => navigation.navigate('AuthorizationDocuments'),
              rightIcon: ChevronRight,
            },
            ...(resume?.workEligibilityChecklist?.selfAttestationAccepted ? [{
              label: 'Status',
              value: getWorkEligibilitySummaryStatus(),
              icon: CheckCircle,
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
              label: 'Job Interest',
              value: primaryJobInterest || 'Add your primary job interest',
              onPress: () => {
                setJobInterestInput(primaryJobInterest);
                setJobInterestModalVisible(true);
              },
              rightIcon: Edit2,
            },
            {
              label: 'Manage Goals',
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
              label: 'Manage Education',
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
              label: 'Manage Certifications',
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
              label: 'Manage Profiles',
              subtext: 'Add your LinkedIn, GitHub, and portfolio links',
              onPress: () => navigation.navigate('ExternalProfilesScreen'),
              rightIcon: ChevronRight,
            },
            ...externalProfileList.map((profile: any, index: number) => {
              const platform = String(profile.platform || '').toLowerCase();
              const isLinkedIn = platform === 'linkedin';
              const isGithub = platform === 'github';
              const label = isLinkedIn
                ? 'LinkedIn'
                : isGithub
                ? 'GitHub'
                : platform === 'portfolio'
                ? 'Portfolio'
                : 'External Link';

              const icon = isLinkedIn ? Linkedin : isGithub ? Github : Globe;
              const iconColor = isLinkedIn ? COLORS.blue : isGithub ? COLORS.gray : COLORS.green;

              return {
                label,
                value: profile.url,
                icon,
                iconColor,
                showSeparator: index !== externalProfileList.length - 1,
              };
            }),
          ]}
        />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Job Interest modal */}
      <Modal
        visible={jobInterestModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setJobInterestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Job Interest</Text>
            <Text style={styles.modalSubtitle}>Add the main role you’re targeting</Text>
            <View style={styles.modalInputWrapper}>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Frontend Developer"
                value={jobInterestInput}
                onChangeText={setJobInterestInput}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setJobInterestModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={async () => {
                  try {
                    const trimmed = jobInterestInput.trim();
                    const updatedInterests = trimmed
                      ? [trimmed, ...(resume?.careerInterests?.slice(1) || [])]
                      : [];

                    const payload: any = {
                      careerInterests: updatedInterests,
                      targetIndustries: resume?.targetIndustries || [],
                      industriesToAvoid: resume?.industriesToAvoid || [],
                      salaryExpectation: resume?.salaryExpectation || {},
                      employmentGapExplanation:
                        resume?.employmentGapExplanation || '',
                    };

                    // Preserve PICS status only if a proof exists to avoid Firestore undefined errors
                    const hasPicsProof = !!resume?.picsAssessmentProof?.fileUrl;
                    payload.picsAssessmentCompleted =
                      !!resume?.picsAssessmentCompleted && hasPicsProof;
                    if (hasPicsProof) {
                      payload.picsAssessmentProof = resume?.picsAssessmentProof;
                    } else {
                      delete payload.picsAssessmentProof;
                    }

                    await ResumeService.updateCareerGoals(payload);

                    setResume(prev => ({
                      ...(prev || {}),
                      careerInterests: updatedInterests,
                    }));

                    Alert.alert('Success', 'Job interest updated');
                    setJobInterestModalVisible(false);
                  } catch (error: any) {
                    Alert.alert(
                      'Issue',
                      error?.response?.data?.error ||
                        error?.message ||
                        'Failed to update job interest',
                    );
                  }
                }}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Location modal */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Update Location</Text>
            <Text style={styles.modalSubtitle}>City, State (e.g., Austin, TX)</Text>
            <View style={styles.modalInputWrapper}>
              <TextInput
                style={styles.modalInput}
                placeholder="City, State"
                value={locationInput}
                onChangeText={setLocationInput}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setLocationModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveLocation}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default StudentProfile;
