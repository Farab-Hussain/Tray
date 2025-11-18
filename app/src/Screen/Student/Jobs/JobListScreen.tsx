import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import SearchBar from '../../../components/shared/SearchBar';
import Loader from '../../../components/ui/Loader';
import { JobService } from '../../../services/job.service';
import { COLORS } from '../../../constants/core/colors';
import { showError } from '../../../utils/toast';

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
  const [refreshing, setRefreshing] = useState(false);
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
      console.error('Error fetching jobs:', error);
      showError(error.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

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

  const handleRefresh = () => {
    setRefreshing(true);
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
      <ScreenHeader title="Job Opportunities" navigation={navigation} />
      
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
                <TouchableOpacity
                  key={job.id}
                  onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
                  style={styles.jobCard}
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

                  {job.matchScore !== undefined && (
                    <View style={styles.matchContainer}>
                      <Text style={styles.matchText}>
                        Match: {job.matchScore}/{job.requiredSkills.length} skills
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              {hasMore && (
                <TouchableOpacity
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                  style={[styles.loadMoreButton, loadingMore && styles.loadMoreButtonDisabled]}
                  activeOpacity={0.7}
                >
                  {loadingMore ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.loadMoreText}>Load More Jobs</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBackground,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
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
  jobInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
  },
  salaryContainer: {
    marginBottom: 12,
  },
  salaryText: {
    fontSize: 14,
    color: COLORS.green,
    fontWeight: '600',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillTag: {
    backgroundColor: COLORS.lightBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 12,
    color: COLORS.black,
    fontWeight: '500',
  },
  moreSkillsText: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  matchContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightBackground,
  },
  matchText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
  loadMoreButton: {
    backgroundColor: COLORS.green,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreButtonDisabled: {
    opacity: 0.6,
  },
  loadMoreText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default JobListScreen;
