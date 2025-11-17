import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import ReviewCard from '../../../components/ui/ReviewCard';
import { ReviewService } from '../../../services/review.service';
import { COLORS } from '../../../constants/core/colors';
import { useAuth } from '../../../contexts/AuthContext';

const ConsultantReviews = ({ navigation }: any) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConsultantReviews = async (pageNum: number = 1, append: boolean = false) => {
    if (!user?.uid) return;
    
    try {
      if (!append) {
        setLoading(true);
      }
      
      console.log('📋 Fetching reviews for consultant:', user.uid);
      const response = await ReviewService.getConsultantReviews(user.uid, pageNum, 20);
      console.log('✅ Consultant reviews response:', response);
      
      const reviewsData = response?.reviews || [];
      
      if (append) {
        setReviews(prev => [...prev, ...reviewsData]);
      } else {
        setReviews(reviewsData);
      }
    } catch (error: any) {
      console.error('❌ Error fetching consultant reviews:', error);
      if (error?.response?.status === 404) {
        console.log('⚠️ Consultant reviews API not available (404)');
      }
      if (!append) {
        setReviews([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch reviews when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchConsultantReviews();
    }, [user?.uid])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchConsultantReviews();
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
          <View style={screenStyles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={screenStyles.loadingText}>Loading reviews...</Text>
          </View>
        ) : reviews.length === 0 ? (
          <View style={screenStyles.centerContainer}>
            <Text style={screenStyles.emptyStateText}>
              No reviews yet.
            </Text>
            <Text style={[screenStyles.emptyStateText, styles.emptySubtext]}>
              Reviews from students will appear here once they book and complete sessions with you.
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>
              Reviews About You ({reviews.length})
            </Text>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                showActions={false}
                isOwnReview={false}
                mode="viewingConsultantReviews"
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

export default ConsultantReviews;
