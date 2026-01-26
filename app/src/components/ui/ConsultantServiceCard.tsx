import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Clock, X } from 'lucide-react-native';
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
};

const ConsultantServiceCard: React.FC<ConsultantServiceCardProps> = ({
  title,
  description,
  imageUri,
  // VIDEO UPLOAD CODE - COMMENTED OUT
  // videoUrl,
  duration,
  onSetAvailabilityPress,
}) => {
  const [showModal, setShowModal] = useState(false);
  // VIDEO UPLOAD CODE - COMMENTED OUT
  // const [showVideoModal, setShowVideoModal] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageLoadTimeout, setImageLoadTimeout] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

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
    imageUriUri: (imageUri as any)?.uri,
    imageUriUriLength: (imageUri as any)?.uri?.length || 0,
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
    if (imageUri && !imageLoadError) {
            if (__DEV__) {
        console.log('🔄 [ConsultantServiceCard] Starting image load for:', (imageUri as any)?.uri)
      };
      setImageLoading(true);
      
      // Set a timeout to show fallback if image takes too long to load
      const timeout = setTimeout(() => {
                if (__DEV__) {
          console.log('⏰ [ConsultantServiceCard] Image load timeout, showing fallback')
        };
        setImageLoadError(true);
        setImageLoading(false);
      }, 10000); // 10 second timeout
      
      setImageLoadTimeout(timeout);
      
      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }
  }, [imageUri, imageLoadError]);

  // Remove ALL height constraints when expanded to allow full content display
  const cardStyle = isDescriptionExpanded
    ? [styles.card, { height: undefined, minHeight: undefined, maxHeight: undefined }]
    : styles.card;

  const contentStyle = isDescriptionExpanded
    ? [styles.content, { flex: 1, minHeight: undefined }]
    : styles.content;

  const contentTopStyle = isDescriptionExpanded
    ? [styles.contentTop, { height: undefined, maxHeight: undefined, flexShrink: 0 }]
    : styles.contentTop;

  const descriptionContainerStyle = isDescriptionExpanded
    ? [styles.descriptionContainer, { maxHeight: undefined, flexShrink: 0 }]
    : styles.descriptionContainer;

  return (
    <>
      <View style={cardStyle}>
        {/* Service Image/Video Section */}
        <View style={styles.imageContainer}>
          {/* VIDEO UPLOAD CODE - COMMENTED OUT */}
          {/* {videoUrl ? (
            ... video display code with play button ...
          ) : */ imageUri && !imageLoadError ? (
            <>
              <Image 
                source={imageUri} 
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
                  if (imageLoadTimeout) {
                    clearTimeout(imageLoadTimeout);
                    setImageLoadTimeout(null);
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
        <View style={contentStyle}>
          <View style={contentTopStyle}>
            {/* Title - Adaptive lines based on length */}
            <Text style={styles.title} numberOfLines={isTitleLong ? 2 : 3}>
              {title}
            </Text>

            {/* Duration Badge */}
            {duration && (
              <View style={styles.durationBadge}>
                <Clock size={14} color={COLORS.green} />
                <Text style={styles.durationText}>{duration} minutes</Text>
              </View>
            )}

            <View style={descriptionContainerStyle}>
              <Text
                style={styles.description}
                numberOfLines={isDescriptionExpanded ? undefined : (needsReadMore ? 5 : undefined)}
                ellipsizeMode={isDescriptionExpanded ? undefined : "tail"}
                allowFontScaling={true}
              >
                {description}
              </Text>
            </View>

            {needsReadMore && (
              <TouchableOpacity
                onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                style={styles.readMoreButton}
                activeOpacity={0.7}
              >
                <Text style={styles.readMoreText}>
                  {isDescriptionExpanded ? 'Read Less' : 'Read More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ marginTop: 'auto' }}>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={onSetAvailabilityPress || (() => {})}
            >
              <Text style={styles.bookButtonText}>Set Availability</Text>
            </TouchableOpacity>
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
                <Image source={imageUri} style={styles.modalImage} />
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
