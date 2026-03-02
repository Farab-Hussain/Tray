import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { COLORS } from '../../../constants/core/colors';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { PublicProfileService, PublicRole } from '../../../services/publicProfile.service';
import { showError } from '../../../utils/toast';
import Loader from '../../../components/ui/Loader';

type RootParams = {
  PublicProfile: {
    uid: string;
    role: PublicRole;
  };
};

const PublicProfileScreen: React.FC = () => {
  const route = useRoute<RouteProp<RootParams, 'PublicProfile'>>();
  const navigation = useNavigation();
  const { uid, role } = route.params;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const screenTitle =
    role === 'recruiter'
      ? 'Company Profile'
      : role === 'consultant'
      ? 'Consultant Profile'
      : 'Student Profile';

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response =
        role === 'student'
          ? await PublicProfileService.getStudent(uid)
          : role === 'consultant'
          ? await PublicProfileService.getConsultant(uid)
          : await PublicProfileService.getRecruiter(uid);
      setProfile(response.profile || null);
    } catch (error: any) {
      showError(error?.message || 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [uid, role]);

  const formatMoneyRange = useCallback((salaryExpectation: any) => {
    if (!salaryExpectation || (!salaryExpectation.min && !salaryExpectation.max)) return null;
    const min = salaryExpectation.min ? `$${Number(salaryExpectation.min).toLocaleString()}` : '';
    const max = salaryExpectation.max ? `$${Number(salaryExpectation.max).toLocaleString()}` : '';
    return [min, max].filter(Boolean).join(' - ');
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const renderRow = (label: string, value: any) => {
    if (value === undefined || value === null || value === '') return null;
    return (
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{String(value)}</Text>
      </View>
    );
  };

  const renderList = (label: string, list: any[], itemFormatter?: (item: any) => string) => {
    if (!Array.isArray(list) || list.length === 0) return null;
    return (
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>{label}</Text>
        {list.map((item, idx) => (
          <Text key={`${label}-${idx}`} style={styles.value}>
            • {itemFormatter ? itemFormatter(item) : typeof item === 'string' ? item : JSON.stringify(item)}
          </Text>
        ))}
      </View>
    );
  };

  const renderStudent = () => {
    if (!profile) return null;
    const preferredWorkTypes = Array.isArray(profile.workPreferences?.preferredWorkTypes)
      ? profile.workPreferences.preferredWorkTypes
      : [];
    const workRestrictions = Array.isArray(profile.workPreferences?.workRestrictions)
      ? profile.workPreferences.workRestrictions
      : [];
    const careerInterests = Array.isArray(profile.careerGoals?.careerInterests)
      ? profile.careerGoals.careerInterests
      : [];
    const targetIndustries = Array.isArray(profile.careerGoals?.targetIndustries)
      ? profile.careerGoals.targetIndustries
      : [];
    const externalProfiles = Array.isArray(profile.externalProfiles) ? profile.externalProfiles : [];
    const salaryText = formatMoneyRange(profile.careerGoals?.salaryExpectation);

    return (
      <>
        <View style={styles.sectionBox}>
          {renderRow('Name', profile.name)}
          {renderRow('Email', profile.email)}
          {renderRow('Location', profile.location || profile.contact?.location)}
          {renderRow('Headline', profile.headline)}
          {renderRow('Summary', profile.summary)}
        </View>
        {renderList('Skills', profile.skills)}
        {renderList(
          'Experience',
          profile.experience,
          item =>
            `${item?.title || 'Role'} at ${item?.company || 'Company'}${
              item?.startDate ? ` (${item.startDate}${item?.current ? ' - Present' : item?.endDate ? ` - ${item.endDate}` : ''})` : ''
            }`,
        )}
        {renderList('Education', profile.education, item => `${item?.degree || 'Degree'} - ${item?.institution || 'Institution'}`)}
        {renderList('Certifications', profile.certifications, item => item?.name || item)}

        {(preferredWorkTypes.length > 0 ||
          profile.workPreferences?.transportationStatus ||
          workRestrictions.length > 0 ||
          profile.workPreferences?.shiftFlexibility) && (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Work Preferences</Text>
            {renderRow('Preferred Work Types', preferredWorkTypes.join(', '))}
            {renderRow('Transportation', profile.workPreferences?.transportationStatus)}
            {renderRow(
              'Shift Flexibility',
              profile.workPreferences?.shiftFlexibility
                ? `Days: ${(profile.workPreferences.shiftFlexibility.days || []).join(', ')} | Shifts: ${(profile.workPreferences.shiftFlexibility.shifts || []).join(', ')}`
                : null,
            )}
            {renderRow('Work Restrictions', workRestrictions.join(', '))}
          </View>
        )}

        {(careerInterests.length > 0 || targetIndustries.length > 0 || salaryText) && (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Career Goals</Text>
            {renderRow('Career Interests', careerInterests.join(', '))}
            {renderRow('Target Industries', targetIndustries.join(', '))}
            {renderRow('Salary Expectation', salaryText)}
          </View>
        )}

        {renderList(
          'External Profiles',
          externalProfiles,
          item => `${String(item?.platform || 'Profile').toUpperCase()}: ${item?.url || ''}`,
        )}
      </>
    );
  };

  const renderConsultant = () => {
    if (!profile) return null;
    const p = profile.professionalInfo || {};
    return (
      <>
        <View style={styles.sectionBox}>
          {renderRow('Name', profile.fullName || profile.name || profile.personalInfo?.fullName)}
          {renderRow('Email', profile.email)}
          {renderRow('Status', profile.status)}
          {renderRow('Bio', profile.bio)}
          {renderRow('Experience (yrs)', profile.experience || p.experience)}
          {renderRow('Title', p.title)}
          {renderRow('Category', p.category)}
          {renderRow('Specialties', Array.isArray(p.specialties) ? p.specialties.join(', ') : null)}
          {renderRow('Hourly Rate', p.hourlyRate ? `$${p.hourlyRate}` : null)}
          {renderRow('Qualifications', Array.isArray(profile.qualifications) ? profile.qualifications.join(', ') : null)}
        </View>
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Capacity & Metrics</Text>
          {renderRow('Max Caseload', p.maxCaseload)}
          {renderRow('Placement Rate (%)', p.placementRate)}
          {renderRow('Retention Rate (%)', p.retentionRate)}
          {renderRow('Revenue Generated', p.revenueGenerated)}
          {renderRow('Client Satisfaction (%)', p.clientSatisfactionRating)}
        </View>
      </>
    );
  };

  const renderRecruiter = () => {
    if (!profile) return null;
    const company = profile.company || {};
    const hq = company?.headquarters || {};
    const social = company?.socialLinks || {};
    const fairChance = company?.fairChanceHiring || {};

    return (
      <>
        <View style={styles.sectionBox}>
          {renderRow('Name', profile.name)}
          {renderRow('Email', profile.email)}
        </View>
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Company</Text>
          {renderRow('Name', company.name)}
          {renderRow('Industry', company.industry)}
          {renderRow('Website', company.website)}
          {renderRow('Size', company.size)}
          {renderRow(
            'Headquarters',
            [hq.city, hq.state, hq.country].filter(Boolean).join(', '),
          )}
          {renderRow('Description', company.description)}
          {renderRow('Founded Year', company.foundedYear)}
          {renderRow('Hiring Volume (Monthly)', company.hiringVolumeMonthly)}
          {renderRow('Pay Range', company.payRange)}
          {renderRow('Shift Requirements', company.shiftRequirements)}
          {renderRow('Required Certifications', company.requiredCertifications)}
          {renderRow('Background Policy', company.backgroundPolicyType)}
          {renderRow('Drug Testing Policy', company.drugTestingPolicy)}
          {renderRow('Benefits', company.benefitsOffered)}
          {renderRow('Retention (90 Day)', company.retention90DayRate)}
          {renderRow('Verification Status', company.verificationStatus)}
        </View>
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Contact & Social</Text>
          {renderRow('Contact Email', company.contactInfo?.email)}
          {renderRow('HR Email', company.contactInfo?.hrEmail)}
          {renderRow('Careers Email', company.contactInfo?.careersEmail)}
          {renderRow('LinkedIn', social.linkedin || company.contactInfo?.linkedinUrl)}
          {renderRow('Twitter', social.twitter)}
          {renderRow('Facebook', social.facebook)}
          {renderRow('Instagram', social.instagram)}
        </View>
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Fair Chance Hiring</Text>
          {renderRow('Enabled', fairChance.enabled ? 'Yes' : 'No')}
          {renderRow('Ban-the-Box Compliant', fairChance.banTheBoxCompliant ? 'Yes' : 'No')}
          {renderRow('Felony Friendly', fairChance.felonyFriendly ? 'Yes' : 'No')}
          {renderRow('Case-by-Case Review', fairChance.caseByCaseReview ? 'Yes' : 'No')}
          {renderRow('Second Chance Policy', fairChance.secondChancePolicy)}
          {renderRow('Rehabilitation Support', fairChance.rehabilitationSupport ? 'Yes' : 'No')}
        </View>
      </>
    );
  };

  const isProfileEmpty = useMemo(() => !profile || Object.keys(profile).length === 0, [profile]);
  const profileImage = useMemo(() => {
    if (!profile) return '';
    const image =
      role === 'recruiter'
        ? (
        profile.profileImage ||
        profile.avatarUrl ||
        profile.photoURL ||
        profile.avatar ||
        profile.company?.logoUrl ||
        ''
      )
        : role === 'consultant'
        ? (
          profile.profileImage ||
          profile.personalInfo?.profileImage ||
          profile.avatarUrl ||
          profile.photoURL ||
          profile.avatar ||
          ''
        )
        : (
          profile.profileImage ||
          profile.personalInfo?.profileImage ||
          profile.avatarUrl ||
          profile.photoURL ||
          profile.avatar ||
          ''
        );
    return typeof image === 'string' ? image.trim() : '';
  }, [profile, role]);

  const displayName = useMemo(() => {
    if (!profile) return '';
    if (role === 'consultant') return profile.fullName || profile.personalInfo?.fullName || profile.name || '';
    return profile.name || profile.company?.name || '';
  }, [profile, role]);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [profileImage, uid, role]);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={screenTitle} showBackButton onBackPress={() => navigation.goBack()} />
      {loading ? (
        <Loader message="Loading profile..." />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {!isProfileEmpty && (
            <View style={styles.headerCard}>
              {profileImage && !imageLoadFailed ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.avatar}
                  onError={() => setImageLoadFailed(true)}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarFallbackText}>
                    {displayName ? String(displayName).charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
              )}
              <Text style={styles.headerTitle}>{displayName || screenTitle}</Text>
            </View>
          )}
          {role === 'student' && renderStudent()}
          {role === 'consultant' && renderConsultant()}
          {role === 'recruiter' && renderRecruiter()}
          {isProfileEmpty && (
            <View style={styles.sectionBox}>
              <Text style={styles.value}>Profile not found.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  sectionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 6,
  },
  row: {
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: COLORS.gray,
  },
  value: {
    fontSize: 14,
    color: COLORS.black,
  },
  headerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    marginBottom: 10,
  },
  avatarFallback: {
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
  },
});

export default PublicProfileScreen;
