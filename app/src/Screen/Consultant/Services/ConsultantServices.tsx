import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { Camera } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import SearchBar from '../../../components/shared/SearchBar';
import ConsultantServiceCard from '../../../components/ui/ConsultantServiceCard';
import { serviceService } from '../../../services/service.service';
import UploadService from '../../../services/upload.service';
import { useFocusEffect } from '@react-navigation/native';
import { RefreshControl } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';
// import ErrorDisplay from '../../../components/ui/ErrorDisplay';
// import LoadingState from '../../../components/ui/LoadingState';

interface Service {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  consultantId?: string;
  category?: string;
  imageUrl?: string;
  icon?: string;
  tags?: string[];
  rating?: number;
  isVerified?: boolean;
  availability?: {
    days?: string[];
    startTime?: string;
    endTime?: string;
    timezone?: string;
  };
  approvalStatus?: string;
  pendingUpdate?: any;
}

const ConsultantServices = ({ navigation }: any) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [, setConsultantUid] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    shortDescription: string;
    category: string;
    price: number;
    isFree: boolean;
    duration: number;
    tags: string[];
    imageUrl: string;
    pricingModel: 'one_time' | 'package' | 'weekly' | 'monthly';
    sessionPrice: number;
    packageSessions: number;
    packagePrice: number;
    weeklyPrice: number;
    monthlyPrice: number;
  }>({
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    price: 0,
    isFree: false,
    duration: 60,
    tags: [''],
    imageUrl: '',
    pricingModel: 'one_time',
    sessionPrice: 0,
    packageSessions: 3,
    packagePrice: 0,
    weeklyPrice: 0,
    monthlyPrice: 0,
  });

  // const categories = ['Business', 'Technology', 'Design', 'Marketing', 'Personal Development', 'Health & Fitness'];
  // const levels = ['beginner', 'intermediate', 'advanced'];

  // Image picker functions
  const pickImage = async () => {
    try {
      const options = {
        mediaType: 'photo' as const,
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
      };

      launchImageLibrary(options, async (response) => {
        if (response.didCancel || response.errorMessage) {
          return;
        }

        if (response.assets && response.assets[0]) {
          try {
            // Show loading indicator
            Alert.alert('Uploading', 'Please wait while we upload your image...');
            
            // Upload to Cloudinary
            const uploadResult = await UploadService.uploadServiceImage(response.assets[0]);
            
            // Store Cloudinary URL
            setFormData(prev => ({ 
              ...prev, 
              imageUrl: uploadResult.imageUrl ? uploadResult.imageUrl.replace(/([^:])\/+/g, '$1/') : '' 
            }));
            
            Alert.alert('Success', 'Image uploaded successfully!');
          } catch (uploadError) {
            logger.error('Image upload error:', uploadError);
            Alert.alert('Error', 'Failed to upload image. Please try again.');
          }
        }
      });
    } catch (pickError) {
      Alert.alert('Error', 'Failed to pick image');
      logger.error('Image picker error:', pickError);
    }
  };

  // Fetch consultant services function
  const fetchConsultantServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get consultant's profile to get their UID
            if (__DEV__) {
        logger.debug('📡 Fetching consultant status...')
      };
      
      // Get user from auth context instead of calling non-existent function
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      if (__DEV__) {
        logger.debug('📊 User authenticated:', user.uid)
      }

      // Fetch consultant services using the user's UID
      const servicesResponse = await serviceService.getConsultantServices(user.uid);
      const normalizedServices = Array.isArray((servicesResponse as any)?.services)
        ? (servicesResponse as any).services
        : Array.isArray(servicesResponse as any)
        ? (servicesResponse as any)
        : [];
      
      if (__DEV__) {
        logger.debug('✅ Services response:', servicesResponse)
      }

      setServices(normalizedServices);
      setFilteredServices(normalizedServices);
      setConsultantUid(user.uid);
      
      if (__DEV__) {
        logger.debug('📊 Services set in state:', normalizedServices.length);
        logger.debug('📊 Services data:', normalizedServices);
        logger.debug('📊 Filtered services set:', normalizedServices.length);
      }
      
    } catch (fetchError) {
      logger.error('❌ Error fetching consultant services:', fetchError);
      setError((fetchError as Error).message || 'Failed to fetch services');
      setServices([]);
      setFilteredServices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Search/filter function
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (__DEV__) {
      logger.debug('🔍 Search query:', query);
      logger.debug('🔍 Total services before filtering:', services.length);
    }
    
    if (!query.trim()) {
      setFilteredServices(services);
      if (__DEV__) {
        logger.debug('🔍 No search query, showing all services:', services.length);
      }
      return;
    }

    const filtered = services.filter((service: any) =>
      service.title?.toLowerCase().includes(query.toLowerCase()) ||
      service.description?.toLowerCase().includes(query.toLowerCase()) ||
      service.category?.toLowerCase().includes(query.toLowerCase())
    );
    
    if (__DEV__) {
      logger.debug('🔍 Services after filtering:', filtered.length);
      logger.debug('🔍 Filtered services:', filtered);
    }
    
    setFilteredServices(filtered);
  }, [services]);

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConsultantServices();
  }, [fetchConsultantServices]);

  // Debug effect to track component state
  useEffect(() => {
    if (__DEV__) {
      logger.debug('🎨 Render - filteredServices.length:', filteredServices.length);
      logger.debug('🎨 Render - services.length:', services.length);
      logger.debug('🎨 Render - searchQuery:', searchQuery);
      logger.debug('🎨 Render - loading:', loading);
      logger.debug('🎨 Render - error:', error);
    }
  }, [filteredServices.length, services.length, searchQuery, loading, error]);

  // Focus effect to fetch services when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (__DEV__) {
        logger.debug('🔄 [ConsultantServices] Screen focused, refreshing services...');
      }
      fetchConsultantServices();
    }, [fetchConsultantServices])
  );

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      shortDescription: '',
      category: '',
      price: 0,
      isFree: false,
      duration: 60,
      tags: [''],
      imageUrl: '',
      pricingModel: 'one_time',
      sessionPrice: 0,
      packageSessions: 3,
      packagePrice: 0,
      weeklyPrice: 0,
      monthlyPrice: 0,
    });
  };

  const openCreateModal = () => {
    setEditingService(null);
    resetForm();
    setShowCreateModal(true);
  };

  const closeServiceModal = () => {
    setShowCreateModal(false);
    setEditingService(null);
    resetForm();
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    const paymentOptions: any = (service as any).paymentOptions || {};
    const normalizedType =
      paymentOptions?.type === 'package' ||
      paymentOptions?.type === 'weekly' ||
      paymentOptions?.type === 'monthly'
        ? paymentOptions.type
        : 'one_time';

    setFormData({
      title: service.title || '',
      description: service.description || '',
      shortDescription: (service as any).details || '',
      category: service.category || '',
      price: Number(service.price || 0),
      isFree: Number(service.price || 0) === 0,
      duration: Number(service.duration || 60),
      tags: Array.isArray(service.tags) && service.tags.length ? service.tags : [''],
      imageUrl: service.imageUrl || '',
      pricingModel: normalizedType,
      sessionPrice: Number(paymentOptions?.sessionPrice ?? service.price ?? 0),
      packageSessions: Number(paymentOptions?.packageSessions ?? 3),
      packagePrice: Number(paymentOptions?.packagePrice ?? 0),
      weeklyPrice: Number(paymentOptions?.weeklyPrice ?? 0),
      monthlyPrice: Number(paymentOptions?.monthlyPrice ?? 0),
    });
    setShowCreateModal(true);
  };

  const handleDeleteService = (service: Service) => {
    Alert.alert(
      'Delete Service',
      `Delete "${service.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await serviceService.deleteService(service.id);
              setServices(prev => prev.filter(item => item.id !== service.id));
              setFilteredServices(prev =>
                prev.filter(item => item.id !== service.id),
              );
              Alert.alert('Deleted', 'Service deleted successfully.');
            } catch (error) {
              logger.error('Delete service error:', error);
              Alert.alert('Error', 'Failed to delete service. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleReviewService = () => {
    navigation.navigate('ConsultantReviews');
  };

  // Form handlers
  const handleSaveService = async () => {
    try {
      // Validate form data
      if (!formData.title.trim() || !formData.description.trim()) {
        Alert.alert('Error', 'Title and description are required');
        return;
      }
      if (!formData.imageUrl) {
        Alert.alert('Error', 'Please upload a service thumbnail image from your device');
        return;
      }

      const selectedPrice = formData.isFree
        ? 0
        : formData.pricingModel === 'package'
        ? formData.packagePrice
        : formData.pricingModel === 'weekly'
        ? formData.weeklyPrice
        : formData.pricingModel === 'monthly'
        ? formData.monthlyPrice
        : formData.sessionPrice;

      const payload = {
        consultantId: user?.uid || '',
        title: formData.title.trim(),
        description: formData.description.trim(),
        details: formData.shortDescription?.trim(),
        duration: formData.duration || 60,
        price: selectedPrice || formData.price || 0,
        imageUrl: formData.imageUrl || '',
        category: formData.category || 'Business & Career',
        tags: formData.tags?.filter(Boolean) || [],
        paymentOptions: {
          type: formData.isFree ? 'one_time' : formData.pricingModel,
          sessionPrice: formData.sessionPrice || 0,
          packageSessions: formData.packageSessions || 0,
          packagePrice: formData.packagePrice || 0,
          weeklyPrice: formData.weeklyPrice || 0,
          monthlyPrice: formData.monthlyPrice || 0,
        },
      };

      if (editingService?.id) {
        await serviceService.updateService(editingService.id, payload);
        Alert.alert('Success', 'Service updated successfully!');
        closeServiceModal();
        await fetchConsultantServices();
        return;
      }

      const createResponse = await serviceService.createService(payload);

      const createdService: Service = createResponse?.service || {
        id: `local-${Date.now()}`,
        consultantId: user?.uid || '',
        title: formData.title.trim(),
        description: formData.description.trim(),
        duration: formData.duration || 60,
        price: selectedPrice || 0,
        imageUrl: formData.imageUrl || '',
        category: formData.category || 'Business & Career',
        tags: formData.tags?.filter(Boolean) || [],
        approvalStatus: 'approved',
      };

      setServices(prev => [createdService, ...prev]);
      setFilteredServices(prev => {
        if (!searchQuery.trim()) {
          return [createdService, ...prev];
        }
        const matchesSearch =
          createdService.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          createdService.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (createdService as any).category?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch ? [createdService, ...prev] : prev;
      });
      
      Alert.alert('Success', 'Service created successfully!');
      closeServiceModal();
      await fetchConsultantServices();
    } catch (createError) {
      logger.error('Error creating service:', createError);
      Alert.alert(
        'Error',
        editingService
          ? 'Failed to update service. Please try again.'
          : 'Failed to create service. Please try again.',
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading services...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchConsultantServices}>
          <Text style={styles.retryButton}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader title="My Services" showBackButton={false} />
      
      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={handleSearch}
        placeholder="Search services..."
        style={styles.searchBarContainer}
      />

      {/* Services List */}
      <ScrollView
        style={styles.servicesContainer}
        contentContainerStyle={styles.servicesContentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredServices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Services Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search terms' : 'Create your first service to get started'}
            </Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {filteredServices.map((service: any) => (
              <View key={service.id} style={styles.gridItem}>
                <ConsultantServiceCard
                  title={service.title}
                  description={service.description}
                  imageUri={service.imageUrl}
                  duration={service.duration}
                  price={service.price}
                  rating={service.rating}
                  onSetAvailabilityPress={() =>
                    navigation.navigate('ConsultantAvailability', {
                      serviceId: service.id,
                    })
                  }
                  onEditPress={() => openEditModal(service)}
                  onDeletePress={() => handleDeleteService(service)}
                  onReviewPress={handleReviewService}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add New Service Button */}
      <TouchableOpacity
        style={styles.addServiceButton}
        onPress={openCreateModal}
      >
        <Text style={styles.addServiceButtonText}>+ Add New Service</Text>
      </TouchableOpacity>

      {/* Create Service Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScreenHeader 
            title={editingService ? 'Edit Service' : 'Create New Service'} 
            showBackButton={true}
            onBackPress={closeServiceModal}
          />
          
          <ScrollView style={styles.modalContent}>
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <Text style={styles.label}>Service Title</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                placeholder="Enter service title"
              />
              
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Describe your service"
                multiline
              />

              <Text style={styles.label}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={String(formData.duration)}
                onChangeText={(text) => setFormData(prev => ({ ...prev, duration: parseInt(text, 10) || 60 }))}
                placeholder="60"
                keyboardType="numeric"
              />
            </View>

            {/* Media Upload */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Media</Text>
              
              <Text style={styles.label}>Service Thumbnail</Text>

              <View style={styles.imageUploadCard}>
                {formData.imageUrl ? (
                  <Image
                    source={{ uri: formData.imageUrl }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imageEmptyState}>
                    <Camera size={28} color={COLORS.gray} />
                    <Text style={styles.imageEmptyTitle}>No image selected</Text>
                    <Text style={styles.imageEmptySubtitle}>Upload a clear thumbnail for your service</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.uploadButtonLarge} onPress={pickImage}>
                <Camera size={16} color={COLORS.white} />
                <Text style={styles.uploadButtonTextLarge}>
                  {formData.imageUrl ? 'Change Image' : 'Upload Image'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Pricing Model */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pricing Model</Text>
              
              <View style={styles.categoryContainer}>
                {[
                  { type: 'one_time', label: 'One-time Session' },
                  { type: 'package', label: 'Session Package' },
                  { type: 'weekly', label: 'Weekly Plan' },
                  { type: 'monthly', label: 'Monthly Plan' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.categoryOption,
                      formData.pricingModel === option.type && styles.selectedCategory,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, pricingModel: option.type as any }))}
                  >
                    <Text style={styles.categoryText}>{option.label}</Text>
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
                    sessionPrice: value ? 0 : prev.sessionPrice,
                    packagePrice: value ? 0 : prev.packagePrice,
                    weeklyPrice: value ? 0 : prev.weeklyPrice,
                    monthlyPrice: value ? 0 : prev.monthlyPrice,
                  }))}
                />
              </View>
              
              {!formData.isFree && (
                <>
                  {formData.pricingModel === 'one_time' && (
                    <>
                      <Text style={styles.label}>Session Price ($)</Text>
                      <TextInput
                        style={styles.input}
                        value={String(formData.sessionPrice)}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, sessionPrice: parseFloat(text) || 0 }))}
                        placeholder="49.99"
                        keyboardType="numeric"
                      />
                    </>
                  )}

                  {formData.pricingModel === 'package' && (
                    <>
                      <Text style={styles.label}>Number of Sessions</Text>
                      <TextInput
                        style={styles.input}
                        value={String(formData.packageSessions)}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, packageSessions: parseInt(text, 10) || 3 }))}
                        placeholder="3"
                        keyboardType="numeric"
                      />
                      <Text style={styles.label}>Package Price ($)</Text>
                      <TextInput
                        style={styles.input}
                        value={String(formData.packagePrice)}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, packagePrice: parseFloat(text) || 0 }))}
                        placeholder="129.99"
                        keyboardType="numeric"
                      />
                    </>
                  )}

                  {formData.pricingModel === 'weekly' && (
                    <>
                      <Text style={styles.label}>Weekly Plan Price ($)</Text>
                      <TextInput
                        style={styles.input}
                        value={String(formData.weeklyPrice)}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, weeklyPrice: parseFloat(text) || 0 }))}
                        placeholder="99.99"
                        keyboardType="numeric"
                      />
                    </>
                  )}

                  {formData.pricingModel === 'monthly' && (
                    <>
                      <Text style={styles.label}>Monthly Plan Price ($)</Text>
                      <TextInput
                        style={styles.input}
                        value={String(formData.monthlyPrice)}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, monthlyPrice: parseFloat(text) || 0 }))}
                        placeholder="299.99"
                        keyboardType="numeric"
                      />
                    </>
                  )}
                </>
              )}
            </View>
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={closeServiceModal}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.createButton]}
              onPress={handleSaveService}
            >
              <Text style={styles.createButtonText}>
                {editingService ? 'Save Changes' : 'Create Service'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  searchBarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
  },
  servicesContainer: {
    flex: 1,
    backgroundColor: COLORS.lightBackground,
  },
  servicesContentContainer: {
    flexGrow: 1,
    paddingBottom: 120,
    paddingHorizontal: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    shadowColor: COLORS.black,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    marginHorizontal: 20,
  },
  addServiceButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalContent: {
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
  imageUploadCard: {
    borderWidth: 1,
    borderColor: '#D8DEE8',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 170,
  },
  imageEmptyState: {
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  imageEmptyTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },
  imageEmptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
  },
  uploadButtonLarge: {
    backgroundColor: COLORS.blue,
    paddingVertical: 13,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadButtonTextLarge: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
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
