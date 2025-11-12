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
import { Clock, CheckCircle, XCircle, FileText, RefreshCw, Plus, Edit3 } from 'lucide-react-native';
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

  // Check if consultant is already approved in AuthContext - run immediately on mount
  useEffect(() => {
    if (consultantVerificationStatus === 'approved') {
      console.log('PendingApproval - Consultant already approved in AuthContext, switching role and navigating');
      setIsLoading(false);
      
      // Automatically switch to consultant role if not already
      if (activeRole !== 'consultant') {
        switchRole('consultant').then(() => {
          navigation.navigate('ConsultantServiceSetup' as never);
        }).catch((error) => {
          console.error('PendingApproval - Error switching role:', error);
          navigation.navigate('ConsultantServiceSetup' as never);
        });
      } else {
        navigation.navigate('ConsultantServiceSetup' as never);
      }
    }
  }, [consultantVerificationStatus, navigation, activeRole, switchRole]);

  // Additional immediate check on component mount
  useEffect(() => {
    // If we have a user and consultantVerificationStatus is approved, navigate immediately
    if (user && consultantVerificationStatus === 'approved') {
      console.log('PendingApproval - Mount check: Consultant approved, switching role and navigating');
      
      // Automatically switch to consultant role if not already
      if (activeRole !== 'consultant') {
        switchRole('consultant').then(() => {
          navigation.navigate('ConsultantServiceSetup' as never);
        }).catch((error) => {
          console.error('PendingApproval - Error switching role:', error);
          navigation.navigate('ConsultantServiceSetup' as never);
        });
      } else {
        navigation.navigate('ConsultantServiceSetup' as never);
      }
    }
  }, [user, consultantVerificationStatus, navigation, activeRole, switchRole]);

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

      // If approved, automatically switch to consultant role and navigate
      if (profileData.status === 'approved') {
        console.log('PendingApproval - Profile approved, switching to consultant role');
        
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
        
        // Navigate to service setup screen
        navigation.navigate('ConsultantServiceSetup' as never);
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
          setIsLoading(false);
          return;
        }

        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.log('PendingApproval - Loading timeout, setting loading to false');
          setIsLoading(false);
        }, 10000); // 10 second timeout
        
        console.log(`PendingApproval - Loading data for user: ${user.uid}`);
        try {
          console.log('PendingApproval - Fetching profile...');
          const profileData = await getConsultantProfile(user.uid);
          
          console.log('PendingApproval - Profile data received:', profileData);
          
          setProfile(profileData);

          // If approved, refresh auth to update role and navigate immediately
          if (profileData.status === 'approved') {
            console.log('PendingApproval - Profile approved, refreshing auth context and navigating to service setup');
            setIsLoading(false); // Set loading to false before navigation
            
            // Refresh the consultant status in AuthContext
            await refreshConsultantStatus();
            
            // Navigate to service setup screen
            navigation.navigate('ConsultantServiceSetup' as never);
            return; // Exit early to prevent further execution
          }

          // Only fetch applications if not approved (to avoid unnecessary API calls)
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
    }, [user?.uid, consultantVerificationStatus, navigation, refreshConsultantStatus]) // Removed isLoading to prevent infinite loop
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
    navigation.navigate('ConsultantApplications' as never);
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
        return 'Application Approved!';
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
          return 'Congratulations! Your profile has been approved. Now you need to apply for services to complete your consultant setup.';
        }
      case 'pending':
        return 'Your profile is currently under review by our admin team. This usually takes 24-48 hours. We\'ll notify you once the review is complete.';
      case 'rejected':
        return 'Your application needs some revisions. Please review the feedback and update your profile.';
      default:
        return 'Your profile is being reviewed by our team.';
    }
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

      {/* Profile Status Card */}
      {profile && (
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

      {/* Applications Summary - Only show if profile is approved */}
      {profile?.status === 'approved' && (
        <>
          {applications.length > 0 ? (
        <View style={pendingApprovalStyles.card}>
          <View style={pendingApprovalStyles.cardHeader}>
            <Text style={pendingApprovalStyles.cardTitle}>Service Applications</Text>
            <TouchableOpacity onPress={handleApplyServices}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 14, color: COLORS.green, fontWeight: '600' }}>Manage</Text>
                <Plus size={16} color={COLORS.green} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={pendingApprovalStyles.statsRow}>
            <View style={pendingApprovalStyles.statItem}>
              <Clock size={24} color="#F59E0B" />
              <Text style={pendingApprovalStyles.statValue}>{pendingApplications.length}</Text>
              <Text style={pendingApprovalStyles.statLabel}>Pending</Text>
            </View>

            <View style={pendingApprovalStyles.statItem}>
              <CheckCircle size={24} color="#10B981" />
              <Text style={pendingApprovalStyles.statValue}>{approvedApplications.length}</Text>
              <Text style={pendingApprovalStyles.statLabel}>Approved</Text>
            </View>

            <View style={pendingApprovalStyles.statItem}>
              <XCircle size={24} color="#EF4444" />
              <Text style={pendingApprovalStyles.statValue}>{rejectedApplications.length}</Text>
              <Text style={pendingApprovalStyles.statLabel}>Rejected</Text>
            </View>
          </View>
        </View>
          ) : (
        <View style={pendingApprovalStyles.card}>
          <View style={pendingApprovalStyles.cardHeader}>
            <Text style={pendingApprovalStyles.cardTitle}>Service Applications</Text>
          </View>
          
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <FileText size={48} color={COLORS.gray} style={{ marginBottom: 12 }} />
            <Text style={{ 
              fontSize: 16, 
              color: COLORS.gray, 
              textAlign: 'center',
              marginBottom: 8,
              fontWeight: '600'
            }}>
              No Applications Yet
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: COLORS.gray, 
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 16
            }}>
              You haven't applied for any services yet. Start by applying for services you'd like to offer.
            </Text>
            
            <TouchableOpacity onPress={handleApplyServices} style={pendingApprovalStyles.primaryButton}>
              <Plus size={20} color={COLORS.white} />
              <Text style={pendingApprovalStyles.primaryButtonText}>Apply for Services</Text>
            </TouchableOpacity>
          </View>
        </View>
          )}
        </>
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
                <TouchableOpacity
                  style={pendingApprovalStyles.primaryButton}
                  onPress={handleApplyServices}
                >
                  <Plus size={20} color="#fff" />
                  <Text style={pendingApprovalStyles.primaryButtonText}>Apply for Services</Text>
                </TouchableOpacity>
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

