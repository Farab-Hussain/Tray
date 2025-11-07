import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Star } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import { reviewStyles } from '../../../constants/styles/reviewStyles';
import { ReviewService } from '../../../services/review.service';
import { useAuth } from '../../../contexts/AuthContext';

const ReviewEmployer = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const { consultantId, consultantName, consultantImage } = route.params || {};

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [recommendation, setRecommendation] = useState('yes');
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasExistingReview, setHasExistingReview] = useState(false);
  const [, setExistingReviewId] = useState<string | null>(null);

  useEffect(() => {
    const checkExistingReview = async () => {
      if (!consultantId || !user) {
        setChecking(false);
        return;
      }

      try {
        console.log(
          '🔍 Checking for existing review for consultant:',
          consultantId,
        );
        const response = await ReviewService.getMyReviews();
        const myReviews = response?.reviews || [];

        const existingReview = myReviews.find(
          (r: any) => r.consultantId === consultantId,
        );

        if (existingReview) {
          console.log(
            '⚠️ User has already reviewed this consultant:',
            existingReview.id,
          );
          setHasExistingReview(true);
          setExistingReviewId(existingReview.id);

          Alert.alert(
            'Already Reviewed',
            `You've already reviewed ${
              consultantName || 'this consultant'
            }. Would you like to edit your existing review?`,
            [
              {
                text: 'Edit Review',
                onPress: () => {
                  navigation.replace('EditReview', {
                    reviewId: existingReview.id,
                    consultantId: existingReview.consultantId,
                    consultantName:
                      existingReview.consultantName || consultantName,
                    currentRating: existingReview.rating,
                    currentComment: existingReview.comment,
                    currentRecommend: existingReview.recommend,
                  });
                },
              },
              {
                text: 'Cancel',
                onPress: () => navigation.goBack(),
                style: 'cancel',
              },
            ],
          );
        } else {
          console.log('✅ No existing review found');
        }
      } catch (error: any) {
        console.log('⚠️ Error checking for existing review:', error?.message);
        if (error?.response?.status !== 404) {
          console.error('❌ Unexpected error:', error);
        }
      } finally {
        setChecking(false);
      }
    };

    checkExistingReview();
  }, [consultantId, consultantName, navigation, user]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(
        'Rating Required',
        'Please select a rating before submitting.',
      );
      return;
    }

    if (reviewText.trim().length < 10) {
      Alert.alert(
        'Review Too Short',
        'Please write at least 10 characters for your review.',
      );
      return;
    }

    setSubmitting(true);
    try {
      console.log('📝 Submitting review:', {
        consultantId,
        rating,
        reviewText,
        recommendation,
      });

      await ReviewService.submitReview({
        consultantId,
        rating,
        comment: reviewText,
        recommend: recommendation === 'yes',
      });

      console.log('✅ Review submitted successfully');
      Alert.alert('Success', 'Thank you for your review!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('❌ Error submitting review:', error);

      const status = error?.response?.status;
      const responseData = error?.response?.data || {};
      
      // Extract error message from various possible formats
      const errorMessage = 
        responseData.error || 
        responseData.message || 
        responseData.errorMessage ||
        (typeof responseData === 'string' ? responseData : null);

      if (__DEV__) {
        console.log('📋 Error details:', {
          status,
          responseData,
          errorMessage,
        });
      }

      if (status === 403) {
        // Permission denied - user doesn't have a confirmed booking
        const message = errorMessage || 'You can only review consultants you have completed bookings with.';
        Alert.alert(
          'Cannot Submit Review',
          message,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else if (status === 404) {
        Alert.alert(
          'Feature Coming Soon',
          'The review system is not yet available on the backend. Your review will be saved once the feature is implemented.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        // Other errors - toast already shown by handleApiError, but show Alert as backup
        Alert.alert(
          'Error',
          errorMessage || 'Failed to submit review. Please try again.',
          [{ text: 'OK' }],
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => setRating(index + 1)}
        style={reviewStyles.starButton}
      >
        <Star
          size={32}
          color={index < rating ? COLORS.yellow : COLORS.lightGray}
          fill={index < rating ? COLORS.yellow : 'transparent'}
        />
      </TouchableOpacity>
    ));
  };

  if (checking) {
    return (
      <SafeAreaView style={reviewStyles.container} edges={['top', 'bottom']}>
        <View style={reviewStyles.header}>
          <TouchableOpacity
            style={reviewStyles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={reviewStyles.headerTitle}>Review Employer</Text>
        </View>
        <View style={reviewStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={reviewStyles.loadingText}>
            Checking for existing review...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasExistingReview) {
    return (
      <SafeAreaView style={reviewStyles.container} edges={['bottom', 'top']}>
        <View style={reviewStyles.header}>
          <TouchableOpacity
            style={reviewStyles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={reviewStyles.headerTitle}>Review Employer</Text>
        </View>
        <View style={reviewStyles.existingReviewContainer}>
          <Text style={reviewStyles.existingReviewText}>
            You've already reviewed this consultant.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={reviewStyles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={reviewStyles.header}>
          <TouchableOpacity
            style={reviewStyles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={reviewStyles.headerTitle}>Review Employer</Text>
        </View>

        <ScrollView
          style={reviewStyles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View style={reviewStyles.profileSection}>
          <Image
            source={
              consultantImage
                ? typeof consultantImage === 'string'
                  ? { uri: consultantImage }
                  : consultantImage
                : require('../../../assets/image/avatar.png')
            }
            style={reviewStyles.profileImage}
          />
          <Text style={reviewStyles.questionText}>
            How was your experience with {consultantName || 'this consultant'}?
          </Text>

          <View style={reviewStyles.starContainer}>{renderStars()}</View>
        </View>

        <View style={reviewStyles.reviewSection}>
          <Text style={reviewStyles.sectionLabel}>Write your review</Text>
          <TextInput
            style={reviewStyles.reviewInput}
            value={reviewText}
            onChangeText={setReviewText}
            multiline
            placeholder="Share your experience..."
            placeholderTextColor={COLORS.gray}
            textAlignVertical="top"
          />
        </View>

        <View style={reviewStyles.recommendationSection}>
          <Text style={reviewStyles.questionText}>
            Would you recommend {consultantName || 'this consultant'} to your
            friends?
          </Text>

          <View style={reviewStyles.radioContainer}>
            <TouchableOpacity
              style={reviewStyles.radioOption}
              onPress={() => setRecommendation('yes')}
            >
              <View
                style={[
                  reviewStyles.radioButton,
                  recommendation === 'yes' && reviewStyles.radioButtonSelected,
                ]}
              >
                {recommendation === 'yes' && (
                  <View style={reviewStyles.radioButtonInner} />
                )}
              </View>
              <Text style={reviewStyles.radioLabel}>Yes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={reviewStyles.radioOption}
              onPress={() => setRecommendation('no')}
            >
              <View
                style={[
                  reviewStyles.radioButton,
                  recommendation === 'no' && reviewStyles.radioButtonSelected,
                ]}
              >
                {recommendation === 'no' && (
                  <View style={reviewStyles.radioButtonInner} />
                )}
              </View>
              <Text style={reviewStyles.radioLabel}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>


      <View style={reviewStyles.submitContainer}>
        <TouchableOpacity
          style={[
            reviewStyles.submitButton,
            submitting && reviewStyles.submittingButton,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={reviewStyles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ReviewEmployer;
