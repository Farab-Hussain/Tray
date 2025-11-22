import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import Loader from '../../../components/ui/Loader';
import { JobService } from '../../../services/job.service';
import { COLORS } from '../../../constants/core/colors';
import { showError } from '../../../utils/toast';
import { useRefresh } from '../../../hooks/useRefresh';
import { jobApplicationsScreenStyles } from '../../../constants/styles/jobApplicationsScreenStyles';
import { getStatusColor } from '../../../utils/statusUtils';
import SummaryCard from '../../../components/ui/SummaryCard';

const JobApplicationsScreen = ({ navigation, route }: any) => {
  const { jobId } = route.params;
  const [applications, setApplications] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await JobService.getJobApplications(jobId);
      setApplications(response.applications || []);
      setSummary(response.summary || null);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      showError(error.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  const { refreshing, handleRefresh } = useRefresh(fetchApplications);

  useFocusEffect(
    useCallback(() => {
      fetchApplications();
    }, [fetchApplications]),
  );

  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case 'gold':
        return '#FFD700';
      case 'silver':
        return '#C0C0C0';
      case 'bronze':
        return '#CD7F32';
      default:
        return COLORS.gray;
    }
  };

  const getRatingLabel = (rating?: string) => {
    switch (rating) {
      case 'gold':
        return '⭐ Gold';
      case 'silver':
        return '⭐ Silver';
      case 'bronze':
        return '⭐ Bronze';
      case 'basic':
        return 'Basic';
      default:
        return 'N/A';
    }
  };


  const formatApplicationDate = (appliedAt?: any, createdAt?: any): string => {
    const dateValue = appliedAt || createdAt;
    
    if (!dateValue) {
      return 'N/A';
    }
    
    let date: Date;
    
    // Handle different date formats
    if (typeof dateValue === 'object' && dateValue !== null) {
      if (dateValue.seconds !== undefined) {
        // Firestore timestamp format: { seconds: number }
        date = new Date(dateValue.seconds * 1000);
      } else if (dateValue._seconds !== undefined) {
        // Alternative Firestore timestamp format
        date = new Date(dateValue._seconds * 1000);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        return 'N/A';
      }
    } else if (typeof dateValue === 'number') {
      // Already a timestamp (milliseconds or seconds)
      date = new Date(dateValue > 1000000000000 ? dateValue : dateValue * 1000);
    } else if (typeof dateValue === 'string') {
      // ISO string or other string format
      date = new Date(dateValue);
    } else {
      return 'N/A';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString();
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader
          title="Applications"
          onBackPress={() => navigation.goBack()}
        />
        <Loader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Applications"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.green}
          />
        }
      >
        {/* Summary Card */}
        {summary && (
          <SummaryCard
            title="Application Summary"
            stats={[
              { label: 'Gold', value: summary.gold || 0, color: '#FFD700' },
              { label: 'Silver', value: summary.silver || 0, color: '#C0C0C0' },
              { label: 'Bronze', value: summary.bronze || 0, color: '#CD7F32' },
              { label: 'Total', value: summary.total || 0 },
            ]}
          />
        )}

        {/* Applications List - Sorted by Rating (Gold first) */}
        {applications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No applications yet</Text>
            <Text style={styles.emptyText}>
              Applications will appear here once candidates apply
            </Text>
          </View>
        ) : (
          applications.map(application => (
            <TouchableOpacity
              key={application.id}
              onPress={() =>
                navigation.navigate('RecruiterApplicationReview', {
                  applicationId: application.id,
                })
              }
              style={[
                styles.applicationCard,
                { borderLeftColor: getRatingColor(application.matchRating) },
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                  <Text style={styles.applicantName} numberOfLines={1}>
                    {application.user?.name || 'Applicant'}
                  </Text>
                  <Text style={styles.applicantEmail} numberOfLines={1}>
                    {application.user?.email || ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.ratingBadge,
                    {
                      backgroundColor: getRatingColor(application.matchRating),
                    },
                  ]}
                >
                  <Text style={styles.ratingText}>
                    {getRatingLabel(application.matchRating)}
                  </Text>
                </View>
              </View>

              <View style={styles.matchContainer}>
                <Text style={styles.matchLabel}>Match Score</Text>
                <Text style={styles.matchValue}>
                  {application.matchScore}/
                  {application.job?.requiredSkills?.length || 0} skills matched
                </Text>
              </View>

              {application.matchedSkills &&
                application.matchedSkills.length > 0 && (
                  <View style={styles.skillsContainer}>
                    <Text style={styles.skillsLabel}>Matched Skills:</Text>
                    <View style={styles.skillsList}>
                      {application.matchedSkills
                        .slice(0, 3)
                        .map((skill: string, index: number) => (
                          <View key={index} style={styles.skillTag}>
                            <Text style={styles.skillText}>{skill}</Text>
                          </View>
                        ))}
                      {application.matchedSkills.length > 3 && (
                        <Text style={styles.moreSkillsText}>
                          +{application.matchedSkills.length - 3} more
                        </Text>
                      )}
                    </View>
                  </View>
                )}

              <View style={styles.footer}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(application.status, 'application') },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {application.status && typeof application.status === 'string'
                      ? String(application.status).charAt(0).toUpperCase() + 
                        String(application.status).slice(1)
                      : 'Pending'}
                  </Text>
                </View>
                <Text style={styles.dateText}>
                  {formatApplicationDate(application.appliedAt, application.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = jobApplicationsScreenStyles;

export default JobApplicationsScreen;
