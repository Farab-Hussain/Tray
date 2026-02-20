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
import {
  Clock,
  Edit3,
  RefreshCw,
  FileText,
  Plus,
} from 'lucide-react-native';
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
import { logger } from '../../utils/logger';

export default function PendingApproval() {
  const navigation = useNavigation();
  const { user, logout, refreshConsultantStatus, activeRole, switchRole } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const isLoadingRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profile, setProfile] = useState<ConsultantProfile | null>(null);
  const [applications, setApplications] = useState<ConsultantApplication[]>([]);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  // Clear applications when user changes to prevent data from previous user
  useEffect(() => {
    if (user?.uid && user.uid !== lastUserId) {
            if (__DEV__) {
        logger.debug('PendingApproval - User changed, clearing applications data')
      };
      setApplications([]);
      setLastUserId(user.uid);
    }
  }, [user?.uid, lastUserId]);

  // Note: Navigation logic is now handled in loadData() after checking both profile AND service approval
  // This ensures consultants can only access screens when BOTH profile and at least one service are approved

  const loadData = useCallback(async () => {
    if (!user?.uid) {
            if (__DEV__) {
        logger.debug('PendingApproval - No user UID, skipping data load')
      };
      return;
    }
    
        if (__DEV__) {
      logger.debug(`PendingApproval - Loading data for user: ${user.uid}`)
    };
    setIsLoading(true);
    try {
            if (__DEV__) {
        logger.debug('PendingApproval - Fetching profile and applications...')
      };
      const [profileData, applicationsData] = await Promise.all([
        getConsultantProfile(user.uid),
        getConsultantApplications(),
      ]);
      
            if (__DEV__) {
        logger.debug('PendingApproval - Profile data received:', profileData)
      };
            if (__DEV__) {
        logger.debug('PendingApproval - Applications data received:', applicationsData)
      };
      
      setProfile(profileData);
      setApplications(applicationsData);

      // Check if profile is approved AND has at least one approved service
      if (profileData.status === 'approved') {
                if (__DEV__) {
          logger.debug('PendingApproval - Profile approved, checking for approved services...')
        };
        
        // Check if consultant has approved services
        const approvedServices = applicationsData.filter(app => app.status === 'approved');
                if (__DEV__) {
          logger.debug('PendingApproval - Approved services count:', approvedServices.length)
        };
        
        if (approvedServices.length > 0) {
                    if (__DEV__) {
            logger.debug('PendingApproval - Profile and services approved, switching to consultant role')
          };
          
          // Automatically switch to consultant role if not already
          if (activeRole !== 'consultant') {
            try {
              await switchRole('consultant');
                            if (__DEV__) {
                logger.debug('PendingApproval - Successfully switched to consultant role')
              };
            } catch (error: any) {
                            if (__DEV__) {
                logger.error('PendingApproval - Error switching to consultant role:', error)
              };
              // Continue navigation even if role switch fails
            }
          }
          
          // Navigate to consultant tabs (home screen) - both profile and services are approved
                    if (__DEV__) {
            logger.debug('PendingApproval - Navigating to consultant tabs')
          };
          (navigation as any).reset({
            index: 0,
            routes: [{ name: 'ConsultantTabs' as never }],
          });
        } else {
                    if (__DEV__) {
            logger.debug('PendingApproval - Profile approved but no services approved, staying on PendingApproval screen')
          };
          // Don't navigate - consultant must have at least one approved service
          // The screen will show the appropriate message
        }
      }
    } catch (error: any) {
            if (__DEV__) {
        logger.error('PendingApproval - Error loading consultant data:', error)
      };
            if (__DEV__) {
        logger.error('PendingApproval - Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      })
      };
      
      // Handle 404 - profile doesn't exist yet
      if (error.response?.status === 404) {
                if (__DEV__) {
          logger.debug('PendingApproval - 404: No profile found - consultant needs to create profile on the app')
        };
        setProfile(null); // Set profile to null to show "Create Profile" UI
      } else {
        // For other errors, also set profile to null to show create profile option
                if (__DEV__) {
          logger.debug('PendingApproval - Non-404 error, setting profile to null')
        };
        setProfile(null);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
            if (__DEV__) {
        logger.debug('PendingApproval - Data load complete')
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, navigation, refreshConsultantStatus, activeRole, switchRole]);

  useFocusEffect(
    useCallback(() => {
      // Prevent multiple simultaneous loads
      if (isLoadingRef.current) {
                if (__DEV__) {
          logger.debug('PendingApproval - Already loading, skipping reload')
        };
        return;
      }

            if (__DEV__) {
        logger.debug('PendingApproval screen focused - reloading profile data')
      };
      isLoadingRef.current = true;
      setIsLoading(true);
      
      // Inline the data loading logic to avoid dependency issues
      const loadDataInline = async () => {
        if (!user?.uid) {
                    if (__DEV__) {
            logger.debug('PendingApproval - No user UID, skipping data load')
          };
          isLoadingRef.current = false;
          setIsLoading(false);
          return;
        }

        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
                    if (__DEV__) {
            logger.debug('PendingApproval - Loading timeout, setting loading to false')
          };
          isLoadingRef.current = false;
          setIsLoading(false);
        }, 10000); // 10 second timeout
        
                if (__DEV__) {
          logger.debug(`PendingApproval - Loading data for user: ${user.uid}`)
        };
        try {
                    if (__DEV__) {
            logger.debug('PendingApproval - Fetching profile...')
          };
          const profileData = await getConsultantProfile(user.uid);
          
                    if (__DEV__) {
            logger.debug('PendingApproval - Profile data received:', profileData)
          };
          
          setProfile(profileData);

          // Always fetch applications to check if services are approved
                    if (__DEV__) {
            logger.debug('PendingApproval - Fetching applications...')
          };
          
          const applicationsData = await getConsultantApplications();
                    if (__DEV__) {
            logger.debug('PendingApproval - Applications data received:', applicationsData)
          };
                    if (__DEV__) {
            logger.debug('PendingApproval - Applications count:', applicationsData?.length || 0)
          };
                    if (__DEV__) {
            logger.debug('PendingApproval - Applications details:', JSON.stringify(applicationsData, null, 2))
          };
          
          // Frontend safety check: Filter applications to only include current user's applications
          const currentUserId = user?.uid;
          const filteredApplications = applicationsData?.filter(app => app.consultantId === currentUserId) || [];
                    if (__DEV__) {
            logger.debug('PendingApproval - Filtered applications for current user:', filteredApplications.length)
          };
                    if (__DEV__) {
            logger.debug('PendingApproval - Current user ID:', currentUserId)
          };
                    if (__DEV__) {
            logger.debug('PendingApproval - Filtered applications:', JSON.stringify(filteredApplications, null, 2))
          };
          
          // Warn if backend returned applications for different users
          const otherUsersApplications = applicationsData?.filter(app => app.consultantId !== currentUserId) || [];
          if (otherUsersApplications.length > 0) {
                        if (__DEV__) {
              logger.warn('⚠️ BACKEND ISSUE: Received applications for other users:', otherUsersApplications.length)
            };
                        if (__DEV__) {
              logger.warn('⚠️ Other user IDs:', [...new Set(otherUsersApplications.map(app => app.consultantId))])
            };
          }
          
          setApplications(filteredApplications);
          
          // Check if profile is approved AND has at least one approved service
          if (profileData.status === 'approved') {
                        if (__DEV__) {
              logger.debug('PendingApproval - Profile approved, checking for approved services...')
            };
            
            // Check if consultant has approved services
            const approvedServices = filteredApplications.filter(app => app.status === 'approved');
                        if (__DEV__) {
              logger.debug('PendingApproval - Approved services count:', approvedServices.length)
            };
            
            if (approvedServices.length > 0) {
                            if (__DEV__) {
                logger.debug('PendingApproval - Profile and services approved, refreshing auth context and navigating')
              };
              
              // Clear loading state first
              clearTimeout(timeoutId);
              isLoadingRef.current = false;
              setIsLoading(false);
              setIsRefreshing(false);
              
              // Small delay to ensure state updates before navigation
              await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
              
              // Refresh the consultant status in AuthContext
              try {
                await refreshConsultantStatus();
              } catch (error) {
                                if (__DEV__) {
                  logger.error('PendingApproval - Error refreshing consultant status:', error)
                };
              }
              
              // Automatically switch to consultant role if not already
              if (activeRole !== 'consultant') {
                try {
                  await switchRole('consultant');
                                    if (__DEV__) {
                    logger.debug('PendingApproval - Successfully switched to consultant role')
                  };
                } catch (error: any) {
                                    if (__DEV__) {
                    logger.error('PendingApproval - Error switching to consultant role:', error)
                  };
                  // Continue navigation even if role switch fails
                }
              }
              
              // Navigate to consultant tabs (home screen) - both profile and services are approved
                            if (__DEV__) {
                logger.debug('PendingApproval - Navigating to consultant tabs')
              };
              try {
                (navigation as any).reset({
                  index: 0,
                  routes: [{ name: 'ConsultantTabs' as never }],
                });
              } catch (navError) {
                                if (__DEV__) {
                  logger.error('PendingApproval - Navigation error:', navError)
                };
                // If navigation fails, at least show the screen content
                setIsLoading(false);
              }
              return; // Exit early
            } else {
                            if (__DEV__) {
                logger.debug('PendingApproval - Profile approved but no services approved, staying on screen')
              };
              // Don't navigate - consultant must have at least one approved service
            }
          }
        } catch (error: any) {
                    if (__DEV__) {
            logger.error('PendingApproval - Error loading consultant data:', error)
          };
          
          // Handle 404 - profile doesn't exist yet
          if (error.response?.status === 404) {
                        if (__DEV__) {
              logger.debug('PendingApproval - 404: No profile found - consultant needs to create profile')
            };
            showInfo('No profile found. Please create your consultant profile to get started.');
            setProfile(null);
          } else {
                        if (__DEV__) {
              logger.debug('PendingApproval - Non-404 error, setting profile to null')
            };
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
                    if (__DEV__) {
            logger.debug('PendingApproval - Data load complete')
          };
        }
      };
      
      loadDataInline();
      
      // Cleanup function to ensure loading state is reset if component unmounts
      return () => {
                if (__DEV__) {
          logger.debug('PendingApproval - useFocusEffect cleanup')
        };
        isLoadingRef.current = false;
        setIsLoading(false);
      };
    }, [user?.uid, navigation, refreshConsultantStatus, activeRole, switchRole]) // Removed consultantVerificationStatus to prevent premature exits
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

  // const handleApplyServices = () => {
  //   // Navigate to BrowseServicesScreen to apply from existing services
  //   navigation.navigate('BrowseServices' as never);
  // };

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
      case 'pending':
        return 'Verification Pending';
      case 'rejected':
        return 'Application Needs Revision';
      default:
        return 'Verification Pending';
    }
  };

  const getStatusMessage = (status: string, _applicationsList: any[]) => {
    switch (status) {
      case 'pending':
        return 'Your profile is currently under review by our admin team. This usually takes 24-48 hours. We\'ll notify you once the review is complete.';
      case 'rejected':
        return 'Your application needs some revisions. Please review the feedback and update your profile.';
      default:
        return 'Your profile is being reviewed by our team.';
    }
  };

  // const handleCreateCustomService = () => {
  //   navigation.navigate('ConsultantTabs' as never);
  // };

  const handleManageApplications = () => {
    navigation.navigate('ConsultantApplications' as never);
  };

  const approvedApplications = applications.filter(a => a.status === 'approved');
  const pendingApplications = applications.filter(a => a.status === 'pending');
  const hasAnyApplications = applications.length > 0;
  
  // Debug logging
    if (__DEV__) {
    logger.debug('PendingApproval - Applications state:', {
    total: applications.length,
    approved: approvedApplications.length,
    pending: pendingApplications.length,
    hasAnyApplications,
    profileStatus: profile?.status,
  })
  };

  // Show loading screen while fetching data
  // Note: Don't return null for approved status - let the navigation logic handle it
  // Returning null causes white screen issues
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
        {getStatusMessage(profile?.status || 'no_profile', applications)}
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

    

      {/* Profile Status Card - Only show if profile is pending or rejected */}
      {profile && profile.status !== 'approved' && (
        <StatusCard
          status={profile.status as any}
          title="Profile Status"
          message={getStatusMessage(profile?.status || 'no_profile', applications)}
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
            ) : profile.status === 'pending' && hasAnyApplications ? (
              // Show Manage Applications button even when profile is pending
              <TouchableOpacity
                style={pendingApprovalStyles.secondaryButton}
                onPress={handleManageApplications}
              >
                <FileText size={20} color={COLORS.green} />
                <Text style={pendingApprovalStyles.secondaryButtonText}>
                  Manage Applications ({applications.length})
                </Text>
              </TouchableOpacity>
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


    
      </ScrollView>
    </SafeAreaView>
  );
}

