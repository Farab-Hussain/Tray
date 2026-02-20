import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { allApplicationsScreenStyles } from '../../../constants/styles/allApplicationsScreenStyles';
import { getStatusColor } from '../../../utils/statusUtils';
import { logger } from '../../../utils/logger';

type SortOption = 'date' | 'status' | 'jobTitle' | 'matchRating' | 'matchScore';
type SortOrder = 'asc' | 'desc';

const AllApplicationsScreen = ({ navigation }: any) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<string | null>(null);
  const [jobFilter, setJobFilter] = useState<string | null>(null);
  const [showSubFilters, setShowSubFilters] = useState(false);

  const fetchAllApplications = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all jobs posted by consultant
      const jobsResponse = await JobService.getMyJobs();
      const jobs = jobsResponse.jobs || [];
      
      // Fetch applications for each job
      const allApplications: any[] = [];
      for (const job of jobs) {
        try {
          const applicationsResponse = await JobService.getJobApplications(job.id);
          const jobApplications = applicationsResponse.applications || [];
          
          // Add job info to each application
          jobApplications.forEach((app: any) => {
            allApplications.push({
              ...app,
              jobTitle: job.title,
              jobId: job.id,
              jobCompany: job.company,
              jobLocation: job.location,
            });
          });
        } catch (error: any) {
                    if (__DEV__) {
            logger.error(`Error fetching applications for job ${job.id}:`, error)
          };
        }
      }
      
      setApplications(allApplications);
    } catch (error: any) {
            if (__DEV__) {
        logger.error('Error fetching applications:', error)
      };
      showError(error.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  const { refreshing, handleRefresh } = useRefresh(fetchAllApplications);

  // Apply filters and sort when applications, sort option, sort order, or status filter changes
  useEffect(() => {
    if (applications.length === 0) {
      setFilteredApplications([]);
      return;
    }

    let filtered = [...applications];
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(app => {
        const appDate = new Date(app.appliedAt || app.createdAt || 0);
        
        switch (dateFilter) {
          case 'today':
            return appDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return appDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return appDate >= monthAgo;
          case 'all':
          default:
            return true;
        }
      });
    }

    // Apply rating filter
    if (ratingFilter) {
      filtered = filtered.filter(app => app.matchRating === ratingFilter);
    }

    // Apply job filter
    if (jobFilter) {
      filtered = filtered.filter(app => app.jobId === jobFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortOption) {
        case 'date':
          const dateA = new Date(a.appliedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.appliedAt || b.createdAt || 0).getTime();
          comparison = dateA - dateB;
          break;
        
        case 'status':
          const statusOrder: { [key: string]: number } = {
            'pending': 0,
            'reviewed': 1,
            'shortlisted': 2,
            'hired': 3,
            'rejected': 4,
          };
          comparison = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
          break;
        
        case 'jobTitle':
          comparison = (a.jobTitle || '').localeCompare(b.jobTitle || '');
          break;
        
        case 'matchRating':
          const ratingOrder: { [key: string]: number } = {
            'gold': 0,
            'silver': 1,
            'bronze': 2,
            'basic': 3,
          };
          const ratingA = a.matchRating || 'basic';
          const ratingB = b.matchRating || 'basic';
          comparison = (ratingOrder[ratingA] || 99) - (ratingOrder[ratingB] || 99);
          break;
        
        case 'matchScore':
          const scoreA = a.matchScore || 0;
          const scoreB = b.matchScore || 0;
          comparison = scoreA - scoreB;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredApplications(filtered);
  }, [applications, sortOption, sortOrder, statusFilter, dateFilter, ratingFilter, jobFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchAllApplications();
    }, [fetchAllApplications]),
  );


  const handleSortChange = (option: SortOption) => {
    if (sortOption === option) {
      // Toggle order if same option is clicked
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new option with default desc order
      setSortOption(option);
      setSortOrder('desc');
    }

    // Show sub-filters for options that have them (excluding status since it's already at top)
    const optionsWithSubFilters: SortOption[] = ['date', 'matchRating', 'jobTitle'];
    setShowSubFilters(optionsWithSubFilters.includes(option));
    
    // Reset sub-filters when switching sort options
    if (option !== 'date') setDateFilter(null);
    if (option !== 'matchRating') setRatingFilter(null);
    if (option !== 'jobTitle') setJobFilter(null);
  };

  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status);
  };

  const handleDateFilter = (date: string | null) => {
    setDateFilter(date);
  };

  const handleRatingFilter = (rating: string | null) => {
    setRatingFilter(rating);
  };

  const handleJobFilter = (jobId: string | null) => {
    setJobFilter(jobId);
  };

  // Get unique jobs for filter
  const uniqueJobs = useMemo(() => {
    const jobsMap = new Map();
    applications.forEach(app => {
      if (app.jobId && app.jobTitle && !jobsMap.has(app.jobId)) {
        jobsMap.set(app.jobId, { id: app.jobId, title: app.jobTitle });
      }
    });
    return Array.from(jobsMap.values());
  }, [applications]);

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
    
    if (typeof dateValue === 'object' && dateValue !== null) {
      if (dateValue.seconds !== undefined) {
        date = new Date(dateValue.seconds * 1000);
      } else if (dateValue._seconds !== undefined) {
        date = new Date(dateValue._seconds * 1000);
      } else {
        return 'N/A';
      }
    } else if (typeof dateValue === 'number') {
      date = new Date(dateValue > 9999999999 ? dateValue : dateValue * 1000);
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else {
      return 'N/A';
    }
    
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString();
  };

  const getSortLabel = (option: SortOption): string => {
    const labels: { [key in SortOption]: string } = {
      date: 'Date',
      status: 'Status',
      jobTitle: 'Job Title',
      matchRating: 'Rating',
      matchScore: 'Score',
    };
    return labels[option];
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="All Applications" onBackPress={() => navigation.goBack()} />
        <Loader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="All Applications" onBackPress={() => navigation.goBack()} />

      {/* Filter and Sort Bar */}
      <View style={styles.filterBar}>
        {/* Combined Sort and Filter Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.combinedFilterContainer}
          style={styles.combinedRow}
        >
          {/* Status Filter (Always visible) */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Status:</Text>
            <View style={styles.filterGroupContent}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  statusFilter === null && styles.filterChipActive,
                ]}
                onPress={() => handleStatusFilter(null)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === null && styles.filterChipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {['pending', 'reviewed', 'shortlisted', 'hired', 'rejected'].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    statusFilter === status && styles.filterChipActive,
                  ]}
                  onPress={() => handleStatusFilter(status)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      statusFilter === status && styles.filterChipTextActive,
                    ]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort Options */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Sort:</Text>
            <View style={styles.filterGroupContent}>
              {(['date', 'status', 'jobTitle', 'matchRating', 'matchScore'] as SortOption[]).map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterChip,
                    sortOption === option && styles.filterChipActive,
                  ]}
                  onPress={() => handleSortChange(option)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      sortOption === option && styles.filterChipTextActive,
                    ]}
                  >
                    {getSortLabel(option)}
                  </Text>
                  {sortOption === option && (
                    <Text style={styles.sortIndicator}>
                      {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Sub-filters (show when specific sort option is selected) */}
        {showSubFilters && (
          <View style={styles.subFilterRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subFilterContainer}
            >
              {sortOption === 'date' && (
                <>
                  {[
                    { value: null, label: 'All Dates' },
                    { value: 'today', label: 'Today' },
                    { value: 'week', label: 'This Week' },
                    { value: 'month', label: 'This Month' },
                  ].map(dateOption => (
                    <TouchableOpacity
                      key={dateOption.value || 'all'}
                      style={[
                        styles.subFilterChip,
                        dateFilter === dateOption.value && styles.subFilterChipActive,
                      ]}
                      onPress={() => handleDateFilter(dateOption.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.subFilterChipText,
                          dateFilter === dateOption.value && styles.subFilterChipTextActive,
                        ]}
                      >
                        {dateOption.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {sortOption === 'matchRating' && (
                <>
                  {[
                    { value: null, label: 'All Ratings' },
                    { value: 'gold', label: 'Gold' },
                    { value: 'silver', label: 'Silver' },
                    { value: 'bronze', label: 'Bronze' },
                    { value: 'basic', label: 'Basic' },
                  ].map(ratingOption => (
                    <TouchableOpacity
                      key={ratingOption.value || 'all'}
                      style={[
                        styles.subFilterChip,
                        ratingFilter === ratingOption.value && styles.subFilterChipActive,
                      ]}
                      onPress={() => handleRatingFilter(ratingOption.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.subFilterChipText,
                          ratingFilter === ratingOption.value && styles.subFilterChipTextActive,
                        ]}
                      >
                        {ratingOption.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {sortOption === 'jobTitle' && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.subFilterChip,
                      jobFilter === null && styles.subFilterChipActive,
                    ]}
                    onPress={() => handleJobFilter(null)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.subFilterChipText,
                        jobFilter === null && styles.subFilterChipTextActive,
                      ]}
                    >
                      All Jobs
                    </Text>
                  </TouchableOpacity>
                  {uniqueJobs.slice(0, 10).map(job => (
                    <TouchableOpacity
                      key={job.id}
                      style={[
                        styles.subFilterChip,
                        jobFilter === job.id && styles.subFilterChipActive,
                      ]}
                      onPress={() => handleJobFilter(job.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.subFilterChipText,
                          jobFilter === job.id && styles.subFilterChipTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {job.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

            </ScrollView>
          </View>
        )}
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
        showsVerticalScrollIndicator={false}
      >
        {filteredApplications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>
              {statusFilter ? `No ${statusFilter} applications` : 'No applications found'}
            </Text>
            <Text style={styles.emptyText}>
              {statusFilter
                ? `There are no ${statusFilter} applications at the moment`
                : 'Applications will appear here when candidates apply to your jobs'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
            </Text>
            {filteredApplications.map((application, index) => (
              <TouchableOpacity
                key={application.id || index}
                style={styles.applicationCard}
                onPress={() =>
                  navigation.navigate('ApplicationReview', {
                    applicationId: application.id,
                    jobId: application.jobId,
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <Text style={styles.applicantName} numberOfLines={1}>
                      {application.resume?.personalInfo?.name ||
                        application.user?.name ||
                        application.user?.displayName ||
                        'Applicant'}
                    </Text>
                    <Text style={styles.jobTitle} numberOfLines={2}>
                      {application.jobTitle || 'No job title'}
                    </Text>
                    {(application.jobCompany || application.jobLocation) && (
                      <Text style={styles.jobInfo} numberOfLines={1}>
                        {[application.jobCompany, application.jobLocation]
                          .filter(Boolean)
                          .join(' • ')}
                      </Text>
                    )}
                  </View>
                  {application.matchRating && (
                    <View
                      style={[
                        styles.ratingBadge,
                        { backgroundColor: getRatingColor(application.matchRating) },
                      ]}
                    >
                      <Text style={styles.ratingText}>
                        {getRatingLabel(application.matchRating)}
                      </Text>
                    </View>
                  )}
                </View>

                {(application.matchScore !== undefined && application.matchScore !== null) && (
                  <View style={styles.matchInfo}>
                    <Text style={styles.matchScore}>
                      {application.matchScore} skill{application.matchScore !== 1 ? 's' : ''}{' '}
                      matched
                    </Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(application.status, 'application') },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>
                    {formatApplicationDate(application.appliedAt, application.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = allApplicationsScreenStyles;

export default AllApplicationsScreen;

