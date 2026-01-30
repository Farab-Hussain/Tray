import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { COLORS } from '../../../constants/core/colors';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { jobDetailStyles } from '../../../constants/styles/jobDetailStyles';
import { JobService } from '../../../services/job.service';
import { ApplicationService } from '../../../services/application.service';
import { ResumeService } from '../../../services/resume.service';
import FitScoreDisplay from '../../../components/ui/FitScoreDisplay';
import { showError, showSuccess, showInfo } from '../../../utils/toast';
import { jobDetailScreenStyles } from '../../../constants/styles/jobDetailScreenStyles';
import { useRefresh } from '../../../hooks/useRefresh';

const JobDetailScreen = ({ navigation, route }: any) => {
  const { jobId } = route.params;
  const { user } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [matchScore, setMatchScore] = useState<any>(null);
  const [hasResume, setHasResume] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);

  const checkResume = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const response = await ResumeService.getMyResume();
      if (response.resume) {
        setHasResume(true);
        setResumeId(response.resume.id);
      }
    } catch {
      // No resume found
      setHasResume(false);
    }
  }, [user?.uid]);

  const checkApplicationStatus = useCallback(async () => {
    if (!user?.uid) {
      setHasApplied(false);
      return;
    }

    try {
      const response = await JobService.getMyApplications();
      const applications = response.applications || [];
      // Check if user has already applied for this job
      const hasAppliedForThisJob = applications.some(
        (app: any) => app.job?.id === jobId || app.jobId === jobId
      );
      setHasApplied(hasAppliedForThisJob);
    } catch (error) {
      // If we can't fetch applications, assume not applied
            if (__DEV__) {
        console.log('Could not check application status:', error)
      };
      setHasApplied(false);
    }
  }, [jobId, user?.uid]);

  const fetchJobDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await JobService.getJobById(jobId);
      setJob(response.job);

      // Get match score if user is authenticated
      if (user?.uid) {
        try {
          const matchResponse = await JobService.getMatchScore(jobId);
          
          // Validate and normalize response data
          const normalizedMatchScore = {
            score: matchResponse.score ?? matchResponse.matchedSkills?.length ?? 0,
            matchRating: matchResponse.matchRating || matchResponse.rating || 'basic',
            totalRequired: matchResponse.totalRequired ?? 0,
            matchPercentage: matchResponse.matchPercentage ?? 0,
            matchedSkills: Array.isArray(matchResponse.matchedSkills) ? matchResponse.matchedSkills : [],
            missingSkills: Array.isArray(matchResponse.missingSkills) ? matchResponse.missingSkills : [],
          };
          
          // Ensure score matches matchedSkills length (defensive check)
          if (normalizedMatchScore.matchedSkills.length > 0 && normalizedMatchScore.score === 0) {
                        if (__DEV__) {
              console.warn('Score mismatch detected, using matchedSkills length:', {
              originalScore: normalizedMatchScore.score,
              matchedSkillsCount: normalizedMatchScore.matchedSkills.length,
              matchedSkills: normalizedMatchScore.matchedSkills,
            })
            };
            normalizedMatchScore.score = normalizedMatchScore.matchedSkills.length;
            // Recalculate percentage
            if (normalizedMatchScore.totalRequired > 0) {
              normalizedMatchScore.matchPercentage = (normalizedMatchScore.score / normalizedMatchScore.totalRequired) * 100;
            }
          }
          
          setMatchScore(normalizedMatchScore);
        } catch (error) {
          // User might not have resume yet
                    if (__DEV__) {
            console.log('No match score available:', error)
          };
        }
      }
    } catch (error: any) {
            if (__DEV__) {
        console.error('Error fetching job:', error)
      };
      showError(error.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  }, [jobId, user?.uid]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      fetchJobDetails(),
      checkResume(),
      checkApplicationStatus(),
    ]);
  }, [fetchJobDetails, checkResume, checkApplicationStatus]);

  const { refreshing } = useRefresh(handleRefresh);

  useEffect(() => {
    fetchJobDetails();
    checkResume();
    checkApplicationStatus();
  }, [fetchJobDetails, checkResume, checkApplicationStatus]);

  const handleApply = () => {
    if (!user?.uid) {
      Alert.alert('Login Required', 'Please login to apply for jobs');
      return;
    }

    if (!hasResume) {
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

    // Enhanced validation for Android - ensure resumeId is actually set and valid
    if (!resumeId || typeof resumeId !== 'string' || resumeId.trim() === '') {
            if (__DEV__) {
        console.error('[JobDetailScreen] Resume ID validation failed:', {
          hasResume,
          resumeId,
          resumeIdType: typeof resumeId,
        });
      };
      Alert.alert(
        'Resume Error',
        'Resume ID is missing. Please try refreshing the page or create a new resume.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Refresh',
            onPress: () => {
              checkResume();
              checkApplicationStatus();
            },
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
    if (!resumeId) {
            if (__DEV__) {
        console.error('[JobDetailScreen] Cannot apply: resumeId is missing');
      };
      showError('Resume ID is missing. Please try again.');
      return;
    }

    // Validate resumeId is a valid string (Android-specific fix)
    const validResumeId = String(resumeId).trim();
    if (!validResumeId) {
            if (__DEV__) {
        console.error('[JobDetailScreen] Cannot apply: resumeId is empty after trimming');
      };
      showError('Invalid resume ID. Please try again.');
      return;
    }

    try {
      setApplying(true);
            if (__DEV__) {
        console.log('[JobDetailScreen] Applying for job:', {
          jobId,
          resumeId: validResumeId,
        });
      };
      const response = await JobService.applyForJob(jobId, {
        resumeId: validResumeId,
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
      
      // Update application status after successful application
      setHasApplied(true);
    } catch (error: any) {
            if (__DEV__) {
        console.error('Error applying for job:', error)
      };
      
      // Check if user has already applied for this job
      const errorMessage = error.response?.data?.error || error.message || '';
      const isAlreadyApplied = errorMessage.toLowerCase().includes('already applied');
      
      if (isAlreadyApplied) {
        // Update state and show friendly info message
        setHasApplied(true);
        showInfo(
          'You have already applied for this job',
          'Application Submitted'
        );
      } else {
        // Show error for other cases
        showError(errorMessage || 'Failed to submit application');
      }
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
        <ScreenHeader title="Job Details" onBackPress={() => navigation.goBack()} />
        <Loader />
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Job Details" onBackPress={() => navigation.goBack()} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Job not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Job Details" onBackPress={() => navigation.goBack()} />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Enhanced Fit Score Display */}
        {matchScore && (
          <FitScoreDisplay
            matchScore={matchScore}
            compact={false}
            showDetails={true}
          />
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
              <Text style={styles.infoValue} numberOfLines={4} ellipsizeMode="tail">
                {job.location}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>💼</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Job Type</Text>
              <Text style={styles.infoValue}>{job.jobType ? job.jobType.replace('-', ' ') : 'N/A'}</Text>
            </View>
          </View>

          {job.salaryRange && job.salaryRange.min !== undefined && job.salaryRange.max !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>💰</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Salary</Text>
                <Text style={styles.infoValue}>
                  ${(job.salaryRange.min || 0).toLocaleString()} - ${(job.salaryRange.max || 0).toLocaleString()} {job.salaryRange.currency || 'USD'}
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
            {job.requiredSkills && job.requiredSkills.length > 0 ? (
              job.requiredSkills.map((skill: string, index: number) => {
                if (!skill) return null; // Skip null/undefined skills
                const isMatched = matchScore?.matchedSkills?.some((ms: string) => 
                  ms && skill && ms.toLowerCase().trim() === skill.toLowerCase().trim()
                );
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
              })
            ) : (
              <Text style={styles.descriptionText}>No skills specified</Text>
            )}
          </View>
        </View>

        {/* Apply Button */}
        <View style={styles.buttonContainer}>
          {hasApplied ? (
            <>
              <AppButton
                title="Already Applied ✓"
                onPress={() => navigation.navigate('MyApplications')}
                disabled={false}
                style={styles.appliedButton}
              />
              <Text style={styles.appliedMessage}>
                You have already applied for this job. View your application status.
              </Text>
            </>
          ) : (
            <>
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
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = jobDetailScreenStyles;

export default JobDetailScreen;
