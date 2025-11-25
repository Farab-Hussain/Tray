import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import Loader from '../../../components/ui/Loader';
import { JobService } from '../../../services/job.service';
import { COLORS } from '../../../constants/core/colors';
import { showError, showSuccess } from '../../../utils/toast';
import { FileText } from 'lucide-react-native';
import { consultantApplicationReviewScreenStyles } from '../../../constants/styles/applicationReviewScreenStyles';

const ApplicationReviewScreen = ({ navigation, route }: any) => {
  const { applicationId } = route.params;
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      fetchApplication();
    }, [fetchApplication])
  );

  const handleUpdateStatus = async (status: string) => {
    Alert.alert(
      'Update Status',
      `Change application status to "${status}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              setUpdating(true);
              await JobService.updateApplicationStatus(applicationId, {
                status: status as 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired',
              });
              showSuccess('Status updated successfully');
              fetchApplication();
            } catch (error: any) {
              showError(error.message || 'Failed to update status');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

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
        <ScreenHeader title="Application Review" onBackPress={() => navigation.goBack()} />
        <Loader />
      </SafeAreaView>
    );
  }

  if (!application) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Application Review" onBackPress={() => navigation.goBack()} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Application not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Application Review" onBackPress={() => navigation.goBack()} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Match Rating Banner */}
        <View style={styles.matchBannerWrapper}>
          <View style={[styles.matchBanner, { borderLeftColor: getRatingColor(application.matchRating) }]}>
            <View style={styles.matchBannerHeader}>
              <View style={[styles.matchBadge, { backgroundColor: getRatingColor(application.matchRating) }]}>
                <Text style={styles.matchBadgeText}>
                  {application.matchRating?.toUpperCase() || 'BASIC'}
                </Text>
              </View>
              <Text style={styles.matchBannerTitle}>MATCH ⭐</Text>
            </View>
            <View style={styles.matchStatsRow}>
              <View style={styles.matchStat}>
                <Text style={styles.matchStatValue}>
                  {application.matchScore}/{application.job?.requiredSkills?.length || 0}
                </Text>
                <Text style={styles.matchStatLabel}>Skills Matched</Text>
              </View>
              <View style={styles.matchStatDivider} />
              <View style={styles.matchStat}>
                <Text style={styles.matchStatValue}>
                  {application.job?.requiredSkills?.length 
                    ? Math.round((application.matchScore / application.job.requiredSkills.length) * 100)
                    : 0}%
                </Text>
                <Text style={styles.matchStatLabel}>Match Rate</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Applicant Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Applicant Information</Text>
          <Text style={styles.applicantName}>
            {application.resume?.personalInfo?.name ||
             application.user?.name || 
             application.user?.displayName || 
             'Applicant'}
          </Text>
          <Text style={styles.applicantEmail}>
            {application.resume?.personalInfo?.email ||
             application.user?.email || 
             'No email available'}
          </Text>
        </View>

        {/* Match Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skill Match Breakdown</Text>
          
          {application.matchedSkills && application.matchedSkills.length > 0 && (
            <View style={styles.skillsGroup}>
              <Text style={styles.skillsGroupTitle}>
                Matched Skills ({application.matchedSkills.length})
              </Text>
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
            <View style={styles.skillsGroup}>
              <Text style={styles.skillsGroupTitleMissing}>
                Missing Skills ({application.missingSkills.length})
              </Text>
              <View style={styles.skillsContainer}>
                {application.missingSkills.map((skill: string, index: number) => (
                  <View key={index} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>


        {/* Experience */}
        {application.resume?.experience && application.resume.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {application.resume.experience.map((exp: any, index: number) => (
              <View key={index} style={styles.experienceCard}>
                <Text style={styles.experienceTitle}>{exp.title}</Text>
                <Text style={styles.experienceCompany}>{exp.company}</Text>
                <Text style={styles.experienceDate}>
                  {exp.startDate} - {exp.current ? 'Present' : exp.endDate || 'N/A'}
                </Text>
                {exp.description && (
                  <Text style={styles.experienceDescription}>{exp.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {application.resume?.education && application.resume.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {application.resume.education.map((edu: any, index: number) => (
              <View key={index} style={styles.educationCard}>
                <Text style={styles.educationDegree}>{edu.degree}</Text>
                <Text style={styles.educationInstitution}>{edu.institution}</Text>
                {edu.graduationYear && (
                  <Text style={styles.educationYear}>Graduated: {edu.graduationYear}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Background Information */}
        {application.resume?.backgroundInformation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Background Information</Text>
            <Text style={styles.backgroundText}>{application.resume.backgroundInformation}</Text>
          </View>
        )}

        {/* Cover Letter */}
        {application.coverLetter && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cover Letter</Text>
            <Text style={styles.coverLetterText}>{application.coverLetter}</Text>
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

        {/* Status Update Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          
          <View style={styles.statusButtonsContainer}>
            {['shortlisted', 'reviewed', 'rejected', 'hired'].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => handleUpdateStatus(status)}
                disabled={updating || application.status === status}
                style={[
                  styles.statusButton,
                  application.status === status && styles.statusButtonActive,
                  (updating || application.status === status) && styles.statusButtonDisabled,
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.statusButtonText,
                  application.status === status && styles.statusButtonTextActive,
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

        
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = consultantApplicationReviewScreenStyles;

export default ApplicationReviewScreen;
