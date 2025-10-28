import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../Screen/Splash/splashScreen';
import SplashMain from '../Screen/Splash/splashMain';
import AuthNavigation from './AuthNavigation';
import ScreenNavigator from './ScreenNavigator';

const Stack = createStackNavigator();

// Custom transition animations
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

const fadeIn = ({ current }: any) => {
  return {
    cardStyle: {
      opacity: current.progress,
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

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
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
        name="Splash" 
        component={SplashScreen}
        options={{
          cardStyleInterpolator: fadeIn,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 500,
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
        name="SplashMain" 
        component={SplashMain}
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
        name="Auth" 
        component={AuthNavigation}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
      <Stack.Screen 
        name="Screen" 
        component={ScreenNavigator}
        options={{
          cardStyleInterpolator: slideFromRight,
        }}
      />
    </Stack.Navigator>
  );
}
