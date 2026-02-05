import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Star, Search, Filter, Clock, Users, BookOpen, Award } from 'lucide-react-native';
import { courseService } from '../../../services/course.service';

type CourseLibraryScreenNavigationProp = StackNavigationProp<any, 'CourseLibrary'>;
type CourseLibraryScreenRouteProp = RouteProp<any, 'CourseLibrary'>;

interface Course {
  id: string;
  title: string;
  shortDescription: string;
  instructorName: string;
  instructorAvatar?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  isFree: boolean;
  thumbnailUrl?: string;
  duration: number;
  durationText: string;
  lessonsCount: number;
  enrollmentCount?: number;
  averageRating?: number;
  ratingCount?: number;
  featured?: boolean;
  trending?: boolean;
  bestseller?: boolean;
  certificateAvailable: boolean;
  tags: string[];
}

interface CourseFilters {
  category?: string;
  level?: string;
  priceRange?: { min: number; max: number };
  isFree?: boolean;
  hasCertificate?: boolean;
  search?: string;
  sort?: 'newest' | 'oldest' | 'rating-high' | 'rating-low' | 'price-low' | 'price-high' | 'popular';
}

interface Props {
  navigation: CourseLibraryScreenNavigationProp;
  route: CourseLibraryScreenRouteProp;
}

const CourseLibraryScreen: React.FC<Props> = ({ navigation }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [trendingCourses, setTrendingCourses] = useState<Course[]>([]);
  const [bestsellerCourses, setBestsellerCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CourseFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'trending' | 'bestseller'>('all');

  const categories = [
    'All',
    'Business',
    'Technology',
    'Design',
    'Marketing',
    'Personal Development',
    'Health & Fitness',
    'Finance',
    'Education',
  ];

  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  const sortOptions: Array<{ value: 'newest' | 'oldest' | 'price-low' | 'price-high' | 'rating-high' | 'rating-low' | 'popular'; label: string }> = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating-high', label: 'Highest Rated' },
    { value: 'rating-low', label: 'Lowest Rated' },
    { value: 'popular', label: 'Most Popular' },
  ];

  const loadCourses = useCallback(async (reset: boolean = false) => {
    try {
      if (reset) {
        setCurrentPage(1);
        setCourses([]);
      }

      const searchFilters = {
        ...filters,
        search: searchQuery || undefined,
        page: reset ? 1 : currentPage,
        limit: 10,
      };

      const response = await courseService.searchCourses(searchFilters);
      
      if (reset) {
        setCourses(response.courses);
      } else {
        setCourses(prev => [...prev, ...response.courses]);
      }

      setHasMore(response.hasMore);
      if (!reset) {
        setCurrentPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  }, [filters, searchQuery, currentPage]);

  const searchCourses = useCallback(async () => {
    try {
      setLoading(true);
      await loadCourses(true);
    } catch (error) {
      console.error('Error searching courses:', error);
    } finally {
      setLoading(false);
    }
  }, [loadCourses]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadFeaturedCourses(),
        loadTrendingCourses(),
        loadBestsellerCourses(),
        loadCourses(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadCourses]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (searchQuery.length > 2 || searchQuery.length === 0) {
      searchCourses();
    }
  }, [searchQuery, searchCourses]);

  const loadFeaturedCourses = async () => {
    try {
      const response = await courseService.getFeaturedCourses(5);
      setFeaturedCourses(response.courses);
    } catch (error) {
      console.error('Error loading featured courses:', error);
    }
  };

  const loadTrendingCourses = async () => {
    try {
      const response = await courseService.getTrendingCourses(5);
      setTrendingCourses(response.courses);
    } catch (error) {
      console.error('Error loading trending courses:', error);
    }
  };

  const loadBestsellerCourses = async () => {
    try {
      const response = await courseService.getBestsellerCourses(5);
      setBestsellerCourses(response.courses);
    } catch (error) {
      console.error('Error loading bestseller courses:', error);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadInitialData();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadMoreCourses = async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      await loadCourses(false);
    } catch (error) {
      console.error('Error loading more courses:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const applyFilters = (newFilters: CourseFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
    searchCourses();
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    searchCourses();
  };

  const renderCourseCard = ({ item }: { item: Course }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}
    >
      <Image
        source={item.thumbnailUrl ? { uri: item.thumbnailUrl } : require('../../../assets/images/course-placeholder.png')}
        style={styles.courseImage}
      />
      
      <View style={styles.courseContent}>
        <View style={styles.courseHeader}>
          <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.courseBadges}>
            {item.featured && <View style={[styles.badge, styles.featuredBadge]}><Text style={styles.badgeText}>Featured</Text></View>}
            {item.trending && <View style={[styles.badge, styles.trendingBadge]}><Text style={styles.badgeText}>Trending</Text></View>}
            {item.bestseller && <View style={[styles.badge, styles.bestsellerBadge]}><Text style={styles.badgeText}>Bestseller</Text></View>}
          </View>
        </View>

        <Text style={styles.courseDescription} numberOfLines={2}>{item.shortDescription}</Text>
        
        <View style={styles.instructorInfo}>
          <Image
            source={item.instructorAvatar ? { uri: item.instructorAvatar } : require('../../../assets/images/avatar-placeholder.png')}
            style={styles.instructorAvatar}
          />
          <Text style={styles.instructorName}>{item.instructorName}</Text>
        </View>

        <View style={styles.courseMeta}>
          <View style={styles.metaItem}>
            <Clock size={14} color="#666" />
            <Text style={styles.metaText}>{item.durationText}</Text>
          </View>
          <View style={styles.metaItem}>
            <BookOpen size={14} color="#666" />
            <Text style={styles.metaText}>{item.lessonsCount} lessons</Text>
          </View>
          <View style={styles.metaItem}>
            <Users size={14} color="#666" />
            <Text style={styles.metaText}>{item.enrollmentCount?.toLocaleString() || 0}</Text>
          </View>
        </View>

        <View style={styles.courseFooter}>
          <View style={styles.ratingContainer}>
            <Star size={14} color="#FFA500" />
            <Text style={styles.ratingText}>{item.averageRating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.ratingCount}>({item.ratingCount || 0})</Text>
          </View>
          
          <View style={styles.priceContainer}>
            {item.isFree ? (
              <Text style={styles.freePrice}>Free</Text>
            ) : (
              <Text style={styles.price}>${(item.price / 100).toFixed(2)}</Text>
            )}
          </View>
        </View>

        {item.certificateAvailable && (
          <View style={styles.certificateBadge}>
            <Award size={12} color="#4CAF50" />
            <Text style={styles.certificateText}>Certificate</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string, seeAll?: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {seeAll && (
        <TouchableOpacity onPress={() => navigation.navigate(seeAll)}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHorizontalCourseList = (courseList: Course[], title: string, seeAll?: string) => (
    <View style={styles.section}>
      {renderSectionHeader(title, seeAll)}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {courseList.map((course) => (
          <TouchableOpacity
            key={course.id}
            style={styles.horizontalCourseCard}
            onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
          >
            <Image
              source={course.thumbnailUrl ? { uri: course.thumbnailUrl } : require('../../../assets/images/course-placeholder.png')}
              style={styles.horizontalCourseImage}
            />
            <View style={styles.horizontalCourseContent}>
              <Text style={styles.horizontalCourseTitle} numberOfLines={2}>{course.title}</Text>
              <Text style={styles.horizontalInstructorName}>{course.instructorName}</Text>
              <View style={styles.horizontalCourseMeta}>
                <View style={styles.horizontalRatingContainer}>
                  <Star size={12} color="#FFA500" />
                  <Text style={styles.horizontalRatingText}>{course.averageRating?.toFixed(1) || '0.0'}</Text>
                </View>
                <Text style={styles.horizontalPrice}>
                  {course.isFree ? 'Free' : `$${(course.price / 100).toFixed(2)}`}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderFiltersModal = () => (
    <View style={styles.filtersModal}>
      <View style={styles.filtersHeader}>
        <Text style={styles.filtersTitle}>Filters</Text>
        <TouchableOpacity onPress={() => setShowFilters(false)}>
          <Filter size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.filtersContent}>
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Category</Text>
          <View style={styles.filterOptions}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterOption,
                  filters.category === category && styles.selectedFilterOption,
                ]}
                onPress={() => setFilters({ ...filters, category: category === 'All' ? undefined : category })}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.category === category && styles.selectedFilterOptionText,
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Level</Text>
          <View style={styles.filterOptions}>
            {levels.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.filterOption,
                  filters.level === level && styles.selectedFilterOption,
                ]}
                onPress={() => setFilters({ ...filters, level: level === 'All' ? undefined : level.toLowerCase() })}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.level === level && styles.selectedFilterOptionText,
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Price</Text>
          <View style={styles.filterOptions}>
            <TouchableOpacity
              style={[
                styles.filterOption,
                filters.isFree === true && styles.selectedFilterOption,
              ]}
              onPress={() => setFilters({ ...filters, isFree: filters.isFree === true ? undefined : true })}
            >
              <Text style={[
                styles.filterOptionText,
                filters.isFree === true && styles.selectedFilterOptionText,
              ]}>
                Free Only
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterOption,
                filters.hasCertificate === true && styles.selectedFilterOption,
              ]}
              onPress={() => setFilters({ ...filters, hasCertificate: filters.hasCertificate === true ? undefined : true })}
            >
              <Text style={[
                styles.filterOptionText,
                filters.hasCertificate === true && styles.selectedFilterOptionText,
              ]}>
                With Certificate
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Sort By</Text>
          <View style={styles.filterOptions}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  filters.sort === option.value && styles.selectedFilterOption,
                ]}
                onPress={() => setFilters({ ...filters, sort: option.value })}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.sort === option.value && styles.selectedFilterOptionText,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.filtersActions}>
        <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
          <Text style={styles.clearFiltersText}>Clear All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyFiltersButton} onPress={() => applyFilters(filters)}>
          <Text style={styles.applyFiltersText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading courses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Course Library</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyEnrollments')}>
          <BookOpen size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
          <Filter size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['all', 'featured', 'trending', 'bestseller'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <FlatList
        data={activeTab === 'all' ? courses : 
              activeTab === 'featured' ? featuredCourses :
              activeTab === 'trending' ? trendingCourses : bestsellerCourses}
        renderItem={renderCourseCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.courseList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={activeTab === 'all' ? loadMoreCourses : undefined}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <BookOpen size={48} color="#ccc" />
            <Text style={styles.emptyText}>No courses found</Text>
            <Text style={styles.emptySubText}>Try adjusting your filters or search query</Text>
          </View>
        }
        ListHeaderComponent={
          activeTab === 'all' ? (
            <View>
              {featuredCourses.length > 0 && renderHorizontalCourseList(featuredCourses, 'Featured Courses', 'FeaturedCourses')}
              {trendingCourses.length > 0 && renderHorizontalCourseList(trendingCourses, 'Trending Courses', 'TrendingCourses')}
              {bestsellerCourses.length > 0 && renderHorizontalCourseList(bestsellerCourses, 'Bestsellers', 'BestsellerCourses')}
              <View style={styles.section}>
                {renderSectionHeader('All Courses')}
              </View>
            </View>
          ) : null
        }
      />

      {/* Filters Modal */}
      {showFilters && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {renderFiltersModal()}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    padding: 10,
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  courseList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  courseContent: {
    padding: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  courseBadges: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  featuredBadge: {
    backgroundColor: '#007AFF',
  },
  trendingBadge: {
    backgroundColor: '#FF6B6B',
  },
  bestsellerBadge: {
    backgroundColor: '#4CAF50',
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  courseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  instructorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  instructorName: {
    fontSize: 14,
    color: '#666',
  },
  courseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  priceContainer: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  freePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  certificateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  certificateText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  horizontalScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  horizontalCourseCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  horizontalCourseImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  horizontalCourseContent: {
    padding: 12,
  },
  horizontalCourseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  horizontalInstructorName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  horizontalCourseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horizontalRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalRatingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginLeft: 2,
  },
  horizontalPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  filtersModal: {
    flex: 1,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filtersContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f3f4',
    marginHorizontal: 4,
    marginVertical: 4,
  },
  selectedFilterOption: {
    backgroundColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedFilterOptionText: {
    color: '#fff',
  },
  filtersActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default CourseLibraryScreen;
