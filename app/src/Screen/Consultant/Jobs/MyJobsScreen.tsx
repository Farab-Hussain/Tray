import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import Loader from '../../../components/ui/Loader';
import { JobService } from '../../../services/job.service';
import { COLORS } from '../../../constants/core/colors';
import { showError, showSuccess } from '../../../utils/toast';
import { Plus, Trash2 } from 'lucide-react-native';

const MyJobsScreen = ({ navigation }: any) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await JobService.getMyJobs();
      setJobs(response.jobs || []);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      showError(error.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [fetchJobs])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const handleDeleteJob = (jobId: string, jobTitle: string) => {
    Alert.alert(
      'Delete Job',
      `Are you sure you want to delete "${jobTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await JobService.deleteJob(jobId);
              showSuccess('Job deleted successfully');
              fetchJobs();
            } catch (error: any) {
              showError(error.message || 'Failed to delete job');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return COLORS.green;
      case 'closed': return COLORS.red;
      case 'draft': return COLORS.gray;
      default: return COLORS.gray;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="My Jobs" navigation={navigation} />
        <Loader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="My Jobs" navigation={navigation} />
      
      <View style={styles.headerActions}>
        <TouchableOpacity
          onPress={() => navigation.navigate('PostJob')}
          style={styles.postButton}
          activeOpacity={0.7}
        >
          <Plus size={20} color={COLORS.white} />
          <Text style={styles.postButtonText}>Post New Job</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.green} />
        }
      >
        {jobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💼</Text>
            <Text style={styles.emptyTitle}>No jobs posted yet</Text>
            <Text style={styles.emptyText}>
              Start posting jobs to find the perfect candidates
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('PostJob')}
              style={styles.postButton}
              activeOpacity={0.7}
            >
              <Plus size={20} color={COLORS.white} />
              <Text style={styles.postButtonText}>Post Your First Job</Text>
            </TouchableOpacity>
          </View>
        ) : (
          jobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                  <Text style={styles.jobTitle} numberOfLines={2}>
                    {job.title}
                  </Text>
                  <Text style={styles.companyName} numberOfLines={1}>
                    {job.company} • {job.location}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
                  <Text style={styles.statusText}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>📋</Text>
                  <Text style={styles.statValue}>{job.applicationCount || 0}</Text>
                  <Text style={styles.statLabel}>applications</Text>
                </View>
                {job.goldApplicantsCount > 0 && (
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>⭐</Text>
                    <Text style={[styles.statValue, { color: '#FFD700' }]}>{job.goldApplicantsCount}</Text>
                    <Text style={styles.statLabel}>Gold</Text>
                  </View>
                )}
                {job.silverApplicantsCount > 0 && (
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>⭐</Text>
                    <Text style={[styles.statValue, { color: '#C0C0C0' }]}>{job.silverApplicantsCount}</Text>
                    <Text style={styles.statLabel}>Silver</Text>
                  </View>
                )}
              </View>

              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('JobApplications', { jobId: job.id })}
                  style={styles.viewButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewButtonText}>View Applications</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteJob(job.id, job.title)}
                  style={styles.deleteButton}
                  activeOpacity={0.7}
                >
                  <Trash2 size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
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
  headerActions: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
  },
  postButton: {
    backgroundColor: COLORS.green,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  postButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
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
  jobCard: {
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
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 6,
    lineHeight: 24,
  },
  companyName: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightBackground,
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  viewButton: {
    flex: 1,
    backgroundColor: COLORS.green,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: COLORS.red,
    padding: 14,
    borderRadius: 10,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MyJobsScreen;
