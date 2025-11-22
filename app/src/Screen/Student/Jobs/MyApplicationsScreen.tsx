import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import Loader from '../../../components/ui/Loader';
import { JobService } from '../../../services/job.service';
import { COLORS } from '../../../constants/core/colors';
import { showError } from '../../../utils/toast';
import { myApplicationsScreenStyles } from '../../../constants/styles/myApplicationsScreenStyles';
import { formatDate } from '../../../utils/dateUtils';
import { useRefresh } from '../../../hooks/useRefresh';
import RefreshableScrollView from '../../../components/ui/RefreshableScrollView';

const MyApplicationsScreen = ({ navigation }: any) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await JobService.getMyApplications();
      setApplications(response.applications || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      showError(error.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  const { refreshing, handleRefresh } = useRefresh(fetchApplications);

  useFocusEffect(
    useCallback(() => {
      fetchApplications();
    }, [fetchApplications])
  );

  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      default: return COLORS.gray;
    }
  };

  const getRatingLabel = (rating?: string) => {
    switch (rating) {
      case 'gold': return '⭐ Gold';
      case 'silver': return '⭐ Silver';
      case 'bronze': return '⭐ Bronze';
      case 'basic': return 'Basic';
      default: return 'N/A';
    }
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="My Applications" onBackPress={() => navigation.goBack()} />
        <Loader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="My Applications" onBackPress={() => navigation.goBack()} />
      
      <RefreshableScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        refreshColor={COLORS.green}
      >
        {applications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No applications yet</Text>
            <Text style={styles.emptyText}>
              Start applying to jobs to see your applications here
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('JobList')}
              style={styles.browseButton}
              activeOpacity={0.7}
            >
              <Text style={styles.browseButtonText}>Browse Jobs</Text>
            </TouchableOpacity>
          </View>
        ) : (
          applications.map((application) => (
            <TouchableOpacity
              key={application.id}
              onPress={() => navigation.navigate('ApplicationDetail', { applicationId: application.id })}
              style={styles.applicationCard}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                  <Text style={styles.jobTitle} numberOfLines={2}>
                    {application.job?.title || 'Job'}
                  </Text>
                  <Text style={styles.companyName} numberOfLines={1}>
                    {application.job?.company || 'Company'}
                  </Text>
                </View>
                {application.matchRating && (
                  <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(application.matchRating) }]}>
                    <Text style={styles.ratingText}>
                      {getRatingLabel(application.matchRating)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Match Score</Text>
                  <Text style={styles.statValue}>
                    {application.matchScore}/{application.job?.requiredSkills?.length || 0} skills
                  </Text>
                </View>
              </View>

              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>
                  Applied: {formatDate(application.appliedAt)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </RefreshableScrollView>
    </SafeAreaView>
  );
};

const styles = myApplicationsScreenStyles;

export default MyApplicationsScreen;
