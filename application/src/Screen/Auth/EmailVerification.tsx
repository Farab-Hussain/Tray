import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Mail, RefreshCw, ArrowLeft } from 'lucide-react-native';
import { auth } from '../../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { api } from '../../lib/fetcher';
import { authStyles } from '../../constants/styles/authStyles';
import { COLORS } from '../../constants/core/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EmailVerification = ({ route }: any) => {
  const navigation = useNavigation();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isCompletingRegistration, setIsCompletingRegistration] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds cooldown
  const [canResend, setCanResend] = useState(false);
  const { role, name, fromLogin } = route?.params || {};
  const isFromLogin = fromLogin === true;
  
  const getTitle = () => {
    return isFromLogin ? 'Verify Your Email to Login' : 'Verify Your Email';
  };
  
  const getDescription = () => {
    return isFromLogin 
      ? 'Please verify your email address to complete the login process.'
      : 'We\'ve sent a verification email to:';
  };

  useEffect(() => {
    // Get email from route params
    const email = route?.params?.email || '';
    setUserEmail(email);
    
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [route?.params?.email]);

  const handleResendVerification = async () => {
    if (!canResend) return;

    setIsResending(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        Alert.alert(
          'Verification Email Sent',
          'A new verification email has been sent to your email address.',
          [{ text: 'OK' }]
        );
        
        // Reset timer
        setTimeLeft(60);
        setCanResend(false);
      }
    } catch (error: any) {
      console.error('Resend verification error:', error);
      Alert.alert(
        'Error',
        'Failed to resend verification email. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsResending(false);
    }
  };

  const completeRegistration = async () => {
    setIsCompletingRegistration(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user found');
      }

      const token = await user.getIdToken();
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Check if this is from login (user already exists) or registration (new user)
      const { role, name, fromLogin } = route?.params || {};
      
      if (fromLogin) {
        // User is logging in, just navigate to appropriate screen
        console.log('EmailVerification - User verified from login, fetching role...');
        
        try {
          const res = await api.get('/auth/me');
          const userRole = res.data?.role || 'student';
          
          // Save role to AsyncStorage
          await AsyncStorage.setItem('role', userRole);
          
          // Navigate based on role
          if (userRole === 'consultant') {
            console.log('EmailVerification - Navigating to consultant flow');
            (navigation as any).replace('Screen', {
              screen: 'PendingApproval',
            });
          } else {
            console.log('EmailVerification - Navigating to student tabs');
            (navigation as any).replace('Screen', {
              screen: 'MainTabs',
              params: { role: userRole },
            });
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          Alert.alert('Error', 'Failed to fetch user information. Please try logging in again.');
        }
      } else {
        // User is registering, complete registration process
        console.log('EmailVerification - Completing registration with role:', role);
        
        // Send user data to backend
        await api.post('/auth/register', {
          uid: user.uid,
          email: user.email,
          role: role || 'student',
          name: name || user.email?.split('@')[0],
        });

        console.log('EmailVerification - Backend registration completed');

        // Navigate based on role
        if (role === 'consultant') {
          console.log('EmailVerification - Navigating to consultant profile flow');
          (navigation as any).replace('Screen', {
            screen: 'ConsultantProfileFlow',
          });
        } else {
          console.log('EmailVerification - Navigating to student tabs');
          (navigation as any).replace('Screen', {
            screen: 'MainTabs',
            params: { role: role || 'student' },
          });
        }
      }
    } catch (error: any) {
      console.error('Complete registration error:', error);
      Alert.alert(
        'Error',
        'Failed to complete the process. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCompletingRegistration(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    try {
      const user = auth.currentUser;
      if (user) {
        // Reload user to get latest email verification status
        await user.reload();
        
        if (user.emailVerified) {
          Alert.alert(
            'Email Verified!',
            'Your email has been successfully verified. Completing your registration...',
            [
              {
                text: 'Continue',
                onPress: completeRegistration,
              },
            ]
          );
        } else {
          Alert.alert(
            'Not Verified Yet',
            'Your email has not been verified yet. Please check your email inbox (and spam folder) for a verification email from Firebase/Tray and click the verification link.\n\nNote: This is different from profile approval emails - you need the Firebase verification email.',
            [
              {
                text: 'Check Spam Folder',
                onPress: () => {
                  Alert.alert(
                    'Check Spam Folder',
                    'Sometimes verification emails end up in spam. Please check your spam/junk folder for an email from Firebase or Tray.',
                    [{ text: 'OK' }]
                  );
                },
              },
              { text: 'OK' },
            ]
          );
        }
      }
    } catch (error: any) {
      console.error('Check verification error:', error);
      Alert.alert(
        'Error',
        'Failed to check verification status. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleGoBack = () => {
    Alert.alert(
      'Cancel Registration',
      'Are you sure you want to cancel the registration process?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            // Sign out the user and go back to login
            auth.signOut();
            navigation.navigate('Login' as never);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <ScrollView
        style={authStyles.scrollContainer}
        contentContainerStyle={[
          authStyles.scrollContentContainer,
          { justifyContent: 'center', paddingHorizontal: 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: COLORS.green,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <Mail size={40} color={COLORS.white} />
          </View>
          
          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: COLORS.black,
            textAlign: 'center',
            marginBottom: 12,
          }}>
            {getTitle()}
          </Text>
          
          <Text style={{
            fontSize: 16,
            color: COLORS.gray,
            textAlign: 'center',
            lineHeight: 24,
          }}>
            {getDescription()}
          </Text>
          
          {!isFromLogin && (
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: COLORS.green,
              textAlign: 'center',
              marginTop: 8,
            }}>
              {userEmail}
            </Text>
          )}
        </View>

        {/* Instructions */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: COLORS.lightGray,
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: COLORS.black,
            marginBottom: 12,
          }}>
            Next Steps:
          </Text>
          
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 4 }}>
              1. Check your email inbox (and spam folder) for Firebase verification email
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 4 }}>
              2. Click the verification link in the Firebase email
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 4 }}>
              3. Return here and tap "Check Verification"
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.orange, fontStyle: 'italic', marginTop: 8 }}>
              Note: This is different from profile approval emails
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ gap: 12 }}>
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.green,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
            onPress={handleCheckVerification}
            disabled={isChecking}
          >
            {isChecking ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <RefreshCw size={20} color={COLORS.white} />
            )}
            <Text style={{
              color: COLORS.white,
              fontSize: 16,
              fontWeight: '600',
            }}>
              {isChecking ? 'Checking...' : 'Check Verification'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: COLORS.white,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              borderWidth: 2,
              borderColor: COLORS.green,
            }}
            onPress={handleResendVerification}
            disabled={!canResend || isResending}
          >
            {isResending ? (
              <ActivityIndicator size="small" color={COLORS.green} />
            ) : (
              <Mail size={20} color={COLORS.green} />
            )}
            <Text style={{
              color: COLORS.green,
              fontSize: 16,
              fontWeight: '600',
            }}>
              {isResending ? 'Sending...' : `Resend Email ${!canResend ? `(${timeLeft}s)` : ''}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 24,
            gap: 8,
          }}
          onPress={handleGoBack}
        >
          <ArrowLeft size={20} color={COLORS.gray} />
          <Text style={{
            color: COLORS.gray,
            fontSize: 16,
            fontWeight: '500',
          }}>
            Back to Login
          </Text>
        </TouchableOpacity>

        {/* Help Text */}
        <View style={{
          marginTop: 32,
          paddingHorizontal: 20,
        }}>
          <Text style={{
            fontSize: 14,
            color: COLORS.gray,
            textAlign: 'center',
            lineHeight: 20,
          }}>
            Didn't receive the Firebase verification email? Check your spam folder or try resending.
          </Text>
          <Text style={{
            fontSize: 12,
            color: COLORS.orange,
            textAlign: 'center',
            lineHeight: 18,
            marginTop: 8,
          }}>
            Note: Profile approval emails are different from Firebase verification emails.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EmailVerification;
