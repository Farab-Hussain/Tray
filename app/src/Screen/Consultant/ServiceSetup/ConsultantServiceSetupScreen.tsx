import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
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
      console.log('ServiceSetup - Already loading, skipping reload');
      return;
    }
    
    isLoadingRef.current = true;
    
    console.log('ServiceSetup - Loading applications for user UID:', user.uid);
    setIsLoading(true);
    try {
      const apps = await getConsultantApplications();
      console.log('ServiceSetup - Received applications:', apps);
      console.log('ServiceSetup - Applications count:', apps.length);
      console.log('ServiceSetup - Applications details:', apps.map(app => ({ id: app.id, consultantId: app.consultantId, status: app.status })));
      
      // Frontend safety check: Filter applications to only include current user's applications
      const currentUserId = user?.uid;
      const filteredApps = apps?.filter(app => app.consultantId === currentUserId) || [];
      console.log('ServiceSetup - Filtered applications for current user:', filteredApps.length);
      console.log('ServiceSetup - Current user ID:', currentUserId);
      console.log('ServiceSetup - Filtered applications:', JSON.stringify(filteredApps, null, 2));
      
      // Warn if backend returned applications for different users
      const otherUsersApplications = apps?.filter(app => app.consultantId !== currentUserId) || [];
      if (otherUsersApplications.length > 0) {
        console.warn('⚠️ BACKEND ISSUE: ServiceSetup received applications for other users:', otherUsersApplications.length);
        console.warn('⚠️ Other user IDs:', [...new Set(otherUsersApplications.map(app => app.consultantId))]);
      }
      
      setApplications(filteredApps);
      
      // Check if user has approved services
      const approvedApps = filteredApps.filter(app => app.status === 'approved');
      console.log('ServiceSetup - Approved applications:', approvedApps.length);
      
      if (approvedApps.length > 0) {
        console.log('ServiceSetup - Approved services found, automatically switching to consultant role');
        
        // Automatically switch to consultant role if not already
        if (activeRole !== 'consultant') {
          try {
            await switchRole('consultant');
            console.log('ServiceSetup - Successfully switched to consultant role');
          } catch (error: any) {
            console.error('ServiceSetup - Error switching to consultant role:', error);
            // Continue navigation even if role switch fails
          }
        }
        
        // Navigate to consultant tabs
        console.log('ServiceSetup - Navigating to consultant dashboard');
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'ConsultantTabs' as never }],
        });
      } else {
        console.log('ServiceSetup - No approved services found, consultant must apply for services');
        // Don't redirect - consultant must apply for services first
      }
    } catch (error) {
      console.error('ServiceSetup - Error loading applications:', error);
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
              <View style={[styles.statCard, styles.statCardPending]}>
                <Clock size={24} color="#F59E0B" />
                <Text style={styles.statValue}>{pendingApplications.length}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>

              <View style={[styles.statCard, styles.statCardApproved]}>
                <CheckCircle size={24} color="#10B981" />
                <Text style={styles.statValue}>{approvedApplications.length}</Text>
                <Text style={styles.statLabel}>Approved</Text>
              </View>

              <View style={[styles.statCard, styles.statCardRejected]}>
                <FileText size={24} color="#EF4444" />
                <Text style={styles.statValue}>{rejectedApplications.length}</Text>
                <Text style={styles.statLabel}>Rejected</Text>
              </View>
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
                console.log('ServiceSetup - Manual navigation to consultant app screen');
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40, // Add extra top padding to ensure content doesn't overlap with status bar
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  stepsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepIconCompleted: {
    backgroundColor: COLORS.green,
  },
  stepIconPending: {
    backgroundColor: '#6B7280',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statCardPending: {
    backgroundColor: '#FEF3C7',
  },
  statCardApproved: {
    backgroundColor: '#D1FAE5',
  },
  statCardRejected: {
    backgroundColor: '#FEE2E2',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  benefitsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitContent: {
    flex: 1,
    marginLeft: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.green,
    gap: 8,
  },
  secondaryButtonText: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 8,
    marginTop: 8,
  },
  tertiaryButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
  manualNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#047857',
  },
  manualNavButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  helpText: {
    fontSize: 14,
    color: '#0369A1',
    textAlign: 'center',
    lineHeight: 20,
  },
});
