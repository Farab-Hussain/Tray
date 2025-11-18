import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import Loader from '../../../components/ui/Loader';
import { JobService } from '../../../services/job.service';
import { COLORS } from '../../../constants/core/colors';
import { showError } from '../../../utils/toast';

const MyApplicationsScreen = ({ navigation }: any) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchApplications();
    }, [fetchApplications])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplications();
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
        <ScreenHeader title="My Applications" navigation={navigation} />
        <Loader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="My Applications" navigation={navigation} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.green} />
        }
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
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) }]}>
                    <Text style={styles.statusText}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>
                  Applied: {application.appliedAt ? new Date(application.appliedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  browseButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  browseButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  applicationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
    lineHeight: 24,
  },
  companyName: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: '500',
  },
  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightBackground,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  dateContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightBackground,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
});

export default MyApplicationsScreen;
