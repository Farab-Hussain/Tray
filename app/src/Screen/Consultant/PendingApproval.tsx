import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,

} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Clock, CheckCircle, XCircle, FileText, RefreshCw, Plus, Edit3, Star, Calendar, Users, DollarSign, ArrowRight, AlertCircle } from 'lucide-react-native';
import {
  getConsultantProfile,
  getConsultantApplications,
  ConsultantProfile,
  ConsultantApplication,
} from '../../services/consultantFlow.service';
import { showInfo, showWarning } from '../../utils/toast';
import { StatusBadge, StatusCard } from '../../components/consultant/StatusComponents';
import { consultantFlowStyles, pendingApprovalStyles } from '../../constants/styles/consultantFlowStyles';
import { COLORS } from '../../constants/core/colors';
import { useAuth } from '../../contexts/AuthContext';

export default function PendingApproval() {
  const navigation = useNavigation();
  const { user, logout, refreshConsultantStatus, consultantVerificationStatus, activeRole, switchRole } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const isLoadingRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profile, setProfile] = useState<ConsultantProfile | null>(null);
  const [applications, setApplications] = useState<ConsultantApplication[]>([]);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  // Clear applications when user changes to prevent data from previous user
  useEffect(() => {
    if (user?.uid && user.uid !== lastUserId) {
      console.log('PendingApproval - User changed, clearing applications data');
      setApplications([]);
      setLastUserId(user.uid);
    }
  }, [user?.uid, lastUserId]);

  // Note: Navigation logic is now handled in loadData() after checking both profile AND service approval
  // This ensures consultants can only access screens when BOTH profile and at least one service are approved

  const loadData = useCallback(async () => {
    if (!user?.uid) {
      console.log('PendingApproval - No user UID, skipping data load');
      return;
    }
    
    console.log(`PendingApproval - Loading data for user: ${user.uid}`);
    setIsLoading(true);
    try {
      console.log('PendingApproval - Fetching profile and applications...');
      const [profileData, applicationsData] = await Promise.all([
        getConsultantProfile(user.uid),
        getConsultantApplications(),
      ]);
      
      console.log('PendingApproval - Profile data received:', profileData);
      console.log('PendingApproval - Applications data received:', applicationsData);
      
      setProfile(profileData);
      setApplications(applicationsData);

      // Check if profile is approved AND has at least one approved service
      if (profileData.status === 'approved') {
        console.log('PendingApproval - Profile approved, checking for approved services...');
        
        // Check if consultant has approved services
        const approvedServices = applicationsData.filter(app => app.status === 'approved');
        console.log('PendingApproval - Approved services count:', approvedServices.length);
        
        if (approvedServices.length > 0) {
          console.log('PendingApproval - Profile and services approved, switching to consultant role');
          
          // Automatically switch to consultant role if not already
          if (activeRole !== 'consultant') {
            try {
              await switchRole('consultant');
              console.log('PendingApproval - Successfully switched to consultant role');
            } catch (error: any) {
              console.error('PendingApproval - Error switching to consultant role:', error);
              // Continue navigation even if role switch fails
            }
          }
          
          // Navigate to consultant tabs (home screen) - both profile and services are approved
          console.log('PendingApproval - Navigating to consultant tabs');
          (navigation as any).reset({
            index: 0,
            routes: [{ name: 'ConsultantTabs' as never }],
          });
        } else {
          console.log('PendingApproval - Profile approved but no services approved, staying on PendingApproval screen');
          // Don't navigate - consultant must have at least one approved service
          // The screen will show the appropriate message
        }
      }
    } catch (error: any) {
      console.error('PendingApproval - Error loading consultant data:', error);
      console.error('PendingApproval - Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      
      // Handle 404 - profile doesn't exist yet
      if (error.response?.status === 404) {
        console.log('PendingApproval - 404: No profile found - consultant needs to create profile on the app');
        setProfile(null); // Set profile to null to show "Create Profile" UI
      } else {
        // For other errors, also set profile to null to show create profile option
        console.log('PendingApproval - Non-404 error, setting profile to null');
        setProfile(null);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      console.log('PendingApproval - Data load complete');
    }
  }, [user?.uid, navigation]);

  useFocusEffect(
    useCallback(() => {
      // Prevent infinite loop - if already approved in AuthContext, don't reload
      if (consultantVerificationStatus === 'approved') {
        console.log('PendingApproval - Already approved, skipping reload');
        setIsLoading(false); // Make sure loading is false
        return;
      }

      // Prevent multiple simultaneous loads
      if (isLoadingRef.current) {
        console.log('PendingApproval - Already loading, skipping reload');
        return;
      }

      console.log('PendingApproval screen focused - reloading profile data');
      isLoadingRef.current = true;
      setIsLoading(true);
      
      // Inline the data loading logic to avoid dependency issues
      const loadDataInline = async () => {
        if (!user?.uid) {
          console.log('PendingApproval - No user UID, skipping data load');
          isLoadingRef.current = false;
          setIsLoading(false);
          return;
        }

        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.log('PendingApproval - Loading timeout, setting loading to false');
          isLoadingRef.current = false;
          setIsLoading(false);
        }, 10000); // 10 second timeout
        
        console.log(`PendingApproval - Loading data for user: ${user.uid}`);
        try {
          console.log('PendingApproval - Fetching profile...');
          const profileData = await getConsultantProfile(user.uid);
          
          console.log('PendingApproval - Profile data received:', profileData);
          
          setProfile(profileData);

          // Always fetch applications to check if services are approved
          console.log('PendingApproval - Fetching applications...');
          
          const applicationsData = await getConsultantApplications();
          console.log('PendingApproval - Applications data received:', applicationsData);
          console.log('PendingApproval - Applications count:', applicationsData?.length || 0);
          console.log('PendingApproval - Applications details:', JSON.stringify(applicationsData, null, 2));
          
          // Frontend safety check: Filter applications to only include current user's applications
          const currentUserId = user?.uid;
          const filteredApplications = applicationsData?.filter(app => app.consultantId === currentUserId) || [];
          console.log('PendingApproval - Filtered applications for current user:', filteredApplications.length);
          console.log('PendingApproval - Current user ID:', currentUserId);
          console.log('PendingApproval - Filtered applications:', JSON.stringify(filteredApplications, null, 2));
          
          // Warn if backend returned applications for different users
          const otherUsersApplications = applicationsData?.filter(app => app.consultantId !== currentUserId) || [];
          if (otherUsersApplications.length > 0) {
            console.warn('⚠️ BACKEND ISSUE: Received applications for other users:', otherUsersApplications.length);
            console.warn('⚠️ Other user IDs:', [...new Set(otherUsersApplications.map(app => app.consultantId))]);
          }
          
          setApplications(filteredApplications);
          
          // Check if profile is approved AND has at least one approved service
          if (profileData.status === 'approved') {
            console.log('PendingApproval - Profile approved, checking for approved services...');
            
            // Check if consultant has approved services
            const approvedServices = filteredApplications.filter(app => app.status === 'approved');
            console.log('PendingApproval - Approved services count:', approvedServices.length);
            
            if (approvedServices.length > 0) {
              console.log('PendingApproval - Profile and services approved, refreshing auth context and navigating');
              setIsLoading(false); // Set loading to false before navigation
              
              // Refresh the consultant status in AuthContext
              await refreshConsultantStatus();
              
              // Automatically switch to consultant role if not already
              if (activeRole !== 'consultant') {
                try {
                  await switchRole('consultant');
                  console.log('PendingApproval - Successfully switched to consultant role');
                } catch (error: any) {
                  console.error('PendingApproval - Error switching to consultant role:', error);
                  // Continue navigation even if role switch fails
                }
              }
              
              // Navigate to consultant tabs (home screen) - both profile and services are approved
              console.log('PendingApproval - Navigating to consultant tabs');
              (navigation as any).reset({
                index: 0,
                routes: [{ name: 'ConsultantTabs' as never }],
              });
              return; // Exit early
            } else {
              console.log('PendingApproval - Profile approved but no services approved, staying on screen');
              // Don't navigate - consultant must have at least one approved service
            }
          }
        } catch (error: any) {
          console.error('PendingApproval - Error loading consultant data:', error);
          
          // Handle 404 - profile doesn't exist yet
          if (error.response?.status === 404) {
            console.log('PendingApproval - 404: No profile found - consultant needs to create profile');
            showInfo('No profile found. Please create your consultant profile to get started.');
            setProfile(null);
          } else {
            console.log('PendingApproval - Non-404 error, setting profile to null');
            // Don't show toast for network errors as they're handled by the fetcher
            if (error.response?.status >= 500) {
              showWarning('Unable to load profile data. Please try again later.');
            }
            setProfile(null);
          }
        } finally {
          clearTimeout(timeoutId); // Clear the timeout
          isLoadingRef.current = false;
          setIsLoading(false);
          setIsRefreshing(false);
          console.log('PendingApproval - Data load complete');
        }
      };
      
      loadDataInline();
      
      // Cleanup function to ensure loading state is reset if component unmounts
      return () => {
        console.log('PendingApproval - useFocusEffect cleanup');
        isLoadingRef.current = false;
        setIsLoading(false);
      };
    }, [user?.uid, consultantVerificationStatus, navigation, refreshConsultantStatus, activeRole, switchRole]) // Removed isLoading to prevent infinite loop
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' as never }],
    });
  };

  const handleCreateProfile = () => {
    navigation.navigate('ConsultantProfileFlow' as never);
  };

  const handleEditProfile = () => {
    navigation.navigate('ConsultantProfileFlow' as never);
  };

  const handleApplyServices = () => {
    // Navigate to BrowseServicesScreen to apply from existing services
    navigation.navigate('BrowseServices' as never);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={consultantFlowStyles.container}>
        <View style={consultantFlowStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={consultantFlowStyles.loadingText}>Loading your status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusTitle = () => {
    if (!profile) return 'Welcome to Tray Consultant!';
    switch (profile.status) {
      case 'approved':
        return 'Profile Approved! 🎉';
      case 'pending':
        return 'Verification Pending';
      case 'rejected':
        return 'Application Needs Revision';
      default:
        return 'Verification Pending';
    }
  };

  const getStatusMessage = () => {
    if (!profile) return 'Thank you for registering as a consultant! To get started, you need to create your consultant profile and apply for services. Complete the form below to provide detailed information about your expertise and experience.';
    switch (profile.status) {
      case 'approved':
        // Check if consultant has approved services
        const approvedServices = applications.filter(a => a.status === 'approved');
        if (approvedServices.length > 0) {
          return 'Congratulations! Your profile and services have been approved. You can now access the full consultant applications screen.';
        } else {
          return 'Your consultant profile has been approved. You must apply for services to complete your consultant setup and start earning.';
        }
      case 'pending':
        return 'Your profile is currently under review by our admin team. This usually takes 24-48 hours. We\'ll notify you once the review is complete.';
      case 'rejected':
        return 'Your application needs some revisions. Please review the feedback and update your profile.';
      default:
        return 'Your profile is being reviewed by our team.';
    }
  };

  const handleCreateCustomService = () => {
    navigation.navigate('ConsultantServiceSetup' as never);
  };

  const pendingApplications = applications.filter(a => a.status === 'pending');
  const approvedApplications = applications.filter(a => a.status === 'approved');
  const rejectedApplications = applications.filter(a => a.status === 'rejected');

  // If consultant is already approved, don't render anything (navigation will happen)
  if (consultantVerificationStatus === 'approved') {
    console.log('PendingApproval - Render check: Consultant approved, returning null');
    return null;
  }

  // Show loading screen while fetching data
  if (isLoading) {
    return (
      <View style={consultantFlowStyles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.green} />
        <Text style={consultantFlowStyles.loadingText}>Loading your status...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={consultantFlowStyles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, alignItems: 'center' }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.green}
          />
        }
      >
      {/* Status Icon */}
      <StatusBadge
        status={profile?.status || 'no_profile'}
        showIcon={true}
        size="large"
      />

      {/* Status Title */}
      <Text style={pendingApprovalStyles.statusTitle}>
        {getStatusTitle()}
      </Text>

      {/* Status Message */}
      <Text style={pendingApprovalStyles.statusMessage}>
        {getStatusMessage()}
      </Text>

      {/* Welcome Card for new consultants */}
      {!profile && (
        <View style={pendingApprovalStyles.welcomeCard}>
          <Text style={pendingApprovalStyles.welcomeCardTitle}>📋 Next Steps:</Text>
          <View style={pendingApprovalStyles.stepContainer}>
            <Text style={pendingApprovalStyles.stepNumber}>1.</Text>
            <Text style={pendingApprovalStyles.stepText}>Click the button below to create your profile</Text>
          </View>
          <View style={pendingApprovalStyles.stepContainer}>
            <Text style={pendingApprovalStyles.stepNumber}>2.</Text>
            <Text style={pendingApprovalStyles.stepText}>Complete your consultant profile with your experience and expertise</Text>
          </View>
          <View style={pendingApprovalStyles.stepContainer}>
            <Text style={pendingApprovalStyles.stepNumber}>3.</Text>
            <Text style={pendingApprovalStyles.stepText}>Apply for services you want to offer</Text>
          </View>
          <View style={pendingApprovalStyles.stepContainer}>
            <Text style={pendingApprovalStyles.stepNumber}>4.</Text>
            <Text style={pendingApprovalStyles.stepText}>Wait for admin approval (24-48 hours)</Text>
          </View>
        </View>
      )}

      {/* Next Steps Card - Only show if profile is approved and no approved services */}
      {profile?.status === 'approved' && approvedApplications.length === 0 && (
        <>
          {/* Next Steps Section */}
          <View style={pendingApprovalStyles.card}>
            <Text style={pendingApprovalStyles.cardTitle}>Next Steps</Text>
            
            <View style={{ marginTop: 16, gap: 16 }}>
              {/* Step 1: Profile Created */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: COLORS.green,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <CheckCircle size={18} color={COLORS.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 4 }}>
                    Profile Created
                  </Text>
                  <Text style={{ fontSize: 14, color: COLORS.gray, lineHeight: 20 }}>
                    Your consultant profile is approved
                  </Text>
                </View>
              </View>

              {/* Step 2: Apply for Services */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#6B7280',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Plus size={18} color={COLORS.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 4 }}>
                    Apply for Services
                  </Text>
                  <Text style={{ fontSize: 14, color: COLORS.gray, lineHeight: 20 }}>
                    <Text style={{ fontWeight: '600', color: COLORS.red }}>REQUIRED:</Text> Apply for services to complete consultant setup
                  </Text>
                </View>
              </View>

              {/* Step 3: Start Earning */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#6B7280',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ArrowRight size={18} color={COLORS.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 4 }}>
                    Start Earning
                  </Text>
                  <Text style={{ fontSize: 14, color: COLORS.gray, lineHeight: 20 }}>
                    Access app after service approval
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Why Apply for Services? Section */}
          <View style={pendingApprovalStyles.card}>
            <Text style={pendingApprovalStyles.cardTitle}>Why Apply for Services?</Text>
            
            <View style={{ marginTop: 16, gap: 16 }}>
              {/* Benefit 1: Earn Money */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#ECFDF5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <DollarSign size={20} color={COLORS.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 4 }}>
                    Earn Money
                  </Text>
                  <Text style={{ fontSize: 14, color: COLORS.gray, lineHeight: 20 }}>
                    Set your own rates and earn from consultations
                  </Text>
                </View>
              </View>

              {/* Benefit 2: Help Students */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#ECFDF5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Users size={20} color={COLORS.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 4 }}>
                    Help Students
                  </Text>
                  <Text style={{ fontSize: 14, color: COLORS.gray, lineHeight: 20 }}>
                    Share your expertise and mentor the next generation
                  </Text>
                </View>
              </View>

              {/* Benefit 3: Build Reputation */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#ECFDF5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Star size={20} color={COLORS.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 4 }}>
                    Build Reputation
                  </Text>
                  <Text style={{ fontSize: 14, color: COLORS.gray, lineHeight: 20 }}>
                    Gain reviews and build your professional brand
                  </Text>
                </View>
              </View>

              {/* Benefit 4: Flexible Schedule */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#ECFDF5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Calendar size={20} color={COLORS.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 4 }}>
                    Flexible Schedule
                  </Text>
                  <Text style={{ fontSize: 14, color: COLORS.gray, lineHeight: 20 }}>
                    Work on your own time and availability
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Profile Status Card - Only show if profile is pending or rejected */}
      {profile && profile.status !== 'approved' && (
        <StatusCard
          status={profile.status as any}
          title="Profile Status"
          message={getStatusMessage()}
          profile={{
            fullName: profile.personalInfo.fullName,
            category: profile.professionalInfo.category,
            experience: profile.personalInfo.experience,
          }}
          reviewNotes={profile.reviewNotes}
        />
      )}

      {/* Show message when profile is pending */}
      {profile?.status === 'pending' && (
        <View style={pendingApprovalStyles.card}>
          <View style={pendingApprovalStyles.cardHeader}>
            <Text style={pendingApprovalStyles.cardTitle}>Next Steps</Text>
          </View>
          
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Clock size={48} color={COLORS.orange} style={{ marginBottom: 12 }} />
            <Text style={{ 
              fontSize: 16, 
              color: COLORS.gray, 
              textAlign: 'center',
              marginBottom: 8,
              fontWeight: '600'
            }}>
              Profile Under Review
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: COLORS.gray, 
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 16
            }}>
              Once your profile is approved, you'll be able to apply for services and start earning.
            </Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={pendingApprovalStyles.actionsContainer}>
        {!profile ? (
          // For new consultants - prominent CTA button
          <>
            <TouchableOpacity
              style={pendingApprovalStyles.primaryButtonLarge}
              onPress={handleCreateProfile}
            >
              <Plus size={24} color="#fff" />
              <Text style={pendingApprovalStyles.primaryButtonLargeText}>
                Create Your Profile Now
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={pendingApprovalStyles.refreshButton}
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={20} color={COLORS.green} />
              <Text style={pendingApprovalStyles.refreshButtonText}>
                {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          // For consultants with profiles
          <>
            <TouchableOpacity
              style={pendingApprovalStyles.refreshButton}
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={20} color={COLORS.green} />
              <Text style={pendingApprovalStyles.refreshButtonText}>
                {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
              </Text>
            </TouchableOpacity>

            {profile.status === 'rejected' ? (
              <TouchableOpacity
                style={pendingApprovalStyles.primaryButton}
                onPress={handleEditProfile}
              >
                <Edit3 size={20} color="#fff" />
                <Text style={pendingApprovalStyles.primaryButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            ) : profile.status === 'approved' ? (
              // Check if consultant has approved services
              approvedApplications.length > 0 ? (
                <TouchableOpacity
                  style={pendingApprovalStyles.primaryButton}
                  onPress={() => {
                    // Navigate to consultant home since both profile and services are approved
                    (navigation as any).navigate('MainTabs', { role: 'consultant' });
                  }}
                >
                  <CheckCircle size={20} color="#fff" />
                  <Text style={pendingApprovalStyles.primaryButtonText}>Go to App</Text>
                </TouchableOpacity>
              ) : (
                <>
                  {/* Browse Platform Services Button */}
                  <TouchableOpacity
                    style={pendingApprovalStyles.primaryButton}
                    onPress={handleApplyServices}
                  >
                    <Star size={20} color="#fff" strokeWidth={2.5} />
                    <Text style={pendingApprovalStyles.primaryButtonText}>Browse Platform Services</Text>
                  </TouchableOpacity>
                  
                  {/* Create Custom Service Button */}
                  <TouchableOpacity
                    style={pendingApprovalStyles.secondaryButton}
                    onPress={handleCreateCustomService}
                  >
                    <Plus size={20} color={COLORS.green} />
                    <Text style={pendingApprovalStyles.secondaryButtonText}>Create Custom Service</Text>
                  </TouchableOpacity>
                </>
              )
            ) : null}
          </>
        )}

        <TouchableOpacity
          style={pendingApprovalStyles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={pendingApprovalStyles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Important Notice - Only show if profile is approved and no approved services */}
      {profile?.status === 'approved' && approvedApplications.length === 0 && (
        <View style={pendingApprovalStyles.noticeContainer}>
          <AlertCircle size={20} color="#F59E0B" />
          <Text style={pendingApprovalStyles.noticeText}>
            <Text style={{ fontWeight: '600' }}>IMPORTANT:</Text> You must apply for and receive approval for at least one service to access your consultant applications screen. You can apply to offer our platform services or create your own custom services. All applications are reviewed by admin within 24-48 hours.
          </Text>
        </View>
      )}

      {/* Help Text */}
      <View style={pendingApprovalStyles.helpContainer}>
        <FileText size={16} color="#6B7280" />
        <Text style={pendingApprovalStyles.helpText}>
          Need help? Contact support at support@tray.com
        </Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

