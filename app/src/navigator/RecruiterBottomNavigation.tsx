import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '../constants/core/colors';
import { Home, Briefcase, User } from 'lucide-react-native';

// Import existing Recruiter Screens
import RecruiterHome from '../Screen/Recruiter/Home/RecruiterHome';
import RecruiterJobs from '../Screen/Recruiter/Jobs/RecruiterJobs';
import RecruiterProfile from '../Screen/Recruiter/Profile/RecruiterProfile';

const Tab = createBottomTabNavigator();

const RecruiterBottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.white,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.green,
          borderTopColor: COLORS.lightGray,
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen 
        name="RecruiterHome" 
        component={RecruiterHome}
        options={{ 
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <Home size={size} color={focused ? color : COLORS.gray} />
          ),
        }}
      />
      <Tab.Screen 
        name="RecruiterJobs" 
        component={RecruiterJobs}
        options={{ 
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ focused, color, size }) => (
            <Briefcase size={size} color={focused ? color : COLORS.gray} />
          ),
        }}
      />
      <Tab.Screen 
        name="RecruiterProfile" 
        component={RecruiterProfile}
        options={{ 
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <User size={size} color={focused ? color : COLORS.gray} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export { RecruiterBottomTabs };
