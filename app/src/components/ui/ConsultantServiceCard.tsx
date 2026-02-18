import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Clock, X, Edit, Trash2, Star } from 'lucide-react-native';
import { COLORS } from '../../constants/core/colors';
import { consultantServiceCardStyles as styles } from '../../constants/styles/ConsultantServiceCard.styles';

type ConsultantServiceCardProps = {
  title: string;
  description: string;
  imageUri?: ImageSourcePropType;
  // VIDEO UPLOAD CODE - COMMENTED OUT
  // videoUrl?: string;
  duration?: number;
  price?: number; 
  rating?: number;
  onSetAvailabilityPress?: () => void;
  onEditPress?: () => void;
  onDeletePress?: () => void;
  onReviewPress?: () => void;
};

const ConsultantServiceCard: React.FC<ConsultantServiceCardProps> = ({
  title,
  description,
  imageUri,
  // VIDEO UPLOAD CODE - COMMENTED OUT
  // videoUrl,
  duration,
  onSetAvailabilityPress,
  onEditPress,
  onDeletePress,
  onReviewPress,
}) => {
  const [showModal, setShowModal] = useState(false);
  // VIDEO UPLOAD CODE - COMMENTED OUT
  // const [showVideoModal, setShowVideoModal] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const imageLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // VIDEO UPLOAD CODE - COMMENTED OUT
  // const handlePlayVideo = () => {
  //   if (videoUrl) {
  //     setShowVideoModal(true);
  //   }
  // };

  // Check if description is long enough to need "Read More"
  // Industry best practice: Show "Read More" for descriptions longer than ~150 characters
  // This allows for approximately 4-5 lines of text before truncation
  const needsReadMore = description.length > 150;

  // Debug logging for image
    if (__DEV__) {
    console.log(`🔍 [ConsultantServiceCard] Service: ${title}`, {
    imageUri: imageUri,
    hasImageUri: !!imageUri,
    imageUriType: typeof imageUri,
    imageUriValue: imageUri,
    imageLoadError: imageLoadError
  })
  };

  // Debug logging
    if (__DEV__) {
    console.log(
    'Description length:',
    description.length,
    'needsReadMore:',
    needsReadMore,
  )
  };

  const isTitleLong = title.length > 10;

  // Debug: Log which rendering path we're taking
    if (__DEV__) {
    console.log(`🎨 [ConsultantServiceCard] ${title} - imageUri: ${!!imageUri}, imageLoadError: ${imageLoadError}, will show: ${imageUri && !imageLoadError ? 'Image' : 'Custom Background'}`)
  };

  // Set up image load timeout
  useEffect(() => {
    // Clear existing timeout when dependencies change
    if (imageLoadTimeoutRef.current) {
      clearTimeout(imageLoadTimeoutRef.current);
      imageLoadTimeoutRef.current = null;
    }

    if (imageUri && !imageLoadError) {
            if (__DEV__) {
        console.log('🔄 [ConsultantServiceCard] Starting image load for:', imageUri)
      };
      setImageLoading(true);
      
      // Set a timeout to show fallback if image takes too long to load
      const timeout = setTimeout(() => {
                if (__DEV__) {
          console.log('⏰ [ConsultantServiceCard] Image load timeout, showing fallback')
        };
        setImageLoadError(true);
        setImageLoading(false);
      }, 10000);
      
      imageLoadTimeoutRef.current = timeout;
    }
  }, [imageUri, imageLoadError]);

  // Remove ALL height constraints when expanded to allow full content display
  return (
    <>
      <View style={styles.card}>
        {/* Service Image/Video Section */}
        <View style={styles.imageContainer}>
          {/* VIDEO UPLOAD CODE - COMMENTED OUT */}
          {/* {videoUrl ? (
            ... video display code with play button ...
          ) : */ imageUri && !imageLoadError ? (
            <>
              <Image 
                source={typeof imageUri === 'string' ? { uri: imageUri } : imageUri} 
                style={styles.image}
                onError={(error) => {
                                    if (__DEV__) {
                    console.log('❌ [ConsultantServiceCard] Image failed to load:', error.nativeEvent.error)
                  };
                                    if (__DEV__) {
                    console.log('❌ [ConsultantServiceCard] Image URL:', imageUri)
                  };
                                    if (__DEV__) {
                    console.log('❌ [ConsultantServiceCard] Error details:', JSON.stringify(error.nativeEvent, null, 2))
                  };
                                    if (__DEV__) {
                    console.log('🔄 [ConsultantServiceCard] Setting imageLoadError to true')
                  };
                  setImageLoadError(true);
                  setImageLoading(false);
                }}
                onLoad={() => {
                                    if (__DEV__) {
                    console.log('✅ [ConsultantServiceCard] Image loaded successfully:', imageUri)
                  };
                  setImageLoadError(false);
                  setImageLoading(false);
                  // Clear timeout since image loaded successfully
                  if (imageLoadTimeoutRef.current) {
                    clearTimeout(imageLoadTimeoutRef.current);
                    imageLoadTimeoutRef.current = null;
                  }
                }}
              />
              {imageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <Text style={styles.imageLoadingText}>Loading...</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.customImageBackground}>
              <Text style={styles.customImageText}>{title}</Text>
            </View>
          )}
        </View>

        {/* Content Section - Flexible Height */}
        <View style={styles.content}>
          <View style={styles.contentTop}>
            {/* Title - Adaptive lines based on length */}
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>

            {/* Duration Badge */}
            {duration && (
              <View style={styles.durationBadge}>
                <Clock size={14} color={COLORS.green} />
                <Text style={styles.durationText}>{duration} minutes</Text>
              </View>
            )}

            <View style={styles.descriptionContainer}>
              <Text
                style={styles.description}
                numberOfLines={4}
                ellipsizeMode="tail"
                allowFontScaling={true}
              >
                {description}
              </Text>
            </View>
            <View style={styles.readMoreSlot}>
              {needsReadMore ? (
                <TouchableOpacity
                  onPress={() => setShowModal(true)}
                  style={styles.readMoreButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.readMoreText}>Read More</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
            </View>
          </View>

          <View style={{ marginTop: 'auto' }}>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={onSetAvailabilityPress || (() => {})}
            >
              <Text style={styles.bookButtonText}>Set Availability</Text>
            </TouchableOpacity>

            {(onEditPress || onDeletePress || onReviewPress) && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionIconButton, styles.editAction]}
                  onPress={onEditPress || (() => {})}
                  disabled={!onEditPress}
                >
                  <Edit size={15} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionIconButton, styles.deleteAction]}
                  onPress={onDeletePress || (() => {})}
                  disabled={!onDeletePress}
                >
                  <Trash2 size={15} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionIconButton, styles.reviewAction]}
                  onPress={onReviewPress || (() => {})}
                  disabled={!onReviewPress}
                >
                  <Star size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Full Description Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {title}
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {/* Service Image */}
              {imageUri ? (
                <Image source={typeof imageUri === 'string' ? { uri: imageUri } : imageUri} style={styles.modalImage} />
              ) : (
                <View style={styles.modalPlaceholderImage}>
                  <Text style={styles.placeholderText}>Service Image</Text>
                </View>
              )}

              {/* Duration Badge in Modal */}
              {duration && (
                <View style={styles.modalDurationBadge}>
                  <Clock size={16} color={COLORS.green} />
                  <Text style={styles.durationText}>{duration} minutes</Text>
                </View>
              )}

              {/* Full Description */}
              <Text style={styles.modalDescription}>{description}</Text>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* VIDEO UPLOAD CODE - COMMENTED OUT */}
      {/* Video Modal */}
      {/* <Modal
        visible={showVideoModal}
        ... video modal code ...
      </Modal> */}
    </>
  );
};

export default ConsultantServiceCard;
