import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, Plus } from 'lucide-react-native';
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
  ConsultantApplication,
} from '../../../services/consultantFlow.service';
import { api } from '../../../lib/fetcher';
import { ConsultantService } from '../../../services/consultant.service';
import axios from 'axios';

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
    duration: number;
    price: number;
    imageUrl?: string | null;
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
  const [serviceDuration, setServiceDuration] = useState('60');
  const [servicePrice, setServicePrice] = useState('150');
  const [serviceImage, setServiceImage] = useState<string | null>(null);
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
        console.error('Error fetching platform services:', error)
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
            console.error('Error fetching consultant services for linkage:', consultantServicesError)
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
        console.error('Error loading applications:', error)
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
        console.log('ConsultantApplicationsScreen - Auto-opening create modal from route params')
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
    if (parseInt(serviceDuration, 10) <= 0) {
      errors.serviceDuration = 'Please enter a valid duration';
    }
    if (parseFloat(servicePrice) <= 0) {
      errors.servicePrice = 'Please enter a valid price';
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
    setServiceDuration('60');
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

    const parsedDuration = parseInt(serviceDuration, 10);
    const parsedPrice = parseFloat(servicePrice);

  const requiresBookingWarning =
    isEditing &&
    editingApplication &&
    editingApplication.status === 'approved' &&
    editingOriginalValues &&
    (parsedPrice !== editingOriginalValues.price || parsedDuration !== editingOriginalValues.duration) &&
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
          type?: 'new' | 'existing' | 'update';
          serviceId?: string;
          customService: {
            title: string;
            description: string;
            duration: number;
            price: number;
            imageUrl?: string;
            imagePublicId?: string;
          };
        } = {
          customService: {
            title: serviceTitle,
            description: serviceDescription,
            duration: parsedDuration,
            price: parsedPrice,
            imageUrl: serviceImage ?? undefined,
            // VIDEO UPLOAD CODE - COMMENTED OUT
            // videoUrl: serviceVideo ?? undefined,
            imagePublicId: serviceImagePublicId ?? undefined,
            // videoPublicId: serviceVideoPublicId ?? undefined,
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
            duration: parsedDuration,
            price: parsedPrice,
            imageUrl: serviceImage ?? undefined,
            // VIDEO UPLOAD CODE - COMMENTED OUT
            // videoUrl: serviceVideo ?? undefined,
            imagePublicId: serviceImagePublicId ?? undefined,
            // videoPublicId: serviceVideoPublicId ?? undefined,
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
                    console.error('Error checking approved services:', error)
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
        console.error('Error submitting application:', error)
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
            console.error('Error fetching bookings before deletion:', error)
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
          console.error('Error deleting approved service:', error)
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
        console.error('Error deleting application:', error)
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
                console.error('Error fetching linked service by ID:', serviceError)
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
              console.error('Error fetching consultant services while editing:', consultantFetchError)
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
          setServiceDuration(String(linkedService.duration || 60));
          setServicePrice(String(linkedService.price || 0));
          setServiceImage(linkedService.imageUrl || null);
          // VIDEO UPLOAD CODE - COMMENTED OUT
          // setServiceVideo(linkedService.videoUrl || null);
          setServiceImagePublicId(linkedService.imagePublicId || null);
          // setServiceVideoPublicId(linkedService.videoPublicId || null);

          setEditingApplication(app);
          setEditingServiceId(linkedService.id);
          setEditingOriginalValues({
            title: linkedService.title || '',
            description: linkedService.description || '',
            duration: linkedService.duration || 60,
            price: linkedService.price || 0,
            imageUrl: linkedService.imageUrl || null,
          });
          try {
            const bookingsResponse = await ConsultantService.getServiceBookings(linkedService.id);
            const bookingsCount =
              bookingsResponse?.count ?? bookingsResponse?.bookings?.length ?? 0;
            setCurrentServiceBookingsCount(bookingsCount);
          } catch (bookingsError) {
            if (!(axios.isAxiosError(bookingsError) && bookingsError.response?.status === 404)) {
                            if (__DEV__) {
                console.error('Error fetching service bookings for edit warning:', bookingsError)
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
    setServiceDuration('60');
    setServicePrice('150');
    setServiceImage(null);
    setServiceImagePublicId(null);
    setIsEditing(false);
    setEditingApplication(null);
    setEditingServiceId(null);
    setEditingOriginalValues(null);
    setIsLoadingServiceDetails(false);
    setLoadingServiceId(null);
    setMutatingApplicationId(null);
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
          onPress={() => navigation.navigate('BrowseServices' as never)} 
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

      {/* New Application Modal */}
      <ConsultantServiceModal
        visible={showModal}
        isEditing={isEditing}
        onClose={handleCloseModal}
        onSubmit={handleSubmitApplication}
        isSubmitting={isSubmitting}
        submitButtonText={isEditing ? 'Update Service' : 'Submit Application'}
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
            image={serviceImage}
            setImage={setServiceImage}
            imagePublicId={serviceImagePublicId}
            setImagePublicId={setServiceImagePublicId}
            aspectRatio={16/9}
            placeholder="Upload Service Image"
          />
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

        <View style={styles.row}>
          <FormInput
            label="Duration (mins)"
            value={serviceDuration}
            onChangeText={(text) => {
              setServiceDuration(text);
              clearFieldError('serviceDuration');
            }}
            placeholder="60"
            keyboardType="numeric"
            error={validationErrors.serviceDuration}
            required
            style={styles.halfWidth}
          />

          <PriceInput
            value={servicePrice}
            onChangeText={(text) => {
              setServicePrice(text);
              clearFieldError('servicePrice');
            }}
            error={validationErrors.servicePrice}
            required
            style={styles.halfWidth}
          />
        </View>
      </ConsultantServiceModal>
    </SafeAreaView>
  );
}
