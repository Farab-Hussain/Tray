import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, TouchableOpacity, Alert, Linking, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import Loader from '../../../components/ui/Loader';
import AppButton from '../../../components/ui/AppButton';
import { JobService } from '../../../services/job.service';
import { COLORS } from '../../../constants/core/colors';
import { showError, showSuccess } from '../../../utils/toast';
import { FileText } from 'lucide-react-native';

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
              await JobService.updateApplicationStatus(applicationId, { status });
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
        <ScreenHeader title="Application Review" navigation={navigation} />
        <Loader />
      </SafeAreaView>
    );
  }

  if (!application) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Application Review" navigation={navigation} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Application not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Application Review" navigation={navigation} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Match Rating Banner */}
        <View style={[styles.matchBanner, { backgroundColor: getRatingColor(application.matchRating) }]}>
          <Text style={styles.matchBannerTitle}>
            {application.matchRating?.toUpperCase()} MATCH ⭐
          </Text>
          <Text style={styles.matchBannerSubtitle}>
            {application.matchScore}/{application.job?.requiredSkills?.length || 0} skills matched
          </Text>
        </View>

        {/* Applicant Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Applicant Information</Text>
          <Text style={styles.applicantName}>{application.user?.name || 'N/A'}</Text>
          <Text style={styles.applicantEmail}>{application.user?.email || 'N/A'}</Text>
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

        {/* Resume Skills */}
        {application.resume && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Applicant Skills</Text>
            <View style={styles.skillsContainer}>
              {application.resume.skills?.map((skill: string, index: number) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

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

          <View style={[styles.currentStatusBadge, { backgroundColor: getStatusColor(application.status) }]}>
            <Text style={styles.currentStatusText}>
              Current Status: {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Text>
          </View>
        </View>
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
  matchBanner: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  matchBannerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  matchBannerSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '500',
  },
  infoCard: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 12,
  },
  applicantName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 6,
  },
  applicantEmail: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: '500',
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
  skillsGroup: {
    marginBottom: 20,
  },
  skillsGroupTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.green,
    marginBottom: 12,
  },
  skillsGroupTitleMissing: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.red,
    marginBottom: 12,
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
  experienceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.lightBackground,
  },
  experienceTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 6,
  },
  experienceCompany: {
    fontSize: 15,
    color: COLORS.gray,
    marginBottom: 4,
    fontWeight: '500',
  },
  experienceDate: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 8,
  },
  experienceDescription: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
  },
  educationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.lightBackground,
  },
  educationDegree: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 6,
  },
  educationInstitution: {
    fontSize: 15,
    color: COLORS.gray,
    marginBottom: 4,
    fontWeight: '500',
  },
  educationYear: {
    fontSize: 13,
    color: COLORS.gray,
  },
  backgroundText: {
    fontSize: 15,
    color: COLORS.black,
    lineHeight: 24,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
  },
  coverLetterText: {
    fontSize: 15,
    color: COLORS.black,
    lineHeight: 24,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
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
  statusButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 10,
  },
  statusButton: {
    backgroundColor: COLORS.lightBackground,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  statusButtonActive: {
    backgroundColor: COLORS.green,
  },
  statusButtonDisabled: {
    opacity: 0.5,
  },
  statusButtonText: {
    color: COLORS.black,
    fontWeight: '600',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  statusButtonTextActive: {
    color: COLORS.white,
  },
  currentStatusBadge: {
    padding: 14,
    borderRadius: 12,
  },
  currentStatusText: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default ApplicationReviewScreen;
