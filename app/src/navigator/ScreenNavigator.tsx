import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createStackNavigator, StackCardStyleInterpolator } from '@react-navigation/stack';
import { CommonActions } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/core/colors';
import { navigationRef } from './navigationRef';
import BottomTabs from './BottomNavigation';
import ConsultantBottomTabs from './ConsultantBottomNavigation';
import Help from '../Screen/common/Help/Help';
import Cart from '../Screen/Student/Cart/Cart';
import AllConsultants from '../Screen/Student/Consultants/AllConsultants';
import BookedConsultants from '../Screen/Student/Consultants/BookedConsultants';
import ConsultantBookings from '../Screen/Student/Consultants/ConsultantBookings';
import MyClients from '../Screen/Consultant/Clients/MyClients';
import Earnings from '../Screen/Consultant/Earnings/Earnings';
import Notifications from '../Screen/common/Notifications/Notifications';
import BookingSlots from '../Screen/Student/Booking/BookingSlots';
import ChatScreen from '../Screen/common/Messages/ChatScreen';
import CallingScreen from '../Screen/common/Calling/CallingScreen';
import VideoCallingScreen from '../Screen/common/Calling/VideoCallingScreen';
import ReviewEmployer from '../Screen/Student/Review/ReviewEmployer';
import EditProfile from '../Screen/common/Account/EditProfile';
import ChangePassword from '../Screen/common/Account/ChangePassword';
import ChangeUsername from '../Screen/common/Account/ChangeUsername';
import StudentProfile from '../Screen/Student/Profile/StudentProfile';
import RecruiterProfile from '../Screen/Recruiter/Profile/RecruiterProfile';
import RecruiterJobs from '../Screen/Recruiter/Jobs/RecruiterJobs';
import AllApplicationsScreen from '../Screen/Recruiter/Jobs/AllApplicationsScreen';
import MyReviews from '../Screen/Student/Review/MyReviews';
import ConsultantReviews from '../Screen/Consultant/Reviews/ConsultantReviews';
import EditReview from '../Screen/Student/Review/EditReview';
import ConsultantProfileFlow from '../Screen/Consultant/Profile/ConsultantProfileFlow';
import ConsultantApplicationsScreen from '../Screen/Consultant/Applications/ConsultantApplicationsScreen';
import BrowseServicesScreen from '../Screen/Consultant/Applications/BrowseServicesScreen';
import ConsultantAvailability from '../Screen/Consultant/Availability/ConsultantAvailability';
import ConsultantSlots from '../Screen/Consultant/Slots/ConsultantSlots';
import StudentAvailability from '../Screen/Student/Availability/StudentAvailability';
import PendingApproval from '../Screen/Consultant/PendingApproval';
import ConsultantServiceSetupScreen from '../Screen/Consultant/ServiceSetup/ConsultantServiceSetupScreen';
import ConsultantVerificationFlow from '../Screen/Consultant/Verification/ConsultantVerificationFlow';
import CreateProfile from '../Screen/common/Profile/CreateProfile';
import StripePaymentSetup from '../Screen/Consultant/Payment/StripePaymentSetup';
// Job screens
import JobListScreen from '../Screen/Student/Jobs/JobListScreen';
import JobDetailScreen from '../Screen/Student/Jobs/JobDetailScreen';
import ResumeScreen from '../Screen/Student/Jobs/ResumeScreen';
import MyApplicationsScreen from '../Screen/Student/Jobs/MyApplicationsScreen';
import PostJobScreen from '../Screen/Consultant/Jobs/PostJobScreen';
import MyJobsScreen from '../Screen/Consultant/Jobs/MyJobsScreen';
import JobApplicationsScreen from '../Screen/Consultant/Jobs/JobApplicationsScreen';
import ApplicationReviewScreen from '../Screen/Consultant/Jobs/ApplicationReviewScreen';
import ApplicationDetailScreen from '../Screen/Student/Jobs/ApplicationDetailScreen';
// Recruiter Job screens
import RecruiterPostJobScreen from '../Screen/Recruiter/Jobs/PostJobScreen';
import RecruiterMyJobsScreen from '../Screen/Recruiter/Jobs/MyJobsScreen';
import RecruiterJobApplicationsScreen from '../Screen/Recruiter/Jobs/JobApplicationsScreen';
import RecruiterApplicationReviewScreen from '../Screen/Recruiter/Jobs/ApplicationReviewScreen';

const Stack = createStackNavigator();

// Component to handle consultant onboarding flow
// Shows different screens based on consultant verification status and service approval
const ConsultantFlowHandler = () => {
  const { consultantVerificationStatus } = useAuth();
  
  // If not approved, show pending approval screen
  if (consultantVerificationStatus !== 'approved') {
    return <PendingApproval />;
  }
  
  // If approved, show service setup screen
  // This screen will handle checking for approved services and redirecting accordingly
  return <ConsultantServiceSetupScreen />;
};

// Component to render appropriate bottom tabs based on role
const RoleBasedTabs = () => {
  const { role, activeRole, needsProfileCreation, consultantVerificationStatus, user } = useAuth();
  const [hasApprovedServices, setHasApprovedServices] = React.useState<boolean | null>(null);
  const [isChecking, setIsChecking] = React.useState(true);
  
  // Use activeRole if available, fallback to role for backward compatibility
  const currentRole = activeRole || role;
  
  // Debug logging for role changes
  React.useEffect(() => {
    console.log('🔄 [RoleBasedTabs] Role changed:', { role, activeRole, currentRole });
  }, [role, activeRole, currentRole]);
  
  // Check if email is verified - redirect to EmailVerification if not
  React.useEffect(() => {
    if (user && !user.emailVerified) {
      if (navigationRef.isReady()) {
        navigationRef.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'Auth',
                params: {
                  screen: 'EmailVerification',
                  params: { 
                    email: user.email,
                    fromLogin: true 
                  }
                }
              }
            ]
          })
        );
      }
    }
  }, [user]);
  
  // If email is not verified, show loading while redirecting
  if (user && !user.emailVerified) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={{ marginTop: 12, fontSize: 16, color: COLORS.gray }}>
            Redirecting to email verification...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Check if consultant has approved services
  React.useEffect(() => {
    const checkApprovedServices = async () => {
      // If not consultant, don't check
      if (currentRole !== 'consultant') {
        setHasApprovedServices(null);
        setIsChecking(false);
        return;
      }
      
      // If profile is not approved or status is unknown, no need to check services
      if (consultantVerificationStatus !== 'approved') {
        setHasApprovedServices(null);
        setIsChecking(false);
        return;
      }
      
      // Only check services if profile is approved
      if (user?.uid) {
        try {
          // Add timeout to prevent infinite loading
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 10000)
          );
          
          const { getConsultantApplications } = await import('../services/consultantFlow.service');
          const applicationsPromise = getConsultantApplications();
          
          const applications = await Promise.race([applicationsPromise, timeoutPromise]) as any;
          const approvedServices = applications.filter((app: any) => app.status === 'approved');
          setHasApprovedServices(approvedServices.length > 0);
        } catch (error) {
          console.error('Error checking approved services:', error);
          setHasApprovedServices(false);
        }
      } else {
        setHasApprovedServices(false);
      }
      setIsChecking(false);
    };
    
    checkApprovedServices();
  }, [currentRole, consultantVerificationStatus, user?.uid]);
  
  // If profile needs to be created, show profile creation screen
  if (needsProfileCreation) {
    return <CreateProfile />;
  }
  
  // For consultants, check if both profile and services are approved
  if (currentRole === 'consultant') {
    // If still checking, show loading screen
    if (isChecking) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={{ marginTop: 12, fontSize: 16, color: COLORS.gray }}>
              Loading your status...
            </Text>
          </View>
        </SafeAreaView>
      );
    }
    
    // If profile is not approved, show pending approval
    if (consultantVerificationStatus !== 'approved') {
      return <PendingApproval />;
    }
    
    // If profile is approved but no services are approved, show service setup
    if (hasApprovedServices === false) {
      return <ConsultantServiceSetupScreen />;
    }
    
    // Only show consultant tabs if both profile AND services are approved
    if (hasApprovedServices === true) {
      return <ConsultantBottomTabs />;
    }
    
    // Default fallback - should not reach here, but show pending approval as fallback
    console.warn('⚠️ [RoleBasedTabs] Unexpected consultant state, showing pending approval');
    return <PendingApproval />;
  }
  
  // For recruiters, show student tabs (they use the same navigation structure)
  if (currentRole === 'recruiter') {
    console.log('✅ [RoleBasedTabs] Showing student tabs for recruiter role');
    return <BottomTabs />;
  }
  
  // Default: show student tabs (for student role or if role is null/undefined)
  console.log('✅ [RoleBasedTabs] Showing student tabs for role:', currentRole);
  return <BottomTabs />;
};

// Custom transition animations for screen navigator
const slideFromRight: StackCardStyleInterpolator = ({ current, layouts }) => {
  return {
    cardStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width, 0],
          }),
        },
      ],
    },
  };
};

const slideFromBottom: StackCardStyleInterpolator = ({ current, layouts }) => {
  return {
    cardStyle: {
      transform: [
        {
          translateY: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.height, 0],
          }),
        },
      ],
    },
  };
};

const modalSlideFromBottom: StackCardStyleInterpolator = ({ current, layouts }) => {
  return {
    cardStyle: {
      transform: [
        {
          translateY: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.height, 0],
          }),
        },
      ],
      opacity: current.progress,
    },
  };
};

const scaleAndSlide: StackCardStyleInterpolator = ({ current, layouts }) => {
  return {
    cardStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width, 0],
          }),
        },
        {
          scale: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1],
          }),
        },
      ],
      opacity: current.progress,
    },
  };
};

const ScreenNavigator = () => {
  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyleInterpolator: slideFromRight,
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 300,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 300,
            },
          },
        },
      }}
      initialRouteName="MainTabs"
    >
      {/* Bottom tab navigator - this will show the bottom navigation on all main screens */}
      <Stack.Screen 
        name="MainTabs" 
        component={RoleBasedTabs}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      {/* Handle direct navigation to Home - this will show the bottom navigation */}
      <Stack.Screen 
        name="Home" 
        component={RoleBasedTabs}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      {/* Help & Support Screen */}
      <Stack.Screen 
        name="Help" 
        component={Help}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      {/* Edit Profile Screen */}
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfile}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      {/* Change Password Screen */}
      <Stack.Screen
        name="ChangePassword"
        component={ChangePassword}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      {/* Change Username Screen */}
      <Stack.Screen
        name="ChangeUsername"
        component={ChangeUsername}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      {/* Student Profile Screen */}
      <Stack.Screen
        name="StudentProfile"
        component={StudentProfile}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      {/* Recruiter Profile Screen */}
      <Stack.Screen
        name="RecruiterProfile"
        component={RecruiterProfile}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />

      {/* Recruiter Jobs Screen */}
      <Stack.Screen
        name="RecruiterJobs"
        component={RecruiterJobs}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      {/* Cart Screen */}
      <Stack.Screen 
        name="Cart" 
        component={Cart}
        options={{
          cardStyleInterpolator: slideFromBottom,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 400,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      />
      
      {/* Consultants Screen */}
      <Stack.Screen 
        name="Consultants" 
        component={AllConsultants}
        options={{
          cardStyleInterpolator: scaleAndSlide,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 350,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      />
      
      {/* Booked Consultants Screen */}
      <Stack.Screen 
        name="BookedConsultants" 
        component={BookedConsultants}
        options={{
          cardStyleInterpolator: scaleAndSlide,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 350,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      />
      
      {/* Consultant Bookings Screen - Detailed view of bookings with a specific consultant */}
      <Stack.Screen 
        name="ConsultantBookings" 
        component={ConsultantBookings}
        options={{
          cardStyleInterpolator: slideFromRight,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      />
      
      {/* My Clients Screen (for consultants) */}
      <Stack.Screen 
        name="MyClients" 
        component={MyClients}
        options={{
          cardStyleInterpolator: scaleAndSlide,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 350,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      />
      
      {/* Earnings Screen (for consultants) */}
      <Stack.Screen 
        name="Earnings" 
        component={Earnings}
        options={{
          cardStyleInterpolator: scaleAndSlide,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 350,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      />
      
      {/* Stripe Payment Setup Screen (for consultants) */}
      <Stack.Screen 
        name="StripePaymentSetup" 
        component={StripePaymentSetup}
        options={{
          cardStyleInterpolator: scaleAndSlide,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 350,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      />
      
      {/* Notifications Screen (for consultants) */}
      <Stack.Screen 
        name="ConsultantNotifications" 
        component={Notifications}
        options={{
          cardStyleInterpolator: scaleAndSlide,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 350,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      />
      
      {/* Booking Slots Screen */}
      <Stack.Screen 
        name="BookingSlots" 
        component={BookingSlots}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      />
      
      {/* Chat Screen */}
      <Stack.Screen 
        name="ChatScreen" 
        component={ChatScreen}
        options={{
          cardStyleInterpolator: modalSlideFromBottom,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 400,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      />
      
      {/* Calling Screen */}
      <Stack.Screen 
        name="CallingScreen" 
        component={CallingScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: modalSlideFromBottom,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 400,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      />
      
      {/* Video Calling Screen */}
      <Stack.Screen 
        name="VideoCallingScreen" 
        component={VideoCallingScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: modalSlideFromBottom,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 400,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      />
      
      {/* Review Employer Screen */}
      <Stack.Screen 
        name="ReviewEmployer" 
        component={ReviewEmployer}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      />
      
      {/* My Reviews Screen */}
      <Stack.Screen 
        name="MyReviews" 
        component={MyReviews}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      />
      
      {/* Consultant Reviews Screen */}
      <Stack.Screen 
        name="ConsultantReviews" 
        component={ConsultantReviews}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      />
      
      {/* Edit Review Screen */}
      <Stack.Screen 
        name="EditReview" 
        component={EditReview}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      />
      
      {/* Consultant Bottom Navigation */}
      <Stack.Screen 
        name="ConsultantTabs" 
        component={ConsultantBottomTabs}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      />

      {/* Consultant Onboarding Screens */}
      <Stack.Screen 
        name="ConsultantProfileFlow" 
        component={ConsultantProfileFlow}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />

      <Stack.Screen 
        name="ConsultantApplications" 
        component={ConsultantApplicationsScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />

      <Stack.Screen 
        name="BrowseServices" 
        component={BrowseServicesScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />

        <Stack.Screen
          name="ConsultantAvailability"
          component={ConsultantAvailability}
          options={{
            headerShown: false,
            cardStyleInterpolator: slideFromRight,
          }}
        />
        <Stack.Screen
          name="ConsultantSlots"
          component={ConsultantSlots}
          options={{
            headerShown: false,
            cardStyleInterpolator: slideFromRight,
          }}
        />
        <Stack.Screen
          name="StudentAvailability"
          component={StudentAvailability}
          options={{
            headerShown: false,
            cardStyleInterpolator: slideFromRight,
          }}
        />

      <Stack.Screen 
        name="PendingApproval" 
        component={PendingApproval}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />

      <Stack.Screen 
        name="ConsultantServiceSetup" 
        component={ConsultantServiceSetupScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />

      <Stack.Screen 
        name="ConsultantVerificationFlow" 
        component={ConsultantVerificationFlow}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />

      <Stack.Screen 
        name="CreateProfile" 
        component={CreateProfile}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />

      {/* Job System Screens - Student */}
      <Stack.Screen 
        name="JobList" 
        component={JobListScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      <Stack.Screen 
        name="JobDetail" 
        component={JobDetailScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      <Stack.Screen 
        name="Resume" 
        component={ResumeScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      <Stack.Screen 
        name="MyApplications" 
        component={MyApplicationsScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      <Stack.Screen 
        name="ApplicationDetail" 
        component={ApplicationDetailScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />

      {/* Job System Screens - Hiring Manager/Consultant */}
      <Stack.Screen 
        name="PostJob" 
        component={PostJobScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      <Stack.Screen 
        name="MyJobs" 
        component={MyJobsScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      <Stack.Screen 
        name="JobApplications" 
        component={JobApplicationsScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      <Stack.Screen 
        name="ApplicationReview" 
        component={ApplicationReviewScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />

      {/* Recruiter Job System Screens */}
      <Stack.Screen 
        name="RecruiterPostJob" 
        component={RecruiterPostJobScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      <Stack.Screen 
        name="RecruiterMyJobs" 
        component={RecruiterMyJobsScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      <Stack.Screen 
        name="RecruiterJobApplications" 
        component={RecruiterJobApplicationsScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      <Stack.Screen 
        name="RecruiterApplicationReview" 
        component={RecruiterApplicationReviewScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />

      {/* All Applications Screen */}
      <Stack.Screen
        name="RecruiterAllApplications"
        component={AllApplicationsScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      {/* Add any modal or overlay screens here that should appear on top of bottom tabs */}
    </Stack.Navigator>
  );
};

export default ScreenNavigator;
