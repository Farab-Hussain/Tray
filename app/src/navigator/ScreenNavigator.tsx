import React from 'react';
import { createStackNavigator, StackCardStyleInterpolator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
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
  const { role, needsProfileCreation } = useAuth();
  
  // If profile needs to be created, show profile creation screen
  if (needsProfileCreation) {
    return <CreateProfile />;
  }
  
  // For consultants, always show verification flow first
  if (role === 'consultant') {
    return <ConsultantVerificationFlow />;
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
      
      
      {/* Add any modal or overlay screens here that should appear on top of bottom tabs */}
    </Stack.Navigator>
  );
};

export default ScreenNavigator;
