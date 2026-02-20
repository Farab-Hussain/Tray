import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Check,
} from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/fetcher';
import { COLORS } from '../../../constants/core/colors';
import { showSuccess, showToast, handleApiError } from '../../../utils/toast';
import { ConsultantService } from '../../../services/consultant.service';
import { logger } from '../../../utils/logger';

interface PlatformService {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  category?: string;
  icon?: string;
  tags?: string[];
  rating?: number;
  isDefault: boolean;
  isPlatformService: boolean;
  imageUrl?: string;
}

interface Application {
  id: string;
  consultantId: string;
  type: 'existing' | 'new';
  serviceId?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface ServiceWithApplication extends PlatformService {
  applicationStatus?: 'pending' | 'approved' | 'rejected';
  applicationId?: string;
}

interface TopConsultant {
  uid: string;
  name?: string;
  rating?: number;
  [key: string]: any;
}

export default function BrowseServicesScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [services, setServices] = useState<ServiceWithApplication[]>([]);
  const [applyingServiceId, setApplyingServiceId] = useState<string | null>(
    null,
  );

  const getServiceImage = (service: ServiceWithApplication): string | undefined => {
    // Return image URL if available, otherwise return undefined for placeholder handling
    return service.imageUrl || undefined;
  };

  const loadServicesWithApplications = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load both services and applications in parallel
      const [servicesResponse, applicationsResponse] = await Promise.all([
        api.get('/consultants/services/available'),
        api.get('/consultant-flow/applications/my'),
      ]);

      const availableServices: PlatformService[] =
        servicesResponse.data.services || [];
      const myApplications: Application[] =
        applicationsResponse.data.applications || [];

      // Map services with their application status
      let servicesWithStatus: ServiceWithApplication[] =
        availableServices.map(service => {
          // Find if consultant has applied for this service - ONLY from their own applications
          const application = myApplications.find(
            app =>
              app.type === 'existing' &&
              app.serviceId === service.id &&
              app.consultantId === user?.uid,
          );

          // Remove any existing applicationStatus from service data to prevent conflicts
          const cleanService = { ...service };
          delete (cleanService as any).applicationStatus;

          const result = {
            ...cleanService,
            applicationStatus: application?.status || undefined, // Explicitly set to undefined if no application
            applicationId: application?.id,
          };

          // Debug logging for each service
                    if (__DEV__) {
            logger.debug(`Service ${service.title}:`, {
            serviceId: service.id,
            hasApplication: !!application,
            applicationStatus: application?.status || 'no application',
            applicationId: application?.id || 'none',
            consultantId: application?.consultantId || 'none',
            currentUserId: user?.uid,
          })
          };

          return result;
        });

      if (servicesWithStatus.length === 0) {
                if (__DEV__) {
          logger.debug(
          'No platform services available. Loading top consultant services as fallback.',
        )
        };
        try {
          const topResponse = await ConsultantService.getTopConsultants();
          const topConsultants: TopConsultant[] =
            topResponse?.topConsultants || [];

          if (topConsultants.length > 0) {
            const selectedTopConsultant = topConsultants.reduce(
              (best, current) => {
                const bestRating = best?.rating ?? 0;
                const currentRating = current?.rating ?? 0;
                return currentRating > bestRating ? current : best;
              },
              topConsultants[0],
            );

                        if (__DEV__) {
              logger.debug(
              'Using top consultant services fallback:',
              selectedTopConsultant?.name,
            )
            };

            const consultantServicesResponse =
              await ConsultantService.getConsultantServices(
                selectedTopConsultant?.uid,
              );
            const consultantServices: PlatformService[] =
              consultantServicesResponse?.services || [];

            servicesWithStatus = consultantServices.map(service => {
              const cleanService = { ...service };
              delete (cleanService as any).applicationStatus;

              const fallbackApplication = myApplications.find(
                app =>
                  app.type === 'existing' &&
                  app.serviceId === service.id &&
                  app.consultantId === user?.uid,
              );

              return {
                ...(cleanService as PlatformService),
                applicationStatus: fallbackApplication?.status || undefined,
                applicationId: fallbackApplication?.id,
                isPlatformService: true,
                isDefault: service.isDefault ?? false,
              } as ServiceWithApplication;
            });
          } else {
                        if (__DEV__) {
              logger.debug('Top consultants response empty. No fallback services.')
            };
          }
        } catch (fallbackError) {
                    if (__DEV__) {
            logger.error(
            'Failed to load top consultant services fallback:',
            fallbackError,
          )
          };
        }
      }

            if (__DEV__) {
        logger.debug('Services with application status:', servicesWithStatus)
      };
            if (__DEV__) {
        logger.debug('My applications:', myApplications)
      };
      setServices(servicesWithStatus);
    } catch (error: any) {
            if (__DEV__) {
        logger.error('Error loading services:', error)
      };
      handleApiError(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadServicesWithApplications();
  }, [loadServicesWithApplications]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadServicesWithApplications();
  };

  const handleApplyForService = async (service: ServiceWithApplication) => {
    if (!user?.uid) {
      showToast.error({ message: 'Please login to apply for services' });
      return;
    }

    Alert.alert(
      'Apply for Service',
      `Do you want to apply to offer "${service.title}"? Your application will be reviewed by our admin team.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            try {
              setApplyingServiceId(service.id);

              // Create application for existing service
              await api.post('/consultant-flow/applications', {
                consultantId: user.uid,
                type: 'existing',
                serviceId: service.id,
              });

              showSuccess(
                "Application submitted successfully! We'll review it within 24-48 hours.",
              );

              // Reload services to show updated status
              await loadServicesWithApplications();
            } catch (error: any) {
                            if (__DEV__) {
                logger.error('Error applying for service:', error)
              };
              handleApiError(error);
            } finally {
              setApplyingServiceId(null);
            }
          },
        },
      ],
    );
  };

  const handleCreateCustomService = () => {
    (navigation as any).navigate('ConsultantApplications', { 
      openCreateModal: true 
    });
  };

  const renderApplicationButton = (service: ServiceWithApplication) => {
    const isApplying = applyingServiceId === service.id;
    const hasApplication = !!service.applicationStatus;

    // Debug logging
        if (__DEV__) {
      logger.debug(`Button for ${service.title}:`, {
      applicationStatus: service.applicationStatus,
      hasApplication,
      isApplying,
    })
    };

    // Determine button style and content based on status
    if (isApplying) {
      return (
        <TouchableOpacity style={styles.applyButton} disabled>
          <View style={styles.buttonContent}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.applyButtonText}>Applying...</Text>
          </View>
        </TouchableOpacity>
      );
    }

    let buttonStyle = styles.applyButton;
    let textStyle = styles.applyButtonText;
    let icon: React.ReactNode = (
      <CheckCircle size={18} color="#fff" />
    );
    let label = 'Apply to Offer';
    let disabled = hasApplication;

    if (service.applicationStatus === 'approved' && service.applicationId) {
      buttonStyle = styles.approvedButton;
      textStyle = styles.approvedButtonText;
      icon = <Check size={18} color="#fff" />;
      label = 'Approved ✓';
      disabled = true;
    } else if (service.applicationStatus === 'pending') {
      buttonStyle = styles.pendingButton;
      textStyle = styles.pendingButtonText;
      icon = <Clock size={18} color="#F59E0B" />;
      label = 'Applied (Pending Review)';
      disabled = true;
    } else if (service.applicationStatus === 'rejected') {
      buttonStyle = styles.rejectedButton;
      textStyle = styles.rejectedButtonText;
      icon = <XCircle size={18} color="#EF4444" />;
      label = 'Rejected';
      disabled = true;
    }

    return (
      <TouchableOpacity
        style={[buttonStyle]}
        onPress={() => handleApplyForService(service)}
        disabled={disabled}
      >
        <View style={styles.buttonContent}>
          {icon}
          <Text style={textStyle}>{label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={styles.loadingText}>Loading available services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Browse Services</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.green}
          />
        }
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            Browse available platform services and apply to offer them, or
            create your own custom service. Pull down to refresh.
          </Text>
        </View>

    

        {/* Services Count */}
        <Text style={styles.servicesCount}>
          {services.length} Platform Service{services.length !== 1 ? 's' : ''}{' '}
          Available
        </Text>

        {/* Services List */}
        {services.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Services Available</Text>
            <Text style={styles.emptySubtitle}>
              Check back later or create your own custom service
            </Text>
          </View>
        ) : (
          services.map(service => (
            <View key={service.id} style={styles.serviceCard}>
              {/* Service Header */}
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                {service.rating != null && service.rating > 0 && (
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>⭐ {service.rating}</Text>
                  </View>
                )}
              </View>

              {/* Service Image */}
              {getServiceImage(service) ? (
                <Image
                  source={{ uri: getServiceImage(service)! }}
                  style={styles.serviceImage}
                  resizeMode="cover"
                  onError={() => {
                                        if (__DEV__) {
                      logger.debug(
                      `Failed to load image for service: ${service.title}`,
                    )
                    };
                  }}
                />
              ) : (
                <View style={styles.serviceImagePlaceholder}>
                  <Text style={styles.serviceImagePlaceholderText}>
                    {service.title.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              {/* Service Description */}
              <Text style={styles.serviceDescription} numberOfLines={3}>
                {service.description || 'No description available'}
              </Text>

              {/* Service Details */}
              <View style={styles.serviceDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{service.duration} min</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Base Price</Text>
                  <Text style={styles.detailValue}>${service.price}</Text>
                </View>
              </View>

              {/* Tags */}
              {service.tags && service.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {service.tags.slice(0, 3).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Application Status Button */}
              {renderApplicationButton(service)}
            </View>
          ))
        )}

        {/* Create Custom Service Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateCustomService}
        >
          <Plus size={20} color={COLORS.green} />
          <Text style={styles.createButtonText}>Create Custom Service</Text>
        </TouchableOpacity>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            💡 Tip: Applications are reviewed by our admin team within 24-48
            hours. You'll be notified once approved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoBannerText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  servicesCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  serviceImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  serviceImagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceImagePlaceholderText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  ratingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#4B5563',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pendingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  pendingButtonText: {
    color: '#92400E',
    fontSize: 16,
    fontWeight: '600',
  },
  approvedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  approvedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  rejectedButtonText: {
    color: '#991B1B',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.green,
    marginTop: 8,
  },
  createButtonText: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  helpContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  helpText: {
    fontSize: 13,
    color: '#075985',
    lineHeight: 18,
  },
});
