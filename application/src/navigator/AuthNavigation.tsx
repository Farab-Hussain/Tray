import { createStackNavigator } from '@react-navigation/stack';
import Register from '../Screen/Auth/Register';
import Login from '../Screen/Auth/Login';
import ForgotPassword from '../Screen/Auth/ForgotPassword';
import Verify from '../Screen/Auth/Verify';
import ResetPassword from '../Screen/Auth/ResetPassword';
import EmailVerification from '../Screen/Auth/EmailVerification';

const Stack = createStackNavigator();

// Custom transition animations for auth screens
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


const scaleAndFade = ({ current }: any) => {
  return {
    cardStyle: {
      opacity: current.progress,
      transform: [
        {
          scale: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }),
        },
      ],
    },
  };
};

const AuthNavigation = () => {
  return (
    <Stack.Navigator
      initialRouteName="Register"
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
    >
      <Stack.Screen 
        name="Register" 
        component={Register}
        options={{
          cardStyleInterpolator: scaleAndFade,
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
        name='Login' 
        component={Login}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      <Stack.Screen 
        name='ForgotPassword' 
        component={ForgotPassword}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      <Stack.Screen 
        name='Verify' 
        component={Verify}
        options={{
          cardStyleInterpolator: scaleAndFade,
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
        name='ResetPassword' 
        component={ResetPassword}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      <Stack.Screen 
        name='EmailVerification' 
        component={EmailVerification}
        options={{
          cardStyleInterpolator: scaleAndFade,
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

export default AuthNavigation;
