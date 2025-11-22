import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import Loader from '../../../components/ui/Loader';
import { JobService } from '../../../services/job.service';
import { COLORS } from '../../../constants/core/colors';
import { showError, showSuccess } from '../../../utils/toast';
import { useRefresh } from '../../../hooks/useRefresh';
import { showConfirmation } from '../../../utils/alertUtils';
import { Plus, Trash2 } from 'lucide-react-native';
import { recruiterMyJobsScreenStyles } from '../../../constants/styles/recruiterMyJobsScreenStyles';
import { getStatusColor } from '../../../utils/statusUtils';

const MyJobsScreen = ({ navigation }: any) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    }
  }, []);

  const { refreshing, handleRefresh } = useRefresh(fetchJobs);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [fetchJobs]),
  );

  const handleDeleteJob = (jobId: string, jobTitle: string) => {
    showConfirmation(
      'Delete Job',
      `Are you sure you want to delete "${jobTitle}"?`,
      async () => {
        try {
          await JobService.deleteJob(jobId);
          showSuccess('Job deleted successfully');
          fetchJobs();
        } catch (error: any) {
          showError(error.message || 'Failed to delete job');
        }
      },
      undefined,
      'Delete',
      'Cancel'
    );
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="My Jobs" onBackPress={() => navigation.goBack()} />
        <Loader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="My Jobs" onBackPress={() => navigation.goBack()} />

      <View style={styles.headerActions}>
        <TouchableOpacity
          onPress={() => navigation.navigate('RecruiterPostJob')}
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.green}
          />
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
              onPress={() => navigation.navigate('RecruiterPostJob')}
              style={styles.postButton}
              activeOpacity={0.7}
            >
              <Plus size={20} color={COLORS.white} />
              <Text style={styles.postButtonText}>Post Your First Job</Text>
            </TouchableOpacity>
          </View>
        ) : (
          jobs.map(job => (
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
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(job.status, 'job') },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>📋</Text>
                  <Text style={styles.statValue}>
                    {job.applicationCount || 0}
                  </Text>
                  <Text style={styles.statLabel}>applications</Text>
                </View>
                {job.goldApplicantsCount > 0 && (
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>⭐</Text>
                    <Text style={[styles.statValue, { color: '#FFD700' }]}>
                      {job.goldApplicantsCount}
                    </Text>
                    <Text style={styles.statLabel}>Gold</Text>
                  </View>
                )}
                {job.silverApplicantsCount > 0 && (
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>⭐</Text>
                    <Text style={[styles.statValue, { color: '#C0C0C0' }]}>
                      {job.silverApplicantsCount}
                    </Text>
                    <Text style={styles.statLabel}>Silver</Text>
                  </View>
                )}
              </View>

              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('RecruiterJobApplications', {
                      jobId: job.id,
                    })
                  }
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

const styles = recruiterMyJobsScreenStyles;

export default MyJobsScreen;
