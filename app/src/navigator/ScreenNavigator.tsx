import React from 'react';
import { createStackNavigator, StackCardStyleInterpolator } from '@react-navigation/stack';
import { CommonActions } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { navigationRef } from './navigationRef';
import BottomTabs from './BottomNavigation';
import ConsultantBottomTabs from './ConsultantBottomNavigation';
import { RecruiterBottomTabs } from './RecruiterBottomNavigation';
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
import WorkPreferences from '../Screen/Student/Profile/WorkPreferences';
import AuthorizationDocuments from '../Screen/Student/Profile/AuthorizationDocuments';
import CareerGoals from '../Screen/Student/Profile/CareerGoals';
import EducationScreen from '../Screen/Student/Profile/EducationScreen';
import CertificationsScreen from '../Screen/Student/Profile/CertificationsScreen';
import SkillsScreen from '../Screen/Student/Profile/SkillsScreen';
import ExternalProfilesScreen from '../Screen/Student/Profile/ExternalProfilesScreen';
import RecruiterProfile from '../Screen/Recruiter/Profile/RecruiterProfile';
import CompanyProfileScreen from '../Screen/Recruiter/Company/CompanyProfileScreen';
import ConsultantProfile from '../Screen/Consultant/Profile/ConsultantProfile';
import RecruiterJobs from '../Screen/Recruiter/Jobs/RecruiterJobs';
import AllApplicationsScreen from '../Screen/Recruiter/Jobs/AllApplicationsScreen';
import ConsultantAllApplicationsScreen from '../Screen/Consultant/Jobs/AllApplicationsScreen';
import MyReviews from '../Screen/Student/Review/MyReviews';
import ConsultantReviews from '../Screen/Consultant/Reviews/ConsultantReviews';
import EditReview from '../Screen/Student/Review/EditReview';
import ConsultantProfileFlow from '../Screen/Consultant/Profile/ConsultantProfileFlow';
import ConsultantDashboard from '../Screen/Consultant/Dashboard/ConsultantDashboard';
import ConsultantApplicationsScreen from '../Screen/Consultant/Applications/ConsultantApplicationsScreen';
import BrowseServicesScreen from '../Screen/Consultant/Applications/BrowseServicesScreen';
import ConsultantAvailability from '../Screen/Consultant/Availability/ConsultantAvailability';
import ConsultantSlots from '../Screen/Consultant/Slots/ConsultantSlots';
import StudentAvailability from '../Screen/Student/Availability/StudentAvailability';
import PendingApproval from '../Screen/Consultant/PendingApproval';
import ConsultantVerificationFlow from '../Screen/Consultant/Verification/ConsultantVerificationFlow';
import CreateProfile from '../Screen/common/Profile/CreateProfile';
import StripePaymentSetup from '../Screen/Consultant/Payment/StripePaymentSetup';
import JobPostingPaymentScreen from '../Screen/Recruiter/Payment/JobPostingPaymentScreen';
// Consultant Content screens
import ConsultantContentPostingScreen from '../Screen/Consultant/Content/ConsultantContentPostingScreen';
// Job screens
import JobListScreen from '../Screen/Student/Jobs/JobListScreen';
import JobDetailScreen from '../Screen/Student/Jobs/JobDetailScreen';
import ResumeScreen from '../Screen/Student/Jobs/ResumeScreen';
import MyApplicationsScreen from '../Screen/Student/Jobs/MyApplicationsScreen';
import PostJobScreen from '../Screen/common/Jobs/PostJobScreen';
import MyJobsScreen from '../Screen/Consultant/Jobs/MyJobsScreen';
import JobApplicationsScreen from '../Screen/Consultant/Jobs/JobApplicationsScreen';
import ApplicationReviewScreen from '../Screen/Consultant/Jobs/ApplicationReviewScreen';
import ApplicationDetailScreen from '../Screen/Student/Jobs/ApplicationDetailScreen';
// Recruiter Job screens
import RecruiterMyJobsScreen from '../Screen/Recruiter/Jobs/MyJobsScreen';
import RecruiterJobApplicationsScreen from '../Screen/Recruiter/Jobs/JobApplicationsScreen';
import RecruiterApplicationReviewScreen from '../Screen/Recruiter/Jobs/ApplicationReviewScreen';
// Course Management screens
import CourseCreationScreen from '../Screen/Consultant/CourseManagement/CourseCreationScreen';
import { ActivityIndicator, View } from 'react-native';

const Stack = createStackNavigator();


// Component to render appropriate bottom tabs based on role
const RoleBasedTabs = () => {
  const { role, activeRole, needsProfileCreation, user, roles } = useAuth();
  
  // Use activeRole if available, fallback to role for backward compatibility
  const currentRole = activeRole || role;

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
  
  // Debug logging for role changes
  React.useEffect(() => {
    if (__DEV__) {
      console.log('🔄 [RoleBasedTabs] Role changed:', { role, activeRole, currentRole });
    }
  }, [role, activeRole, currentRole]);

  const shouldShowRoleLoader = user && (!currentRole || roles.length === 0);
  if (shouldShowRoleLoader) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }
  
  // If profile needs to be created, show profile creation screen
  if (needsProfileCreation) {
    return <CreateProfile />;
  }
  
  // For consultants, approval gating was removed: route directly to consultant tabs.
  if (currentRole === 'consultant') {
    return <ConsultantBottomTabs />;
  }
  
  // For recruiters, show recruiter-specific screens
  if (currentRole === 'recruiter') {
    if (__DEV__) {
      console.log('✅ [RoleBasedTabs] Showing recruiter tabs for recruiter role')
    }
    return <RecruiterBottomTabs />;
  }
  
  // Default: show student tabs (for student role or if role is null/undefined)
  if (__DEV__) {
    console.log('✅ [RoleBasedTabs] Showing student tabs for role:', currentRole);
  }
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
      ] as any,
    } as any,
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
      ] as any,
    } as any,
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
      ] as any,
      opacity: current.progress,
    } as any,
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
      ] as any,
      opacity: current.progress,
    } as any,
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
      
      {/* Work Preferences Screen */}
      <Stack.Screen
        name="WorkPreferences"
        component={WorkPreferences}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      {/* Authorization Documents Screen */}
      <Stack.Screen
        name="AuthorizationDocuments"
        component={AuthorizationDocuments}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      {/* Career Goals Screen */}
      <Stack.Screen
        name="CareerGoals"
        component={CareerGoals}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      {/* Education Screen */}
      <Stack.Screen
        name="EducationScreen"
        component={EducationScreen}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      {/* Certifications Screen */}
      <Stack.Screen
        name="CertificationsScreen"
        component={CertificationsScreen}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      {/* Skills Screen */}
      <Stack.Screen
        name="SkillsScreen"
        component={SkillsScreen}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      {/* External Profiles Screen */}
      <Stack.Screen
        name="ExternalProfilesScreen"
        component={ExternalProfilesScreen}
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

      <Stack.Screen
        name="CompanyProfile"
        component={CompanyProfileScreen}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      {/* Consultant Profile Screen */}
      <Stack.Screen
        name="ConsultantProfile"
        component={ConsultantProfile}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      {/* Consultant Dashboard Screen */}
      <Stack.Screen
        name="ConsultantDashboard"
        component={ConsultantDashboard}
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
        name="ConsultantContentPosting" 
        component={ConsultantContentPostingScreen}
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

      {/* Course Management Screens */}
      <Stack.Screen 
        name="CourseCreation" 
        component={CourseCreationScreen}
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
        component={PostJobScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
        }}
      />
      
      <Stack.Screen 
        name="JobPostingPayment" 
        component={JobPostingPaymentScreen}
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
      
      {/* Consultant All Applications Screen */}
      <Stack.Screen
        name="ConsultantAllApplications"
        component={ConsultantAllApplicationsScreen}
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
