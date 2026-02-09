import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Switch,
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
import ErrorDisplay from '../../../components/ui/ErrorDisplay';
import LoadingState from '../../../components/ui/LoadingState';
import { courseService, CourseInput } from '../../../services/course.service';

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
  
  // Course creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    shortDescription: string;
    category: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    price: number;
    isFree: boolean;
    duration: number;
    durationText: string;
    lessonsCount: number;
    objectives: string[];
    prerequisites: string[];
    targetAudience: string[];
    difficultyScore: number;
    timeCommitment: string;
    certificateAvailable: boolean;
    tags: string[];
    // New fields
    imageUrl: string;
    videoUrl: string;
    subscriptionType: 'monthly' | 'yearly' | 'lifetime';
    monthlyPrice: number;
    yearlyPrice: number;
    lifetimePrice: number;
  }>({
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    level: 'beginner',
    price: 0,
    isFree: false,
    duration: 0,
    durationText: '',
    lessonsCount: 0,
    objectives: [''],
    prerequisites: [''],
    targetAudience: [''],
    difficultyScore: 5,
    timeCommitment: '',
    certificateAvailable: true,
    tags: [''],
    // New fields
    imageUrl: '',
    videoUrl: '',
    subscriptionType: 'monthly',
    monthlyPrice: 0,
    yearlyPrice: 0,
    lifetimePrice: 0,
  });

  const categories = ['Business', 'Technology', 'Design', 'Marketing', 'Personal Development', 'Health & Fitness'];
  const levels = ['beginner', 'intermediate', 'advanced'];

  // Fetch consultant services function
  const fetchConsultantServices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get consultant's profile to get their UID
            if (__DEV__) {
        console.log('📡 Fetching consultant status...')
      };
      const statusResponse = await getConsultantVerificationStatus();
            if (__DEV__) {
        console.log(
        '📊 Status response:',
        JSON.stringify(statusResponse, null, 2),
      )
      };

      if (!statusResponse.profile?.uid) {
                if (__DEV__) {
          console.error('❌ No profile UID found in response')
        };
        setError('Consultant profile not found. Please complete your profile.');
        setServices([]);
        setFilteredServices([]);
        return;
      }

      const uid = statusResponse.profile.uid;
      setConsultantUid(uid);
            if (__DEV__) {
        console.log('✅ Got consultant UID:', uid)
      };

            if (__DEV__) {
        console.log('📡 Fetching services for consultant:', uid)
      };
      const servicesResponse = await ConsultantService.getConsultantServices(
        uid,
      );
            if (__DEV__) {
        console.log(
        '📊 Services response:',
        JSON.stringify(servicesResponse, null, 2),
      )
      };

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
                                if (__DEV__) {
                  console.log(
                  `🖼️ [ConsultantServices] Using fallback image for ${service.title} from default service ${service.basedOnDefaultService}`,
                )
                };
                return {
                  ...service,
                  imageUrl: defaultService.imageUrl,
                };
              }
            } catch (fallbackError) {
                            if (__DEV__) {
                console.warn(
                `⚠️ [ConsultantServices] Unable to load fallback image for ${service.title}:`,
                fallbackError,
              )
              };
            }
          }
          return service;
        }),
      );

      // Debug: Log service data to see imageUrl values
            if (__DEV__) {
        console.log(
        '🔍 [ConsultantServices] Services data:',
        JSON.stringify(servicesData, null, 2),
      )
      };
      servicesData.forEach((service: any, index: number) => {
                if (__DEV__) {
          console.log(`🔍 [ConsultantServices] Service ${index + 1}:`, {
          title: service.title,
          imageUrl: service.imageUrl,
          hasImageUrl: !!service.imageUrl,
          imageUrlLength: service.imageUrl?.length || 0,
        })
        };
      });

      const activeServices = enrichedServices.filter(service => {
        const status = service.approvalStatus
          ? service.approvalStatus.toLowerCase()
          : 'approved';
        return status !== 'withdrawn' && status !== 'deleted';
      });

      setServices(activeServices);
      setFilteredServices(activeServices);

            if (__DEV__) {
        console.log(
        '✅ Loaded',
        enrichedServices.length,
        'services for consultant:',
        uid,
      )
      };
    } catch (err: any) {
            if (__DEV__) {
        console.error('❌ Error fetching consultant services:', err)
      };
            if (__DEV__) {
        console.error('❌ Error response:', err.response?.data)
      };
            if (__DEV__) {
        console.error('❌ Error status:', err.response?.status)
      };
            if (__DEV__) {
        console.error('❌ Error message:', err.message)
      };
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
                if (__DEV__) {
          console.log(
          '🔄 [ConsultantServices] Screen focused, refreshing services...',
        )
        };
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
        if (__DEV__) {
      console.log('Set availability for service:', service.title, service.id)
    };
    navigation.navigate('ConsultantAvailability', {
      serviceId: service.id,
      serviceTitle: service.title,
      serviceDuration: service.duration,
    });
  };

  const handleCreateCourse = async () => {
    try {
      // Validate form data
      if (!formData.title.trim() || !formData.description.trim()) {
        Alert.alert('Error', 'Title and description are required');
        return;
      }

      const courseData: CourseInput = {
        ...formData,
        pricingOptions: {
          monthly: formData.monthlyPrice,
          yearly: formData.yearlyPrice,
          lifetime: formData.lifetimePrice,
        },
        language: 'English',
        currency: 'USD',
        slug: formData.title.toLowerCase().replace(/\s+/g, '-'),
        // Include new fields with correct names
        thumbnailUrl: formData.imageUrl,
        previewVideoUrl: formData.videoUrl,
        // Set base price to monthly price for compatibility
        price: formData.monthlyPrice || 0,
      };

      await courseService.createCourse(courseData);
      Alert.alert('Success', 'Service created successfully!');
      setShowCreateModal(false);
      resetForm();
      await fetchConsultantServices();
    } catch (createError) {
      console.error('Error creating service:', createError);
      Alert.alert('Error', 'Failed to create service');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      shortDescription: '',
      category: '',
      level: 'beginner',
      price: 0,
      isFree: false,
      duration: 0,
      durationText: '',
      lessonsCount: 0,
      objectives: [''],
      prerequisites: [''],
      targetAudience: [''],
      difficultyScore: 5,
      timeCommitment: '',
      certificateAvailable: true,
      tags: [''],
      // New fields
      imageUrl: '',
      videoUrl: '',
      subscriptionType: 'monthly',
      monthlyPrice: 0,
      yearlyPrice: 0,
      lifetimePrice: 0,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
        <ScreenHeader
          title="My Services"
          onBackPress={() => navigation.goBack()}
        />
        <LoadingState message="Loading your services..." />
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
        <ErrorDisplay
          error={error}
          onRetry={fetchConsultantServices}
          retryLabel="Retry"
        />
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
          onPress={() => setShowCreateModal(true)}
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
                            if (__DEV__) {
                console.log(`🔍 [ConsultantServices] Rendering ${item.title}:`, {
                imageUrl: item.imageUrl,
                imageUri: imageUri,
                hasImageUri: !!imageUri,
              })
              };

              return (
                <View key={item.id} style={screenStyles.consultantCardWrapper}>
                  <ConsultantServiceCard
                    title={item.title}
                    description={item.description}
                    imageUri={imageUri}
                    // VIDEO UPLOAD CODE - COMMENTED OUT: videoUrl={item.videoUrl}
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
      
      {/* Course Creation Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
          <ScreenHeader
            title="Create New Service"
            onBackPress={() => setShowCreateModal(false)}
          />
          
          <ScrollView style={styles.modalContainer}>
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text.trim() }))}
                placeholder="Enter service title"
                placeholderTextColor={COLORS.gray}
              />
              
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text.trim() }))}
                placeholder="Describe your service"
                placeholderTextColor={COLORS.gray}
                multiline
                numberOfLines={4}
              />
              
              <Text style={styles.label}>Short Description</Text>
              <TextInput
                style={styles.input}
                value={formData.shortDescription}
                onChangeText={(text) => setFormData(prev => ({ ...prev, shortDescription: text }))}
                placeholder="Brief description (optional)"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            {/* Media Upload */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Media</Text>
              
              <Text style={styles.label}>Service Image URL</Text>
              <TextInput
                style={styles.input}
                value={formData.imageUrl}
                onChangeText={(text) => setFormData(prev => ({ ...prev, imageUrl: text }))}
                placeholder="https://example.com/image.jpg"
                placeholderTextColor={COLORS.gray}
              />
              
              <Text style={styles.label}>Course Video URL (Preview)</Text>
              <TextInput
                style={styles.input}
                value={formData.videoUrl}
                onChangeText={(text) => setFormData(prev => ({ ...prev, videoUrl: text }))}
                placeholder="https://example.com/video.mp4"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            {/* Category and Level */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category & Level</Text>
              
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      formData.category === category && styles.selectedCategory,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, category }))}
                  >
                    <Text style={styles.categoryText}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.label}>Level</Text>
              <View style={styles.categoryContainer}>
                {levels.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.categoryOption,
                      formData.level === level && styles.selectedCategory,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, level: level as 'beginner' | 'intermediate' | 'advanced' }))}
                  >
                    <Text style={styles.categoryText}>{level}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Subscription Pricing */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Subscription Pricing</Text>
              
              <Text style={styles.label}>Access Type</Text>
              <View style={styles.categoryContainer}>
                {['monthly', 'yearly', 'lifetime'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.categoryOption,
                      formData.subscriptionType === type && styles.selectedCategory,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, subscriptionType: type as 'monthly' | 'yearly' | 'lifetime' }))}
                  >
                    <Text style={styles.categoryText}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.switchContainer}>
                <Text style={styles.label}>Free Service</Text>
                <Switch
                  value={formData.isFree}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    isFree: value, 
                    monthlyPrice: value ? 0 : prev.monthlyPrice,
                    yearlyPrice: value ? 0 : prev.yearlyPrice,
                    lifetimePrice: value ? 0 : prev.lifetimePrice
                  }))}
                />
              </View>
              
              {!formData.isFree && (
                <>
                  <Text style={styles.label}>Monthly Price ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.monthlyPrice.toString()}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, monthlyPrice: parseFloat(text) || 0 }))}
                    placeholder="29.99"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="numeric"
                  />
                  
                  <Text style={styles.label}>Yearly Price ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.yearlyPrice.toString()}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, yearlyPrice: parseFloat(text) || 0 }))}
                    placeholder="299.99"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="numeric"
                  />
                  
                  <Text style={styles.label}>Lifetime Price ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.lifetimePrice.toString()}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, lifetimePrice: parseFloat(text) || 0 }))}
                    placeholder="999.99"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="numeric"
                  />
                </>
              )}
            </View>

            {/* Duration */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Duration</Text>
              
              <Text style={styles.label}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={formData.duration.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, duration: parseInt(text, 10) || 0 }))}
                placeholder="60"
                placeholderTextColor={COLORS.gray}
                keyboardType="numeric"
              />
              
              <Text style={styles.label}>Duration Text</Text>
              <TextInput
                style={styles.input}
                value={formData.durationText}
                onChangeText={(text) => setFormData(prev => ({ ...prev, durationText: text }))}
                placeholder="e.g., 1 hour, 30 minutes"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.createButton]}
                onPress={handleCreateCourse}
              >
                <Text style={styles.createButtonText}>Create Service</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  section: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.black,
    backgroundColor: COLORS.white,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryOption: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategory: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.black,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.gray,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  createButton: {
    backgroundColor: COLORS.green,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default ConsultantServices;
