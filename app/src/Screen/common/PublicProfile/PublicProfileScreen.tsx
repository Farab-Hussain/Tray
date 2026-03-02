import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
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

  const renderList = (label: string, list: any[]) => {
    if (!Array.isArray(list) || list.length === 0) return null;
    return (
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>{label}</Text>
        {list.map((item, idx) => (
          <Text key={`${label}-${idx}`} style={styles.value}>
            • {typeof item === 'string' ? item : JSON.stringify(item)}
          </Text>
        ))}
      </View>
    );
  };

  const renderStudent = () => {
    if (!profile) return null;
    return (
      <>
        <View style={styles.sectionBox}>
          {renderRow('Name', profile.name)}
          {renderRow('Email', profile.email)}
        </View>
        {profile.workPreferences && (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Work Preferences</Text>
            <Text style={styles.value}>{JSON.stringify(profile.workPreferences, null, 2)}</Text>
          </View>
        )}
        {profile.careerGoals && (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Career Goals</Text>
            <Text style={styles.value}>{JSON.stringify(profile.careerGoals, null, 2)}</Text>
          </View>
        )}
        {renderList('Education', profile.education?.items || profile.education)}
        {renderList('Certifications', profile.certifications?.items || profile.certifications)}
        {renderList('External Profiles', profile.externalProfiles?.links || profile.externalProfiles)}
      </>
    );
  };

  const renderConsultant = () => {
    if (!profile) return null;
    const p = profile.professionalInfo || {};
    return (
      <>
        <View style={styles.sectionBox}>
          {renderRow('Name', profile.fullName || profile.name)}
          {renderRow('Email', profile.email)}
          {renderRow('Title', p.title)}
          {renderRow('Category', p.category)}
          {renderRow('Experience (yrs)', p.experience)}
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
          {renderRow('Headquarters', company.headquarters)}
          {renderRow('Description', company.description)}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Public Profile" showBackButton onBackPress={() => navigation.goBack()} />
      {loading ? (
        <Loader message="Loading profile..." />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {role === 'student' && renderStudent()}
          {role === 'consultant' && renderConsultant()}
          {role === 'recruiter' && renderRecruiter()}
          {!profile && (
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
});

export default PublicProfileScreen;
