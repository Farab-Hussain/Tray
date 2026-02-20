import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, Plus, FileText, X } from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { COLORS } from '../../../constants/core/colors';
import { consultantApplicationsScreenStyles as styles } from '../../../constants/styles/consultantApplicationsScreenStyles';
import EmptyState from '../../../components/ui/EmptyState';
import ConsultantApplicationCard from '../../../components/ui/ConsultantApplicationCard';
import ConsultantServiceModal from '../../../components/ui/ConsultantServiceModal';
import FormInput from '../../../components/ui/FormInput';
import PriceInput from '../../../components/ui/PriceInput';
import ImageUpload from '../../../components/ui/ImageUpload';
import StatCard from '../../../components/ui/StatCard';
import {
  createConsultantApplication,
  getConsultantApplications,
  deleteConsultantApplication,
  updateConsultantApplication,
} from '../../../services/consultantFlow.service';
import { launchImageLibrary, MediaType, ImagePickerResponse } from 'react-native-image-picker';
import { api } from '../../../lib/fetcher';
import { ConsultantService } from '../../../services/consultant.service';
import axios from 'axios';
import { logger } from '../../../utils/logger';

interface PlatformServiceSummary {
  id: string;
  title: string;
}

type ConsultantApplicationWithTitle = ConsultantApplication & {
  existingServiceTitle?: string;
  linkedServiceId?: string;
  linkedService?: any;
};

export default function ConsultantApplicationsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, refreshConsultantStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<ConsultantApplicationWithTitle[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingApplication, setEditingApplication] = useState<ConsultantApplicationWithTitle | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingOriginalValues, setEditingOriginalValues] = useState<{
    title: string;
    description: string;
    price: number;
    imageUrl: string | null;
    accessType?: string;
    pricing?: any;
    category?: string;
  } | null>(null);
  const [isLoadingServiceDetails, setIsLoadingServiceDetails] = useState(false);
  const [loadingServiceId, setLoadingServiceId] = useState<string | null>(null);
  const [mutatingApplicationId, setMutatingApplicationId] = useState<string | null>(null);
const [currentServiceBookingsCount, setCurrentServiceBookingsCount] = useState<number | null>(null);

  const confirmAction = useCallback(
    (
      title: string,
      message: string,
      confirmLabel: string = 'Yes',
      cancelLabel: string = 'No',
    ): Promise<boolean> =>
      new Promise(resolve => {
        Alert.alert(title, message, [
          {
            text: cancelLabel,
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: confirmLabel,
            onPress: () => resolve(true),
          },
        ]);
      }),
    [],
  );

  // Form state
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('150');
  const [serviceImage, setServiceImage] = useState<string | null>(null);
  const [accessType, setAccessType] = useState<'one-time' | 'weekly' | 'monthly' | 'yearly' | 'lifetime'>('one-time');
  const [weeklyPrice, setWeeklyPrice] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [yearlyPrice, setYearlyPrice] = useState('');
  const [lifetimePrice, setLifetimePrice] = useState('');
  
  // Video Management State
  const [serviceVideos, setServiceVideos] = useState<Array<{
    id: string;
    uri: string;
    title: string;
    description: string;
    thumbnail?: string;
  }>>([]);
  
  // Service Structure State
  const [serviceCategory, setServiceCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [serviceCurriculum, setServiceCurriculum] = useState<Array<{
    id: string;
    title: string;
    description: string;
    order: number;
  }>>([]);
  
  // Available categories including custom ones
  const [availableCategories, setAvailableCategories] = useState([
    'Business & Career',
    'Technology & Programming',
    'Design & Creative',
    'Marketing & Sales',
    'Health & Wellness',
    'Education & Teaching',
    'Finance & Accounting',
    'Personal Development'
  ]);
  
  // Certificate Options
  const [certificateEnabled, setCertificateEnabled] = useState(false);
  const [certificateTemplate, setCertificateTemplate] = useState('standard');
  
  // VIDEO UPLOAD CODE - COMMENTED OUT
  // const [serviceVideo, setServiceVideo] = useState<string | null>(null);
  const [serviceImagePublicId, setServiceImagePublicId] = useState<string | null>(null);
  // const [serviceVideoPublicId, setServiceVideoPublicId] = useState<string | null>(null);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const fetchPlatformServices = useCallback(async (): Promise<PlatformServiceSummary[]> => {
    try {
      const servicesResponse = await api.get('/consultants/services/available');
      let services: PlatformServiceSummary[] = servicesResponse.data?.services || [];

      if (services.length > 0) {
        return services;
      }

      // Fallback to the current top consultant's services
      const topResponse = await ConsultantService.getTopConsultants();
      const topConsultants: Array<{ uid: string; name?: string; rating?: number }> =
        topResponse?.topConsultants || [];

      if (!topConsultants.length) {
        return [];
      }

      const selectedTopConsultant = topConsultants.reduce(
        (best, current) => {
          const bestRating = best?.rating ?? 0;
          const currentRating = current?.rating ?? 0;
          return currentRating > bestRating ? current : best;
        },
        topConsultants[0],
      );

      const consultantServicesResponse = await ConsultantService.getConsultantServices(
        selectedTopConsultant?.uid,
      );

      services = consultantServicesResponse?.services || [];
      return services;
    } catch (error) {
            if (__DEV__) {
        logger.error('Error fetching platform services:', error)
      };
      return [];
    }
  }, []);

  const loadApplications = useCallback(async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      // Load the applications
      const apps = await getConsultantApplications();
      const services = await fetchPlatformServices();
      const serviceMap = new Map<string, string>();
      services.forEach(service => {
        if (service?.id && service?.title) {
          serviceMap.set(service.id, service.title);
        }
      });

      let consultantServices: any[] = [];
      if (user?.uid) {
        try {
          const consultantServicesResponse = await ConsultantService.getConsultantServices(user.uid);
          consultantServices = consultantServicesResponse?.services || [];
        } catch (consultantServicesError) {
                    if (__DEV__) {
            logger.error('Error fetching consultant services for linkage:', consultantServicesError)
          };
        }
      }

      const serviceByApplication = new Map<string, any>();
      consultantServices.forEach(service => {
        if (service?.fromApplication) {
          serviceByApplication.set(service.fromApplication, service);
        }
        if (service?.id) {
          serviceByApplication.set(service.id, service);
        }
      });

      const enrichedApps: ConsultantApplicationWithTitle[] = apps.map(app => {
        const linkedService =
          serviceByApplication.get(app.id) ||
          (app.serviceId ? serviceByApplication.get(app.serviceId) : undefined);
        return {
          ...app,
          existingServiceTitle:
            app.type === 'existing' && app.serviceId ? serviceMap.get(app.serviceId) : undefined,
          linkedServiceId: linkedService?.id || app.serviceId,
          linkedService,
        };
      });

      setApplications(enrichedApps);
    } catch (error) {
            if (__DEV__) {
        logger.error('Error loading applications:', error)
      };
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, fetchPlatformServices]);

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user, loadApplications]);

  useEffect(() => {
    const params = route.params as any;
    if (params?.openCreateModal) {
            if (__DEV__) {
        logger.debug('ConsultantApplicationsScreen - Auto-opening create modal from route params')
      };
      setIsEditing(false);
      setShowModal(true);
      navigation.setParams({ openCreateModal: undefined } as never);
    }
  }, [route.params, navigation]);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!serviceTitle.trim()) {
      errors.serviceTitle = 'Service title is required';
    }
    if (serviceDescription.trim().length < 20) {
      errors.serviceDescription = 'Description must be at least 20 characters';
    }
    
    // Validate based on access type
    if (accessType === 'one-time') {
      if (parseFloat(servicePrice) <= 0) {
        errors.servicePrice = 'Please enter a valid price';
      }
    } else {
      // Validate subscription pricing
      if (accessType === 'weekly' && parseFloat(weeklyPrice) <= 0) {
        errors.weeklyPrice = 'Please enter a valid weekly price';
      }
      if (accessType === 'monthly' && parseFloat(monthlyPrice) <= 0) {
        errors.monthlyPrice = 'Please enter a valid monthly price';
      }
      if (accessType === 'yearly' && parseFloat(yearlyPrice) <= 0) {
        errors.yearlyPrice = 'Please enter a valid yearly price';
      }
      if (accessType === 'lifetime' && parseFloat(lifetimePrice) <= 0) {
        errors.lifetimePrice = 'Please enter a valid lifetime price';
      }
    }
    
    // VIDEO UPLOAD CODE - COMMENTED OUT
    // // Require either an image or a video (not both, but at least one)
    // if (!serviceImage && !serviceVideo) {
    //   errors.serviceImage = 'Service image or video is required';
    // }
    // Require an image
    if (!serviceImage) {
      errors.serviceImage = 'Service image is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (fieldName: string) => {
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setValidationErrors({});
    setIsEditing(false);
    setEditingApplication(null);
    setEditingServiceId(null);
    setEditingOriginalValues(null);
  setCurrentServiceBookingsCount(null);
    setIsLoadingServiceDetails(false);
    setLoadingServiceId(null);
    setMutatingApplicationId(null);
    setIsLoadingServiceDetails(false);
  setCurrentServiceBookingsCount(null);
    // Reset form
    setServiceTitle('');
    setServiceDescription('');
    setServicePrice('150');
    setServiceImage(null);
    setServiceImagePublicId(null);
  };

  const handleSubmitApplication = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    
    // Validate form and show errors immediately
    if (!validateForm()) {
      Alert.alert('', 'Please fix the errors before submitting');
      return;
    }

    const parsedPrice = parseFloat(servicePrice);

    // Build pricing object based on access type
    const pricing = accessType === 'one-time' 
      ? { price: parsedPrice }
      : {
          weekly: parseFloat(weeklyPrice) || 0,
          monthly: parseFloat(monthlyPrice) || 0,
          yearly: parseFloat(yearlyPrice) || 0,
          lifetime: parseFloat(lifetimePrice) || 0,
        };

  const requiresBookingWarning =
    isEditing &&
    editingApplication &&
    editingApplication.status === 'approved' &&
    editingOriginalValues &&
    parsedPrice !== editingOriginalValues.price &&
    (currentServiceBookingsCount ?? 0) > 0;

  if (requiresBookingWarning) {
    const proceed = await confirmAction(
      'Active Bookings Detected',
      `This service currently has ${currentServiceBookingsCount} active booking${
        (currentServiceBookingsCount ?? 0) === 1 ? '' : 's'
      }. Updating the price or duration will only apply to future bookings. Do you want to continue?`,
      'Continue',
      'Cancel',
    );

    if (!proceed) {
      return;
    }
  }

    setIsSubmitting(true);
    if (isEditing && editingApplication) {
      setMutatingApplicationId(editingApplication.id);
    }
    try {
      if (isEditing && editingApplication) {
        // Prevent editing pending applications - only approved services can be edited
        if (editingApplication.status === 'pending') {
          Alert.alert(
            'Cannot Edit Pending Application',
            'You can only edit services that have been approved. Please wait for admin approval before making changes.',
          );
          return;
        }

        const targetServiceId =
          editingServiceId || editingApplication.linkedServiceId || editingApplication.serviceId || null;

        const payload: {
          consultantId: string;
          type?: 'new' | 'existing' | 'update';
          serviceId?: string;
          customService: {
            title: string;
            description: string;
            price: number;
            imageUrl?: string;
            imagePublicId?: string;
            category?: string;
            accessType: 'one-time' | 'weekly' | 'monthly' | 'yearly' | 'lifetime';
            pricing?: {
              weekly?: number;
              monthly?: number;
              yearly?: number;
              lifetime?: number;
            };
          };
        } = {
          consultantId: user?.uid || '',
          customService: {
            title: serviceTitle,
            description: serviceDescription,
            price: parsedPrice,
            imageUrl: serviceImage ?? undefined,
            imagePublicId: serviceImagePublicId ?? undefined,
            category: serviceCategory || undefined,
            accessType,
            pricing: accessType !== 'one-time' ? pricing : undefined,
          },
        };

        if (editingApplication.status === 'approved') {
          if (!targetServiceId) {
            Alert.alert('Service Not Found', 'Unable to locate the approved service for this application.');
            return;
          }
          payload.type = 'update';
          payload.serviceId = targetServiceId;
        } else {
          payload.type = editingApplication.type;
          if (targetServiceId) {
            payload.serviceId = targetServiceId;
          }
        }

        setMutatingApplicationId(editingApplication.id);
        await updateConsultantApplication(editingApplication.id, payload);

        const successMessage =
          editingApplication.status === 'approved'
            ? 'Your update has been submitted to the admin for approval. This service will remain pending until it is reviewed.'
            : 'Application updated successfully and remains pending review.';

        Alert.alert('Submitted for Approval', successMessage);
        handleCloseModal();
        await loadApplications();
        return;
      } else {
        await createConsultantApplication({
          consultantId: user.uid,
          type: 'new',
          customService: {
            title: serviceTitle,
            description: serviceDescription,
            price: parsedPrice,
            imageUrl: serviceImage ?? undefined,
            imagePublicId: serviceImagePublicId ?? undefined,
            category: serviceCategory || undefined,
            accessType,
            pricing: accessType !== 'one-time' ? pricing : undefined,
          },
        });

        Alert.alert(
          'Success',
          'Application submitted! It will be reviewed by admin.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await refreshConsultantStatus();

                try {
                  const applications = await getConsultantApplications();
                  const approvedServices = applications.filter(app => app.status === 'approved');

                  if (approvedServices.length > 0) {
                    navigation.goBack();
                  } else {
                    navigation.navigate('PendingApproval' as never);
                  }
                } catch (error) {
                                    if (__DEV__) {
                    logger.error('Error checking approved services:', error)
                  };
                  navigation.navigate('PendingApproval' as never);
                }
              },
            },
          ],
        );
        setShowModal(false);
        resetForm();
        await loadApplications();
      }
    } catch (error: any) {
            if (__DEV__) {
        logger.error('Error submitting application:', error)
      };
      Alert.alert('Error', error.response?.data?.error || 'Failed to process request');
    } finally {
      setIsSubmitting(false);
      setMutatingApplicationId(null);
    }
  };

  const handleDeleteApplication = async (app: ConsultantApplicationWithTitle) => {
    if (app.status === 'approved') {
      if (!app.linkedServiceId) {
        Alert.alert('Service Not Found', 'Unable to locate the approved service for this application.');
        return;
      }

      let bookingsCount = 0;
      try {
        const bookingsResponse = await ConsultantService.getServiceBookings(app.linkedServiceId);
        bookingsCount = bookingsResponse?.count ?? bookingsResponse?.bookings?.length ?? 0;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          bookingsCount = 0;
        } else {
                    if (__DEV__) {
            logger.error('Error fetching bookings before deletion:', error)
          };
        }
      }

      const proceed = await confirmAction(
        'Delete Approved Service',
        bookingsCount > 0
          ? `This service has ${bookingsCount} active booking${bookingsCount > 1 ? 's' : ''}. Deleting will cancel and refund those bookings automatically. Continue?`
          : 'Deleting this service will remove it from your catalog. Continue?',
        'Delete & Refund',
        'Cancel',
      );

      if (!proceed) {
        return;
      }

      try {
        setMutatingApplicationId(app.id);
        setIsSubmitting(true);
        await ConsultantService.deleteService(app.linkedServiceId, { cancelBookings: true });
        Alert.alert('Service Deleted', 'The service and its bookings have been handled successfully.');
        await loadApplications();
      } catch (error: any) {
                if (__DEV__) {
          logger.error('Error deleting approved service:', error)
        };
        Alert.alert(
          'Deletion Failed',
          error?.response?.data?.error || 'Unable to delete service. Please try again.',
        );
      } finally {
        setIsSubmitting(false);
        setMutatingApplicationId(null);
      }
      return;
    }

    const confirmed = await confirmAction(
      'Delete Application',
      'Are you sure you want to delete this application?',
      'Delete',
      'Cancel',
    );

    if (!confirmed) {
      return;
    }

    try {
      setMutatingApplicationId(app.id);
      setIsSubmitting(true);
      await deleteConsultantApplication(app.id);
      Alert.alert('Success', 'Application deleted');
      await loadApplications();
    } catch (error: any) {
            if (__DEV__) {
        logger.error('Error deleting application:', error)
      };
      Alert.alert('Error', 'Failed to delete application');
    } finally {
      setIsSubmitting(false);
      setMutatingApplicationId(null);
    }
  };

  const handleEditApplication = useCallback(
    async (app: ConsultantApplicationWithTitle) => {
      if (!user?.uid) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      if (app.type === 'existing') {
        Alert.alert('Unsupported', 'Editing platform service applications is not supported yet.');
        return;
      }

      setLoadingServiceId(app.id);
      setIsLoadingServiceDetails(true);
      setValidationErrors({});

      // Only allow editing approved services
      if (app.status === 'pending') {
        Alert.alert(
          'Cannot Edit Pending Application',
          'You can only edit services that have been approved. Please wait for admin approval before making changes.',
        );
        return;
      }

      try {
        if (app.status === 'approved') {
          let linkedService = app.linkedService;

        if (!linkedService && app.linkedServiceId) {
          try {
            const serviceResponse = await ConsultantService.getServiceById(app.linkedServiceId);
            linkedService = serviceResponse?.service;
          } catch (serviceError) {
            if (!(axios.isAxiosError(serviceError) && serviceError.response?.status === 404)) {
                            if (__DEV__) {
                logger.error('Error fetching linked service by ID:', serviceError)
              };
            }
          }
        }

        if (!linkedService) {
          try {
            const consultantServicesResponse = await ConsultantService.getConsultantServices(user.uid);
            const matching = consultantServicesResponse?.services?.find((service: any) => {
              if (service.fromApplication && service.fromApplication === app.id) {
                return true;
              }
              if (app.linkedServiceId && service.id === app.linkedServiceId) {
                return true;
              }
              if (app.customService?.title && service.title === app.customService.title) {
                return true;
              }
              return false;
            });
            if (matching) {
              linkedService = matching;
              app.linkedServiceId = matching.id;
              app.linkedService = matching;
            }
          } catch (consultantFetchError) {
                        if (__DEV__) {
              logger.error('Error fetching consultant services while editing:', consultantFetchError)
            };
          }
        }

        if (!linkedService) {
          Alert.alert(
            'Service Not Found',
            'Unable to locate the service associated with this application. Please try again or contact support.',
          );
          return;
        }

          setServiceTitle(linkedService.title || '');
          setServiceDescription(linkedService.description || '');
          setServiceImage(linkedService.imageUrl || null);
          setServiceImagePublicId(linkedService.imagePublicId || null);
          
          // Set access type and pricing based on service data
          if (linkedService.accessType) {
            setAccessType(linkedService.accessType);
            
            // Set pricing based on access type
            if (linkedService.accessType === 'one-time') {
              setServicePrice(String(linkedService.price || 0));
            } else if (linkedService.pricing) {
              setWeeklyPrice(String(linkedService.pricing.weekly || 0));
              setMonthlyPrice(String(linkedService.pricing.monthly || 0));
              setYearlyPrice(String(linkedService.pricing.yearly || 0));
              setLifetimePrice(String(linkedService.pricing.lifetime || 0));
            }
          } else {
            // Fallback for old services without accessType
            setAccessType('one-time');
            setServicePrice(String(linkedService.price || 0));
          }
          
          // Set category if available
          if (linkedService.category) {
            setServiceCategory(linkedService.category);
          }

          setEditingApplication(app);
          setEditingServiceId(linkedService.id);
          setEditingOriginalValues({
            title: linkedService.title || '',
            description: linkedService.description || '',
            price: linkedService.price || 0,
            imageUrl: linkedService.imageUrl || null,
            accessType: linkedService.accessType || undefined,
            pricing: linkedService.pricing || undefined,
            category: linkedService.category || undefined,
          });
          try {
            const bookingsResponse = await ConsultantService.getServiceBookings(linkedService.id);
            const bookingsCount =
              bookingsResponse?.count ?? bookingsResponse?.bookings?.length ?? 0;
            setCurrentServiceBookingsCount(bookingsCount);
          } catch (bookingsError) {
            if (!(axios.isAxiosError(bookingsError) && bookingsError.response?.status === 404)) {
                            if (__DEV__) {
                logger.error('Error fetching service bookings for edit warning:', bookingsError)
              };
            }
            setCurrentServiceBookingsCount(0);
          }

          setIsEditing(true);
          setShowModal(true);
        }
      } finally {
        setIsLoadingServiceDetails(false);
        setLoadingServiceId(null);
      }
    },
    [user?.uid, confirmAction],
  );

  const resetForm = () => {
    setServiceTitle('');
    setServiceDescription('');
    setServicePrice('150');
    setServiceImage(null);
    setServiceImagePublicId(null);
    setAccessType('one-time');
    setWeeklyPrice('');
    setMonthlyPrice('');
    setYearlyPrice('');
    setLifetimePrice('');
    setServiceCategory('');
    setCustomCategory('');
    setShowCustomCategoryInput(false);
    setIsEditing(false);
    setEditingApplication(null);
    setEditingServiceId(null);
    setEditingOriginalValues(null);
    setIsLoadingServiceDetails(false);
    setLoadingServiceId(null);
    setMutatingApplicationId(null);
  };

  const handleAddVideo = () => {
    const options = {
      mediaType: 'video' as MediaType,
      videoQuality: 'medium' as any,
      durationLimit: 300, // 5 minutes max
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const video = response.assets[0];
        
        // Create a simple modal for video details
        Alert.prompt(
          'Video Details',
          'Enter a title for your video:',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Add Video',
              onPress: (title: string) => {
                if (title && title.trim()) {
                  const newVideo = {
                    id: Date.now().toString(),
                    uri: video.uri || '',
                    title: title.trim(),
                    description: '', // Optional: can add description later
                    thumbnail: (video as any).thumbnail || undefined,
                  };
                  
                  setServiceVideos(prev => [...prev, newVideo]);
                }
              },
            },
          ],
          'plain-text',
          undefined
        );
      }
    });
  };

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <ChevronLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Applications</Text>
        <TouchableOpacity 
          onPress={() => setShowModal(true)} 
          style={styles.headerButton}
        >
          <Plus size={24} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        {[
          { value: pendingCount, label: 'Pending', variant: 'pending' as const },
          { value: approvedCount, label: 'Approved', variant: 'approved' as const },
          { value: rejectedCount, label: 'Rejected', variant: 'rejected' as const },
        ].map((statConfig, index) => (
          <StatCard
            key={index}
            value={statConfig.value}
            label={statConfig.label}
            variant={statConfig.variant}
          />
        ))}
      </View>

      {/* Applications List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {applications.length === 0 ? (
          <EmptyState
            icon={FileText}
            iconSize={48}
            iconColor={COLORS.lightGray}
            title="No Applications Yet"
            description="Browse and apply from existing platform services"
            actionLabel="Apply from Existing Services"
            onAction={() => navigation.navigate('BrowseServices' as never)}
            actionIcon={Plus}
          />
        ) : (
          <View style={styles.applicationsList}>
            {applications.map((app) => (
              <ConsultantApplicationCard
                key={app.id}
                application={app}
                onEdit={handleEditApplication}
                onDelete={handleDeleteApplication}
                isLoadingServiceDetails={isLoadingServiceDetails}
                loadingServiceId={loadingServiceId}
                isSubmitting={isSubmitting}
                mutatingApplicationId={mutatingApplicationId}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Service Creation Screen */}
      {showModal && (
        <View style={styles.fullScreenOverlay}>
          <SafeAreaView style={styles.fullScreenContainer}>
            {/* Header */}
            <View style={styles.fullScreenHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleCloseModal}
              >
                <ChevronLeft size={24} color={COLORS.black} />
              </TouchableOpacity>
              <Text style={styles.fullScreenTitle}>
                {isEditing ? 'Edit Service' : 'Create New Service'}
              </Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Form Content */}
            <ScrollView 
              style={styles.fullScreenContent}
              showsVerticalScrollIndicator={false}
            >
              <FormInput
                label="Service Title"
                value={serviceTitle}
                onChangeText={(text) => {
                  setServiceTitle(text);
                  clearFieldError('serviceTitle');
                }}
                placeholder="e.g., Career Mentorship Session"
                error={validationErrors.serviceTitle}
                required
              />

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Service Media *</Text>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  Upload an image to showcase your service
                </Text>
                <ImageUpload
                  currentImageUrl={serviceImage}
                  currentPublicId={serviceImagePublicId}
                  onImageUploaded={(imageUrl, publicId) => {
                    setServiceImage(imageUrl);
                    setServiceImagePublicId(publicId);
                  }}
                  onImageDeleted={() => {
                    setServiceImage(null);
                    setServiceImagePublicId(null);
                  }}
                  uploadType="service"
                  placeholder="Upload Service Image"
                />
              </View>

        {/* Service Category */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Service Category *</Text>
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
            Choose the best category for your service
          </Text>
          
          <View style={styles.categoryContainer}>
            {availableCategories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  serviceCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setServiceCategory(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  serviceCategory === category && styles.categoryButtonTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.addCategoryButton}
              onPress={() => setShowCustomCategoryInput(true)}
            >
              <Plus size={16} color={COLORS.green} />
            </TouchableOpacity>
          </View>
          
          {/* Custom Category Input */}
          {showCustomCategoryInput && (
            <View style={styles.customCategoryInputContainer}>
              <FormInput
                label="Custom Category"
                value={customCategory}
                onChangeText={setCustomCategory}
                placeholder="Enter your custom category"
                style={styles.customCategoryInput}
              />
              <View style={styles.customCategoryButtons}>
                <TouchableOpacity
                  style={[styles.customCategoryButton, styles.customCategoryCancelButton]}
                  onPress={() => {
                    setShowCustomCategoryInput(false);
                    setCustomCategory('');
                  }}
                >
                  <Text style={styles.customCategoryCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.customCategoryButton, styles.customCategoryAddButton]}
                  onPress={() => {
                    if (customCategory.trim()) {
                      const newCategory = customCategory.trim();
                      if (!availableCategories.includes(newCategory)) {
                        setAvailableCategories(prev => [...prev, newCategory]);
                        setServiceCategory(newCategory);
                        setShowCustomCategoryInput(false);
                        setCustomCategory('');
                      }
                    }
                  }}
                >
                  <Text style={styles.customCategoryAddText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Video Management */}
        <View style={styles.inputContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Service Videos</Text>
            <TouchableOpacity
              style={styles.addVideoButton}
              onPress={handleAddVideo}
            >
              <Plus size={16} color={COLORS.green} />
              <Text style={styles.addVideoButtonText}>Add Video</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
            Add multiple videos to showcase your service (optional)
          </Text>
          
          {serviceVideos.length > 0 && (
            <View style={styles.videosList}>
              {serviceVideos.map((video, index) => (
                <View key={video.id} style={styles.videoItem}>
                  <View style={styles.videoThumbnail}>
                    {video.thumbnail ? (
                      <Image source={{ uri: video.thumbnail }} style={styles.thumbnailImage} />
                    ) : (
                      <View style={styles.placeholderThumbnail}>
                        <Text style={styles.placeholderText}>📹</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle}>{video.title}</Text>
                    <Text style={styles.videoDescription} numberOfLines={2}>
                      {video.description}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeVideoButton}
                    onPress={() => {
                      setServiceVideos(prev => prev.filter(v => v.id !== video.id));
                    }}
                  >
                    <X size={16} color={COLORS.red} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <FormInput
          label="Description (min 20 chars)"
          value={serviceDescription}
          onChangeText={(text) => {
            setServiceDescription(text);
            clearFieldError('serviceDescription');
          }}
          placeholder="Describe your service in detail..."
          multiline
          numberOfLines={4}
          error={validationErrors.serviceDescription}
          required
        />

        {/* Access Type Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Access Type *</Text>
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
            Choose how clients can access your service
          </Text>
          <View style={styles.accessTypeContainer}>
            {[
              { key: 'one-time', label: 'One-time', description: 'Single session' },
              { key: 'weekly', label: 'Weekly', description: 'Access for 1 week' },
              { key: 'monthly', label: 'Monthly', description: 'Access for 1 month' },
              { key: 'yearly', label: 'Yearly', description: 'Access for 1 year' },
              { key: 'lifetime', label: 'Lifetime', description: 'Forever access' }
            ].map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.accessTypeButton,
                  accessType === type.key && styles.accessTypeButtonActive
                ]}
                onPress={() => setAccessType(type.key as any)}
              >
                <Text style={[
                  styles.accessTypeLabel,
                  accessType === type.key && styles.accessTypeLabelActive
                ]}>
                  {type.label}
                </Text>
                <Text style={styles.accessTypeDescription}>
                  {type.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Curriculum/Outline Section */}
        <View style={styles.inputContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Service Curriculum</Text>
            <TouchableOpacity
              style={styles.addVideoButton}
              onPress={() => {
                const newItem = {
                  id: Date.now().toString(),
                  title: '',
                  description: '',
                  order: serviceCurriculum.length
                };
                setServiceCurriculum(prev => [...prev, newItem]);
              }}
            >
              <Plus size={16} color={COLORS.green} />
              <Text style={styles.addVideoButtonText}>Add Module</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
            Create a structured outline for your service (optional)
          </Text>
          
          {serviceCurriculum.length > 0 && (
            <View style={styles.videosList}>
              {serviceCurriculum.map((item, index) => (
                <View key={item.id} style={styles.videoItem}>
                  <View style={styles.videoInfo}>
                    <FormInput
                      label={`Module ${index + 1} Title`}
                      value={item.title}
                      onChangeText={(text) => {
                        setServiceCurriculum(prev => 
                          prev.map(i => i.id === item.id ? { ...i, title: text } : i)
                        );
                      }}
                      placeholder={`Module ${index + 1} title`}
                      style={styles.curriculumInput}
                    />
                    <FormInput
                      label="Description"
                      value={item.description}
                      onChangeText={(text) => {
                        setServiceCurriculum(prev => 
                          prev.map(i => i.id === item.id ? { ...i, description: text } : i)
                        );
                      }}
                      placeholder="Module description"
                      multiline
                      numberOfLines={2}
                      style={styles.curriculumInput}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.removeVideoButton}
                    onPress={() => {
                      setServiceCurriculum(prev => prev.filter(i => i.id !== item.id));
                    }}
                  >
                    <X size={16} color={COLORS.red} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Certificate Options */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Certificate Options</Text>
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
            Offer certificates to students who complete your service
          </Text>
          
          <TouchableOpacity
            style={styles.certificateOption}
            onPress={() => setCertificateEnabled(!certificateEnabled)}
          >
            <View style={[
              styles.checkbox,
              certificateEnabled && styles.checkboxChecked
            ]}>
              {certificateEnabled && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.certificateText}>
              Enable certificate of completion
            </Text>
          </TouchableOpacity>
          
          {certificateEnabled && (
            <View style={styles.certificateTemplates}>
              <Text style={styles.label}>Certificate Template</Text>
              <View style={styles.templateContainer}>
                {[
                  { id: 'standard', name: 'Standard' },
                  { id: 'professional', name: 'Professional' },
                  { id: 'premium', name: 'Premium' }
                ].map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.templateButton,
                      certificateTemplate === template.id && styles.templateButtonActive
                    ]}
                    onPress={() => setCertificateTemplate(template.id)}
                  >
                    <Text style={[
                      styles.templateButtonText,
                      certificateTemplate === template.id && styles.templateButtonTextActive
                    ]}>
                      {template.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Dynamic Pricing based on access type */}
        <View style={styles.pricingContainer}>
          <Text style={styles.label}>Pricing *</Text>
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
            Set price for {accessType === 'one-time' ? 'single session' : `${accessType} access`}
          </Text>
          
          {accessType === 'one-time' ? (
            <View style={styles.row}>
              <PriceInput
                value={servicePrice}
                onChangeText={(text) => {
                  setServicePrice(text);
                  clearFieldError('servicePrice');
                }}
                error={validationErrors.servicePrice}
                required
                style={styles.fullWidth}
                placeholder="0.00"
              />
            </View>
          ) : (
            <View style={styles.row}>
              {accessType === 'weekly' && (
                <FormInput
                  label="Weekly Price"
                  value={weeklyPrice}
                  onChangeText={(text) => {
                    setWeeklyPrice(text);
                    clearFieldError('weeklyPrice');
                  }}
                  placeholder="0.00"
                  keyboardType="numeric"
                  error={validationErrors.weeklyPrice}
                  required
                  style={styles.fullWidth}
                />
              )}
              
              {accessType === 'monthly' && (
                <FormInput
                  label="Monthly Price"
                  value={monthlyPrice}
                  onChangeText={(text) => {
                    setMonthlyPrice(text);
                    clearFieldError('monthlyPrice');
                  }}
                  placeholder="0.00"
                  keyboardType="numeric"
                  error={validationErrors.monthlyPrice}
                  required
                  style={styles.fullWidth}
                />
              )}
              
              {accessType === 'yearly' && (
                <FormInput
                  label="Yearly Price"
                  value={yearlyPrice}
                  onChangeText={(text) => {
                    setYearlyPrice(text);
                    clearFieldError('yearlyPrice');
                  }}
                  placeholder="0.00"
                  keyboardType="numeric"
                  error={validationErrors.yearlyPrice}
                  required
                  style={styles.fullWidth}
                />
              )}
              
              {accessType === 'lifetime' && (
                <FormInput
                  label="Lifetime Price"
                  value={lifetimePrice}
                  onChangeText={(text) => {
                    setLifetimePrice(text);
                    clearFieldError('lifetimePrice');
                  }}
                  placeholder="0.00"
                  keyboardType="numeric"
                  error={validationErrors.lifetimePrice}
                  required
                  style={styles.fullWidth}
                />
              )}
            </View>
          )}
        </View>

        {/* Curriculum/Outline Section */}
        <View style={styles.fullScreenSubmitContainer}>
          <TouchableOpacity
            style={[
              styles.fullScreenSubmitButton,
              isSubmitting && styles.fullScreenSubmitButtonDisabled
            ]}
            onPress={handleSubmitApplication}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.fullScreenSubmitButtonText}>
                {isEditing ? 'Update Service' : 'Create Service'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  </View>
      )}
    </SafeAreaView>
  );
}
