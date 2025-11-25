import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, TouchableOpacity, Linking, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import Loader from '../../../components/ui/Loader';
import { JobService } from '../../../services/job.service';
import { COLORS } from '../../../constants/core/colors';
import { showError } from '../../../utils/toast';
import { FileText } from 'lucide-react-native';
import { applicationDetailScreenStyles } from '../../../constants/styles/applicationDetailScreenStyles';
import { formatDate } from '../../../utils/dateUtils';
import { useRefresh } from '../../../hooks/useRefresh';
import RefreshableScrollView from '../../../components/ui/RefreshableScrollView';

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
            if (__DEV__) {
        console.error('Error fetching application:', error)
      };
      showError(error.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  const { refreshing, handleRefresh } = useRefresh(fetchApplication);

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


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Application Details" onBackPress={() => navigation.goBack()} />
        <Loader />
      </SafeAreaView>
    );
  }

  if (!application) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Application Details" onBackPress={() => navigation.goBack()} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Application not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Application Details" onBackPress={() => navigation.goBack()} />
      
      <RefreshableScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        {/* Job Info Card */}
        <View style={styles.jobCard}>
          <Text style={styles.jobTitle}>{application.job?.title || 'Job'}</Text>
          {application.job?.company && (
            <Text style={styles.companyName}>{application.job.company}</Text>
          )}
          {application.job?.location && (
            <View style={styles.jobInfoRow}>
              <Text style={styles.jobInfoIcon}>📍</Text>
              <Text style={styles.jobInfoText}>{application.job.location}</Text>
            </View>
          )}
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
            {formatDate(application.appliedAt || application.createdAt || new Date())}
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
      </RefreshableScrollView>
    </SafeAreaView>
  );
};

const styles = applicationDetailScreenStyles;

export default ApplicationDetailScreen;
