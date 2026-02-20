// src/Screen/Student/Course/EnhancedCourseLibraryScreen.tsx
// Enhanced Course Library with time-based pricing and purchase flow

import React, { useState, useEffect } from 'react';
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
  Modal,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Star, Filter, Search, Clock, DollarSign, Award, BookOpen, TrendingUp, Users } from 'lucide-react-native';
import { courseService } from '../../services/course.service';
import { logger } from '../../../utils/logger';

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
  currency: string;
  isFree: boolean;
  thumbnailUrl?: string;
  duration: number;
  durationText: string;
  lessonsCount: number;
  enrollmentCount: number;
  averageRating: number;
  ratingCount: number;
  featured: boolean;
  trending: boolean;
  bestseller: boolean;
  certificateAvailable: boolean;
  tags: string[];
  
  // NEW: Enhanced pricing and scheduling
  pricingOptions?: {
    monthly?: number;
    yearly?: number;
    lifetime?: number;
    custom?: {
      duration: string;
      price: number;
    }[];
  };
  enrollmentType?: 'instant' | 'scheduled' | 'subscription';
  availabilitySchedule?: {
    startDate: string;
    endDate?: string;
    enrollmentDeadline?: string;
    maxEnrollments?: number;
    currentEnrollments: number;
  };
  isLaunched?: boolean;
  launchDate?: string;
}

interface CourseFilters {
  category?: string;
  level?: string;
  priceRange?: { min: number; max: number };
  isFree?: boolean;
  hasCertificate?: boolean;
  search?: string;
  sort?: string;
}

interface Props {
  navigation: CourseLibraryScreenNavigationProp;
  route: CourseLibraryScreenRouteProp;
}

const EnhancedCourseLibraryScreen: React.FC<Props> = ({ navigation, route }) => {
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
  
  // NEW: Purchase modal state
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedPricing, setSelectedPricing] = useState<'monthly' | 'yearly' | 'lifetime' | 'custom'>('monthly');
  const [customDuration, setCustomDuration] = useState('');

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
  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load featured, trending, and bestseller courses
      const [featured, trending, bestseller] = await Promise.all([
        courseService.getFeaturedCourses(5),
        courseService.getTrendingCourses(5),
        courseService.getBestsellerCourses(5),
      ]);

      setFeaturedCourses(featured);
      setTrendingCourses(trending);
      setBestsellerCourses(bestseller);
      
      // Load all courses for main view
      await loadCourses();
    } catch (error) {
      logger.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async (reset = false) => {
    try {
      if (reset) {
        setCurrentPage(1);
        setCourses([]);
      }

      const params = new URLSearchParams();
      
      // Apply filters
      if (filters.category && filters.category !== 'All') {
        params.set('category', filters.category);
      }
      if (filters.level && filters.level !== 'All') {
        params.set('level', filters.level);
      }
      if (filters.isFree !== undefined) {
        params.set('isFree', filters.isFree.toString());
      }
      if (filters.hasCertificate) {
        params.set('hasCertificate', 'true');
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }
      if (filters.sort) {
        params.set('sort', filters.sort);
      }
      
      params.set('page', currentPage.toString());
      params.set('limit', '20');

      const result = await courseService.searchCourses(params.toString());
      
      if (reset) {
        setCourses(result.courses);
      } else {
        setCourses(prev => [...prev, ...result.courses]);
      }
      
      setHasMore(result.hasMore);
    } catch (error) {
      logger.error('Error loading courses:', error);
      Alert.alert('Error', 'Failed to load courses');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const loadMoreCourses = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    await loadCourses(false);
    setCurrentPage(prev => prev + 1);
    setLoadingMore(false);
  };

  const handleCoursePress = (course: Course) => {
    setSelectedCourse(course);
    setShowPurchaseModal(true);
  };

  const handlePurchase = async () => {
    if (!selectedCourse) return;

    try {
      // Calculate price based on selected option
      let price = 0;
      if (selectedPricing === 'monthly' && selectedCourse.pricingOptions?.monthly) {
        price = selectedCourse.pricingOptions.monthly;
      } else if (selectedPricing === 'yearly' && selectedCourse.pricingOptions?.yearly) {
        price = selectedCourse.pricingOptions.yearly;
      } else if (selectedPricing === 'lifetime' && selectedCourse.pricingOptions?.lifetime) {
        price = selectedCourse.pricingOptions.lifetime;
      } else if (selectedPricing === 'custom' && customDuration) {
        const customOption = selectedCourse.pricingOptions?.custom?.find(
          option => option.duration === customDuration
        );
        if (customOption) {
          price = customOption.price;
        }
      }

      if (price === 0) {
        Alert.alert('Error', 'Please select a valid pricing option');
        return;
      }

      // Here you would integrate with your payment system
      Alert.alert(
        'Purchase Course',
        `Purchase ${selectedCourse.title} for $${(price / 100).toFixed(2)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Purchase', 
            onPress: () => {
              // Call payment service
              logger.debug('Processing payment for course:', selectedCourse.id);
              Alert.alert('Success', 'Course purchased successfully!');
              setShowPurchaseModal(false);
            }
          },
        ]
      );
    } catch (error) {
      logger.error('Error purchasing course:', error);
      Alert.alert('Error', 'Failed to purchase course');
    }
  };

  const renderCourseCard = ({ item }: { item: Course }) => (
    <TouchableOpacity 
      style={styles.courseCard}
      onPress={() => handleCoursePress(item)}
    >
      <Image 
        source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/300x200' }} 
        style={styles.courseImage}
      />
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.instructorName}>{item.instructorName}</Text>
        
        {/* NEW: Enhanced pricing display */}
        {item.pricingOptions && (
          <View style={styles.pricingContainer}>
            {item.pricingOptions.monthly && (
              <Text style={styles.pricingOption}>
                ${(item.pricingOptions.monthly / 100).toFixed(2)}/mo
              </Text>
            )}
            {item.pricingOptions.yearly && (
              <Text style={styles.pricingOption}>
                ${(item.pricingOptions.yearly / 100).toFixed(2)}/yr
              </Text>
            )}
            {item.pricingOptions.lifetime && (
              <Text style={styles.pricingOption}>
                ${(item.pricingOptions.lifetime / 100).toFixed(2)} lifetime
              </Text>
            )}
          </View>
        )}
        
        <View style={styles.courseMeta}>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.level}>{item.level}</Text>
          <View style={styles.ratingContainer}>
            <Star size={12} color="#FFA500" />
            <Text style={styles.rating}>
              {item.averageRating.toFixed(1)} ({item.ratingCount})
            </Text>
          </View>
        </View>
        
        {/* NEW: Launch status indicator */}
        {item.isLaunched && (
          <View style={styles.launchedBadge}>
            <Text style={styles.launchedText}>Available</Text>
          </View>
        )}
        
        {item.enrollmentType === 'scheduled' && (
          <Text style={styles.scheduledText}>
            Starts: {new Date(item.availabilitySchedule?.startDate || '').toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'featured':
        return (
          <FlatList
            data={featuredCourses}
            renderItem={renderCourseCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.coursesList}
            showsVerticalScrollIndicator={false}
          />
        );
      case 'trending':
        return (
          <FlatList
            data={trendingCourses}
            renderItem={renderCourseCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.coursesList}
            showsVerticalScrollIndicator={false}
          />
        );
      case 'bestseller':
        return (
          <FlatList
            data={bestsellerCourses}
            renderItem={renderCourseCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.coursesList}
            showsVerticalScrollIndicator={false}
          />
        );
      default:
        return (
          <FlatList
            data={courses}
            renderItem={renderCourseCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.coursesList}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreCourses}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
              ) : null
            }
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Course Library</Text>
        <TouchableOpacity onPress={() => setShowFilters(true)}>
          <Filter size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => loadCourses(true)}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {['all', 'featured', 'trending', 'bestseller'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText,
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {renderTabContent()}
        </ScrollView>
      )}

      {/* NEW: Purchase Modal */}
      <Modal
        visible={showPurchaseModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.purchaseModal}>
            <Text style={styles.modalTitle}>Purchase Course</Text>
            
            {selectedCourse && (
              <View style={styles.courseDetails}>
                <Text style={styles.selectedCourseTitle}>{selectedCourse.title}</Text>
                <Text style={styles.instructorName}>By {selectedCourse.instructorName}</Text>
                <Text style={styles.courseDescription}>{selectedCourse.shortDescription}</Text>
              </View>
            )}

            {/* Pricing Options */}
            <Text style={styles.sectionTitle}>Select Access Duration:</Text>
            
            {selectedCourse?.pricingOptions?.monthly && (
              <TouchableOpacity
                style={[
                  styles.pricingOptionCard,
                  selectedPricing === 'monthly' && styles.selectedPricingOption,
                ]}
                onPress={() => setSelectedPricing('monthly')}
              >
                <Text style={styles.pricingOptionTitle}>Monthly Access</Text>
                <Text style={styles.pricingOptionPrice}>
                  ${(selectedCourse.pricingOptions.monthly / 100).toFixed(2)}
                </Text>
                <Text style={styles.pricingOptionDescription}>
                  30 days of access
                </Text>
              </TouchableOpacity>
            )}

            {selectedCourse?.pricingOptions?.yearly && (
              <TouchableOpacity
                style={[
                  styles.pricingOptionCard,
                  selectedPricing === 'yearly' && styles.selectedPricingOption,
                ]}
                onPress={() => setSelectedPricing('yearly')}
              >
                <Text style={styles.pricingOptionTitle}>Yearly Access</Text>
                <Text style={styles.pricingOptionPrice}>
                  ${(selectedCourse.pricingOptions.yearly / 100).toFixed(2)}
                </Text>
                <Text style={styles.pricingOptionDescription}>
                  Save 20% vs monthly
                </Text>
              </TouchableOpacity>
            )}

            {selectedCourse?.pricingOptions?.lifetime && (
              <TouchableOpacity
                style={[
                  styles.pricingOptionCard,
                  selectedPricing === 'lifetime' && styles.selectedPricingOption,
                ]}
                onPress={() => setSelectedPricing('lifetime')}
              >
                <Text style={styles.pricingOptionTitle}>Lifetime Access</Text>
                <Text style={styles.pricingOptionPrice}>
                  ${(selectedCourse.pricingOptions.lifetime / 100).toFixed(2)}
                </Text>
                <Text style={styles.pricingOptionDescription}>
                  Unlimited access
                </Text>
              </TouchableOpacity>
            )}

            {/* Custom Duration Options */}
            {selectedCourse?.pricingOptions?.custom && selectedCourse?.pricingOptions.custom.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Custom Duration:</Text>
                {selectedCourse.pricingOptions.custom.map((option) => (
                  <TouchableOpacity
                    key={option.duration}
                    style={[
                      styles.pricingOptionCard,
                      selectedPricing === 'custom' && customDuration === option.duration && styles.selectedPricingOption,
                    ]}
                    onPress={() => {
                      setSelectedPricing('custom');
                      setCustomDuration(option.duration);
                    }}
                  >
                    <Text style={styles.pricingOptionTitle}>{option.duration}</Text>
                    <Text style={styles.pricingOptionPrice}>
                      ${(option.price / 100).toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPurchaseModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.purchaseButton}
                onPress={handlePurchase}
              >
                <Text style={styles.purchaseButtonText}>Purchase Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
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
  coursesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
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
  courseInfo: {
    padding: 12,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  instructorName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  pricingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pricingOption: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  courseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  category: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  level: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  launchedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  launchedText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scheduledText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
  },
  loader: {
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchaseModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 16,
    textAlign: 'center',
  },
  courseDetails: {
    marginBottom: 20,
  },
  selectedCourseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 12,
  },
  pricingOptionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPricingOption: {
    borderColor: '#007AFF',
    backgroundColor: '#EFF6FF',
  },
  pricingOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  pricingOptionPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  pricingOptionDescription: {
    fontSize: 12,
    color: '#666',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  purchaseButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  purchaseButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default EnhancedCourseLibraryScreen;
