import React, { useEffect, useMemo, useState } from 'react';
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

const FALLBACK_SERVICE_IMAGE = require('../../assets/image/services.png');

type ConsultantServiceCardProps = {
  title: string;
  description: string;
  imageUri?: ImageSourcePropType | string | null;
  duration?: number;
  price?: number;
  rating?: number;
  onSetAvailabilityPress?: () => void;
  onEditPress?: () => void;
  onDeletePress?: () => void;
  onReviewPress?: () => void;
};

const normalizeImageSource = (
  imageUri?: ImageSourcePropType | string | null,
): ImageSourcePropType | null => {
  if (!imageUri) return null;
  if (typeof imageUri === 'string') {
    const trimmed = imageUri.trim();
    if (!trimmed) return null;
    // Skip known-dead legacy Cloudinary cloud
    if (trimmed.includes('res.cloudinary.com/dkblutnml')) return null;
    return { uri: trimmed };
  }
  return imageUri;
};

const ConsultantServiceCard: React.FC<ConsultantServiceCardProps> = ({
  title,
  description,
  imageUri,
  duration,
  onSetAvailabilityPress,
  onEditPress,
  onDeletePress,
  onReviewPress,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [cardImageFailed, setCardImageFailed] = useState(false);
  const [modalImageFailed, setModalImageFailed] = useState(false);

  const imageSource = useMemo(() => normalizeImageSource(imageUri), [imageUri]);
  const descriptionText = typeof description === 'string' ? description : '';
  const needsReadMore = descriptionText.length > 150;

  // Reset failure flags when the URL changes
  useEffect(() => {
    setCardImageFailed(false);
    setModalImageFailed(false);
  }, [imageUri]);

  const cardSource =
    imageSource && !cardImageFailed ? imageSource : FALLBACK_SERVICE_IMAGE;
  const modalSource =
    imageSource && !modalImageFailed ? imageSource : FALLBACK_SERVICE_IMAGE;

  return (
    <>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={cardSource}
            style={styles.image}
            resizeMode="cover"
            onError={() => {
              if (imageSource) {
                if (__DEV__) {
                  console.warn(
                    '[ConsultantServiceCard] Card image failed, using fallback:',
                    imageUri,
                  );
                }
                setCardImageFailed(true);
              }
            }}
            onLoad={() => {
              if (cardImageFailed) setCardImageFailed(false);
            }}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.contentTop}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>

            {duration ? (
              <View style={styles.durationBadge}>
                <Clock size={14} color={COLORS.green} />
                <Text style={styles.durationText}>{duration} minutes</Text>
              </View>
            ) : null}

            <View style={styles.descriptionContainer}>
              <Text
                style={styles.description}
                numberOfLines={4}
                ellipsizeMode="tail"
              >
                {descriptionText}
              </Text>
            </View>
            <View style={styles.readMoreSlot}>
              {needsReadMore ? (
                <TouchableOpacity
                  onPress={() => {
                    setModalImageFailed(false);
                    setShowModal(true);
                  }}
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

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              <Image
                source={modalSource}
                style={styles.modalImage}
                resizeMode="cover"
                onError={() => {
                  if (imageSource) {
                    if (__DEV__) {
                      console.warn(
                        '[ConsultantServiceCard] Modal image failed, using fallback:',
                        imageUri,
                      );
                    }
                    setModalImageFailed(true);
                  }
                }}
              />

              {duration ? (
                <View style={styles.modalDurationBadge}>
                  <Clock size={16} color={COLORS.green} />
                  <Text style={styles.durationText}>{duration} minutes</Text>
                </View>
              ) : null}

              <Text style={styles.modalDescription}>
                {descriptionText.trim()
                  ? descriptionText
                  : 'No description available.'}
              </Text>
            </ScrollView>

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
