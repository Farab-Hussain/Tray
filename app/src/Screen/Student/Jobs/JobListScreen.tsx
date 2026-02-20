import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import SearchBar from '../../../components/shared/SearchBar';
import Loader from '../../../components/ui/Loader';
import AppButton from '../../../components/ui/AppButton';
import { JobService } from '../../../services/job.service';
import { COLORS } from '../../../constants/core/colors';
import { showError } from '../../../utils/toast';
import { jobListScreenStyles } from '../../../constants/styles/jobListScreenStyles';
import { useRefresh } from '../../../hooks/useRefresh';
import LoadMoreButton from '../../../components/ui/LoadMoreButton';
import FitScoreDisplay from '../../../components/ui/FitScoreDisplay';
import { logger } from '../../../utils/logger';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  requiredSkills: string[];
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  matchScore?: number;
  matchRating?: 'gold' | 'silver' | 'bronze' | 'basic';
  applicationCount?: number;
  createdAt: any;
}

const JobListScreen = ({ navigation }: any) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchJobs = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let response;
      if (searchQuery.trim()) {
        response = await JobService.searchJobs(searchQuery.trim(), pageNum, 20);
      } else {
        response = await JobService.getAllJobs(pageNum, 20, { status: 'active' });
      }

      const newJobs = response.jobs || [];
      
      if (reset) {
        setJobs(newJobs);
      } else {
        setJobs(prev => [...prev, ...newJobs]);
      }

      setHasMore(response.pagination?.hasNextPage || false);
    } catch (error: any) {
            if (__DEV__) {
        logger.error('Error fetching jobs:', error)
      };
      showError(error.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery]);

  const handleRefreshAction = useCallback(async () => {
    setPage(1);
    setHasMore(true);
    await fetchJobs(1, true);
  }, [fetchJobs]);

  const { refreshing, handleRefresh } = useRefresh(handleRefreshAction);

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      setHasMore(true);
      fetchJobs(1, true);
    }, [fetchJobs])
  );

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchJobs(nextPage, false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
    setHasMore(true);
    fetchJobs(1, true);
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
      default: return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Job Opportunities" onBackPress={() => navigation.goBack()} />
      
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Search jobs by title, company, skills..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <Loader />
      ) : (
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
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No jobs found' : 'No jobs available'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Check back later for new opportunities'}
              </Text>
            </View>
          ) : (
            <>
              {jobs.map((job) => (
                <View key={job.id} style={styles.jobCard}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.titleContainer}>
                        <Text style={styles.jobTitle} numberOfLines={2}>
                          {job.title}
                        </Text>
                        <Text style={styles.companyName} numberOfLines={1}>
                          {job.company}
                        </Text>
                      </View>
                      {job.matchRating && (
                        <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(job.matchRating) }]}>
                          <Text style={styles.ratingText}>
                            {getRatingLabel(job.matchRating)}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.jobInfo}>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>📍</Text>
                        <Text style={styles.infoText} numberOfLines={1}>{job.location}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>💼</Text>
                        <Text style={styles.infoText}>{job.jobType.replace('-', ' ')}</Text>
                      </View>
                    </View>

                    {job.salaryRange && (
                      <View style={styles.salaryContainer}>
                        <Text style={styles.salaryText}>
                          💰 ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()} {job.salaryRange.currency}
                        </Text>
                      </View>
                    )}

                    <View style={styles.skillsContainer}>
                      {job.requiredSkills.slice(0, 3).map((skill, index) => (
                        <View key={index} style={styles.skillTag}>
                          <Text style={styles.skillText}>{skill}</Text>
                        </View>
                      ))}
                      {job.requiredSkills.length > 3 && (
                        <Text style={styles.moreSkillsText}>
                          +{job.requiredSkills.length - 3} more
                        </Text>
                      )}
                    </View>

                    {/* Enhanced Fit Score Display */}
                    {job.matchScore && (
                      <FitScoreDisplay
                        matchScore={{
                          score: job.matchScore,
                          totalRequired: job.requiredSkills.length,
                          matchPercentage: (job.matchScore / job.requiredSkills.length) * 100,
                          matchRating: job.matchRating || 'basic',
                          matchedSkills: job.matchedSkills || [],
                          missingSkills: job.missingSkills || [],
                        }}
                        compact={true}
                        showDetails={false}
                      />
                    )}
                  </TouchableOpacity>

                  <View style={styles.applyButtonContainer}>
                    <AppButton
                      title="Apply"
                      onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
                      style={styles.applyButton}
                    />
                  </View>
                </View>
              ))}

              <LoadMoreButton
                onPress={handleLoadMore}
                loading={loadingMore}
                hasMore={hasMore}
                label="Load More Jobs"
              />
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = jobListScreenStyles;

export default JobListScreen;
