import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CourseLibraryScreen from '../Screen/Student/Course/CourseLibraryScreen';
import CoursePlayerScreen from '../Screen/Student/CoursePlayer/CoursePlayerScreen';

const Stack = createStackNavigator();

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

const CourseStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyleInterpolator: slideFromRight,
      }}
      initialRouteName="CourseLibrary"
    >
      <Stack.Screen name="CourseLibrary" component={CourseLibraryScreen as any} />
      <Stack.Screen name="CourseDetail" component={CoursePlayerScreen as any} />
    </Stack.Navigator>
  );
};

export default CourseStackNavigator;
