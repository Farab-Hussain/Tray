import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import Loader from '../../../components/ui/Loader';
import { JobService } from '../../../services/job.service';
import { COLORS } from '../../../constants/core/colors';
import { showError } from '../../../utils/toast';
import { FileText } from 'lucide-react-native';

const ApplicationDetailScreen = ({ navigation, route }: any) => {
  const { applicationId } = route.params;
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchApplication = useCallback(async () => {
    try {
      setLoading(true);
      const response = await JobService.getApplicationById(applicationId);
      setApplication(response.application);
    } catch (error: any) {
      console.error('Error fetching application:', error);
      showError(error.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useFocusEffect(
    useCallback(() => {
      fetchApplication();
    }, [fetchApplication])
  );

  const handleViewResume = () => {
    if (application?.resume?.resumeFileUrl) {
      Linking.openURL(application.resume.resumeFileUrl).catch(() => {
        showError('Failed to open resume file');
      });
    } else {
      showError('Resume file not available');
    }
  };

  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      default: return COLORS.gray;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hired': return COLORS.green;
      case 'shortlisted': return COLORS.blue;
      case 'reviewed': return COLORS.orange;
      case 'rejected': return COLORS.red;
      default: return COLORS.gray;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Application Details" navigation={navigation} />
        <Loader />
      </SafeAreaView>
    );
  }

  if (!application) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Application Details" navigation={navigation} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Application not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Application Details" navigation={navigation} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Job Info Card */}
        <View style={styles.jobCard}>
          <Text style={styles.jobTitle}>{application.job?.title || 'Job'}</Text>
          <Text style={styles.companyName}>{application.job?.company || 'Company'}</Text>
          <View style={styles.jobInfoRow}>
            <Text style={styles.jobInfoIcon}>📍</Text>
            <Text style={styles.jobInfoText}>{application.job?.location || 'N/A'}</Text>
          </View>
        </View>

        {/* Match Rating Banner */}
        {application.matchRating && (
          <View style={[styles.matchBanner, { backgroundColor: getRatingColor(application.matchRating) }]}>
            <Text style={styles.matchBannerTitle}>
              {application.matchRating.toUpperCase()} MATCH ⭐
            </Text>
            <Text style={styles.matchBannerSubtitle}>
              {application.matchScore}/{application.job?.requiredSkills?.length || 0} skills matched
            </Text>
          </View>
        )}

        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Application Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) }]}>
            <Text style={styles.statusText}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Match Breakdown */}
        {application.matchedSkills && application.matchedSkills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Matched Skills</Text>
            <View style={styles.skillsContainer}>
              {application.matchedSkills.map((skill: string, index: number) => (
                <View key={index} style={styles.skillTagMatched}>
                  <Text style={styles.skillTextMatched}>{skill} ✓</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {application.missingSkills && application.missingSkills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Missing Skills</Text>
            <View style={styles.skillsContainer}>
              {application.missingSkills.map((skill: string, index: number) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Application Date */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Applied Date</Text>
          <Text style={styles.infoValue}>
            {application.appliedAt ? new Date(application.appliedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
          </Text>
        </View>

        {/* Cover Letter */}
        {application.coverLetter && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cover Letter</Text>
            <View style={styles.textCard}>
              <Text style={styles.textContent}>{application.coverLetter}</Text>
            </View>
          </View>
        )}

        {/* Resume File */}
        {application.resume?.resumeFileUrl && (
          <View style={styles.section}>
            <TouchableOpacity
              onPress={handleViewResume}
              style={styles.resumeButton}
              activeOpacity={0.7}
            >
              <FileText size={20} color={COLORS.white} />
              <Text style={styles.resumeButtonText}>View Resume File (PDF/DOC)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Review Notes */}
        {application.reviewNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review Notes</Text>
            <View style={styles.textCard}>
              <Text style={styles.textContent}>{application.reviewNotes}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
  },
  companyName: {
    fontSize: 17,
    color: COLORS.gray,
    fontWeight: '500',
    marginBottom: 12,
  },
  jobInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobInfoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  jobInfoText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  matchBanner: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  matchBannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  matchBannerSubtitle: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 12,
  },
  statusBadge: {
    padding: 14,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillTag: {
    backgroundColor: COLORS.lightBackground,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  skillText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  skillTagMatched: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  skillTextMatched: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 8,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.black,
    fontWeight: '600',
  },
  textCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  textContent: {
    fontSize: 15,
    color: COLORS.black,
    lineHeight: 24,
  },
  resumeButton: {
    backgroundColor: COLORS.green,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  resumeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ApplicationDetailScreen;
