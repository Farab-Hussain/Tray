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
  duration?: number;
  price?: number;
  rating?: number;
  onSetAvailabilityPress?: () => void;
};

const ConsultantServiceCard: React.FC<ConsultantServiceCardProps> = ({
  title,
  description,
  imageUri,
  duration,
  onSetAvailabilityPress,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageLoadTimeout, setImageLoadTimeout] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Check if description is long enough to need "Read More"
  const needsReadMore = description.length > 80;

  // Debug logging for image
  console.log(`🔍 [ConsultantServiceCard] Service: ${title}`, {
    imageUri: imageUri,
    hasImageUri: !!imageUri,
    imageUriType: typeof imageUri,
    imageUriUri: (imageUri as any)?.uri,
    imageUriUriLength: (imageUri as any)?.uri?.length || 0,
    imageLoadError: imageLoadError
  });

  // Debug logging
  console.log(
    'Description length:',
    description.length,
    'needsReadMore:',
    needsReadMore,
  );

  const isTitleLong = title.length > 10;

  // Debug: Log which rendering path we're taking
  console.log(`🎨 [ConsultantServiceCard] ${title} - imageUri: ${!!imageUri}, imageLoadError: ${imageLoadError}, will show: ${imageUri && !imageLoadError ? 'Image' : 'Custom Background'}`);

  // Set up image load timeout
  useEffect(() => {
    if (imageUri && !imageLoadError) {
      console.log('🔄 [ConsultantServiceCard] Starting image load for:', (imageUri as any)?.uri);
      setImageLoading(true);
      
      // Set a timeout to show fallback if image takes too long to load
      const timeout = setTimeout(() => {
        console.log('⏰ [ConsultantServiceCard] Image load timeout, showing fallback');
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

  const cardStyle = isDescriptionExpanded
    ? [styles.card, { height: undefined, minHeight: 400 }]
    : styles.card;

  const contentTopStyle = isDescriptionExpanded
    ? [styles.contentTop, { height: undefined, maxHeight: 200 }]
    : styles.contentTop;

  const descriptionContainerStyle = isDescriptionExpanded
    ? [styles.descriptionContainer, { maxHeight: undefined }]
    : styles.descriptionContainer;

  return (
    <>
      <View style={cardStyle}>
        {/* Service Image Section */}
        <View style={styles.imageContainer}>
          {imageUri && !imageLoadError ? (
            <>
              <Image 
                source={imageUri} 
                style={styles.image}
                onError={(error) => {
                  console.log('❌ [ConsultantServiceCard] Image failed to load:', error.nativeEvent.error);
                  console.log('❌ [ConsultantServiceCard] Image URL:', imageUri);
                  console.log('❌ [ConsultantServiceCard] Error details:', JSON.stringify(error.nativeEvent, null, 2));
                  console.log('🔄 [ConsultantServiceCard] Setting imageLoadError to true');
                  setImageLoadError(true);
                  setImageLoading(false);
                }}
                onLoad={() => {
                  console.log('✅ [ConsultantServiceCard] Image loaded successfully:', imageUri);
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
        <View style={styles.content}>
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
                numberOfLines={
                  isDescriptionExpanded
                    ? undefined
                    : isTitleLong // If title is long, show fewer lines for description
                    ? 2
                    : needsReadMore // Otherwise, if needsReadMore, show 3 lines
                    ? 3
                    : undefined // If no read more needed, show all lines
                }
              >
                {description}
              </Text>
            </View>

            {(needsReadMore || description.length > 50) && (
              <Text
                style={styles.readMoreText}
                onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                {isDescriptionExpanded ? 'Read Less' : 'Read More'}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={onSetAvailabilityPress || (() => {})}
          >
            <Text style={styles.bookButtonText}>Set Availability</Text>
          </TouchableOpacity>
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
    </>
  );
};

export default ConsultantServiceCard;
