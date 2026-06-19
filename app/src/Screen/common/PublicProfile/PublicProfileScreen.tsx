import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import {
  BadgeCheck,
  Award,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Car,
  DollarSign,
  ExternalLink,
  FileText,
  Github,
  GraduationCap,
  Link,
  Linkedin,
  MapPin,
  Mail,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react-native';
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

  const viewedRole: PublicRole = useMemo(() => {
    const normalizedRole = String(role || '').toLowerCase();
    if (normalizedRole === 'consultant') return 'consultant';
    if (normalizedRole === 'recruiter' || normalizedRole === 'hiring_manager') return 'recruiter';
    return 'student';
  }, [role]);

  const screenTitle =
    viewedRole === 'recruiter'
      ? 'Company Profile'
      : viewedRole === 'consultant'
      ? 'Consultant Profile'
      : 'Student Profile';

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response =
        viewedRole === 'student'
          ? await PublicProfileService.getStudent(uid)
          : viewedRole === 'consultant'
          ? await PublicProfileService.getConsultant(uid)
          : await PublicProfileService.getRecruiter(uid);
      setProfile(response.profile || null);
    } catch (error: any) {
      showError(error?.message || 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [uid, viewedRole]);

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

  const renderDetail = (
    label: string,
    value: any,
    icon?: React.ReactNode,
    compact = false,
  ) => {
    if (value === undefined || value === null || value === '') return null;
    return (
      <View style={[styles.detailItem, compact && styles.detailItemCompact]}>
        {!!icon && <View style={styles.detailIcon}>{icon}</View>}
        <View style={styles.detailTextWrap}>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.detailValue} numberOfLines={compact ? 2 : 4}>
            {String(value)}
          </Text>
        </View>
      </View>
    );
  };

  const renderChip = (label: string, tone: 'green' | 'blue' | 'orange' | 'gray' = 'gray') => {
    if (!label) return null;
    return (
      <View style={[styles.chip, styles[`chip_${tone}`]]}>
        <Text style={[styles.chipText, styles[`chipText_${tone}`]]}>{label}</Text>
      </View>
    );
  };

  const renderSection = (
    title: string,
    children: React.ReactNode,
    icon?: React.ReactNode,
  ) => (
    <View style={styles.sectionBox}>
      <View style={styles.sectionHeader}>
        {!!icon && <View style={styles.sectionIcon}>{icon}</View>}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const formatDateRange = (item: any) => {
    const start = item?.startDate || item?.from || item?.year || '';
    const end = item?.current ? 'Present' : item?.endDate || item?.to || '';
    return [start, end].filter(Boolean).join(' - ');
  };

  const normalizeUrl = (url: any) => {
    if (typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return /^https?:\/\/[^\s]+$/i.test(withProtocol) ? withProtocol : null;
  };

  const getHostName = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\//i, '').split('/')[0];
    }
  };

  const openSafeUrl = async (url: any) => {
    const safeUrl = normalizeUrl(url);
    if (!safeUrl) {
      showError('This link is not available');
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(safeUrl);
      if (!canOpen) {
        showError('Unable to open this link');
        return;
      }
      await Linking.openURL(safeUrl);
    } catch {
      showError('Unable to open this link');
    }
  };

  const getExternalProfileMeta = (platform: any) => {
    const key = String(platform || 'profile').toLowerCase();
    if (key.includes('linkedin')) {
      return {
        label: 'LinkedIn',
        icon: <Linkedin size={17} color="#0A66C2" />,
      };
    }
    if (key.includes('github')) {
      return {
        label: 'GitHub',
        icon: <Github size={17} color={COLORS.black} />,
      };
    }
    if (key.includes('portfolio')) {
      return {
        label: 'Portfolio',
        icon: <BriefcaseBusiness size={17} color={COLORS.blue} />,
      };
    }
    return {
      label: key === 'website' ? 'Website' : 'Profile',
      icon: <Link size={17} color={COLORS.blue} />,
    };
  };

  const renderTimelineItem = (
    title: string,
    subtitle?: string,
    meta?: string,
    description?: string,
  ) => (
    <View style={styles.timelineItem}>
      <View style={styles.timelineDot} />
      <View style={styles.timelineContent}>
        <Text style={styles.timelineTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.timelineSubtitle}>{subtitle}</Text>}
        {!!meta && <Text style={styles.timelineMeta}>{meta}</Text>}
        {!!description && <Text style={styles.timelineDescription}>{description}</Text>}
      </View>
    </View>
  );

  const renderChipList = (
    items: any[],
    tone: 'green' | 'blue' | 'orange' | 'gray' = 'gray',
  ) => {
    const filtered = Array.isArray(items) ? items.filter(Boolean) : [];
    if (filtered.length === 0) return null;
    return (
      <View style={styles.chipWrap}>
        {filtered.map((item, index) => (
          <React.Fragment key={`${String(item)}-${index}`}>
            {renderChip(String(item), tone)}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const renderStudent = () => {
    if (!profile) return null;
    const skills = Array.isArray(profile.skills) ? profile.skills.filter(Boolean) : [];
    const experience = Array.isArray(profile.experience) ? profile.experience.filter(Boolean) : [];
    const education = Array.isArray(profile.education) ? profile.education.filter(Boolean) : [];
    const certifications = Array.isArray(profile.certifications)
      ? profile.certifications.filter(Boolean)
      : [];
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
    const externalProfiles = Array.isArray(profile.externalProfiles)
      ? profile.externalProfiles.filter((item: any) => !!normalizeUrl(item?.url))
      : [];
    const salaryText = formatMoneyRange(profile.careerGoals?.salaryExpectation);
    const shiftFlexibility = profile.workPreferences?.shiftFlexibility;
    const shiftDays = Array.isArray(shiftFlexibility?.days) ? shiftFlexibility.days : [];
    const shiftTimes = Array.isArray(shiftFlexibility?.shifts) ? shiftFlexibility.shifts : [];
    const resumeUrl =
      profile.resumeFileUrl ||
      profile.resume?.publicUrl ||
      profile.resume?.url ||
      profile.resume?.fileUrl ||
      profile.resume?.resumeFileUrl;
    const workEligibility = profile.workEligibility || profile.workAuthorization || {};
    const hasWorkEligibility =
      profile.workAuthorized !== undefined ||
      profile.backgroundCheckRequired !== undefined ||
      workEligibility.workAuthorized !== undefined ||
      workEligibility.backgroundCheckRequired !== undefined ||
      (Array.isArray(profile.authorizationDocuments) && profile.authorizationDocuments.length > 0) ||
      (Array.isArray(workEligibility.authorizationDocuments) &&
        workEligibility.authorizationDocuments.length > 0);

    return (
      <>
        {renderSection(
          'Overview',
          <>
            {!!(profile.summary || profile.bio) && (
              <Text style={styles.bioText}>{profile.summary || profile.bio}</Text>
            )}
            <View style={styles.detailGrid}>
              {renderDetail('Name', profile.name, <GraduationCap size={16} color={COLORS.orange} />, true)}
              {renderDetail('Email', profile.email || profile.contact?.email, <Mail size={16} color={COLORS.gray} />, true)}
              {renderDetail('Location', profile.location || profile.contact?.location, <MapPin size={16} color={COLORS.blue} />, true)}
              {renderDetail('Headline', profile.headline, <Target size={16} color={COLORS.green} />, true)}
            </View>
          </>,
          <GraduationCap size={18} color={COLORS.orange} />,
        )}

        {(resumeUrl || skills.length > 0 || externalProfiles.length > 0) &&
          renderSection(
            'Profile Assets',
            <>
              {!!resumeUrl && (
                <TouchableOpacity
                  activeOpacity={0.82}
                  style={styles.resumeButton}
                  onPress={() => openSafeUrl(resumeUrl)}
                >
                  <View style={styles.resumeIcon}>
                    <FileText size={19} color={COLORS.blue} />
                  </View>
                  <View style={styles.resumeTextWrap}>
                    <Text style={styles.resumeTitle}>Resume</Text>
                    <Text style={styles.resumeSubtitle}>Open downloadable file</Text>
                  </View>
                  <ExternalLink size={17} color={COLORS.gray} />
                </TouchableOpacity>
              )}
              {skills.length > 0 && (
                <View style={styles.subBlock}>
                  <Text style={styles.subBlockTitle}>Skills</Text>
                  {renderChipList(skills, 'blue')}
                </View>
              )}
              {externalProfiles.length > 0 && (
                <View style={styles.subBlock}>
                  <Text style={styles.subBlockTitle}>External Profiles</Text>
                  <View style={styles.linkGrid}>
                    {externalProfiles.map((item: any, index: number) => {
                      const safeUrl = normalizeUrl(item?.url);
                      if (!safeUrl) return null;
                      const meta = getExternalProfileMeta(item?.platform);
                      return (
                        <TouchableOpacity
                          key={`${item?.platform || 'profile'}-${index}`}
                          activeOpacity={0.82}
                          style={styles.externalLinkCard}
                          onPress={() => openSafeUrl(safeUrl)}
                        >
                          <View style={styles.externalIcon}>{meta.icon}</View>
                          <View style={styles.externalTextWrap}>
                            <Text style={styles.externalTitle}>{meta.label}</Text>
                            <Text style={styles.externalUrl} numberOfLines={1}>
                              {getHostName(safeUrl)}
                            </Text>
                          </View>
                          <ExternalLink size={15} color={COLORS.gray} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </>,
            <FileText size={18} color={COLORS.blue} />,
          )}

        {experience.length > 0 &&
          renderSection(
            'Experience',
            <View style={styles.timelineList}>
              {experience.map((item: any, index: number) => (
                <React.Fragment key={`experience-${index}`}>
                  {renderTimelineItem(
                    item?.title || 'Role',
                    item?.company || '',
                    formatDateRange(item),
                    item?.description,
                  )}
                </React.Fragment>
              ))}
            </View>,
            <BriefcaseBusiness size={18} color={COLORS.blue} />,
          )}

        {education.length > 0 &&
          renderSection(
            'Education',
            <View style={styles.timelineList}>
              {education.map((item: any, index: number) => (
                <React.Fragment key={`education-${index}`}>
                  {renderTimelineItem(
                    item?.degree || item?.program || 'Education',
                    item?.institution || item?.school || '',
                    item?.graduationYear ? `Graduation ${item.graduationYear}` : formatDateRange(item),
                    item?.gpa ? `GPA ${item.gpa}` : item?.description,
                  )}
                </React.Fragment>
              ))}
            </View>,
            <GraduationCap size={18} color={COLORS.green} />,
          )}

        {certifications.length > 0 &&
          renderSection(
            'Certifications',
            <View style={styles.timelineList}>
              {certifications.map((item: any, index: number) => (
                <React.Fragment key={`certification-${index}`}>
                  {renderTimelineItem(
                    item?.name || String(item),
                    item?.issuer || '',
                    item?.date || item?.issuedAt || '',
                  )}
                </React.Fragment>
              ))}
            </View>,
            <Award size={18} color={COLORS.orange} />,
          )}

        {hasWorkEligibility &&
          renderSection(
            'Work Eligibility',
            <View style={styles.detailGrid}>
              {renderDetail(
                'Work Authorized',
                profile.workAuthorized ?? workEligibility.workAuthorized ?? null
                  ? 'Yes'
                  : profile.workAuthorized === false || workEligibility.workAuthorized === false
                  ? 'No'
                  : null,
                <ShieldCheck size={16} color={COLORS.green} />,
                true,
              )}
              {renderDetail(
                'Background Check',
                profile.backgroundCheckRequired ?? workEligibility.backgroundCheckRequired ?? null
                  ? 'Required'
                  : profile.backgroundCheckRequired === false || workEligibility.backgroundCheckRequired === false
                  ? 'Not required'
                  : null,
                <BadgeCheck size={16} color={COLORS.blue} />,
                true,
              )}
              {renderDetail(
                'Documents',
                (profile.authorizationDocuments || workEligibility.authorizationDocuments || []).join(', '),
                <FileText size={16} color={COLORS.gray} />,
                true,
              )}
            </View>,
            <ShieldCheck size={18} color={COLORS.green} />,
          )}

        {(preferredWorkTypes.length > 0 ||
          profile.workPreferences?.transportationStatus ||
          workRestrictions.length > 0 ||
          profile.workPreferences?.shiftFlexibility) && (
          renderSection(
            'Work Preferences',
            <>
              <View style={styles.detailGrid}>
                {renderDetail('Transportation', profile.workPreferences?.transportationStatus, <Car size={16} color={COLORS.blue} />, true)}
                {renderDetail(
                  'Availability',
                  [...shiftDays, ...shiftTimes].join(', '),
                  <CalendarDays size={16} color={COLORS.green} />,
                  true,
                )}
              </View>
              {preferredWorkTypes.length > 0 && (
                <View style={styles.subBlock}>
                  <Text style={styles.subBlockTitle}>Preferred Work Types</Text>
                  {renderChipList(preferredWorkTypes, 'green')}
                </View>
              )}
              {workRestrictions.length > 0 && (
                <View style={styles.subBlock}>
                  <Text style={styles.subBlockTitle}>Work Restrictions</Text>
                  {renderChipList(workRestrictions, 'orange')}
                </View>
              )}
            </>,
            <BriefcaseBusiness size={18} color={COLORS.blue} />,
          )
        )}

        {(careerInterests.length > 0 || targetIndustries.length > 0 || salaryText) && (
          renderSection(
            'Career Goals',
            <>
              <View style={styles.detailGrid}>
                {renderDetail('Salary Expectation', salaryText, <DollarSign size={16} color={COLORS.green} />, true)}
              </View>
              {careerInterests.length > 0 && (
                <View style={styles.subBlock}>
                  <Text style={styles.subBlockTitle}>Career Interests</Text>
                  {renderChipList(careerInterests, 'blue')}
                </View>
              )}
              {targetIndustries.length > 0 && (
                <View style={styles.subBlock}>
                  <Text style={styles.subBlockTitle}>Target Industries</Text>
                  {renderChipList(targetIndustries, 'gray')}
                </View>
              )}
            </>,
            <Target size={18} color={COLORS.green} />,
          )
        )}
      </>
    );
  };

  const renderConsultant = () => {
    if (!profile) return null;
    const p = profile.professionalInfo || {};
    const specialties = Array.isArray(p.specialties) ? p.specialties.filter(Boolean) : [];
    const qualifications = Array.isArray(profile.qualifications)
      ? profile.qualifications.filter(Boolean)
      : [];

    return (
      <>
        {renderSection(
          'Overview',
          <>
            {!!profile.bio && <Text style={styles.bioText}>{profile.bio}</Text>}
            <View style={styles.detailGrid}>
              {renderDetail('Title', p.title, <BriefcaseBusiness size={16} color={COLORS.blue} />, true)}
              {renderDetail('Category', p.category, <Star size={16} color={COLORS.yellow} />, true)}
              {renderDetail('Experience', profile.experience || p.experience ? `${profile.experience || p.experience} years` : null, <TrendingUp size={16} color={COLORS.green} />, true)}
              {renderDetail('Rate', p.hourlyRate ? `$${p.hourlyRate}/hr` : null, <DollarSign size={16} color={COLORS.green} />, true)}
            </View>
          </>,
          <BriefcaseBusiness size={18} color={COLORS.blue} />,
        )}

        {(specialties.length > 0 || qualifications.length > 0 || profile.email) &&
          renderSection(
            'Credentials',
            <>
              {!!profile.email &&
                renderDetail('Email', profile.email, <Mail size={16} color={COLORS.gray} />)}
              {specialties.length > 0 && (
                <View style={styles.chipWrap}>
                  {specialties.map((item: string) => (
                    <React.Fragment key={`specialty-${item}`}>
                      {renderChip(item, 'blue')}
                    </React.Fragment>
                  ))}
                </View>
              )}
              {qualifications.length > 0 && (
                <View style={styles.qualificationList}>
                  {qualifications.map((item: string, idx: number) => (
                    <View key={`qualification-${idx}`} style={styles.qualificationItem}>
                      <GraduationCap size={15} color={COLORS.green} />
                      <Text style={styles.qualificationText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>,
            <ShieldCheck size={18} color={COLORS.green} />,
          )}

        {renderSection(
          'Capacity & Metrics',
          <View style={styles.metricGrid}>
            {renderDetail('Caseload', p.maxCaseload || 'Not set', <Users size={16} color={COLORS.blue} />, true)}
            {renderDetail('Placement', p.placementRate ? `${p.placementRate}%` : 'Not set', <TrendingUp size={16} color={COLORS.green} />, true)}
            {renderDetail('Retention', p.retentionRate ? `${p.retentionRate}%` : 'Not set', <BadgeCheck size={16} color={COLORS.green} />, true)}
            {renderDetail('Satisfaction', p.clientSatisfactionRating ? `${p.clientSatisfactionRating}%` : 'Not set', <Star size={16} color={COLORS.yellow} />, true)}
          </View>,
          <TrendingUp size={18} color={COLORS.green} />,
        )}
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
      viewedRole === 'recruiter'
        ? (
        profile.profileImage ||
        profile.avatarUrl ||
        profile.photoURL ||
        profile.avatar ||
        profile.company?.logoUrl ||
        ''
      )
        : viewedRole === 'consultant'
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
  }, [profile, viewedRole]);

  const displayName = useMemo(() => {
    if (!profile) return '';
    if (viewedRole === 'consultant') return profile.fullName || profile.personalInfo?.fullName || profile.name || '';
    return profile.name || profile.company?.name || '';
  }, [profile, viewedRole]);

  const subtitle = useMemo(() => {
    if (!profile) return '';
    if (viewedRole === 'consultant') {
      const p = profile.professionalInfo || {};
      return [p.title, p.category].filter(Boolean).join(' • ');
    }
    if (viewedRole === 'recruiter') return profile.company?.industry || profile.email || '';
    return profile.headline || profile.email || '';
  }, [profile, viewedRole]);

  const statusChip = useMemo(() => {
    if (!profile) return null;
    const status = viewedRole === 'consultant' ? String(profile.status || '') : '';
    if (!status) return null;
    const normalized = status.toLowerCase();
    return renderChip(
      normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : status,
      normalized === 'approved' ? 'green' : normalized === 'pending' ? 'orange' : 'gray',
    );
  }, [profile, viewedRole]);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [profileImage, uid, viewedRole]);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={screenTitle} showBackButton onBackPress={() => navigation.goBack()} />
      {loading ? (
        <Loader message="Loading profile..." />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {!isProfileEmpty && (
            <View style={styles.headerCard}>
              <View style={styles.headerTopRow}>
                <View style={styles.rolePill}>
                  {viewedRole === 'consultant' ? (
                    <ShieldCheck size={14} color={COLORS.green} />
                  ) : viewedRole === 'recruiter' ? (
                    <Building2 size={14} color={COLORS.blue} />
                  ) : (
                    <GraduationCap size={14} color={COLORS.orange} />
                  )}
                  <Text style={styles.rolePillText}>
                    {viewedRole === 'recruiter' ? 'Company' : viewedRole === 'consultant' ? 'Consultant' : 'Student'}
                  </Text>
                </View>
                {statusChip}
              </View>
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
              {!!subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
            </View>
          )}
          {viewedRole === 'student' && renderStudent()}
          {viewedRole === 'consultant' && renderConsultant()}
          {viewedRole === 'recruiter' && renderRecruiter()}
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 12,
  },
  sectionBox: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: COLORS.black,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.black,
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
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: COLORS.black,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  headerTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
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
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 6,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.dark,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chip_green: {
    backgroundColor: '#ECFDF5',
  },
  chip_blue: {
    backgroundColor: '#EFF6FF',
  },
  chip_orange: {
    backgroundColor: '#FFF7ED',
  },
  chip_gray: {
    backgroundColor: '#F3F4F6',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipText_green: {
    color: '#047857',
  },
  chipText_blue: {
    color: '#1D4ED8',
  },
  chipText_orange: {
    color: '#C2410C',
  },
  chipText_gray: {
    color: COLORS.gray,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.dark,
    marginBottom: 14,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    backgroundColor: '#F8FAFC',
    padding: 12,
  },
  detailItemCompact: {
    width: '48%',
    minHeight: 78,
  },
  detailIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  detailTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '700',
    lineHeight: 19,
  },
  qualificationList: {
    gap: 8,
    marginTop: 12,
  },
  qualificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  qualificationText: {
    flex: 1,
    color: COLORS.dark,
    fontSize: 14,
    lineHeight: 20,
  },
  subBlock: {
    marginTop: 14,
  },
  subBlockTitle: {
    color: COLORS.dark,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  resumeButton: {
    minHeight: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resumeIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  resumeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.black,
  },
  resumeSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  linkGrid: {
    gap: 8,
  },
  externalLinkCard: {
    minHeight: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  externalIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  externalTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  externalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.black,
  },
  externalUrl: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  timelineList: {
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 8,
    backgroundColor: COLORS.blue,
    marginTop: 6,
    marginRight: 10,
  },
  timelineContent: {
    flex: 1,
    minWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  timelineTitle: {
    color: COLORS.black,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  timelineSubtitle: {
    color: COLORS.dark,
    fontSize: 13,
    marginTop: 2,
  },
  timelineMeta: {
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 4,
  },
  timelineDescription: {
    color: COLORS.dark,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },
});

export default PublicProfileScreen;
