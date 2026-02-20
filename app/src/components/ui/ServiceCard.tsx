import React, { useState } from 'react';
import { View, Text, Image, ImageSourcePropType, TouchableOpacity, Modal, Linking } from 'react-native';
import AppButton from './AppButton';
import { COLORS } from '../../constants/core/colors';
import { serviceCardStyles } from '../../constants/styles/serviceCardStyles';

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
  onReadMore?: () => void;
  onCardPress?: () => void;
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
  onReadMore,
  onCardPress,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // VIDEO UPLOAD CODE - COMMENTED OUT
  // const [showVideoModal, setShowVideoModal] = useState(false);

  // Debug: Log media for debugging
    if (__DEV__) {
    console.log(`🖼️ [ServiceCard] "${title}" received imageUri:`, imageUri)
  };
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

  const cardBody = (
    <>
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
          
          {(onReadMore || description.length > 150) && (
            <TouchableOpacity 
              onPress={() => {
                if (onReadMore) {
                  onReadMore();
                  return;
                }
                setIsExpanded(!isExpanded);
              }}
              style={styles.readMoreButton}
              activeOpacity={0.7}
            >
              <Text style={styles.readMoreText}>
                {onReadMore ? 'Read More' : isExpanded ? 'Read Less' : 'Read More'}
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
    </>
  );

  return onCardPress ? (
    <TouchableOpacity style={styles.card} activeOpacity={0.92} onPress={onCardPress}>
      {cardBody}
    </TouchableOpacity>
  ) : (
    <View style={styles.card}>
      {cardBody}
    </View>
  );
};

const styles = serviceCardStyles;

export default ServiceCard;
