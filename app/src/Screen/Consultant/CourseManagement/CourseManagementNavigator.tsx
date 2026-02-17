import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CourseCreationScreen from './CourseCreationScreen';
import VideoUploadManagerWrapper from './VideoUploadManagerWrapper';
import VideoManagementScreen from './VideoManagementScreen';
import CourseAnalyticsScreen from './CourseAnalyticsScreen';
import CertificateManagementScreen from './CertificateManagementScreen';
import CourseDetailsScreen from './CourseDetailsScreen';

const Stack = createStackNavigator();

export default function CourseManagementNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CourseCreation" component={CourseCreationScreen} />
      <Stack.Screen name="VideoUploadManager" component={VideoUploadManagerWrapper} />
      <Stack.Screen name="VideoManagement" component={VideoManagementScreen} />
      <Stack.Screen name="CourseAnalytics" component={CourseAnalyticsScreen} />
      <Stack.Screen name="CertificateManagement" component={CertificateManagementScreen} />
      <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} />
    </Stack.Navigator>
  );
}
