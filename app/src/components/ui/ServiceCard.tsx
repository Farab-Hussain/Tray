import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ImageSourcePropType, TouchableOpacity } from 'react-native';
import AppButton from './AppButton';
import { COLORS } from '../../constants/core/colors';

type ServiceCardProps = {
  title: string;
  description: string;
  imageUri: ImageSourcePropType;
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
  duration,
  consultantName,
  consultantCategory,
  onBookPress,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Debug: Log imageUri for debugging
  console.log(`🖼️ [ServiceCard] "${title}" received imageUri:`, imageUri);
  console.log(`🖼️ [ServiceCard] "${title}" imageUri type:`, typeof imageUri);
  if (imageUri && typeof imageUri === 'object' && 'uri' in imageUri) {
    console.log(`🖼️ [ServiceCard] "${title}" imageUri.uri:`, imageUri.uri);
  }

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={imageUri} style={styles.image} />
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
            numberOfLines={isExpanded ? undefined : 2}
            ellipsizeMode={isExpanded ? undefined : "tail"}
          >
            {description}
          </Text>
          
          <TouchableOpacity 
            onPress={() => setIsExpanded(!isExpanded)}
            style={styles.readMoreButton}
          >
            <Text style={styles.readMoreText}>
              {isExpanded ? 'Read Less' : 'Read More'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Book Button - Always at bottom */}
        <AppButton
          title="Book Now"
          onPress={onBookPress || (() => {})}
          style={styles.button}
          textStyle={styles.buttonText}
        />
      </View>
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

