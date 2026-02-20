import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  Users, 
  Calendar,
  Share2,
  MessageCircle,
  Phone,
  Video
} from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import AppButton from '../../../components/ui/AppButton';
import { useAuth } from '../../../contexts/AuthContext';
import { BookingService } from '../../../services/booking.service';
import { ConsultantService } from '../../../services/consultant.service';
import { logger } from '../../../utils/logger';

interface ServiceDetailsProps {
  consultantId: string;
  consultantName: string;
  consultantCategory: string;
  serviceId: string;
  serviceTitle: string;
  serviceDescription?: string;
  serviceImageUrl?: string;
  serviceDuration?: number;
  servicePrice?: number;
  consultantRating?: number;
  consultantTotalReviews?: number;
}

const ServiceDetails = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  
  const [service, setService] = useState<ServiceDetailsProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingSlots, setBookingSlots] = useState<
    Array<{
      date: string;
      time: string;
      available: boolean;
    }>
  >([]);

  // Get service data from route params
  const routeParams = route.params as ServiceDetailsProps;

  const fetchServiceDetails = useCallback(async () => {
    try {
      setLoading(true);
      const serviceId = routeParams?.serviceId;
      if (!serviceId) {
        setService(routeParams);
        setBookingSlots([]);
        return;
      }

      const response = await ConsultantService.getServiceById(serviceId);
      const apiService = response?.service || response;

      const rawPrice = apiService?.price ?? apiService?.cost ?? apiService?.fee;
      const parsedPrice =
        typeof rawPrice === 'number'
          ? rawPrice
          : typeof rawPrice === 'string'
          ? parseFloat(rawPrice)
          : undefined;

      const normalizedService: ServiceDetailsProps = {
        serviceId: apiService?.id || apiService?._id || routeParams.serviceId,
        serviceTitle: apiService?.title || routeParams?.serviceTitle || 'Service',
        serviceDescription:
          apiService?.description || routeParams?.serviceDescription,
        serviceImageUrl:
          apiService?.imageUrl || apiService?.image || routeParams?.serviceImageUrl,
        serviceDuration:
          apiService?.duration || routeParams?.serviceDuration || 60,
        servicePrice:
          Number.isFinite(parsedPrice) ? parsedPrice : routeParams?.servicePrice,
        consultantId:
          apiService?.consultantId ||
          apiService?.consultant?.uid ||
          routeParams?.consultantId,
        consultantName:
          apiService?.consultant?.name ||
          routeParams?.consultantName ||
          'Consultant',
        consultantCategory:
          apiService?.consultant?.category ||
          routeParams?.consultantCategory ||
          'Consultation',
      };

      setService(normalizedService);
      setBookingSlots([]);
    } catch (error) {
      logger.error('Error fetching service details:', error);
      setService(routeParams);
      setBookingSlots([]);
    } finally {
      setLoading(false);
    }
  }, [routeParams]);

  React.useEffect(() => {
    fetchServiceDetails();
  }, [fetchServiceDetails]);

  const handleBookNow = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to book this service');
      return;
    }

    if (!service) return;

    // Navigate to booking slots
    navigation.navigate('BookingSlots' as never, {
      consultantId: service.consultantId,
      consultantName: service.consultantName,
      serviceId: service.serviceId,
      serviceTitle: service.serviceTitle,
      serviceImageUrl: service.serviceImageUrl,
      serviceDuration: service.serviceDuration,
      servicePrice: service.servicePrice,
      consultantCategory: service.consultantCategory,
    });
  };

  const handleContactConsultant = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to contact this consultant');
      return;
    }

    if (!service) return;

    const openChat = async () => {
      try {
        const access = await BookingService.checkAccess(service.consultantId);
        if (!access?.hasAccess) {
          Alert.alert(
            'Session Access Required',
            access?.message ||
              'Please book an active paid session with this consultant first.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Book Now', onPress: handleBookNow },
            ],
          );
          return;
        }

        navigation.navigate('Chat' as never, {
          consultantId: service.consultantId,
          consultantName: service.consultantName,
        });
      } catch (error) {
        Alert.alert('Error', 'Unable to verify session access');
      }
    };

    openChat();
  };

  const verifyCallAccess = async (): Promise<boolean> => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to contact this consultant');
      return false;
    }

    if (!service?.consultantId) {
      Alert.alert('Consultant Not Available', 'Unable to start call right now.');
      return false;
    }

    try {
      const access = await BookingService.checkAccess(service.consultantId);
      if (!access?.hasAccess) {
        Alert.alert(
          'Session Access Required',
          access?.message ||
            'Please book an active paid session with this consultant first.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Book Now', onPress: handleBookNow },
          ],
        );
        return false;
      }
      return true;
    } catch (error) {
      Alert.alert('Error', 'Unable to verify session access');
      return false;
    }
  };

  const handleAudioCall = async () => {
    const hasAccess = await verifyCallAccess();
    if (!hasAccess || !user?.uid || !service?.consultantId) return;

    const callId = `${user.uid}_${service.consultantId}-${Date.now()}`;
    navigation.navigate('CallingScreen', {
      callId,
      callerId: user.uid,
      receiverId: service.consultantId,
      isCaller: true,
    });
  };

  const handleVideoCall = async () => {
    const hasAccess = await verifyCallAccess();
    if (!hasAccess || !user?.uid || !service?.consultantId) return;

    const callId = `${user.uid}_${service.consultantId}-${Date.now()}`;
    navigation.navigate('VideoCallingScreen', {
      callId,
      callerId: user.uid,
      receiverId: service.consultantId,
      isCaller: true,
    });
  };

  const handleShare = async () => {
    if (!service) return;

    try {
      await Share.share({
        message: `Check out this service: ${service.serviceTitle} by ${service.consultantName}`,
        url: `https://tray.app/service/${service.serviceId}`,
        title: service.serviceTitle,
      });
    } catch (error) {
      logger.error('Error sharing service:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={styles.loadingText}>Loading service details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Service not found</Text>
          <AppButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          {/* <Share2 size={20} color={COLORS.black} /> */}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Service Image */}
        {service.serviceImageUrl && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: service.serviceImageUrl }}
              style={styles.serviceImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Service Info */}
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceTitle}>{service.serviceTitle}</Text>
          
          <View style={styles.consultantInfo}>
            <View style={styles.consultantHeader}>
              <Text style={styles.consultantName}>{service.consultantName}</Text>
              <View style={styles.ratingContainer}>
                <Star size={16} color={COLORS.orange} fill={COLORS.orange} />
                <Text style={styles.ratingText}>
                  {service.consultantRating || 0} ({service.consultantTotalReviews || 0})
                </Text>
              </View>
            </View>
            <Text style={styles.consultantCategory}>{service.consultantCategory}</Text>
          </View>

          {/* Price and Duration */}
          <View style={styles.pricingContainer}>
            {service.servicePrice && (
              <View style={styles.priceCard}>
                <Text style={styles.priceLabel}>Price</Text>
                <Text style={styles.priceValue}>{formatPrice(service.servicePrice)}</Text>
              </View>
            )}
            
            {service.serviceDuration && (
              <View style={styles.durationCard}>
                <Clock size={16} color={COLORS.green} />
                <Text style={styles.durationText}>{service.serviceDuration} minutes</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {service.serviceDescription && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>About this service</Text>
              <Text style={styles.descriptionText}>{service.serviceDescription}</Text>
            </View>
          )}

          {/* Available Slots Preview */}
          <View style={styles.slotsContainer}>
            <Text style={styles.slotsTitle}>Available Time Slots</Text>
            <View style={styles.slotsGrid}>
              {bookingSlots.slice(0, 6).map((slot, index) => (
                <View
                  key={index}
                  style={[
                    styles.slotChip,
                    !slot.available && styles.slotChipUnavailable,
                  ]}
                >
                  <Text style={[
                    styles.slotText,
                    !slot.available && styles.slotTextUnavailable,
                  ]}>
                    {slot.time}
                  </Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.viewAllSlotsButton}
              onPress={handleBookNow}
            >
              <Text style={styles.viewAllSlotsText}>View All Available Slots</Text>
            </TouchableOpacity>
          </View>

          {/* Contact Options */}
          <View style={styles.contactContainer}>
            <Text style={styles.contactTitle}>Contact Consultant</Text>
            <View style={styles.contactButtons}>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleContactConsultant}
              >
                <MessageCircle size={20} color={COLORS.white} />
                <Text style={styles.contactButtonText}>Chat</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.contactButton, styles.contactButtonSecondary]}
                onPress={handleAudioCall}
              >
                <Phone size={20} color={COLORS.green} />
                <Text style={[styles.contactButtonText, styles.contactButtonTextSecondary]}>
                  Call
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.contactButton, styles.contactButtonSecondary]}
                onPress={handleVideoCall}
              >
                <Video size={20} color={COLORS.green} />
                <Text style={[styles.contactButtonText, styles.contactButtonTextSecondary]}>
                  Video
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bottom Action Button */}
        <View style={styles.bottomAction}>
          <AppButton
            title="Book Now"
            onPress={handleBookNow}
            style={styles.bookButton}
            textStyle={styles.bookButtonText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 20,
  },
  errorButton: {
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  shareButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: COLORS.lightBackground,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceInfo: {
    padding: 20,
    backgroundColor: COLORS.white,
  },
  serviceTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 16,
  },
  consultantInfo: {
    marginBottom: 24,
  },
  consultantHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  consultantName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  ratingContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 4,
  },
  consultantCategory: {
    fontSize: 14,
    color: COLORS.gray,
  },
  pricingContainer: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 24,
  },
  priceCard: {
    flex: 1,
    backgroundColor: COLORS.lightBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.green,
  },
  durationCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: COLORS.lightBackground,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.black,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.gray,
  },
  slotsContainer: {
    marginBottom: 24,
  },
  slotsTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 16,
  },
  slotsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  slotChip: {
    backgroundColor: COLORS.green,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  slotChipUnavailable: {
    backgroundColor: COLORS.lightGray,
  },
  slotText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: COLORS.white,
  },
  slotTextUnavailable: {
    color: COLORS.gray,
  },
  viewAllSlotsButton: {
    alignSelf: 'flex-start',
  },
  viewAllSlotsText: {
    fontSize: 14,
    color: COLORS.green,
    fontWeight: '500' as const,
  },
  contactContainer: {
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 16,
  },
  contactButtons: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  contactButtonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  contactButtonTextSecondary: {
    color: COLORS.green,
  },
  bottomAction: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  bookButton: {
    backgroundColor: COLORS.green,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
};

export default ServiceDetails;
