import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { View } from 'react-native';
import {
  Home,
  BookOpen,
  MessageCircle,
  Bell,
  CircleUserRound,
} from 'lucide-react-native';

// Screens
// import HomeStackNavigator from './HomeStackNavigator';
// import ServicesStackNavigator from './ServicesStackNavigator';
// import Messages from '../Screen/common/Messages/Messages';
// import Notifications from '../Screen/common/Notifications/Notifications';
// import Account from '../Screen/common/Account/Account';

import HomeStackNavigator from './HomeStackNavigator';
import ServicesStackNavigator from './ServicesStackNavigator';
import Messages from '../Screen/common/Messages/Messages';
import Notifications from '../Screen/common/Notifications/Notifications';
import Account from '../Screen/common/Account/Account';


import { COLORS } from '../constants/core/colors';

const Tab = createBottomTabNavigator();

const getTabBarVisibility = (route: any) => {
  const routeName = getFocusedRouteNameFromRoute(route);
  const hideOnScreens = ['BookingSlots', 'Cart', 'Account'];
  return routeName && hideOnScreens.includes(routeName) ? 'none' : 'flex';
};

const getTabIcon = (routeName: string, color: string, size: number) => {
  const iconStyle = {
    paddingTop: 8,
  };

  switch (routeName) {
    case 'Menu':
      return (
        <View style={iconStyle}>
          <Home size={size} color={color} />
        </View>
      );
    case 'Services':
      return (
        <View style={iconStyle}>
          <BookOpen size={size} color={color} />
        </View>
      );
    case 'Messages':
      return (
        <View style={iconStyle}>
          <MessageCircle size={size} color={color} />
        </View>
      );
    case 'Notifications':
      return (
        <View style={iconStyle}>
          <Bell size={size} color={color} />
        </View>
      );
    case 'Account':
      return (
        <View style={iconStyle}>
          <CircleUserRound size={size} color={color} />
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

const BottomTabs = () => {
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
      })}
    >
      <Tab.Screen
        name="Menu"
        component={HomeStackNavigator}
        options={({ route }) => ({
          tabBarStyle: {
            backgroundColor: COLORS.green,
            display: getTabBarVisibility(route),
            borderTopWidth: 0,
            elevation: 0,
          },
        })}
      />
      <Tab.Screen
        name="Services"
        component={ServicesStackNavigator}
        options={({ route }) => ({
          tabBarStyle: {
            backgroundColor: COLORS.green,
            display: getTabBarVisibility(route),
            borderTopWidth: 0,
            elevation: 0,
          },
        })}
      />
      <Tab.Screen
        name="Messages"
        component={Messages}
        options={{
          tabBarStyle: {
            backgroundColor: COLORS.green,
            borderTopWidth: 0,
            elevation: 0,
          },
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={Notifications}
        options={{
          tabBarStyle: {
            backgroundColor: COLORS.green,
            borderTopWidth: 0,
            elevation: 0,
          },
        }}
      />
      <Tab.Screen
        name="Account"
        component={Account}
        options={({ route }) => ({
          tabBarStyle: {
            backgroundColor: COLORS.green,
            display: getTabBarVisibility(route),
            borderTopWidth: 0,
            elevation: 0,
          },
        })}
      />
    </Tab.Navigator>
  );
};

export default BottomTabs;
