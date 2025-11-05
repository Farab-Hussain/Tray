import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Star, ThumbsUp, Edit, Trash2 } from 'lucide-react-native';
import { COLORS } from '../../constants/core/colors';

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
          <Image
            source={
              displayImage
                ? { uri: displayImage }
                : require('../../assets/image/avatar.png')
            }
            style={styles.avatar}
          />
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: COLORS.gray,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  comment: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 6,
  },
  recommendText: {
    fontSize: 12,
    color: COLORS.green,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  editButton: {
    backgroundColor: COLORS.blue,
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ReviewCard;

