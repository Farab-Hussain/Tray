import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, Plus, X, CheckCircle, Clock, XCircle, FileText, Trash2, Pencil } from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { COLORS } from '../../../constants/core/colors';
import {
  createConsultantApplication,
  getConsultantApplications,
  deleteConsultantApplication,
  updateConsultantApplication,
  ConsultantApplication,
} from '../../../services/consultantFlow.service';
import ImageUpload from '../../../components/ui/ImageUpload';
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
      console.error('Error fetching platform services:', error);
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
          console.error('Error fetching consultant services for linkage:', consultantServicesError);
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
      console.error('Error loading applications:', error);
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
      console.log('ConsultantApplicationsScreen - Auto-opening create modal from route params');
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
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
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
                  console.error('Error checking approved services:', error);
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
      console.error('Error submitting application:', error);
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
          console.error('Error fetching bookings before deletion:', error);
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
        console.error('Error deleting approved service:', error);
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
      console.error('Error deleting application:', error);
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
              console.error('Error fetching linked service by ID:', serviceError);
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
            console.error('Error fetching consultant services while editing:', consultantFetchError);
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
              console.error('Error fetching service bookings for edit warning:', bookingsError);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return COLORS.green;
      case 'pending': return COLORS.orange;
      case 'rejected': return COLORS.red;
      default: return COLORS.gray;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} color={COLORS.green} />;
      case 'pending': return <Clock size={16} color={COLORS.orange} />;
      case 'rejected': return <XCircle size={16} color={COLORS.red} />;
      default: return <FileText size={16} color={COLORS.gray} />;
    }
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
        <View style={[styles.statCard, styles.statCardPending]}>
          <Text style={[styles.statValue, styles.statValuePending]}>{pendingCount}</Text>
          <Text style={[styles.statLabel, styles.statLabelPending]}>Pending</Text>
        </View>
        <View style={[styles.statCard, styles.statCardApproved]}>
          <Text style={[styles.statValue, styles.statValueApproved]}>{approvedCount}</Text>
          <Text style={[styles.statLabel, styles.statLabelApproved]}>Approved</Text>
        </View>
        <View style={[styles.statCard, styles.statCardRejected]}>
          <Text style={[styles.statValue, styles.statValueRejected]}>{rejectedCount}</Text>
          <Text style={[styles.statLabel, styles.statLabelRejected]}>Rejected</Text>
        </View>
      </View>

      {/* Applications List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {applications.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={48} color={COLORS.lightGray} />
            <Text style={styles.emptyTitle}>No Applications Yet</Text>
            <Text style={styles.emptyText}>Browse and apply from existing platform services</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => {
                navigation.navigate('BrowseServices' as never);
              }}
            >
              <Plus size={20} color={COLORS.white} />
              <Text style={styles.emptyButtonText}>Apply from Existing Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.applicationsList}>
            {applications.map((app) => (
              <View key={app.id} style={styles.applicationCard}>
                <View style={styles.cardHeader}>
                  <FileText size={20} color={COLORS.green} />
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(app.status)}20` }]}>
                    <View style={styles.statusContent}>
                      {getStatusIcon(app.status)}
                      <Text style={[styles.statusText, { color: getStatusColor(app.status) }]}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.cardTitle}>
                  {app.type === 'new' || app.type === 'update'
                    ? app.customService?.title
                    : app.existingServiceTitle || 'Service Application'}
                </Text>
                
                {(app.type === 'new' || app.type === 'update') && app.customService && (
                  <>
                    {/* VIDEO UPLOAD CODE - COMMENTED OUT */}
                    {/* {(app.customService.imageUrl || app.customService.videoUrl) && ( */}
                    {app.customService.imageUrl && (
                      <View style={styles.serviceImageContainer}>
                        {/* VIDEO UPLOAD CODE - COMMENTED OUT */}
                        {/* {app.customService.videoUrl ? (
                          ... video preview code ...
                        ) : ( */}
                          <Image 
                            source={{ uri: app.customService.imageUrl! }} 
                            style={styles.serviceImage}
                            resizeMode="cover"
                          />
                        {/* )} */}
                      </View>
                    )}
                    <Text style={styles.cardDescription} numberOfLines={2}>
                      {app.customService.description}
                    </Text>
                    <View style={styles.cardDetails}>
                      <Text style={styles.cardDetailText}>
                        ${app.customService.price} • {app.customService.duration} mins
                      </Text>
                    </View>
                  </>
                )}

                {app.reviewNotes && (
                  <View style={styles.reviewNotes}>
                    <Text style={styles.reviewNotesLabel}>Review Notes:</Text>
                    <Text style={styles.reviewNotesText}>{app.reviewNotes}</Text>
                  </View>
                )}

                {(app.status === 'pending' || app.status === 'approved') && (
                  <View style={styles.cardActions}>
                    {/* Only show Edit button for approved services */}
                    {app.status === 'approved' && (app.type === 'new' || app.type === 'update') && (
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditApplication(app)}
                        disabled={isLoadingServiceDetails || isSubmitting}
                      >
                        {loadingServiceId === app.id && isLoadingServiceDetails ? (
                          <ActivityIndicator size="small" color={COLORS.green} />
                        ) : (
                          <>
                            <Pencil size={16} color={COLORS.green} />
                            <Text style={styles.editButtonText}>Edit</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.deleteButton,
                        app.status === 'approved' && styles.deleteButtonEmphasis,
                      ]}
                      onPress={() => handleDeleteApplication(app)}
                      disabled={isSubmitting}
                    >
                      {mutatingApplicationId === app.id && isSubmitting ? (
                        <ActivityIndicator size="small" color={COLORS.red} />
                      ) : (
                        <>
                          <Trash2 size={16} color={COLORS.red} />
                          <Text
                            style={[
                              styles.deleteButtonText,
                              app.status === 'approved' && styles.deleteButtonTextStrong,
                            ]}
                          >
                            Delete
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* New Application Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Service' : 'New Application'}</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <X size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalForm}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Service Title *</Text>
                  <TextInput
                    style={[styles.input, validationErrors.serviceTitle && { borderColor: COLORS.red }]}
                    value={serviceTitle}
                    onChangeText={(text) => {
                      setServiceTitle(text);
                      clearFieldError('serviceTitle');
                    }}
                    placeholder="e.g., Career Mentorship Session"
                    placeholderTextColor={COLORS.lightGray}
                  />
                  {validationErrors.serviceTitle && (
                    <Text style={{ color: COLORS.red, fontSize: 12, marginTop: 4 }}>
                      {validationErrors.serviceTitle}
                    </Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Service Media *</Text>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                    Upload an image to showcase your service
                  </Text>
                  <ImageUpload
                    currentImageUrl={serviceImage || ''}
                    // VIDEO UPLOAD CODE - COMMENTED OUT: currentVideoUrl={serviceVideo || ''}
                    currentPublicId={serviceImagePublicId || ''}
                    // VIDEO UPLOAD CODE - COMMENTED OUT: currentVideoPublicId={serviceVideoPublicId || ''}
                    onImageUploaded={(imageUrl, publicId) => {
                      setServiceImage(imageUrl);
                      setServiceImagePublicId(publicId);
                      // VIDEO UPLOAD CODE - COMMENTED OUT
                      // // Clear video when image is uploaded
                      // setServiceVideo(null);
                      // setServiceVideoPublicId(null);
                      clearFieldError('serviceImage');
                    }}
                    // VIDEO UPLOAD CODE - COMMENTED OUT: onVideoUploaded={(videoUrl, publicId) => { ... }}
                    onImageDeleted={() => {
                      setServiceImage(null);
                      setServiceImagePublicId(null);
                      clearFieldError('serviceImage');
                    }}
                    // VIDEO UPLOAD CODE - COMMENTED OUT: onVideoDeleted={() => { ... }}
                    placeholder="Upload service image"
                    style={styles.imageUpload}
                    required={true}
                    error={validationErrors.serviceImage}
                    uploadType="service"
                    // VIDEO UPLOAD CODE - COMMENTED OUT: allowVideo={true}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Description * (min 20 chars)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, validationErrors.serviceDescription && { borderColor: COLORS.red }]}
                    value={serviceDescription}
                    onChangeText={(text) => {
                      setServiceDescription(text);
                      clearFieldError('serviceDescription');
                    }}
                    placeholder="Describe your service..."
                    multiline
                    numberOfLines={4}
                    placeholderTextColor={COLORS.lightGray}
                  />
                  <Text style={styles.charCount}>{serviceDescription.length} chars</Text>
                  {validationErrors.serviceDescription && (
                    <Text style={{ color: COLORS.red, fontSize: 12, marginTop: 4 }}>
                      {validationErrors.serviceDescription}
                    </Text>
                  )}
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>Duration (mins) *</Text>
                    <TextInput
                      style={[styles.input, validationErrors.serviceDuration && { borderColor: COLORS.red }]}
                      value={serviceDuration}
                      onChangeText={(text) => {
                        setServiceDuration(text);
                        clearFieldError('serviceDuration');
                      }}
                      placeholder="60"
                      keyboardType="numeric"
                      placeholderTextColor={COLORS.lightGray}
                    />
                    {validationErrors.serviceDuration && (
                      <Text style={{ color: COLORS.red, fontSize: 12, marginTop: 4 }}>
                        {validationErrors.serviceDuration}
                      </Text>
                    )}
                  </View>

                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>Price (USD) *</Text>
                    <View style={styles.priceInput}>
                      <Text style={styles.priceSymbol}>$</Text>
                      <TextInput
                        style={[styles.input, styles.priceInputField, validationErrors.servicePrice && { borderColor: COLORS.red }]}
                        value={servicePrice}
                        onChangeText={(text) => {
                          setServicePrice(text);
                          clearFieldError('servicePrice');
                        }}
                        placeholder="150"
                        keyboardType="numeric"
                        placeholderTextColor={COLORS.lightGray}
                      />
                    </View>
                    {validationErrors.servicePrice && (
                      <Text style={{ color: COLORS.red, fontSize: 12, marginTop: 4 }}>
                        {validationErrors.servicePrice}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmitApplication}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEditing ? 'Save Changes' : 'Submit'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20, // Add extra top padding
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerButton: {
    width: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    flex: 1,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statCardPending: {
    backgroundColor: COLORS.yellow,
  },
  statValuePending: {
    color: COLORS.orange,
  },
  statLabelPending: {
    color: COLORS.orange,
  },
  statCardApproved: {
    backgroundColor: COLORS.green,
  },
  statValueApproved: {
    color: COLORS.white,
  },
  statLabelApproved: {
    color: COLORS.white,
  },
  statCardRejected: {
    backgroundColor: COLORS.red,
  },
  statValueRejected: {
    color: COLORS.white,
  },
  statLabelRejected: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  applicationsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  applicationCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  videoPreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButtonText: {
    color: COLORS.white,
    fontSize: 48,
    fontWeight: 'bold',
  },
  serviceImageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  cardDetails: {
    flexDirection: 'row',
    gap: 8,
  },
  cardDetailText: {
    fontSize: 13,
    color: COLORS.lightGray,
  },
  reviewNotes: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.red,
  },
  reviewNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.red,
    marginBottom: 4,
  },
  reviewNotesText: {
    fontSize: 13,
    color: COLORS.black,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#E6F7EE',
    gap: 6,
  },
  editButtonText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonEmphasis: {
    backgroundColor: '#F87171',
    borderColor: '#F87171',
  },
  deleteButtonText: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButtonTextStrong: {
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  modalForm: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.black,
  },
  imageUpload: {
    marginTop: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  priceInput: {
    position: 'relative',
  },
  priceSymbol: {
    position: 'absolute',
    left: 12,
    top: 10,
    fontSize: 14,
    color: COLORS.gray,
    zIndex: 1,
  },
  priceInputField: {
    paddingLeft: 28,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
});

