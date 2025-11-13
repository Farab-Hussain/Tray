import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import SearchBar from '../../../components/shared/SearchBar';
import ConsultantServiceCard from '../../../components/ui/ConsultantServiceCard';
import { ConsultantService } from '../../../services/consultant.service';
import { getConsultantVerificationStatus } from '../../../services/consultantFlow.service';
import { useAuth } from '../../../contexts/AuthContext';
import { COLORS } from '../../../constants/core/colors';

interface Service {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  imageUrl?: string;
  icon?: string;
  tags?: string[];
  rating?: number;
  isVerified?: boolean;
  availability?: {
    days: string[];
    startTime: string;
    endTime: string;
    timezone: string;
  };
  approvalStatus?: string;
  pendingUpdate?: any;
}

const ConsultantServices = ({ navigation }: any) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setConsultantUid] = useState<string | null>(null);

  // Fetch consultant services function
  const fetchConsultantServices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get consultant's profile to get their UID
      console.log('📡 Fetching consultant status...');
      const statusResponse = await getConsultantVerificationStatus();
      console.log(
        '📊 Status response:',
        JSON.stringify(statusResponse, null, 2),
      );

      if (!statusResponse.profile?.uid) {
        console.error('❌ No profile UID found in response');
        setError('Consultant profile not found. Please complete your profile.');
        setServices([]);
        setFilteredServices([]);
        return;
      }

      const uid = statusResponse.profile.uid;
      setConsultantUid(uid);
      console.log('✅ Got consultant UID:', uid);

      console.log('📡 Fetching services for consultant:', uid);
      const servicesResponse = await ConsultantService.getConsultantServices(
        uid,
      );
      console.log(
        '📊 Services response:',
        JSON.stringify(servicesResponse, null, 2),
      );

      const servicesData = servicesResponse?.services || servicesResponse || [];

      const enrichedServices = await Promise.all(
        servicesData.map(async (service: any) => {
          if (
            (!service.imageUrl || service.imageUrl.trim() === '') &&
            service.basedOnDefaultService
          ) {
            try {
              const defaultServiceResponse =
                await ConsultantService.getServiceById(
                  service.basedOnDefaultService,
                );
              const defaultService =
                defaultServiceResponse?.service || defaultServiceResponse;
              if (defaultService?.imageUrl) {
                console.log(
                  `🖼️ [ConsultantServices] Using fallback image for ${service.title} from default service ${service.basedOnDefaultService}`,
                );
                return {
                  ...service,
                  imageUrl: defaultService.imageUrl,
                };
              }
            } catch (fallbackError) {
              console.warn(
                `⚠️ [ConsultantServices] Unable to load fallback image for ${service.title}:`,
                fallbackError,
              );
            }
          }
          return service;
        }),
      );

      // Debug: Log service data to see imageUrl values
      console.log(
        '🔍 [ConsultantServices] Services data:',
        JSON.stringify(servicesData, null, 2),
      );
      servicesData.forEach((service: any, index: number) => {
        console.log(`🔍 [ConsultantServices] Service ${index + 1}:`, {
          title: service.title,
          imageUrl: service.imageUrl,
          hasImageUrl: !!service.imageUrl,
          imageUrlLength: service.imageUrl?.length || 0,
        });
      });

      const activeServices = enrichedServices.filter(service => {
        const status = service.approvalStatus
          ? service.approvalStatus.toLowerCase()
          : 'approved';
        return status !== 'withdrawn' && status !== 'deleted';
      });

      setServices(activeServices);
      setFilteredServices(activeServices);

      console.log(
        '✅ Loaded',
        enrichedServices.length,
        'services for consultant:',
        uid,
      );
    } catch (err: any) {
      console.error('❌ Error fetching consultant services:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error message:', err.message);
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to load services. Please try again.',
      );
      setServices([]);
      setFilteredServices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        console.log(
          '🔄 [ConsultantServices] Screen focused, refreshing services...',
        );
        fetchConsultantServices();
      }
    }, [user?.uid, fetchConsultantServices]),
  );

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredServices(services);
    } else {
      const filtered = services.filter(
        service =>
          service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredServices(filtered);
    }
  }, [searchQuery, services]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchConsultantServices();
    setIsRefreshing(false);
  };

  const handleSetAvailability = (service: Service) => {
    console.log('Set availability for service:', service.title, service.id);
    navigation.navigate('ConsultantAvailability', {
      serviceId: service.id,
      serviceTitle: service.title,
      serviceDuration: service.duration,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
        <ScreenHeader
          title="My Services"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={styles.loadingText}>Loading your services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
        <ScreenHeader
          title="My Services"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryButton} onPress={fetchConsultantServices}>
            Retry
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader
        title="My Services"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.green]}
            tintColor={COLORS.green}
          />
        }
      >
        {/* Header Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {services.length} Service{services.length !== 1 ? 's' : ''} in Your
            Catalog
          </Text>
        </View>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search your services"
        />

        {/* Add New Service Button */}
        <TouchableOpacity
          style={styles.addServiceButton}
          onPress={() => navigation.navigate('ConsultantApplications')}
        >
          <Text style={styles.addServiceButtonText}>+ Add New Service</Text>
        </TouchableOpacity>

        {/* Empty State */}
        {filteredServices.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No services found' : 'No services yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Apply for services or create your own to get started'}
            </Text>
          </View>
        )}

        {/* Services Grid (2 per row) */}
        {filteredServices.length > 0 && (
          <View style={screenStyles.consultantList}>
            {filteredServices.map(item => {
              const imageUri =
                item.imageUrl && item.imageUrl.trim() !== ''
                  ? { uri: item.imageUrl }
                  : undefined;
              console.log(`🔍 [ConsultantServices] Rendering ${item.title}:`, {
                imageUrl: item.imageUrl,
                imageUri: imageUri,
                hasImageUri: !!imageUri,
              });

              return (
                <View key={item.id} style={screenStyles.consultantCardWrapper}>
                  <ConsultantServiceCard
                    title={item.title}
                    description={item.description}
                    imageUri={imageUri}
                    duration={item.duration}
                    price={item.price}
                    rating={item.rating}
                    onSetAvailabilityPress={() => handleSetAvailability(item)}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.orange,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    fontSize: 16,
    color: COLORS.green,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    // paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  addServiceButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 14,
    // paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    shadowColor: COLORS.black,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  addServiceButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default ConsultantServices;
