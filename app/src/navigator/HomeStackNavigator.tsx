import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import HomeScreen from '../Screen/Student/Home/home';
import RecruiterHome from '../Screen/Recruiter/Home/RecruiterHome';
import AllConsultants from '../Screen/Student/Consultants/AllConsultants';
import BookingSlots from '../Screen/Student/Booking/BookingSlots';
import Cart from '../Screen/Student/Cart/Cart';
import { useAuth } from '../contexts/AuthContext';

const Stack = createStackNavigator();

// Custom transition animations for home stack
const slideFromRight = ({ current, layouts }: any) => {
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

const slideFromBottom = ({ current, layouts }: any) => {
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

const scaleAndSlide = ({ current, layouts }: any) => {
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

// Wrapper component that conditionally renders the correct home screen
const HomeScreenWrapper = () => {
  const { activeRole, roles } = useAuth();
  const navigation = useNavigation();
  
  // Determine which home screen to show based on role
  // Use activeRole if available, fallback to roles array
  const currentRole = activeRole || (roles.length > 0 ? roles[0] : 'student');
  const isRecruiter = currentRole === 'recruiter' || roles.includes('recruiter');
  
  // Debug logging for role changes
  React.useEffect(() => {
        if (__DEV__) {
      console.log('🔄 [HomeScreenWrapper] Role changed:', { activeRole, roles, currentRole, isRecruiter })
    };
  }, [activeRole, roles, currentRole, isRecruiter]);
  
  // Conditionally render based on role, passing navigation prop
  if (isRecruiter) {
    return <RecruiterHome navigation={navigation} />;
  }
  
  return <HomeScreen navigation={navigation} />;
};

const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
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
      initialRouteName="HomeScreen"
    >
      <Stack.Screen 
        name="HomeScreen" 
        component={HomeScreenWrapper}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      <Stack.Screen 
        name="AllConsultants" 
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
      <Stack.Screen 
        name="BookingSlots" 
        component={BookingSlots}
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
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;
