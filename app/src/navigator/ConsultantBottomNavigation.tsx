import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { View } from 'react-native';
import { 
  Home,
  Calendar,
  MessageCircle,
  BookOpen,
  // Bell,
  // User,
} from 'lucide-react-native';

// Consultant Screens
import ConsultantHome from '../Screen/Consultant/Home/ConsultantHome';
import CourseManagementNavigator from '../navigation/CourseManagementNavigator';
import ConsultantAvailability from '../Screen/Consultant/Availability/ConsultantAvailability';
import Messages from '../Screen/common/Messages/Messages';
// import Notifications from '../Screen/common/Notifications/Notifications';
import ConsultantAccount from '../Screen/Consultant/Account/ConsultantAccount';
// import ServiceManagementScreen from '../Screen/Consultant/CourseManagement/ServiceManagementScreen';


import { COLORS } from '../constants/core/colors';

const Tab = createBottomTabNavigator();

const getTabBarVisibility = (route: any) => {
  const routeName = getFocusedRouteNameFromRoute(route);
  const hideOnScreens = ['ConsultantBookingSlots', 'ConsultantCart', 'ConsultantAccount'];
  return routeName && hideOnScreens.includes(routeName) ? 'none' : 'flex';
};

const getTabIcon = (routeName: string, color: string, size: number) => {
  const iconStyle = {
    paddingTop: 8,
  };

  switch (routeName) {
    case 'ConsultantHome':
      return (
        <View style={iconStyle}>
          <Home size={size} color={color} />
        </View>
      );
    case 'ConsultantServices':
      return (
        <View style={iconStyle}>
          <BookOpen size={size} color={color} />
        </View>
      );
    case 'CourseManagement':
      return (
        <View style={iconStyle}>
          <BookOpen size={size} color={color} />
        </View>
      );
    case 'ConsultantAvailability':
      return (
        <View style={iconStyle}>
          <Calendar size={size} color={color} />
        </View>
      );
    case 'ConsultantMessages':
      return (
        <View style={iconStyle}>
          <MessageCircle size={size} color={color} />
        </View>
      );
    // case 'ConsultantNotifications':
    //   return (
    //     <View style={iconStyle}>
    //       <Bell size={size} color={color} />
    //     </View>
    //   );
    // case 'ServiceManagement':
    //   return (
    //     <View style={iconStyle}>
    //       <GraduationCap size={size} color={color} />
    //     </View>
    //   );
    case 'ConsultantAccount':
      return (
        <View style={iconStyle}>
          <Home size={size} color={color} />
        </View>
      );
    default:
      return (
        <View style={iconStyle}>
          <Home size={size} color={color} />
        </View>
      );
  }
};

const ConsultantBottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.white,
        tabBarInactiveTintColor: COLORS.blackTransparent,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIcon: ({ color, size }) => getTabIcon(route.name, color, size),
        tabBarStyle: {
          backgroundColor: COLORS.green,
          borderTopWidth: 0,
          elevation: 0,
          display: getTabBarVisibility(route),
        },
      })}
    >
      <Tab.Screen
        name="ConsultantHome"
        component={ConsultantHome}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      
      <Tab.Screen
        name="CourseManagement"
        component={CourseManagementNavigator}
        options={{
          tabBarLabel: 'Courses',
        }}
      />
      
      <Tab.Screen
        name="ConsultantAvailability"
        component={ConsultantAvailability}
        options={{
          tabBarLabel: 'Availability',
        }}
      />
      
      <Tab.Screen
        name="ConsultantMessages"
        component={Messages}
        options={{
          tabBarLabel: 'Messages',
        }}
      />
      
      {/* <Tab.Screen
        name="ConsultantNotifications"
        component={Notifications}
        options={{
          tabBarLabel: 'Notifications',
        }}
      /> */}
      
      <Tab.Screen
        name="ConsultantAccount"
        component={ConsultantAccount}
        options={{
          tabBarLabel: 'Account',
        }}
      />
    </Tab.Navigator>
  );
};

export default ConsultantBottomTabs;
