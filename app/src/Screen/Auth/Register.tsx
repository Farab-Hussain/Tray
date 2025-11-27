// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AppButton from '../../components/ui/AppButton';
import PasswordStrengthIndicator from '../../components/ui/PasswordStrengthIndicator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authStyles } from '../../constants/styles/authStyles';
import { COLORS } from '../../constants/core/colors';
import * as LucideIcons from 'lucide-react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { api } from '../../lib/fetcher';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validatePassword, PasswordValidation } from '../../utils/passwordValidation';
import { useSocialLogin } from '../../hooks/useSocialLogin';


const Register = ({ navigation, route }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation | null>(null);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | 'apple' | null>(null);

  const role = route?.params?.role || 'student';
  const { googleLogin, facebookLogin, appleLogin } = useSocialLogin();


  useEffect(() => {
    if (password.length > 0) {
      const validation = validatePassword(password);
      setPasswordValidation(validation);
    } else {
      setPasswordValidation(null);
    }
  }, [password]);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    

    // Password validation is now optional - just check if passwords match
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Password and confirm password do not match');
      return;
    }

    setLoading(true);
    try {
      // Set registration flag to prevent premature role fetching
      await AsyncStorage.setItem('isRegistering', 'true');
            if (__DEV__) {
        console.log('Register - Registration flag set')
      };
      
      // Save role in both old and new formats for compatibility
      await AsyncStorage.setItem('role', role);
      await AsyncStorage.setItem('activeRole', role);
      await AsyncStorage.setItem('roles', JSON.stringify([role]));
            if (__DEV__) {
        console.log('Register - Role saved to AsyncStorage FIRST:', role)
      };

      if (role === 'consultant') {
        await AsyncStorage.setItem(
          'consultantVerificationStatus',
          'incomplete',
        );
                if (__DEV__) {
          console.log('Register - Initial consultant status saved: incomplete')
        };
      }

            if (__DEV__) {
        console.log('Register - Creating Firebase user...')
      };
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCredential.user.uid;
      
            if (__DEV__) {
        console.log('Register - Firebase user created, UID:', uid)
      };

      // Update user profile with display name (non-blocking - continue even if it fails)
            if (__DEV__) {
        console.log('Register - Setting display name...')
      };
      try {
        await updateProfile(userCredential.user, {
          displayName: name.trim()
        });
                if (__DEV__) {
          console.log('Register - Display name set:', name.trim())
        };
      } catch (profileError: any) {
                if (__DEV__) {
          console.error('Register - Failed to set display name:', profileError)
        };
                if (__DEV__) {
          console.error('Register - Profile error code:', profileError?.code)
        };
                if (__DEV__) {
          console.error('Register - Profile error message:', profileError?.message)
        };
        // Continue anyway - display name is not critical for email verification
      }

      // Reload user to ensure all properties are synced before sending email
      try {
        await userCredential.user.reload();
                if (__DEV__) {
          console.log('Register - User reloaded successfully')
        };
      } catch (reloadError: any) {
                if (__DEV__) {
          console.warn('Register - User reload warning (non-critical):', reloadError?.message)
        };
        // Continue anyway - reload is not critical
      }
      
      // Send email verification via backend SMTP
            if (__DEV__) {
        console.log('Register - Sending email verification via backend SMTP...')
      };
      let emailSent = false;
      let emailError: any = null;
      
      // Use backend SMTP as primary method
      try {
        const token = await userCredential.user.getIdToken();
        const backendResponse = await api.post('/auth/resend-verification-email', {
          email: userCredential.user.email,
          uid: userCredential.user.uid
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (backendResponse.data?.success && backendResponse.data?.emailSent) {
          emailSent = true;
                    if (__DEV__) {
            console.log('✅ Register - Backend sent verification email via SMTP!')
          };
        } else if (backendResponse.data?.verificationLink) {
                    if (__DEV__) {
            console.log('✅ Register - Backend generated verification link (SMTP failed, but link available)')
          };
          emailSent = true; // Mark as sent since we have a link
        }
      } catch (backendError: any) {
          // Backend email sending failed - error already logged
          emailError = backendError;
          // No Firebase fallback - we use custom token system only
      }

      // Clear registration flag
      await AsyncStorage.removeItem('isRegistering');
            if (__DEV__) {
        console.log('Register - Registration flag cleared')
      };

      // Show informational message about email verification (required)
      if (emailSent) {
        Alert.alert(
          'Verification Email Sent ✓',
          `We've sent a verification email to:\n\n${userCredential.user.email}\n\n📧 Please check:\n• Your inbox (wait 1-2 minutes)\n• SPAM/JUNK folder\n• Promotions tab (Gmail)\n\nIf you don't receive it, you can resend from the next screen.\n\nEmail verification is required to use the app.`,
          [
            {
              text: 'Go to Verification',
              onPress: () => {
                // Navigate to email verification screen
                navigation.replace('EmailVerification', { 
                  email: userCredential.user.email,
                  role,
                  name: name || userCredential.user.email?.split('@')[0] 
                });
              },
            },
            { 
              text: 'OK',
              onPress: () => {
                // Navigate to email verification screen
                navigation.replace('EmailVerification', { 
                  email: userCredential.user.email,
                  role,
                  name: name || userCredential.user.email?.split('@')[0] 
                });
              },
            },
          ]
        );
      } else {
        // Navigate to email verification screen even if email failed
        let errorMsg = 'Email sending failed. Please try resending from the verification screen.';
        
        if (emailError?.code === 'auth/unauthorized-continue-uri') {
          errorMsg = 'Email configuration error. Please use the verification screen to resend.';
        } else if (emailError?.message) {
          errorMsg = emailError.message + '\n\nPlease use the verification screen to resend.';
        }
        
        Alert.alert(
          'Registration Complete ⚠️',
          `Your account has been created successfully! ✅\n\nHowever, we couldn't send the verification email right now:\n\n${errorMsg}\n\nYou can resend the verification email from the next screen.`,
          [
            {
              text: 'Go to Verification',
              onPress: () => {
                navigation.replace('EmailVerification', { 
                  email: userCredential.user.email,
                  role,
                  name: name || userCredential.user.email?.split('@')[0] 
                });
              },
            },
          ]
        );
      }
      return;
    } catch (e: any) {
            if (__DEV__) {
        console.error('Register error:', e)
      };
      // Clear registration flag on error
      await AsyncStorage.removeItem('isRegistering');
            if (__DEV__) {
        console.log('Register - Registration flag cleared due to error')
      };
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle social login for registration
   */
  const handleSocialRegister = async (
    provider: 'google' | 'facebook' | 'apple',
    loginFunction: (options?: { role?: string }) => Promise<any>
  ) => {
    setSocialLoading(provider);
    try {
      // Add timeout for social login to prevent hanging
      // Facebook login can take longer due to browser redirects, so use longer timeout
      // The login dialog itself has a 90s timeout, so we need at least 120s for the full process
      const timeoutDuration = provider === 'facebook' ? 150000 : 60000; // 2.5 min for Facebook (includes dialog + token + Firebase), 1 min for others
      
      const loginPromise = loginFunction({ role: role });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`${provider === 'facebook' ? 'Facebook' : 'Social'} login timed out. Please try again.`)), timeoutDuration)
      );
      
      if (__DEV__) {
        console.log(`Social Register - Starting ${provider} login with ${timeoutDuration/1000}s timeout`);
      }
      
      const user = await Promise.race([loginPromise, timeoutPromise]) as any;
      
      if (!user) {
        // User cancelled
        setSocialLoading(null);
        return;
      }

      // Social logins don't need email verification
            if (__DEV__) {
        console.log('Social Register - Email verified, proceeding with registration')
      };
      
      // Get token and set for backend calls
      const token = await user.getIdToken();
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      // Register with backend (useSocialLogin already handles this, but we ensure it's done)
            if (__DEV__) {
        console.log('Social Register - Backend sync should be complete')
      };
      
      // Save role in both old and new formats for compatibility
      await AsyncStorage.setItem('role', role);
      await AsyncStorage.setItem('activeRole', role);
      await AsyncStorage.setItem('roles', JSON.stringify([role]));
            if (__DEV__) {
        console.log('Social Register - Role saved to AsyncStorage:', role)
      };

      // For consultants, also save initial status
      if (role === 'consultant') {
        await AsyncStorage.setItem('consultantVerificationStatus', 'incomplete');
                if (__DEV__) {
          console.log('Social Register - Initial consultant status saved: incomplete')
        };
      }

      // Navigate based on role
      if (role === 'consultant') {
                if (__DEV__) {
          console.log('Social Register - Navigating to consultant profile flow')
        };
        navigation.replace('Screen', {
          screen: 'ConsultantProfileFlow',
        });
      } else {
        // Student or recruiter - navigate to MainTabs
                if (__DEV__) {
          console.log(`Social Register - Navigating to MainTabs with role: ${role || 'student'}`)
        };
        navigation.replace('Screen', {
          screen: 'MainTabs',
          params: { role: role || 'student' },
        });
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error(`Social Register - ${provider} error:`, error)
      };
      
      // Don't show errors for user cancellations - they return null, not throw
      // Only show errors for actual failures
      
      // Handle timeout errors specifically
      if (error?.message?.includes('timeout') || error?.message?.includes('timed out')) {
        Alert.alert(
          'Registration Timeout',
          `${provider === 'facebook' ? 'Facebook' : 'Social'} login took too long. This might happen if:\n\n• The redirect back to the app didn't complete\n• Your internet connection is slow\n• Facebook servers are experiencing issues\n\nPlease try again. If the problem persists, try:\n• Ensuring the Facebook app is installed\n• Checking your internet connection\n• Restarting the app`,
          [{ text: 'OK' }]
        );
      } else if (error?.message && 
                 !error?.message?.includes('cancelled') && 
                 !error?.message?.includes('requires a user to be signed in') &&
                 !error?.message?.includes('SIGN_IN_REQUIRED')) {
        // Show other errors that weren't handled by useSocialLogin
        // But skip cancellation-related errors (they should return null, but just in case)
        Alert.alert(
          'Registration Error',
          error.message || `Failed to register with ${provider}. Please try again.`,
          [{ text: 'OK' }]
        );
      }
      // Note: useSocialLogin hook already shows errors for most cases via showError
      // Cancellations return null and don't throw, so they won't reach here
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <KeyboardAwareScrollView
        style={authStyles.scrollContainer}
        contentContainerStyle={authStyles.keyboardContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={24}
        extraHeight={Platform.OS === 'ios' ? 40 : 24}
      >
        <View style={authStyles.loginContainer}>
          <View style={authStyles.scrollContentContainer}>
            <Text style={authStyles.authHeading}>Register</Text>

            <Text style={authStyles.label}>Full Name</Text>
            <View style={authStyles.inputWrapper}>
              <TextInput
                style={authStyles.input}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.lightGray}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <Text style={authStyles.label}>Email</Text>
            <View style={authStyles.inputWrapper}>
              <TextInput
                style={authStyles.input}
                placeholder="example@gmail.com"
                placeholderTextColor={COLORS.lightGray}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>

            <Text style={authStyles.label}>Create a password</Text>
            <View style={authStyles.inputWrapper}>
              <TextInput
                style={authStyles.input}
                placeholder="Create a strong password"
                placeholderTextColor={COLORS.lightGray}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCorrect={false}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={authStyles.passwordToggle}
              >
                {showPassword ? (
                  <LucideIcons.EyeOff size={24} color="#333333" strokeWidth={1.5} />
                ) : (
                  <LucideIcons.Eye size={24} color="#333333" strokeWidth={1.5} />
                )}
              </TouchableOpacity>
            </View>

            {passwordValidation && (
              <PasswordStrengthIndicator
                strength={passwordValidation.strength}
                showFeedback={false}
              />
            )}

            <Text style={authStyles.label}>Re-enter password</Text>
            <View style={authStyles.inputWrapper}>
              <TextInput
                style={authStyles.input}
                placeholder="Re-enter password"
                placeholderTextColor={COLORS.lightGray}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCorrect={false}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={authStyles.passwordToggle}
              >
                {showConfirmPassword ? (
                  <LucideIcons.EyeOff size={24} color="#333333" strokeWidth={1.5} />
                ) : (
                  <LucideIcons.Eye size={24} color="#333333" strokeWidth={1.5} />
                )}
              </TouchableOpacity>
            </View>

            <AppButton
              title={loading ? 'Creating account...' : 'Sign up'}
              onPress={handleRegister}
              disabled={loading || (passwordValidation && !passwordValidation.isValid)}
              style={[
                authStyles.signUpBtn,
                (passwordValidation && !passwordValidation.isValid) && { opacity: 0.6 },
              ]}
              textStyle={authStyles.signUpText}
            />

            {loading && (
              <ActivityIndicator
                size="small"
                color="#FFC107"
                style={{ marginTop: 10 }}
              />
            )}
          </View>

          <View style={authStyles.bottomSection}>
            <View style={authStyles.dividerWrapper}>
              <View style={authStyles.divider} />
              <Text style={authStyles.dividerText}>Or Register With</Text>
              <View style={authStyles.divider} />
            </View>

            <View style={authStyles.socialRow}>
              <TouchableOpacity
                style={authStyles.socialButton}
                onPress={() => handleSocialRegister('facebook', facebookLogin)}
                disabled={socialLoading !== null || loading}
              >
                <View style={authStyles.iconContainer}>
                  {socialLoading === 'facebook' ? (
                    <ActivityIndicator size="small" color="#1877F2" />
                  ) : (
                    <Image
                      source={require('../../assets/icon/facebook.png')}
                      style={authStyles.socialIcon}
                      resizeMode="contain"
                    />
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={authStyles.socialButton}
                onPress={() => handleSocialRegister('google', googleLogin)}
                disabled={socialLoading !== null || loading}
              >
                <View style={authStyles.iconContainer}>
                  {socialLoading === 'google' ? (
                    <ActivityIndicator size="small" color="#333333" />
                  ) : (
                    <Image
                      source={require('../../assets/icon/google.png')}
                      style={authStyles.socialIcon}
                      resizeMode="contain"
                    />
                  )}
                </View>
              </TouchableOpacity>
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={authStyles.socialButton}
                  onPress={() => handleSocialRegister('apple', appleLogin)}
                  disabled={socialLoading !== null || loading}
                >
                  <View style={authStyles.iconContainer}>
                    {socialLoading === 'apple' ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <Image
                        source={require('../../assets/icon/apple.png')}
                        style={authStyles.socialIcon}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            </View>

            <Text style={authStyles.footer}>
              Already have an account?{' '}
              <Text
                style={authStyles.loginLink}
                onPress={() => {
                  // Clear intended role when navigating to login
                  // Login will fetch actual role from backend, not use intended role
                  if (__DEV__) {
                    console.log('Register - Navigating to Login, clearing intended role');
                  }
                  navigation.navigate('Login');
                }}
              >
                Log in
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};
export default Register;
