import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ImageSourcePropType, TouchableOpacity, Modal, Linking } from 'react-native';
import AppButton from './AppButton';
import { COLORS } from '../../constants/core/colors';

type ServiceCardProps = {
  title: string;
  description: string;
  imageUri?: ImageSourcePropType;
  // VIDEO UPLOAD CODE - COMMENTED OUT
  // videoUrl?: string;
  price?: number;
  duration?: number;
  consultantName?: string;
  consultantCategory?: string;
  onBookPress?: () => void;
};

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  imageUri,
  // VIDEO UPLOAD CODE - COMMENTED OUT
  // videoUrl,
  price,
  duration,
  consultantName,
  consultantCategory,
  onBookPress,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // VIDEO UPLOAD CODE - COMMENTED OUT
  // const [showVideoModal, setShowVideoModal] = useState(false);

  // Debug: Log media for debugging
  console.log(`🖼️ [ServiceCard] "${title}" received imageUri:`, imageUri);
  // VIDEO UPLOAD CODE - COMMENTED OUT
  // console.log(`🎥 [ServiceCard] "${title}" received videoUrl:`, videoUrl);
  
  // VIDEO UPLOAD CODE - COMMENTED OUT
  // const handlePlayVideo = () => {
  //   if (videoUrl) {
  //     setShowVideoModal(true);
  //   }
  // };

  // VIDEO UPLOAD CODE - COMMENTED OUT
  // const hasVideo = !!videoUrl;
  const hasImage = !!imageUri;

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {/* VIDEO UPLOAD CODE - COMMENTED OUT */}
        {/* {hasVideo ? (
          <View style={styles.videoContainer}>
            ... video display code ...
          </View>
        ) : */ hasImage ? (
          <Image source={imageUri} style={styles.image} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>{title}</Text>
          </View>
        )}
        {duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationIcon}>⏱</Text>
            <Text style={styles.durationText}>{duration} minutes</Text>
          </View>
        )}
      </View>
      
      <View style={styles.contentContainer}>
        {/* Text Content */}
        <View style={styles.textContent}>
          <Text style={styles.title}>{title}</Text>

          {typeof price === 'number' && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.priceValue}>
                ${price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </Text>
            </View>
          )}
          
          {consultantName && (
            <View style={styles.consultantInfo}>
              {!isExpanded ? (
                <Text style={styles.consultantText} numberOfLines={1} ellipsizeMode="tail">
                  By {consultantName}
                  {consultantCategory && ` • ${consultantCategory}`}
                </Text>
              ) : (
                <View style={styles.consultantInfoExpanded}>
                  <Text style={styles.consultantText}>
                    By {consultantName}
                  </Text>
                  {consultantCategory && (
                    <Text style={styles.consultantCategoryText}>
                      {consultantCategory}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
          
          <Text 
            style={styles.description}
            numberOfLines={isExpanded ? undefined : (description.length > 150 ? 5 : undefined)}
            ellipsizeMode={isExpanded ? undefined : "tail"}
          >
            {description}
          </Text>
          
          {description.length > 150 && (
            <TouchableOpacity 
              onPress={() => setIsExpanded(!isExpanded)}
              style={styles.readMoreButton}
              activeOpacity={0.7}
            >
              <Text style={styles.readMoreText}>
                {isExpanded ? 'Read Less' : 'Read More'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Book Button - Always at bottom */}
        <AppButton
          title="Book Now"
          onPress={onBookPress || (() => {})}
          style={styles.button}
          textStyle={styles.buttonText}
        />
      </View>

      {/* VIDEO UPLOAD CODE - COMMENTED OUT */}
      {/* Video Modal */}
      {/* <Modal
        visible={showVideoModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowVideoModal(false)}
      >
        ... video modal code ...
      </Modal> */}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: COLORS.black, 
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 16,
    width: '48%',
    flexDirection: 'column',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
    overflow: 'hidden',
  },
  playButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  playIcon: {
    fontSize: 24,
    color: COLORS.green,
    marginLeft: 4,
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
  },
  placeholderText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  videoLinkButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  videoLinkText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  durationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.green,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  durationIcon: {
    fontSize: 12,
    color: COLORS.white,
    marginRight: 4,
  },
  durationText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  contentContainer: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  textContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 6,
    lineHeight: 20,
  },
  consultantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 16,
    color: COLORS.green,
    fontWeight: '700',
  },
  consultantInfoExpanded: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
  },
  consultantText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
    flex: 1,
  },
  consultantCategoryText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
    marginTop: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: '#666666',
    marginBottom: 6,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    marginBottom: 12,
  },
  readMoreText: {
    fontSize: 13,
    color: COLORS.green,
    fontWeight: '600',
  },
  button: {
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 'auto', // Push button to bottom
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
});

export default ServiceCard;

