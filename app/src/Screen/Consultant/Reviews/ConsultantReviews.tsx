import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import ReviewCard from '../../../components/ui/ReviewCard';
import { ReviewService } from '../../../services/review.service';
import { courseService } from '../../../services/course.service';
import { COLORS } from '../../../constants/core/colors';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingState from '../../../components/ui/LoadingState';
import { logger } from '../../../utils/logger';
import { normalizeAvatarUrl, normalizeTimestampToIso } from '../../../utils/normalize';

const ConsultantReviews = ({ navigation }: any) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'service' | 'course'>('service');
  const [serviceReviews, setServiceReviews] = useState<any[]>([]);
  const [courseReviews, setCourseReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCourseReviews = async () => {
    if (!user?.uid) return;
    const courses = await courseService.getInstructorCourses(user.uid, { status: 'published', limit: 100 });
    if (!Array.isArray(courses) || courses.length === 0) {
      setCourseReviews([]);
      return;
    }

    const reviewResponses = await Promise.all(
      courses.map(async (course: any) => {
        try {
          const response = await courseService.getCourseReviews(course.id, { page: 1, limit: 50 });
          const reviews = response?.reviews || [];
          return reviews.map((review: any) => ({
            ...review,
            consultantName: course.instructorName || 'Consultant',
            consultantId: user.uid,
            courseTitle: course.title || 'Course',
            createdAt: normalizeTimestampToIso(review?.createdAt) || new Date().toISOString(),
          }));
        } catch {
          return [];
        }
      }),
    );

    const flattened = reviewResponses.flat();
    flattened.sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
    setCourseReviews(flattened);
  };

  const fetchAllReviews = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const serviceResponse = await ReviewService.getConsultantReviews(user.uid, 1, 100);
      setServiceReviews(serviceResponse?.reviews || []);
      await fetchCourseReviews();
    } catch (error: any) {
      logger.error('❌ Error fetching consultant reviews:', error);
      setServiceReviews([]);
      setCourseReviews([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchAllReviews();
    } finally {
      setRefreshing(false);
    }
  }, [fetchAllReviews]);

  // Fetch reviews when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchAllReviews();
    }, [fetchAllReviews])
  );

  const selectedReviews = activeTab === 'service' ? serviceReviews : courseReviews;

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader 
        title="My Reviews" 
        onBackPress={() => navigation.goBack()} 
      />

      <ScrollView
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('service')}
            style={[
              styles.tabButton,
              activeTab === 'service' && styles.tabButtonActive,
            ]}
          >
            <Text style={[styles.tabText, activeTab === 'service' && styles.tabTextActive]}>
              Service Reviews ({serviceReviews.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('course')}
            style={[
              styles.tabButton,
              activeTab === 'course' && styles.tabButtonActive,
            ]}
          >
            <Text style={[styles.tabText, activeTab === 'course' && styles.tabTextActive]}>
              Course Reviews ({courseReviews.length})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <LoadingState message="Loading reviews..." />
        ) : selectedReviews.length === 0 ? (
          <View style={screenStyles.centerContainer}>
            <Text style={screenStyles.emptyStateText}>
              No {activeTab === 'service' ? 'service' : 'course'} reviews yet.
            </Text>
            <Text style={[screenStyles.emptyStateText, styles.emptySubtext]}>
              {activeTab === 'service'
                ? 'Service reviews will appear after students complete sessions with you.'
                : 'Course reviews will appear after students enroll and review your courses.'}
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>
              {activeTab === 'service'
                ? `Service Reviews (${serviceReviews.length})`
                : `Course Reviews (${courseReviews.length})`}
            </Text>
            {selectedReviews.map((review) => (
              <View key={`${activeTab}-${review.id}`} style={{ marginBottom: 10 }}>
                {activeTab === 'course' ? (
                  <Text style={styles.courseTitle}>{review.courseTitle || 'Course'}</Text>
                ) : null}
                <ReviewCard
                  review={{
                    ...review,
                    studentName: review.studentName || review.studentId || 'Student',
                    studentProfileImage: normalizeAvatarUrl({
                      profileImage: review.studentProfileImage,
                      avatarUrl: review.studentAvatar,
                    }) || null,
                    createdAt: normalizeTimestampToIso(review.createdAt) || new Date().toISOString(),
                  }}
                  showActions={false}
                  isOwnReview={false}
                  mode="viewingConsultantReviews"
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 16,
  },
  emptySubtext: {
    marginTop: 8,
  },
  tabRow: {
    flexDirection: 'row' as const,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center' as const,
  },
  tabButtonActive: {
    backgroundColor: COLORS.white,
  },
  tabText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500' as const,
  },
  tabTextActive: {
    color: COLORS.black,
    fontWeight: '700' as const,
  },
  courseTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: COLORS.blue,
    marginBottom: 6,
    marginLeft: 2,
  },
};

export default ConsultantReviews;
