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
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
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
    

    const validation = validatePassword(password);
    if (!validation.isValid) {
      Alert.alert(
        'Password Requirements Not Met',
        validation.errors.join('\n\n') + '\n\nPlease improve your password and try again.'
      );
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Password and confirm password do not match');
      return;
    }

    setLoading(true);
    try {
      // Set registration flag to prevent premature role fetching
      await AsyncStorage.setItem('isRegistering', 'true');
      console.log('Register - Registration flag set');
      
      await AsyncStorage.setItem('role', role);
      console.log('Register - Role saved to AsyncStorage FIRST:', role);

      if (role === 'consultant') {
        await AsyncStorage.setItem(
          'consultantVerificationStatus',
          'incomplete',
        );
        console.log('Register - Initial consultant status saved: incomplete');
      }

      console.log('Register - Creating Firebase user...');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCredential.user.uid;
      
      console.log('Register - Firebase user created, UID:', uid);

      // Update user profile with display name (non-blocking - continue even if it fails)
      console.log('Register - Setting display name...');
      try {
        await updateProfile(userCredential.user, {
          displayName: name.trim()
        });
        console.log('Register - Display name set:', name.trim());
      } catch (profileError: any) {
        console.error('Register - Failed to set display name:', profileError);
        console.error('Register - Profile error code:', profileError?.code);
        console.error('Register - Profile error message:', profileError?.message);
        // Continue anyway - display name is not critical for email verification
      }

      // Reload user to ensure all properties are synced before sending email
      try {
        await userCredential.user.reload();
        console.log('Register - User reloaded successfully');
      } catch (reloadError: any) {
        console.warn('Register - User reload warning (non-critical):', reloadError?.message);
        // Continue anyway - reload is not critical
      }
      
      // Send email verification via backend SMTP (bypasses Firebase rate limits)
      console.log('Register - Sending email verification via backend SMTP...');
      let emailSent = false;
      let emailError: any = null;
      
      // Use backend SMTP as primary method to avoid Firebase rate limits
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
          console.log('✅ Register - Backend sent verification email via SMTP!');
        } else if (backendResponse.data?.verificationLink) {
          console.log('✅ Register - Backend generated verification link (SMTP failed, but link available)');
          emailSent = true; // Mark as sent since we have a link
        }
      } catch (backendError: any) {
        console.warn('⚠️ Register - Backend SMTP failed, trying Firebase as fallback...');
        emailError = backendError;
        
        // Fallback to Firebase if backend fails
        try {
          await sendEmailVerification(userCredential.user, {
            url: `tray://email-verification`,
            handleCodeInApp: true,
          });
          emailSent = true;
          console.log('✅ Register - Firebase sent verification email (fallback)!');
        } catch (firebaseError: any) {
          // If custom scheme not allowlisted, try simple method
          if (firebaseError?.code === 'auth/unauthorized-continue-uri') {
            try {
              await sendEmailVerification(userCredential.user);
              emailSent = true;
              console.log('✅ Register - Firebase sent verification email (simple method)!');
            } catch (simpleError: any) {
              emailError = simpleError;
              console.error('❌ Register - All methods failed:', simpleError?.message);
            }
          } else {
            emailError = firebaseError;
            console.error('❌ Register - Firebase fallback also failed:', firebaseError?.message);
          }
        }
      }

      // Clear registration flag
      await AsyncStorage.removeItem('isRegistering');
      console.log('Register - Registration flag cleared');

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
      console.error('Register error:', e);
      // Clear registration flag on error
      await AsyncStorage.removeItem('isRegistering');
      console.log('Register - Registration flag cleared due to error');
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
      const user = await loginFunction({ role: role });
      
      if (!user) {
        // User cancelled
        setSocialLoading(null);
        return;
      }

      // Social logins don't need email verification
      console.log('Social Register - Email verified, proceeding with registration');
      
      // Get token and set for backend calls
      const token = await user.getIdToken();
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Register with backend (useSocialLogin already handles this, but we ensure it's done)
      console.log('Social Register - Backend sync should be complete');
      
      // Save role to AsyncStorage
      await AsyncStorage.setItem('role', role);
      console.log('Social Register - Role saved to AsyncStorage:', role);

      // For consultants, also save initial status
      if (role === 'consultant') {
        await AsyncStorage.setItem('consultantVerificationStatus', 'incomplete');
        console.log('Social Register - Initial consultant status saved: incomplete');
      }

      // Navigate based on role
      if (role === 'consultant') {
        console.log('Social Register - Navigating to consultant profile flow');
        navigation.replace('Screen', {
          screen: 'ConsultantProfileFlow',
        });
      } else {
        console.log('Social Register - Navigating to student tabs');
        navigation.replace('Screen', {
          screen: 'MainTabs',
          params: { role: role || 'student' },
        });
      }
    } catch (error: any) {
      console.error(`Social Register - ${provider} error:`, error);
      // Error is already handled in useSocialLogin hook
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
                showFeedback={true}
              />
            )}

            <Text style={authStyles.label}>Re-enter password</Text>
            <View style={authStyles.inputWrapper}>
              <TextInput
                style={authStyles.input}
                placeholder="password must match"
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
                onPress={() => navigation.navigate('Login')}
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
