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

const JobApplicationsScreen = ({ navigation, route }: any) => {
  const { jobId } = route.params;
  const [applications, setApplications] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      setRefreshing(false);
    }
  }, [jobId]);

  useFocusEffect(
    useCallback(() => {
      fetchApplications();
    }, [fetchApplications])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplications();
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
        <ScreenHeader title="Applications" navigation={navigation} />
        <Loader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Applications" navigation={navigation} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.green} />
        }
      >
        {/* Summary Card */}
        {summary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Application Summary</Text>
            <View style={styles.summaryStats}>
              {summary.gold > 0 && (
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryLabel}>Gold</Text>
                  <Text style={[styles.summaryValue, { color: '#FFD700' }]}>{summary.gold}</Text>
                </View>
              )}
              {summary.silver > 0 && (
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryLabel}>Silver</Text>
                  <Text style={[styles.summaryValue, { color: '#C0C0C0' }]}>{summary.silver}</Text>
                </View>
              )}
              {summary.bronze > 0 && (
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryLabel}>Bronze</Text>
                  <Text style={[styles.summaryValue, { color: '#CD7F32' }]}>{summary.bronze}</Text>
                </View>
              )}
              <View style={styles.summaryStat}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryValue}>{summary.total}</Text>
              </View>
            </View>
          </View>
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
          applications.map((application) => (
            <TouchableOpacity
              key={application.id}
              onPress={() => navigation.navigate('ApplicationReview', { applicationId: application.id })}
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
                <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(application.matchRating) }]}>
                  <Text style={styles.ratingText}>
                    {getRatingLabel(application.matchRating)}
                  </Text>
                </View>
              </View>

              <View style={styles.matchContainer}>
                <Text style={styles.matchLabel}>Match Score</Text>
                <Text style={styles.matchValue}>
                  {application.matchScore}/{application.job?.requiredSkills?.length || 0} skills matched
                </Text>
              </View>

              {application.matchedSkills && application.matchedSkills.length > 0 && (
                <View style={styles.skillsContainer}>
                  <Text style={styles.skillsLabel}>Matched Skills:</Text>
                  <View style={styles.skillsList}>
                    {application.matchedSkills.slice(0, 3).map((skill: string, index: number) => (
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
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) }]}>
                  <Text style={styles.statusText}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </Text>
                </View>
                <Text style={styles.dateText}>
                  {application.appliedAt ? new Date(application.appliedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
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
  summaryCard: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 6,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.black,
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
    lineHeight: 20,
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
    borderLeftWidth: 4,
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
  applicantName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  applicantEmail: {
    fontSize: 14,
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
  matchContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightBackground,
  },
  matchLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
    fontWeight: '500',
  },
  matchValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  skillsContainer: {
    marginBottom: 12,
  },
  skillsLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 8,
    fontWeight: '600',
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  skillTag: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  moreSkillsText: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightBackground,
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
  dateText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
});

export default JobApplicationsScreen;
