import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import SearchBar from '../../../components/shared/SearchBar';
import Loader from '../../../components/ui/Loader';
import ServiceCard from '../../../components/ui/ServiceCard';
import ReviewCard from '../../../components/ui/ReviewCard';
import { ConsultantService } from '../../../services/consultant.service';
import { ReviewService } from '../../../services/review.service';
import { COLORS } from '../../../constants/core/colors';
import { Star } from 'lucide-react-native';

const Services = ({ navigation, route }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Use state to track current consultant info (updated on focus)
  const [currentConsultantId, setCurrentConsultantId] = useState<string | undefined>(undefined);
  const [currentConsultantName, setCurrentConsultantName] = useState<string | undefined>(undefined);
  const [currentConsultantCategory, setCurrentConsultantCategory] = useState<string | undefined>(undefined);

  // Track when we've already handled an incoming set of route params to avoid clearing loops
  const hasHandledRouteParamsRef = useRef(false);

  // Cache for default service images to avoid duplicate network requests
  const defaultServiceImageCacheRef = useRef<Record<string, string | null>>({});

  // Memoized helpers for current params
  const routeParams = route?.params;
  const paramsConsultantId = routeParams?.consultantId;
  const paramsConsultantName = routeParams?.consultantName;
  const paramsConsultantCategory = routeParams?.consultantCategory;

  const consultantId = currentConsultantId ?? paramsConsultantId;
  const consultantName = currentConsultantName ?? paramsConsultantName;
  const consultantCategory = currentConsultantCategory ?? paramsConsultantCategory;

  console.log('🔍 Services Screen - Route Params:', routeParams);
  console.log('📋 Current Consultant ID:', consultantId);
  console.log('👤 Current Consultant Name:', consultantName);

  // Fetch services function
  const resolveServiceImage = useCallback(
    async (service: any): Promise<string | undefined> => {
      const currentImageUrl =
        typeof service.imageUrl === 'string' && service.imageUrl.trim() !== ''
          ? service.imageUrl.trim()
          : undefined;

      if (currentImageUrl) {
        return currentImageUrl;
      }

      const consultantProfileImage =
        typeof service.consultant?.profileImage === 'string' &&
        service.consultant.profileImage.trim() !== ''
          ? service.consultant.profileImage.trim()
          : undefined;

      if (
        typeof service.image === 'string' &&
        service.image.trim() !== ''
      ) {
        return service.image.trim();
      }

      if (consultantProfileImage) {
        return consultantProfileImage;
      }

      const defaultServiceId = service.basedOnDefaultService;
      if (!defaultServiceId) {
        return undefined;
      }

      const cache = defaultServiceImageCacheRef.current;
      if (defaultServiceId in cache) {
        const cachedValue = cache[defaultServiceId];
        return cachedValue ?? undefined;
      }

      try {
        const defaultServiceResponse =
          await ConsultantService.getServiceById(defaultServiceId);
        const fallbackImageUrl =
          defaultServiceResponse?.service?.imageUrl ||
          defaultServiceResponse?.service?.image ||
          undefined;

        cache[defaultServiceId] = fallbackImageUrl ?? null;
        if (fallbackImageUrl) {
          console.log(
            `🖼️ Applied fallback image for service ${service.title} from default service ${defaultServiceId}`,
          );
        }
        return fallbackImageUrl;
      } catch (fallbackError) {
        console.warn(
          `⚠️ Unable to load fallback image for service ${service.title} (default: ${defaultServiceId})`,
          fallbackError,
        );
        cache[defaultServiceId] = null;
        return undefined;
      }
    },
    [],
  );

  const fetchServices = useCallback(async (targetConsultantId?: string) => {
    try {
      setLoading(true);
      let servicesData = [];

      if (targetConsultantId) {
        // Fetch specific consultant's services
        console.log('🚀 Fetching services for consultant:', targetConsultantId);
        const response = await ConsultantService.getConsultantServices(targetConsultantId);
        console.log('✅ Services Response:', response);
        servicesData = response?.services || [];
      } else {
        // Fetch all services (from Services tab)
        console.log('🚀 Fetching all services from all consultants');
        try {
          const response = await ConsultantService.getAllServices();
          console.log('✅ All Services Response:', response);
          console.log('📊 Total services found:', response?.services?.length || 0);
          if (response?.services && response.services.length > 0) {
            console.log('📋 Sample service:', response.services[0]);
            console.log('🖼️ Sample service imageUrl:', response.services[0].imageUrl);
            console.log('🖼️ Sample service image:', response.services[0].image);
            console.log('🖼️ Sample service imageUri:', response.services[0].imageUri);
            console.log('🔍 All service keys:', Object.keys(response.services[0]));
          }
          servicesData = response?.services || [];
        } catch (error: any) {
          console.log('⚠️ All services endpoint error:', error?.message);
          console.log('❌ Error details:', error?.response?.status, error?.response?.data);
          // If endpoint doesn't exist, show empty array
          servicesData = [];
        }
      }

      const servicesWithImages = await Promise.all(
        servicesData.map(async (service: any) => {
          const imageUrl = await resolveServiceImage(service);
          if (imageUrl && imageUrl !== service.imageUrl) {
            return {
              ...service,
              imageUrl,
              image: service.image ?? imageUrl,
            };
          }
          return service;
        }),
      );

      setServices(servicesWithImages);
    } catch (err) {
      console.error('❌ Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  }, [resolveServiceImage]);
  useEffect(() => {
    const parent = navigation.getParent?.();
    if (!parent) {
      return;
    }

    const unsubscribe = parent.addListener('tabPress', event => {
      const parentState = parent.getState();
      const targetRoute = parentState?.routes?.find(routeItem => routeItem.key === event.target);

      if (targetRoute?.name !== 'Services') {
        return;
      }

      console.log('🧭 Services tab pressed - clearing consultant context');
      hasHandledRouteParamsRef.current = false;
      setCurrentConsultantId(undefined);
      setCurrentConsultantName(undefined);
      setCurrentConsultantCategory(undefined);
    });

    return unsubscribe;
  }, [navigation]);


  // Auto-refresh services when screen comes into focus
  // This ensures that when accessing from bottom navigator (no params), we fetch all services
  useFocusEffect(
    useCallback(() => {
      const hasRouteConsultant = !!paramsConsultantId;

      console.log('🔄 Services screen focused - Route params:', route?.params);
      console.log('📋 Derived consultant ID from params:', paramsConsultantId);

      if (hasRouteConsultant) {
        console.log('📋 Handling consultant params from navigation');
        setCurrentConsultantId(paramsConsultantId);
        setCurrentConsultantName(paramsConsultantName);
        setCurrentConsultantCategory(paramsConsultantCategory);
        fetchServices(paramsConsultantId);

        hasHandledRouteParamsRef.current = true;

        // Clear params so they don't linger when accessing the tab directly later
        navigation.setParams({
          consultantId: undefined,
          consultantName: undefined,
          consultantCategory: undefined,
        });

        return;
      }

      if (hasHandledRouteParamsRef.current) {
        console.log('⏭️ Skipping reset after clearing handled params');
        hasHandledRouteParamsRef.current = false;
        return;
      }

      if (currentConsultantId) {
        console.log('📋 No consultant params but existing consultant state detected - refreshing consultant services');
        fetchServices(currentConsultantId);
        return;
      }

      console.log('📋 No consultant params present - showing all services');
      setCurrentConsultantId(undefined);
      setCurrentConsultantName(undefined);
      setCurrentConsultantCategory(undefined);
      setSearchQuery('');
      fetchServices(undefined);
    }, [
      fetchServices,
      navigation,
      currentConsultantId,
      paramsConsultantCategory,
      paramsConsultantId,
      paramsConsultantName,
    ])
  );

  // Fetch reviews for the consultant
  useEffect(() => {
    const fetchReviews = async () => {
      if (!consultantId) return;

      setLoadingReviews(true);
      try {
        console.log('⭐ Fetching reviews for consultant:', consultantId);
        const response = await ReviewService.getConsultantReviews(consultantId);
        console.log('✅ Reviews Response:', response);
        
        const reviewsData = response?.reviews || [];
        setReviews(reviewsData);
      } catch (error: any) {
        console.error('❌ Error fetching reviews:', error);
        if (error?.response?.status !== 404) {
          // Only log non-404 errors
          console.log('⚠️ Reviews API error:', error?.message);
        }
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [consultantId]);

  // Filter services based on search query
  const filteredServices = services.filter(service =>
    service.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader 
        title={consultantName ? `${consultantName}'s Services` : 'Consultancy Services'}
        onBackPress={() => navigation.goBack()} 
      />

      <ScrollView 
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <SearchBar 
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search services"
        />

        {loading ? (
          <Loader message="Loading services..." />
        ) : filteredServices.length > 0 ? (
          <View style={styles.servicesContainer}>
            <View style={styles.servicesGrid}>
              {filteredServices.map(item => {
                console.log('🖼️ Rendering service:', item.title);
                console.log('🖼️ Service imageUrl:', item.imageUrl);
                console.log('🖼️ Service image:', item.image);
                console.log('🖼️ Service imageUri:', item.imageUri);
                
                // Create proper imageUri with fallback
                let imageUri;
                if (item.imageUrl && item.imageUrl.trim() !== '') {
                  // Use the actual service image from database
                  imageUri = { uri: item.imageUrl };
                  console.log('✅ Using real service image:', item.imageUrl);
                } else {
                  // Use default placeholder
                  imageUri = require('../../../assets/image/services.png');
                  console.log('⚠️ No image URL, using default placeholder');
                }
                
                console.log('🖼️ Final imageUri:', imageUri);
                
                return (
                  <ServiceCard
                    key={item.id}
                    title={item.title}
                    description={item.description}
                    duration={item.duration || 60} // Default 60 minutes
                    imageUri={imageUri}
                    consultantName={!consultantId && item.consultant?.name ? item.consultant.name : undefined}
                    consultantCategory={!consultantId && item.consultant?.category ? item.consultant.category : undefined}
                  onBookPress={() => {
                    // Use consultant from route params or from service data
                    const targetConsultantId = consultantId || item.consultantId || item.consultant?.uid;
                    const targetConsultantName = consultantName || item.consultant?.name || 'Consultant';
                    const targetConsultantCategory = consultantCategory || item.consultant?.category || 'Consultation';
                    
                    // Validate we have a consultant
                    if (!targetConsultantId) {
                      Alert.alert(
                        'Consultant Not Available',
                        'This service does not have an associated consultant. Please try another service.',
                        [{ text: 'OK' }]
                      );
                      return;
                    }
                    
                    // Navigate to booking slots
                    navigation.navigate('BookingSlots', {
                      consultantId: targetConsultantId,
                      consultantName: targetConsultantName,
                      consultantCategory: targetConsultantCategory,
                      serviceId: item.id,
                      serviceTitle: item.title,
                      serviceImageUrl: item.imageUrl, // Pass service image URL
                      servicePrice: item.price || 100, // Default price if not provided
                      serviceDuration: item.duration || 60 // Default 60 minutes if not provided
                    });
                }}
              />
                );
              })}
            </View>
          </View>
        ) : searchQuery ? (
          <Text style={screenStyles.emptyStateText}>
            No services found matching "{searchQuery}"
          </Text>
        ) : (
          <Text style={screenStyles.emptyStateText}>
            {!consultantId 
              ? 'No services available at the moment.' 
              : 'No services available for this consultant'}
          </Text>
        )}

        {/* Reviews Section - Only show if viewing a specific consultant */}
        {consultantId && (
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <View style={styles.reviewsTitleRow}>
                <Star size={20} color={COLORS.yellow} fill={COLORS.yellow} />
                <Text style={styles.reviewsTitle}>
                  Reviews {reviews.length > 0 && `(${reviews.length})`}
                </Text>
              </View>
              {reviews.length > 0 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('AllReviews', {
                    consultantId,
                    consultantName,
                    reviews
                  })}
                >
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              )}
            </View>

            {loadingReviews ? (
              <Loader message="Loading reviews..." size="small" />
            ) : reviews.length > 0 ? (
              <>

                {reviews.slice(0, 3).map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
                {reviews.length > 3 && (
                  <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={() => navigation.navigate('AllReviews', {
                      consultantId,
                      consultantName,
                      reviews
                    })}
                  >
                    <Text style={styles.seeAllButtonText}>
                      View All {reviews.length} Reviews
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text style={styles.noReviewsText}>
                No reviews yet. Be the first to review {consultantName}!
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  servicesContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  servicesGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  reviewsSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  reviewsHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  reviewsTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.green,
    fontWeight: '600' as const,
  },
  noReviewsText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center' as const,
    paddingVertical: 20,
    fontStyle: 'italic' as const,
  },
  seeAllButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center' as const,
  },
  seeAllButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
};

export default Services;
