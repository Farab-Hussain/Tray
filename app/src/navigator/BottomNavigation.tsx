import React, { useCallback, useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
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
import { useChatContext } from '../contexts/ChatContext';
import { useNotificationContext } from '../contexts/NotificationContext';

const Tab = createBottomTabNavigator();

const getTabBarVisibility = (route: any) => {
  const routeName = getFocusedRouteNameFromRoute(route);
  const hideOnScreens = ['BookingSlots', 'Cart', 'Account'];
  return routeName && hideOnScreens.includes(routeName) ? 'none' : 'flex';
};

const getTabIcon = (routeName: string, color: string, size: number) => {
  switch (routeName) {
    case 'Menu':
      return (
        <Home size={size} color={color} />
      );
    case 'Services':
      return (
        <BookOpen size={size} color={color} />
      );
    case 'Messages':
      return (
        <MessageCircle size={size} color={color} />
      );
    case 'Notifications':
      return (
        <Bell size={size} color={color} />
      );
    case 'Account':
      return (
        <CircleUserRound size={size} color={color} />
      );
    default:
      return (
        <Home size={size} color={color} />
      );
  }
};

const BottomTabs = () => {
  const { chats } = useChatContext();
  const {
    unreadCount: notificationUnreadCount,
    notifications,
  } = useNotificationContext();

  const hasUnreadMessages = useMemo(() => {
    const chatUnreadViaChats =
      chats?.some(chat => (chat.unreadCount || 0) > 0) ?? false;
    const chatUnreadViaNotifications =
      notifications?.some(
        notification =>
          !notification.read &&
          (notification.type === 'chat_message' ||
            notification.category === 'message'),
      ) ?? false;
    return chatUnreadViaChats || chatUnreadViaNotifications;
  }, [chats, notifications]);

  const badgeMap = useMemo(
    () => ({
      Messages: hasUnreadMessages,
      Notifications: (notificationUnreadCount || 0) > 0,
    }),
    [hasUnreadMessages, notificationUnreadCount],
  );

  const renderIconWithBadge = useCallback(
    (routeName: string, color: string, size: number) => {
      const showDot = badgeMap[routeName as keyof typeof badgeMap];

      return (
        <View style={styles.iconWrapper}>
          {getTabIcon(routeName, color, size)}
          {showDot ? <View style={styles.badgeDot} /> : null}
        </View>
      );
    },
    [badgeMap],
  );

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
        tabBarIcon: ({ color, size }) =>
          renderIconWithBadge(route.name, color, size),
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
          unmountOnBlur: true,
          tabBarStyle: {
            backgroundColor: COLORS.green,
            display: getTabBarVisibility(route),
            borderTopWidth: 0,
            elevation: 0,
          },
        })}
        listeners={({ navigation, route }) => ({
          tabPress: e => {
            const state = navigation.getState();
            const tabRoute = state.routes.find(r => r.key === route.key);
            const stackState = tabRoute?.state as any;
            if (stackState?.index > 0) {
              navigation.navigate('Services', {
                screen: 'ServicesScreen',
              });
            }
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

const styles = StyleSheet.create({
  iconWrapper: {
    paddingTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 4,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.yellow,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
});
