import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import ReviewCard from '../../../components/ui/ReviewCard';
import { ReviewService } from '../../../services/review.service';
import { COLORS } from '../../../constants/core/colors';
import { useRefresh } from '../../../hooks/useRefresh';
import LoadingState from '../../../components/ui/LoadingState';
import { logger } from '../../../utils/logger';

const MyReviews = ({ navigation }: any) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyReviews = async () => {
    try {
            if (__DEV__) {
        logger.debug('📋 Fetching my reviews...')
      };
      const response = await ReviewService.getMyReviews();
            if (__DEV__) {
        logger.debug('✅ My reviews response:', response)
      };
      
      const reviewsData = response?.reviews || [];
      
      setReviews(reviewsData);
    } catch (error: any) {
            if (__DEV__) {
        logger.error('❌ Error fetching my reviews:', error)
      };
      if (error?.response?.status === 404) {
                if (__DEV__) {
          logger.debug('⚠️ My reviews API not available (404)')
        };
      }
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const { refreshing, onRefresh } = useRefresh(fetchMyReviews);

  // Fetch reviews when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMyReviews();
    }, [])
  );

  const handleEdit = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (review) {
      navigation.navigate('EditReview', {
        reviewId: review.id,
        consultantId: review.consultantId,
        consultantName: review.consultantName,
        currentRating: review.rating,
        currentComment: review.comment,
        currentRecommend: review.recommend,
      });
    }
  };

  const handleDelete = (reviewId: string) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
                            if (__DEV__) {
                logger.debug('🗑️ Deleting review:', reviewId)
              };
              await ReviewService.deleteReview(reviewId);
                            if (__DEV__) {
                logger.debug('✅ Review deleted successfully')
              };
              
              // Remove from local state
              setReviews(reviews.filter(r => r.id !== reviewId));
              
              Alert.alert('Success', 'Review deleted successfully');
            } catch (error: any) {
                            if (__DEV__) {
                logger.error('❌ Error deleting review:', error)
              };
              Alert.alert(
                'Error',
                error?.response?.data?.message || 'Failed to delete review. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

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
        {loading ? (
          <LoadingState message="Loading your reviews..." />
        ) : reviews.length === 0 ? (
          <View style={screenStyles.centerContainer}>
            <Text style={screenStyles.emptyStateText}>
              You haven't written any reviews yet.
            </Text>
            <Text style={[screenStyles.emptyStateText, styles.emptySubtext]}>
              Book a consultant and share your experience!
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>
              Your Reviews ({reviews.length})
            </Text>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                showActions={true}
                isOwnReview={true}
                mode="viewingMyReviews"
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
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
};

export default MyReviews;

