import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { 
  CheckCircle, 
  Plus, 
  FileText, 
  Clock, 
  ArrowRight,
  Star,
  Users,
  DollarSign,
  Calendar,
  Home
} from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import {
  getConsultantApplications,
  ConsultantApplication,
} from '../../../services/consultantFlow.service';
import { COLORS } from '../../../constants/core/colors';
import { consultantServiceSetupScreenStyles as styles } from '../../../constants/styles/consultantServiceSetupScreenStyles';
import StatCard from '../../../components/ui/StatCard';

export default function ConsultantServiceSetupScreen() {
  const navigation = useNavigation();
  const { user, activeRole, switchRole } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<ConsultantApplication[]>([]);
  const isLoadingRef = useRef(false);

  const loadApplications = useCallback(async () => {
    if (!user?.uid) return;
    
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
            if (__DEV__) {
        console.log('ServiceSetup - Already loading, skipping reload')
      };
      return;
    }
    
    isLoadingRef.current = true;
    
        if (__DEV__) {
      console.log('ServiceSetup - Loading applications for user UID:', user.uid)
    };
    setIsLoading(true);
    try {
      const apps = await getConsultantApplications();
            if (__DEV__) {
        console.log('ServiceSetup - Received applications:', apps)
      };
            if (__DEV__) {
        console.log('ServiceSetup - Applications count:', apps.length)
      };
            if (__DEV__) {
        console.log('ServiceSetup - Applications details:', apps.map(app => ({ id: app.id, consultantId: app.consultantId, status: app.status })))
      };
      
      // Frontend safety check: Filter applications to only include current user's applications
      const currentUserId = user?.uid;
      const filteredApps = apps?.filter(app => app.consultantId === currentUserId) || [];
            if (__DEV__) {
        console.log('ServiceSetup - Filtered applications for current user:', filteredApps.length)
      };
            if (__DEV__) {
        console.log('ServiceSetup - Current user ID:', currentUserId)
      };
            if (__DEV__) {
        console.log('ServiceSetup - Filtered applications:', JSON.stringify(filteredApps, null, 2))
      };
      
      // Warn if backend returned applications for different users
      const otherUsersApplications = apps?.filter(app => app.consultantId !== currentUserId) || [];
      if (otherUsersApplications.length > 0) {
                if (__DEV__) {
          console.warn('⚠️ BACKEND ISSUE: ServiceSetup received applications for other users:', otherUsersApplications.length)
        };
                if (__DEV__) {
          console.warn('⚠️ Other user IDs:', [...new Set(otherUsersApplications.map(app => app.consultantId))])
        };
      }
      
      setApplications(filteredApps);
      
      // Check if user has approved services
      const approvedApps = filteredApps.filter(app => app.status === 'approved');
            if (__DEV__) {
        console.log('ServiceSetup - Approved applications:', approvedApps.length)
      };
      
      if (approvedApps.length > 0) {
                if (__DEV__) {
          console.log('ServiceSetup - Approved services found, automatically switching to consultant role')
        };
        
        // Automatically switch to consultant role if not already
        if (activeRole !== 'consultant') {
          try {
            await switchRole('consultant');
                        if (__DEV__) {
              console.log('ServiceSetup - Successfully switched to consultant role')
            };
          } catch (error: any) {
                        if (__DEV__) {
              console.error('ServiceSetup - Error switching to consultant role:', error)
            };
            // Continue navigation even if role switch fails
          }
        }
        
        // Navigate to consultant tabs
                if (__DEV__) {
          console.log('ServiceSetup - Navigating to consultant dashboard')
        };
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'ConsultantTabs' as never }],
        });
      } else {
                if (__DEV__) {
          console.log('ServiceSetup - No approved services found, consultant must apply for services')
        };
        // Don't redirect - consultant must apply for services first
      }
    } catch (error) {
            if (__DEV__) {
        console.error('ServiceSetup - Error loading applications:', error)
      };
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [user?.uid, activeRole, switchRole, navigation]);

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user, loadApplications]);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadApplications();
      }
    }, [user, loadApplications])
  );

  const handleCreateService = () => {
    (navigation as any).navigate('ConsultantApplications', { 
      openCreateModal: true 
    });
  };

  const handleViewApplications = () => {
    navigation.navigate('ConsultantApplications' as never);
  };

  const handleBrowseServices = () => {
    navigation.navigate('BrowseServices' as never);
  };



  const pendingApplications = applications.filter(a => a.status === 'pending');
  const approvedApplications = applications.filter(a => a.status === 'approved');
  const rejectedApplications = applications.filter(a => a.status === 'rejected');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={styles.loadingText}>Loading your services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <CheckCircle size={32} color={COLORS.green} />
          </View>
          <Text style={styles.headerTitle}>Profile Approved! 🎉</Text>
          <Text style={styles.headerSubtitle}>
            Your consultant profile has been approved. You must apply for services to complete your consultant setup and start earning.
          </Text>
        </View>

        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>Next Steps</Text>
          
          <View style={styles.stepItem}>
            <View style={[styles.stepIcon, styles.stepIconCompleted]}>
              <CheckCircle size={20} color="#fff" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Profile Created</Text>
              <Text style={styles.stepDescription}>Your consultant profile is approved</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepIcon, approvedApplications.length > 0 ? styles.stepIconCompleted : styles.stepIconPending]}>
              {approvedApplications.length > 0 ? (
                <CheckCircle size={20} color="#fff" />
              ) : (
                <Plus size={20} color="#fff" />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Apply for Services</Text>
              <Text style={styles.stepDescription}>
                {approvedApplications.length > 0 
                  ? `${approvedApplications.length} service(s) approved - Ready to start earning!` 
                  : 'REQUIRED: Apply for services to complete consultant setup'
                }
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepIcon, approvedApplications.length > 0 ? styles.stepIconCompleted : styles.stepIconPending]}>
              {approvedApplications.length > 0 ? (
                <CheckCircle size={20} color="#fff" />
              ) : (
                <ArrowRight size={20} color="#fff" />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Start Earning</Text>
              <Text style={styles.stepDescription}>
                {approvedApplications.length > 0 
                  ? 'Access full consultant screen' 
                  : 'Access app after service approval'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Service Stats */}
        {applications.length > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Your Service Applications</Text>
            
            <View style={styles.statsRow}>
              {[
                { icon: Clock, iconColor: '#F59E0B', value: pendingApplications.length, label: 'Pending', variant: 'pending' as const },
                { icon: CheckCircle, iconColor: '#10B981', value: approvedApplications.length, label: 'Approved', variant: 'approved' as const },
                { icon: FileText, iconColor: '#EF4444', value: rejectedApplications.length, label: 'Rejected', variant: 'rejected' as const },
              ].map((statConfig, index) => (
                <StatCard
                  key={index}
                  icon={statConfig.icon}
                  iconSize={24}
                  iconColor={statConfig.iconColor}
                  value={statConfig.value}
                  label={statConfig.label}
                  variant={statConfig.variant}
                />
              ))}
            </View>
          </View>
        )}

        {/* Benefits Card */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Why Apply for Services?</Text>
          
          <View style={styles.benefitItem}>
            <DollarSign size={20} color={COLORS.green} />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Earn Money</Text>
              <Text style={styles.benefitDescription}>Set your own rates and earn from consultations</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Users size={20} color={COLORS.green} />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Help Students</Text>
              <Text style={styles.benefitDescription}>Share your expertise and mentor the next generation</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Star size={20} color={COLORS.green} />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Build Reputation</Text>
              <Text style={styles.benefitDescription}>Gain reviews and build your professional brand</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Calendar size={20} color={COLORS.green} />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Flexible Schedule</Text>
              <Text style={styles.benefitDescription}>Work on your own time and availability</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {applications.length === 0 ? (
            // First time - prominent CTAs
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleBrowseServices}
              >
                <Star size={24} color="#fff" />
                <Text style={styles.primaryButtonText}>Browse Platform Services</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleCreateService}
              >
                <Plus size={20} color={COLORS.green} />
                <Text style={styles.secondaryButtonText}>Create Custom Service</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Has applications - show management options
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleBrowseServices}
              >
                <Star size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Browse Platform Services</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleCreateService}
              >
                <Plus size={20} color={COLORS.green} />
                <Text style={styles.secondaryButtonText}>Create Custom Service</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tertiaryButton}
                onPress={handleViewApplications}
              >
                <FileText size={20} color="#6B7280" />
                <Text style={styles.tertiaryButtonText}>Manage Applications</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Manual Navigation Button for approved services */}
          {approvedApplications.length > 0 && (
            <TouchableOpacity
              style={styles.manualNavButton}
              onPress={() => {
                                if (__DEV__) {
                  console.log('ServiceSetup - Manual navigation to consultant app screen')
                };
                (navigation as any).navigate('MainTabs', { role: 'consultant' });
              }}
            >
              <Home size={20} color="#fff" />
              <Text style={styles.manualNavButtonText}>Go to App</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            ⚠️ IMPORTANT: You must apply for and receive approval for at least one service to access your consultant applications screen. 
            You can apply to offer our platform services or create your own custom services. 
            All applications are reviewed by admin within 24-48 hours.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

