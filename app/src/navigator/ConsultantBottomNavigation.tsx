import React, { useCallback, useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { View } from 'react-native';
import { 
  Home,
  MessageCircle,
  BookOpen,
  User,
  // Bell,
  // User,
} from 'lucide-react-native';

// Consultant Screens
import ConsultantHome from '../Screen/Consultant/Home/ConsultantHome';
import CourseManagementNavigator from '../navigation/CourseManagementNavigator';
import Messages from '../Screen/common/Messages/Messages';
import ConsultantServices from '../Screen/Consultant/Services/ConsultantServices';
// import Notifications from '../Screen/common/Notifications/Notifications';
import ConsultantAccount from '../Screen/Consultant/Account/ConsultantAccount';
// import ServiceManagementScreen from '../Screen/Consultant/CourseManagement/ServiceManagementScreen';


import { COLORS } from '../constants/core/colors';
import { useChatContext } from '../contexts/ChatContext';
import { useNotificationContext } from '../contexts/NotificationContext';
import { bottomNavigationStyles } from '../constants/styles/bottomNavigationStyles';

const Tab = createBottomTabNavigator();

const getTabBarVisibility = (route: any) => {
  const routeName = getFocusedRouteNameFromRoute(route);
  const hideOnScreens = ['ConsultantBookingSlots', 'ConsultantCart', 'ConsultantAccount'];
  return routeName && hideOnScreens.includes(routeName) ? 'none' : 'flex';
};

const getTabIcon = (routeName: string, color: string, size: number) => {
  switch (routeName) {
    case 'ConsultantHome':
      return <Home size={size} color={color} />;
    case 'ConsultantServices':
      return <BookOpen size={size} color={color} />;
    case 'CourseManagement':
      return <BookOpen size={size} color={color} />;
    case 'ConsultantMessages':
      return <MessageCircle size={size} color={color} />;
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
      return <User size={size} color={color} />;
    default:
      return <Home size={size} color={color} />;
  }
};

const ConsultantBottomTabs = () => {
  const { chats } = useChatContext();
  const { notifications } = useNotificationContext();

  const hasUnreadMessages = useMemo(() => {
    const chatUnreadViaChats =
      chats?.some(chat => (chat.unreadCount || 0) > 0) ?? false;
    const chatUnreadViaNotifications =
      notifications?.some(
        n => !n.read && (n.type === 'chat_message' || n.category === 'message'),
      ) ?? false;
    return chatUnreadViaChats || chatUnreadViaNotifications;
  }, [chats, notifications]);

  const renderIconWithBadge = useCallback(
    (routeName: string, color: string, size: number) => {
      const showDot = routeName === 'ConsultantMessages' && hasUnreadMessages;
      return (
        <View style={styles.iconWrapper}>
          {getTabIcon(routeName, color, size)}
          {showDot ? <View style={styles.badgeDot} /> : null}
        </View>
      );
    },
    [hasUnreadMessages],
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
          marginTop: -2,
          paddingBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarIcon: ({ color, size }) =>
          renderIconWithBadge(route.name, color, size),
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
        name="ConsultantServices"
        component={ConsultantServices}
        options={{
          tabBarLabel: 'Services',
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
const styles = bottomNavigationStyles;
