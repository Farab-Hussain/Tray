import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CourseManagementHomeScreen from '../Screen/Consultant/CourseManagement/CourseManagementHomeScreen';
import CourseCreationScreen from '../Screen/Consultant/CourseManagement/CourseCreationScreen';
import CourseDetailsScreen from '../Screen/Consultant/CourseManagement/CourseDetailsScreen';
import VideoUploadManagerWrapper from '../Screen/Consultant/CourseManagement/VideoUploadManagerWrapper';
import CourseLibraryScreen from '../Screen/Student/CourseLibrary/CourseLibraryScreen';
import CoursePlayerScreen from '../Screen/Student/CoursePlayer/CoursePlayerScreen';

const Stack = createStackNavigator();

export default function CourseManagementNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="CourseManagementHome"
        component={CourseManagementHomeScreen}
        options={{ title: 'Courses' }}
      />
      {/* Instructor Screens */}
      <Stack.Screen 
        name="CourseCreation" 
        component={CourseCreationScreen} 
        options={{ title: 'Create Course' }}
      />
      <Stack.Screen
        name="CourseDetails"
        component={CourseDetailsScreen}
        options={{ title: 'Course Details' }}
      />
      <Stack.Screen 
        name="VideoUploadManager" 
        component={VideoUploadManagerWrapper} 
        options={{ title: 'Manage Videos' }}
      />
      
      {/* Student Screens */}
      <Stack.Screen 
        name="CourseLibrary" 
        component={CourseLibraryScreen} 
        options={{ title: 'Course Library' }}
      />
      <Stack.Screen 
        name="CoursePlayer" 
        component={CoursePlayerScreen} 
        options={{ title: 'Course Player' }}
      />
    </Stack.Navigator>
  );
}
