import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Star } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import { reviewStyles } from '../../../constants/styles/reviewStyles';
import { ReviewService } from '../../../services/review.service';

const EditReview = ({ navigation, route }: any) => {
  const {
    reviewId,
    consultantName,
    currentRating,
    currentComment,
    currentRecommend,
  } = route.params || {};

  const [rating, setRating] = useState(currentRating || 0);
  const [reviewText, setReviewText] = useState(currentComment || '');
  const [recommendation, setRecommendation] = useState(currentRecommend ? 'yes' : 'no');
  const [submitting, setSubmitting] = useState(false);

  const handleUpdate = async () => {
    // Validation
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before updating.');
      return;
    }

    if (reviewText.trim().length < 10) {
      Alert.alert('Review Too Short', 'Please write at least 10 characters for your review.');
      return;
    }

    setSubmitting(true);
    try {
      console.log('📝 Updating review:', { reviewId, rating, reviewText, recommendation });

      await ReviewService.updateReview(reviewId, {
        rating,
        comment: reviewText,
        recommend: recommendation === 'yes',
      });

      console.log('✅ Review updated successfully');
      Alert.alert('Success', 'Your review has been updated!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('❌ Error updating review:', error);

      if (error?.response?.status === 404) {
        Alert.alert(
          'Error',
          'Review not found or you do not have permission to edit it.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'Error',
          error?.response?.data?.message || 'Failed to update review. Please try again.',
          [{ text: 'OK' }]
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

  return (
    <SafeAreaView style={reviewStyles.container} edges={['top']}>
      {/* Header */}
      <View style={reviewStyles.header}>
        <TouchableOpacity style={reviewStyles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={reviewStyles.headerTitle}>Edit Review</Text>
      </View>

      <ScrollView style={reviewStyles.content} showsVerticalScrollIndicator={false}>
        {/* Consultant Name */}
        <View style={reviewStyles.profileSection}>
          <Text style={reviewStyles.questionText}>
            Update your review for {consultantName || 'this consultant'}
          </Text>

          {/* Star Rating */}
          <View style={reviewStyles.starContainer}>{renderStars()}</View>
        </View>

        {/* Review Input */}
        <View style={reviewStyles.reviewSection}>
          <Text style={reviewStyles.sectionLabel}>Update your review</Text>
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

        {/* Recommendation Section */}
        <View style={reviewStyles.recommendationSection}>
          <Text style={reviewStyles.questionText}>
            Would you recommend {consultantName || 'this consultant'} to your friends?
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
                {recommendation === 'yes' && <View style={reviewStyles.radioButtonInner} />}
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
                {recommendation === 'no' && <View style={reviewStyles.radioButtonInner} />}
              </View>
              <Text style={reviewStyles.radioLabel}>No</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Update Button */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}>
          <TouchableOpacity
            style={[reviewStyles.submitButton, submitting && { opacity: 0.6 }]}
            onPress={handleUpdate}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={reviewStyles.submitButtonText}>Update Review</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditReview;

