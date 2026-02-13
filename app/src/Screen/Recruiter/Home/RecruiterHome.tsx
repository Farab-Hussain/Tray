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
import HomeHeader from '../../../components/shared/HomeHeader';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { JobService } from '../../../services/job.service';
import { COLORS } from '../../../constants/core/colors';
import { showError } from '../../../utils/toast';
import { Plus, Briefcase, Users,  TrendingUp, Clock } from 'lucide-react-native';
import Loader from '../../../components/ui/Loader';
import { recruiterHomeStyles } from '../../../constants/styles/recruiterHomeStyles';
import { getStatusColor } from '../../../utils/statusUtils';
import EmptyState from '../../../components/ui/EmptyState';
import { useRefresh } from '../../../hooks/useRefresh';
import StatCard from '../../../components/ui/StatCard';

const RecruiterHome = ({ navigation }: any) => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch jobs
      const jobsResponse = await JobService.getMyJobs();
      const jobs = jobsResponse.jobs || [];
      
      // Calculate statistics
      const activeJobs = jobs.filter((job: any) => job.status === 'active');
      let totalApplications = 0;
      let pendingApplications = 0;
      
      // Fetch applications for each job to get counts
      for (const job of jobs) {
        try {
          const applicationsResponse = await JobService.getJobApplications(job.id);
          const applications = applicationsResponse.applications || [];
          totalApplications += applications.length;
          pendingApplications += applications.filter(
            (app: any) => app.status === 'pending' || app.status === 'reviewed'
          ).length;
        } catch (error:any) { 
          // Ignore errors for individual job applications
                    if (__DEV__) {
            console.log(`Could not fetch applications for job ${job.id},error:`, error )
          };
        }
      }
      
      setStats({
        totalJobs: jobs.length,
        activeJobs: activeJobs.length,
        totalApplications,
        pendingApplications,
      });
      
      // Get recent jobs (last 3)
      setRecentJobs(jobs.slice(0, 3));
      
      // Get recent applications (from all jobs, last 5)
      const allApplications: any[] = [];
      for (const job of jobs.slice(0, 3)) {
        try {
          const applicationsResponse = await JobService.getJobApplications(job.id);
          const applications = applicationsResponse.applications || [];
          applications.forEach((app: any) => {
            allApplications.push({
              ...app,
              jobTitle: job.title,
              jobId: job.id,
            });
          });
        } catch (error:any) {
                    if (__DEV__) {
            console.log(`Error fetching applications for job ${job.id}:`, error)
          };
                    if (__DEV__) {
            console.log(`Could not fetch applications for job ${job.id}`)
          };
        }
      }
      
      // Sort by date (most recent first) and take first 5
      allApplications.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.appliedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.appliedAt || 0).getTime();
        return dateB - dateA;
      });
      
      setRecentApplications(allApplications.slice(0, 5));
    } catch (error: any) {
            if (__DEV__) {
        console.error('Error fetching recruiter data:', error)
      };
      showError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const { refreshing, handleRefresh } = useRefresh(fetchData);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
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
        return 'Gold';
      case 'silver':
        return 'Silver';
      case 'bronze':
        return 'Bronze';
      default:
        return 'No Rating';
    }
  };


  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
          <HomeHeader />
        </SafeAreaView>
        <View style={styles.loaderContainer}>
          <Loader message="Loading..." />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer} edges={['top']}>
      <HomeHeader />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome, Recruiter!</Text>
          <Text style={styles.welcomeSubtitle}>
            Manage your job postings and find the best candidates
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('RecruiterPostJob')}
            style={[styles.quickActionButton, styles.primaryAction]}
            activeOpacity={0.7}
          >
            <Plus size={24} color={COLORS.white} />
            <Text style={styles.quickActionText}>Post New Job</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('RecruiterMyJobs')}
            style={[styles.quickActionButton, styles.secondaryAction]}
            activeOpacity={0.7}
          >
            <Briefcase size={24} color={COLORS.white} />
            <Text style={styles.quickActionText}>View All Jobs</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          {[
            { icon: Briefcase, iconColor: COLORS.green, value: stats.totalJobs, label: 'Total Jobs' },
            { icon: TrendingUp, iconColor: COLORS.blue, value: stats.activeJobs, label: 'Active Jobs' },
            { icon: Users, iconColor: COLORS.orange, value: stats.totalApplications, label: 'Applications' },
            { icon: Clock, iconColor: COLORS.red, value: stats.pendingApplications, label: 'Pending Review' },
          ].map((statConfig, index) => (
            <StatCard
              key={index}
              icon={statConfig.icon}
              iconSize={24}
              iconColor={statConfig.iconColor}
              value={statConfig.value}
              label={statConfig.label}
            />
          ))}
        </View>

        {/* Recent Jobs */}
        {recentJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Jobs</Text>
              <TouchableOpacity onPress={() => navigation.navigate('RecruiterMyJobs')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {recentJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                onPress={() => navigation.navigate('RecruiterJobApplications', { jobId: job.id })}
                style={styles.jobCard}
                activeOpacity={0.7}
              >
                <View style={styles.jobCardHeader}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          job.status === 'active' ? COLORS.green : COLORS.gray,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: job.status === 'active' ? COLORS.white : COLORS.black },
                      ]}
                    >
                      {job.status?.toUpperCase() || 'DRAFT'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.jobCompany}>{job.company}</Text>
                <Text style={styles.jobLocation}>{job.location}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Applications */}
        {recentApplications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Applications</Text>
            </View>
            
            {recentApplications.map((application, index) => (
              <TouchableOpacity
                key={application.id || index}
                onPress={() =>
                  navigation.navigate('RecruiterApplicationReview', {
                    applicationId: application.id,
                  })
                }
                style={styles.applicationCard}
                activeOpacity={0.7}
              >
                <View style={styles.applicationHeader}>
                  <View style={styles.applicationInfo}>
                    <Text style={styles.applicationName}>
                      {String(application.user?.name || 'Unknown Applicant')}
                    </Text>
                    <Text style={styles.applicationJob}>
                      {String(application.jobTitle || 'No job title')}
                    </Text>
                  </View>
                  {application.matchRating && (
                    <View
                      style={[
                        styles.ratingBadge,
                        { backgroundColor: getRatingColor(application.matchRating) },
                      ]}
                    >
                      <Text style={styles.ratingText}>
                        {String(getRatingLabel(application.matchRating))}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.applicationEmail}>
                  {String(application.user?.email || 'N/A')}
                </Text>
                <View style={styles.applicationFooter}>
                  <View style={styles.applicationFooterLeft}>
                    {(application.matchScore !== undefined && application.matchScore !== null) && (
                      <Text style={styles.matchScore}>
                        {String(application.matchScore)}/{String(application.job?.requiredSkills?.length || 0)} skills matched
                  </Text>
                    )}
                  </View>
                  {application.status && (
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
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {stats.totalJobs === 0 && (
          <EmptyState
            icon={Briefcase}
            iconSize={64}
            title="No Jobs Posted Yet"
            description="Start by posting your first job to find qualified candidates"
            actionLabel="Post Your First Job"
            onAction={() => navigation.navigate('RecruiterPostJob')}
            actionIcon={Plus}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = recruiterHomeStyles;

export default RecruiterHome;

