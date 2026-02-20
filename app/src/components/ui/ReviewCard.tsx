import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Star, ThumbsUp, Edit, Trash2, UserRound } from 'lucide-react-native';
import { COLORS } from '../../constants/core/colors';
import { reviewCardStyles } from '../../constants/styles/reviewCardStyles';
import { normalizeAvatarUrl, normalizeTimestampToDate } from '../../utils/normalize';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment: string;
    recommend?: boolean;
    studentName?: string;
    studentProfileImage?: string;
    consultantName?: string;
    consultantProfileImage?: string;
    consultantCategory?: string;
    createdAt: string;
  };
  showActions?: boolean;
  onEdit?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
  isOwnReview?: boolean;
  mode?: 'viewingConsultantReviews' | 'viewingMyReviews';
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  showActions = false,
  onEdit,
  onDelete,
  isOwnReview = false,
  mode = 'viewingConsultantReviews',
}) => {
  // Determine what to display based on mode
  const displayName = mode === 'viewingMyReviews' 
    ? (review.consultantName || 'Consultant')
    : (review.studentName || 'Student');
  
  const displayImage = mode === 'viewingMyReviews'
    ? review.consultantProfileImage
    : review.studentProfileImage;
  const normalizedDisplayImage = normalizeAvatarUrl({ profileImage: displayImage });
  
  const displaySubtitle = mode === 'viewingMyReviews'
    ? review.consultantCategory
    : null;
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={16}
        color={index < rating ? '#FFD700' : '#E5E5E5'}
        fill={index < rating ? '#FFD700' : 'transparent'}
      />
    ));
  };

  const formatDate = (dateValue: any) => {
    const date = normalizeTimestampToDate(dateValue) || new Date(0);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <View style={styles.card}>
      {/* Header with user info and rating */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {normalizedDisplayImage ? (
            <Image source={{ uri: normalizedDisplayImage }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: '#A5AFBD',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
            >
              <UserRound size={18} color={COLORS.gray} />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{displayName}</Text>
            {displaySubtitle && (
              <Text style={styles.subtitle}>{displaySubtitle}</Text>
            )}
            <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
          </View>
        </View>

        {/* Rating Stars */}
        <View style={styles.ratingContainer}>{renderStars(review.rating)}</View>
      </View>

      {/* Review Comment */}
      <Text style={styles.comment}>{review.comment}</Text>

      {/* Recommendation Badge */}
      {review.recommend && (
        <View style={styles.recommendBadge}>
          <ThumbsUp size={14} color={COLORS.green} />
          <Text style={styles.recommendText}>Recommends this consultant</Text>
        </View>
      )}

      {/* Action Buttons (Edit/Delete) */}
      {showActions && isOwnReview && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => onEdit(review.id)}
            >
              <Edit size={16} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => onDelete(review.id)}
            >
              <Trash2 size={16} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = reviewCardStyles;

export default ReviewCard;
