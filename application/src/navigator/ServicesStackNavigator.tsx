import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Services from '../Screen/Student/Services/Services';
import BookingSlots from '../Screen/Student/Booking/BookingSlots';
import Cart from '../Screen/Student/Cart/Cart';
import PaymentScreen from '../Screen/Student/Payment/PaymentScreen';
import AllReviews from '../Screen/Student/Review/AllReviews';

const Stack = createStackNavigator();

// Custom transition animations for services stack
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


const ServicesStackNavigator = () => {
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
      initialRouteName="ServicesScreen"
    >
      <Stack.Screen 
        name="ServicesScreen" 
        component={Services}
        options={{
          cardStyleInterpolator: slideFromRight,
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
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
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
        name="AllReviews" 
        component={AllReviews}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
    </Stack.Navigator>
  );
};

export default ServicesStackNavigator;

