import { useEffect } from 'react';
import { Image, View, Platform } from 'react-native';
import { globalStyles } from '../../constants/core/global';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { api } from '../../lib/fetcher';
// import { getConsultantApplications } from '../../services/consultantFlow.service';

const SplashScreen = ({ navigation }: any) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      // Wait for Firebase auth to initialize
      if (loading) {
        return;
      }

      // Minimum splash display time for better UX
      const minSplashTime = Platform.OS === 'android' ? 2000 : 2500;
      const startTime = Date.now();

      try {
        if (user) {
          // Check if email is verified (required for app access)
          if (!user.emailVerified) {
            console.log('User email not verified, redirecting to EmailVerification');
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minSplashTime - elapsedTime);
            
            setTimeout(() => {
              navigation.replace('Auth', {
                screen: 'EmailVerification',
                params: { 
                  email: user.email,
                  fromLogin: true 
                }
              });
            }, remainingTime);
            return;
          }

          // User is logged in and email verified - get their role and navigate to home
          const storedRole = await AsyncStorage.getItem('role');
          const userRole = storedRole || 'student'; // Default to student if no role found

          if (__DEV__) {
            console.log('User logged in - Role:', userRole);
          }

          // Calculate remaining time to show splash
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, minSplashTime - elapsedTime);

          setTimeout(async () => {
            // Navigate to appropriate screen based on role
            // RoleBasedTabs will handle checking for profile and service approval
            navigation.replace('Screen', {
              screen: 'MainTabs',
              params: { role: userRole }
            });
          }, remainingTime);
        } else {
          // User is not logged in - show role selection/login screen
          console.log('No user logged in, showing SplashMain');

          // Calculate remaining time to show splash
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, minSplashTime - elapsedTime);

          setTimeout(() => {
            navigation.replace('SplashMain');
          }, remainingTime);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        navigation.replace('SplashMain');
      }
    };

    checkAuthAndNavigate();
  }, [user, loading, navigation]);

  return (
    <View style={globalStyles.splash}>
      <Image
        source={require('../../assets/image/logo.png')}
        style={globalStyles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

export default SplashScreen;
