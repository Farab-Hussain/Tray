import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import AppButton from '../../../components/ui/AppButton';
import Loader from '../../../components/ui/Loader';
import { JobService } from '../../../services/job.service';
import { ResumeService } from '../../../services/resume.service';
import { COLORS } from '../../../constants/core/colors';
import { showError, showSuccess } from '../../../utils/toast';
import { useAuth } from '../../../contexts/AuthContext';

const JobDetailScreen = ({ navigation, route }: any) => {
  const { jobId } = route.params;
  const { user } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [matchScore, setMatchScore] = useState<any>(null);
  const [hasResume, setHasResume] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);

  useEffect(() => {
    fetchJobDetails();
    checkResume();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await JobService.getJobById(jobId);
      setJob(response.job);

      // Get match score if user is authenticated
      if (user?.uid) {
        try {
          const matchResponse = await JobService.getMatchScore(jobId);
          setMatchScore(matchResponse);
        } catch (error) {
          // User might not have resume yet
          console.log('No match score available');
        }
      }
    } catch (error: any) {
      console.error('Error fetching job:', error);
      showError(error.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const checkResume = async () => {
    if (!user?.uid) return;

    try {
      const response = await ResumeService.getMyResume();
      if (response.resume) {
        setHasResume(true);
        setResumeId(response.resume.id);
      }
    } catch (error) {
      // No resume found
      setHasResume(false);
    }
  };

  const handleApply = () => {
    if (!user?.uid) {
      Alert.alert('Login Required', 'Please login to apply for jobs');
      return;
    }

    if (!hasResume || !resumeId) {
      Alert.alert(
        'Resume Required',
        'Please create a resume before applying for jobs.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create Resume',
            onPress: () => navigation.navigate('Resume'),
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Apply for Job',
      `Are you sure you want to apply for "${job.title}" at ${job.company}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: applyForJob,
        },
      ]
    );
  };

  const applyForJob = async () => {
    if (!resumeId) return;

    try {
      setApplying(true);
      const response = await JobService.applyForJob(jobId, {
        resumeId,
      });

      showSuccess('Application submitted successfully!');
      
      // Show match rating
      if (response.application?.matchRating) {
        const rating = response.application.matchRating;
        const ratingLabels: any = {
          gold: 'Gold ⭐',
          silver: 'Silver ⭐',
          bronze: 'Bronze ⭐',
          basic: 'Basic',
        };

        Alert.alert(
          'Application Submitted',
          `Your application has been submitted with a ${ratingLabels[rating] || rating} rating.\n\nMatched Skills: ${response.application.matchedSkills?.length || 0}/${job.requiredSkills.length}`,
          [
            {
              text: 'View My Applications',
              onPress: () => navigation.navigate('MyApplications'),
            },
            { text: 'OK' },
          ]
        );
      } else {
        navigation.navigate('MyApplications');
      }
    } catch (error: any) {
      console.error('Error applying for job:', error);
      showError(error.message || 'Failed to submit application');
    } finally {
      setApplying(false);
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
        <ScreenHeader title="Job Details" navigation={navigation} />
        <Loader />
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Job Details" navigation={navigation} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Job not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Job Details" navigation={navigation} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Match Score Banner */}
        {matchScore && (
          <View style={[styles.matchBanner, { backgroundColor: getRatingColor(matchScore.matchRating) }]}>
            <Text style={styles.matchBannerTitle}>
              {matchScore.matchRating.toUpperCase()} MATCH ⭐
            </Text>
            <Text style={styles.matchBannerSubtitle}>
              {matchScore.score}/{matchScore.totalRequired} skills matched ({matchScore.matchPercentage.toFixed(0)}%)
            </Text>
            {matchScore.matchedSkills.length > 0 && (
              <View style={styles.matchSkillsContainer}>
                <Text style={styles.matchSkillsLabel}>Matched: </Text>
                <Text style={styles.matchSkillsText}>{matchScore.matchedSkills.join(', ')}</Text>
              </View>
            )}
            {matchScore.missingSkills.length > 0 && (
              <View style={styles.matchSkillsContainer}>
                <Text style={styles.matchSkillsLabel}>Missing: </Text>
                <Text style={styles.matchSkillsText}>{matchScore.missingSkills.join(', ')}</Text>
              </View>
            )}
          </View>
        )}

        {/* Job Header */}
        <View style={styles.headerSection}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.companyName}>{job.company}</Text>
        </View>

        {/* Job Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{job.location}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>💼</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Job Type</Text>
              <Text style={styles.infoValue}>{job.jobType.replace('-', ' ')}</Text>
            </View>
          </View>

          {job.salaryRange && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>💰</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Salary</Text>
                <Text style={styles.infoValue}>
                  ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()} {job.salaryRange.currency}
                </Text>
              </View>
            </View>
          )}

          {job.experienceRequired && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📅</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Experience Required</Text>
                <Text style={styles.infoValue}>{job.experienceRequired} years</Text>
              </View>
            </View>
          )}
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{job.description}</Text>
        </View>

        {/* Required Skills Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Skills</Text>
          <View style={styles.skillsContainer}>
            {job.requiredSkills.map((skill: string, index: number) => {
              const isMatched = matchScore?.matchedSkills?.includes(skill);
              return (
                <View
                  key={index}
                  style={[
                    styles.skillTag,
                    isMatched && styles.skillTagMatched,
                  ]}
                >
                  <Text style={[styles.skillText, isMatched && styles.skillTextMatched]}>
                    {skill} {isMatched && '✓'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Apply Button */}
        <View style={styles.buttonContainer}>
          <AppButton
            title={applying ? 'Applying...' : 'Apply for Job'}
            onPress={handleApply}
            disabled={applying || job.status !== 'active'}
            loading={applying}
          />
          {job.status !== 'active' && (
            <Text style={styles.statusWarning}>
              This job is no longer accepting applications
            </Text>
          )}
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  matchBannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  matchBannerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    marginBottom: 8,
    fontWeight: '500',
  },
  matchSkillsContainer: {
    flexDirection: 'row',
    marginTop: 6,
  },
  matchSkillsLabel: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  matchSkillsText: {
    fontSize: 12,
    color: COLORS.white,
    flex: 1,
  },
  headerSection: {
    marginBottom: 20,
  },
  jobTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
    lineHeight: 32,
  },
  companyName: {
    fontSize: 18,
    color: COLORS.gray,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  infoRowLast: {
    marginBottom: 0,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.black,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: COLORS.black,
    lineHeight: 24,
    fontWeight: '400',
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
  skillTagMatched: {
    backgroundColor: COLORS.green,
  },
  skillText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  skillTextMatched: {
    color: COLORS.white,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 8,
  },
  statusWarning: {
    fontSize: 13,
    color: COLORS.red,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
});

export default JobDetailScreen;
