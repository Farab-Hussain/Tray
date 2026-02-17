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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { Camera, Video } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import SearchBar from '../../../components/shared/SearchBar';
import ConsultantServiceCard from '../../../components/ui/ConsultantServiceCard';
import { ConsultantService } from '../../../services/consultant.service';
import { courseService, CourseInput } from '../../../services/course.service';
import UploadService from '../../../services/upload.service';
import { useFocusEffect } from '@react-navigation/native';
import { RefreshControl } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
// import ErrorDisplay from '../../../components/ui/ErrorDisplay';
// import LoadingState from '../../../components/ui/LoadingState';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [, setConsultantUid] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    shortDescription: string;
    category: string;
    subcategory?: string;
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
    subscriptionType: 'monthly' | 'yearly' | 'lifetime' | 'allMonthly' | 'allYearly';
    monthlyPrice: number;
    yearlyPrice: number;
    lifetimePrice: number;
    allCoursesMonthlyPrice: number;
    allCoursesYearlyPrice: number;
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
    allCoursesMonthlyPrice: 0,
    allCoursesYearlyPrice: 0,
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
            console.error('Image upload error:', uploadError);
            Alert.alert('Error', 'Failed to upload image. Please try again.');
          }
        }
      });
    } catch (pickError) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', pickError);
    }
  };

  const pickVideo = async () => {
    try {
      const options = {
        mediaType: 'video' as const,
        includeBase64: false,
      };

      launchImageLibrary(options, async (response) => {
        if (response.didCancel || response.errorMessage) {
          return;
        }

        if (response.assets && response.assets[0]) {
          try {
            // Show loading indicator
            Alert.alert('Uploading', 'Please wait while we upload your video. This may take a few minutes...');
            
            // Upload to Cloudinary
            const uploadResult = await UploadService.uploadServiceVideo(response.assets[0]);
            
            // Store Cloudinary URL
            setFormData(prev => ({ 
              ...prev, 
              videoUrl: uploadResult.videoUrl || '' 
            }));
            
            Alert.alert('Success', 'Video uploaded successfully!');
          } catch (uploadError) {
            console.error('Video upload error:', uploadError);
            Alert.alert('Error', 'Failed to upload video. Please try again.');
          }
        }
      });
    } catch (pickError) {
      Alert.alert('Error', 'Failed to pick video');
      console.error('Video picker error:', pickError);
    }
  };

  // Fetch consultant services function
  const fetchConsultantServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get consultant's profile to get their UID
            if (__DEV__) {
        console.log('📡 Fetching consultant status...')
      };
      
      // Get user from auth context instead of calling non-existent function
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      if (__DEV__) {
        console.log('📊 User authenticated:', user.uid)
      }

      // Fetch consultant services using the user's UID
      const servicesResponse = await ConsultantService.getConsultantServices(user.uid);
      
      if (__DEV__) {
        console.log('✅ Services response:', servicesResponse)
      }

      setServices(servicesResponse.services || []);
      setFilteredServices(servicesResponse.services || []);
      setConsultantUid(user.uid);
      
      if (__DEV__) {
        console.log('📊 Services set in state:', servicesResponse.services?.length || 0);
        console.log('📊 Services data:', servicesResponse.services);
        console.log('📊 Filtered services set:', servicesResponse.services?.length || 0);
      }
      
    } catch (fetchError) {
      console.error('❌ Error fetching consultant services:', fetchError);
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
      console.log('🔍 Search query:', query);
      console.log('🔍 Total services before filtering:', services.length);
    }
    
    if (!query.trim()) {
      setFilteredServices(services);
      if (__DEV__) {
        console.log('🔍 No search query, showing all services:', services.length);
      }
      return;
    }

    const filtered = services.filter((service: any) =>
      service.title?.toLowerCase().includes(query.toLowerCase()) ||
      service.description?.toLowerCase().includes(query.toLowerCase()) ||
      service.category?.toLowerCase().includes(query.toLowerCase())
    );
    
    if (__DEV__) {
      console.log('🔍 Services after filtering:', filtered.length);
      console.log('🔍 Filtered services:', filtered);
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
      console.log('🎨 Render - filteredServices.length:', filteredServices.length);
      console.log('🎨 Render - services.length:', services.length);
      console.log('🎨 Render - searchQuery:', searchQuery);
      console.log('🎨 Render - loading:', loading);
      console.log('🎨 Render - error:', error);
    }
  }, [filteredServices.length, services.length, searchQuery, loading, error]);

  // Focus effect to fetch services when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (__DEV__) {
        console.log('🔄 [ConsultantServices] Screen focused, refreshing services...');
      }
      fetchConsultantServices();
    }, [fetchConsultantServices])
  );

  // Form handlers
  const handleCreateCourse = async () => {
    try {
      // Validate form data
      if (!formData.title.trim() || !formData.description.trim()) {
        Alert.alert('Error', 'Title and description are required');
        return;
      }

      const courseData: CourseInput = {
        ...formData,
        instructorId: user?.uid || '',
        instructorName: user?.displayName || user?.email || 'Consultant',
        pricingOptions: {
          monthly: formData.subscriptionType === 'allMonthly' ? formData.allCoursesMonthlyPrice : formData.monthlyPrice,
          yearly: formData.subscriptionType === 'allYearly' ? formData.allCoursesYearlyPrice : formData.yearlyPrice,
          lifetime: formData.lifetimePrice,
        },
        language: 'English',
        currency: 'USD',
        slug: formData.title.toLowerCase().replace(/\s+/g, '-'),
        // Include new fields with correct names
        thumbnailUrl: formData.imageUrl,
        previewVideoUrl: formData.videoUrl,
        // Set base price based on subscription type
        price: formData.subscriptionType === 'allMonthly' ? formData.allCoursesMonthlyPrice : 
               formData.subscriptionType === 'allYearly' ? formData.allCoursesYearlyPrice :
               formData.monthlyPrice || 0,
        // Filter out undefined subcategory to prevent Firestore error
        ...(formData.subcategory && { subcategory: formData.subcategory }),
      };

      await courseService.createCourse(courseData);
      
      Alert.alert('Success', 'Service created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchConsultantServices();
    } catch (createError) {
      console.error('Error creating course:', createError);
      Alert.alert('Error', 'Failed to create service. Please try again.');
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
      difficultyScore: 0,
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
      allCoursesMonthlyPrice: 0,
      allCoursesYearlyPrice: 0,
    });
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
    <SafeAreaView style={screenStyles.container}>
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
          filteredServices.map((service: any) => (
            <TouchableOpacity
              key={service.id}
              onPress={() => navigation.navigate('ServiceDetails', { serviceId: service.id })}
            >
              <ConsultantServiceCard
                title={service.title}
                description={service.description}
                imageUri={service.imageUrl}
                duration={service.duration}
                price={service.price}
                rating={service.rating}
                onSetAvailabilityPress={() => navigation.navigate('ConsultantAvailability', { serviceId: service.id })}
              />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Add New Service Button */}
      <TouchableOpacity
        style={styles.addServiceButton}
        onPress={() => setShowCreateModal(true)}
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
            title="Create New Service" 
            showBackButton={true}
            onBackPress={() => setShowCreateModal(false)}
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
            </View>

            {/* Media Upload */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Media</Text>
              
              <Text style={styles.label}>Service Image</Text>
              <View style={styles.mediaContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 10 }]}
                  value={formData.imageUrl}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, imageUrl: text }))}
                  placeholder="Enter image URL or upload from device"
                />
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={pickImage}
                >
                  <Camera size={16} color={COLORS.white} style={styles.uploadIcon} />
                  <Text style={styles.uploadButtonText}>Upload</Text>
                </TouchableOpacity>
              </View>
              
              {formData.imageUrl && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewLabel}>Image Preview:</Text>
                  <Text style={styles.previewText} numberOfLines={1}>
                    {formData.imageUrl.length > 50 ? formData.imageUrl.substring(0, 50) + '...' : formData.imageUrl}
                  </Text>
                </View>
              )}
              
              <Text style={styles.label}>Course Video (Preview)</Text>
              <View style={styles.mediaContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 10 }]}
                  value={formData.videoUrl}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, videoUrl: text }))}
                  placeholder="Enter video URL or upload from device"
                />
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={pickVideo}
                >
                  <Video size={16} color={COLORS.white} style={styles.uploadIcon} />
                  <Text style={styles.uploadButtonText}>Upload</Text>
                </TouchableOpacity>
              </View>
              
              {formData.videoUrl && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewLabel}>Video Preview:</Text>
                  <Text style={styles.previewText} numberOfLines={1}>
                    {formData.videoUrl.length > 50 ? formData.videoUrl.substring(0, 50) + '...' : formData.videoUrl}
                  </Text>
                </View>
              )}
            </View>

            {/* Subscription Pricing */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Subscription Pricing</Text>
              
              <View style={styles.categoryContainer}>
                {[
                  { type: 'monthly', label: 'Monthly (Single Course)' },
                  { type: 'yearly', label: 'Yearly (Single Course)' },
                  { type: 'lifetime', label: 'Lifetime (Single Course)' },
                  { type: 'allMonthly', label: 'Monthly (All Courses)' },
                  { type: 'allYearly', label: 'Yearly (All Courses)' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.categoryOption,
                      formData.subscriptionType === option.type && styles.selectedCategory,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, subscriptionType: option.type as any }))}
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
                    monthlyPrice: value ? 0 : prev.monthlyPrice,
                    yearlyPrice: value ? 0 : prev.yearlyPrice,
                    lifetimePrice: value ? 0 : prev.lifetimePrice,
                    allCoursesMonthlyPrice: value ? 0 : prev.allCoursesMonthlyPrice,
                    allCoursesYearlyPrice: value ? 0 : prev.allCoursesYearlyPrice,
                  }))}
                />
              </View>
              
              {!formData.isFree && (
                <>
                  {(formData.subscriptionType === 'monthly' || formData.subscriptionType === 'allMonthly') && (
                    <>
                      <Text style={styles.label}>
                        {formData.subscriptionType === 'allMonthly' ? 'All Courses Monthly Price ($)' : 'Monthly Price ($)'}
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={
                          formData.subscriptionType === 'allMonthly' 
                            ? formData.allCoursesMonthlyPrice.toString()
                            : formData.monthlyPrice.toString()
                        }
                        onChangeText={(text) => setFormData(prev => ({ 
                          ...prev, 
                          ...(formData.subscriptionType === 'allMonthly' 
                            ? { allCoursesMonthlyPrice: parseFloat(text) || 0 }
                            : { monthlyPrice: parseFloat(text) || 0 }
                          )
                        }))}
                        placeholder="29.99"
                        keyboardType="numeric"
                      />
                    </>
                  )}
                  
                  {(formData.subscriptionType === 'yearly' || formData.subscriptionType === 'allYearly') && (
                    <>
                      <Text style={styles.label}>
                        {formData.subscriptionType === 'allYearly' ? 'All Courses Yearly Price ($)' : 'Yearly Price ($)'}
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={
                          formData.subscriptionType === 'allYearly' 
                            ? formData.allCoursesYearlyPrice.toString()
                            : formData.yearlyPrice.toString()
                        }
                        onChangeText={(text) => setFormData(prev => ({ 
                          ...prev, 
                          ...(formData.subscriptionType === 'allYearly' 
                            ? { allCoursesYearlyPrice: parseFloat(text) || 0 }
                            : { yearlyPrice: parseFloat(text) || 0 }
                          )
                        }))}
                        placeholder="299.99"
                        keyboardType="numeric"
                      />
                    </>
                  )}
                  
                  {formData.subscriptionType === 'lifetime' && (
                    <>
                      <Text style={styles.label}>Lifetime Price ($)</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.lifetimePrice.toString()}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, lifetimePrice: parseFloat(text) || 0 }))}
                        placeholder="999.99"
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
  mediaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  uploadIcon: {
    marginRight: 4,
  },
  previewContainer: {
    backgroundColor: COLORS.lightGray,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  previewLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 5,
    fontWeight: '600',
  },
  previewText: {
    fontSize: 11,
    color: COLORS.gray,
    fontStyle: 'italic',
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
