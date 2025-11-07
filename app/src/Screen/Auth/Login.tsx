import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, Image, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import AppButton from '../../components/ui/AppButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authStyles } from '../../constants/styles/authStyles';
import { COLORS } from '../../constants/core/colors';
import * as LucideIcons from 'lucide-react-native';
import { signInWithEmailAndPassword, sendEmailVerification, type UserCredential } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { api } from '../../lib/fetcher';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getConsultantApplications } from '../../services/consultantFlow.service';
import { showError, handleApiError } from '../../utils/toast';
import { useSocialLogin } from '../../hooks/useSocialLogin';

interface LoginProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    replace: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

const Login = ({ navigation }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | 'apple' | null>(null);
  
  const { googleLogin, facebookLogin, appleLogin } = useSocialLogin();
  
  // Note: We fetch role directly from backend on login instead of using AuthContext's role state
  // This ensures we get the most up-to-date role information

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('Login - Attempting to sign in with Firebase...');
      console.log('Login - Firebase auth instance:', auth ? 'Available' : 'Not available');
      
      // Add retry logic for network failures
      let userCredential: UserCredential | null = null;
      let retries = 0;
      const maxRetries = 3;
      let lastError: unknown = null;
      
      while (retries < maxRetries) {
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
          break; // Success, exit retry loop
        } catch (error: unknown) {
          lastError = error;
          // Check if it's a network error that we should retry
          if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            (error as { code: string }).code === 'auth/network-request-failed' &&
            retries < maxRetries - 1
          ) {
            retries++;
            console.log(`⚠️ [Login] Network error, retrying... (${retries}/${maxRetries})`);
            await new Promise<void>(resolve => setTimeout(() => resolve(), 1000 * retries)); // Exponential backoff
            continue;
          }
          throw error; // Re-throw if not network error or max retries reached
        }
      }
      
      if (!userCredential) {
        throw lastError || new Error('Login failed after retries');
      }
      
      const token = await userCredential.user.getIdToken();
      
      console.log('Login - Firebase sign-in successful, token obtained');
      
      // Check if email is verified (required)
      if (!userCredential.user.emailVerified) {
        console.log('Login - User email not verified');
        const user = userCredential.user; // Store reference to avoid null checks
        const userEmail = user.email;
        Alert.alert(
          'Email Not Verified',
          'Please verify your email address before logging in. Check your email for a verification link.',
          [
            {
              text: 'Resend Verification',
              onPress: async () => {
                try {
                  // Reload user first
                  await user.reload();
                  
                  let emailSent = false;
                  let emailError: any = null;
                  
                  // Use backend SMTP as primary method (bypasses Firebase rate limits)
                  try {
                    console.log('Login - Sending email via backend SMTP...');
                    const userToken = await user.getIdToken();
                    const backendResponse = await api.post('/auth/resend-verification-email', {
                      email: user.email,
                      uid: user.uid
                    }, {
                      headers: {
                        'Authorization': `Bearer ${userToken}`
                      }
                    });
                    
                    if (backendResponse.data?.success && backendResponse.data?.emailSent) {
                      emailSent = true;
                      console.log('✅ Login - Backend sent verification email via SMTP!');
                    } else if (backendResponse.data?.verificationLink) {
                      console.log('✅ Login - Backend generated verification link (SMTP failed, but link available)');
                      emailSent = true; // Mark as sent for UI purposes
                    }
                  } catch (backendError: any) {
                    console.warn('⚠️ Login - Backend SMTP failed, trying Firebase as fallback...');
                    emailError = backendError;
                    
                    // Fallback to Firebase if backend fails
                    try {
                      await sendEmailVerification(user, {
                        url: `tray://email-verification`,
                        handleCodeInApp: true,
                      });
                      emailSent = true;
                      console.log('✅ Login - Firebase sent verification email (fallback)!');
                    } catch (firebaseError: any) {
                      // If custom scheme not allowlisted, try simple method
                      if (firebaseError?.code === 'auth/unauthorized-continue-uri') {
                        try {
                          await sendEmailVerification(user);
                          emailSent = true;
                          console.log('✅ Login - Firebase sent verification email (simple method)!');
                          emailError = null; // Clear error since it worked
                        } catch (simpleError: any) {
                          emailError = simpleError;
                          console.error('Login - All methods failed:', simpleError?.message);
                        }
                      } else {
                        emailError = firebaseError;
                        console.error('Login - Firebase fallback also failed:', firebaseError?.message);
                      }
                    }
                  }
                  
                  // Show appropriate alert based on result
                  if (emailSent) {
                    Alert.alert(
                      'Verification Email Sent ✓',
                      `A verification email has been sent to ${userEmail}.\n\nPlease check:\n• Your inbox\n• SPAM/JUNK folder\n• Wait 1-2 minutes for delivery`,
                      [
                        {
                          text: 'Go to Verification',
                          onPress: () => {
                            navigation.navigate('EmailVerification', { 
                              email: userEmail,
                              fromLogin: true 
                            });
                          },
                        },
                        { text: 'OK' },
                      ]
                    );
                  } else {
                    // Email sending failed - show helpful error message
                    const errorMessage = emailError?.message || 'Unknown error';
                    const errorCode = emailError?.code || 'unknown';
                    
                    let userMessage = `Failed to resend verification email.\n\n`;
                    
                    if (errorCode === 'auth/unauthorized-continue-uri') {
                      userMessage += '⚠️ Email configuration error. Please use the verification screen to resend.';
                    } else {
                      userMessage += `Error: ${errorMessage}\n\n`;
                      userMessage += 'Please try again later or use the verification screen.';
                    }
                    
                    Alert.alert(
                      'Error',
                      userMessage,
                      [
                        {
                          text: 'Go to Verification',
                          onPress: () => {
                            navigation.navigate('EmailVerification', { 
                              email: userEmail,
                              fromLogin: true 
                            });
                          },
                        },
                        { text: 'OK' },
                      ]
                    );
                  }
                } catch (error: any) {
                  console.error('Login - Resend verification error:', error);
                  Alert.alert(
                    'Error', 
                    `Failed to resend verification email: ${error?.message || 'Unknown error'}. Please try again or use the verification screen.`
                  );
                }
              },
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );
        return;
      }
      
      console.log('Login - Email verified, proceeding with login');
      
      // Set token for backend calls
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch role from backend
      console.log('Login - Fetching user role from backend...');
      const res = await api.get('/auth/me');
      console.log('Login - /auth/me response:', JSON.stringify(res.data, null, 2));
      
      const userRole = res.data?.role || 'student';
      console.log('Login - User role:', userRole);
      console.log('Login - User email:', email);
      
      // Save role to AsyncStorage immediately so AuthContext can read it
      await AsyncStorage.setItem('role', userRole);
      console.log('Login - Role saved to AsyncStorage:', userRole);
      
      // For consultants, also fetch and save verification status
      if (userRole === 'consultant') {
        try {
          const statusRes = await api.get('/consultant-flow/status');
          const backendStatus = statusRes.data?.status;
          let verificationStatus: 'incomplete' | 'pending' | 'approved' | 'rejected';
          
          if (backendStatus === 'no_profile') {
            verificationStatus = 'incomplete';
          } else if (backendStatus === 'pending') {
            verificationStatus = 'pending';
          } else if (backendStatus === 'approved') {
            verificationStatus = 'approved';
          } else if (backendStatus === 'rejected') {
            verificationStatus = 'rejected';
          } else {
            verificationStatus = 'incomplete';
          }
          
          await AsyncStorage.setItem('consultantVerificationStatus', verificationStatus);
          console.log('Login - Consultant verification status saved:', verificationStatus);
        } catch (error) {
          console.error('Login - Error fetching consultant status:', error);
          await AsyncStorage.setItem('consultantVerificationStatus', 'incomplete');
        }
      }
      
      // Navigate based on role
      await navigateAfterLogin(userRole);
      
    } catch (error: unknown) {
      console.error('❌ [Login] Login error:', error);
      
      // Handle Firebase authentication errors
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message?: string };
        
        switch (firebaseError.code) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            showError('Invalid email or password. Please check your credentials and try again.', 'Login Failed');
            break;
            
          case 'auth/too-many-requests':
            showError('Too many failed attempts. Please try again later or reset your password.', 'Account Temporarily Locked');
            break;
            
          case 'auth/network-request-failed':
            console.error('❌ [Login] Network error - Possible causes:');
            console.error('   - No internet connection');
            console.error('   - Firebase configuration issue');
            console.error('   - iOS/Android network security config');
            console.error('   - Firewall/proxy blocking connection');
            showError('Network error. Please check your internet connection and try again.', 'Connection Error');
            break;
            
          case 'auth/api-key-not-valid':
          case 'auth/invalid-api-key':
            console.error('❌ [Login] Firebase API key invalid - check .env file');
            showError('App configuration error. Please contact support or check your network connection.', 'Configuration Error');
            break;
            
          case 'auth/app-not-authorized':
            showError('This app is not authorized. Please contact support.', 'Authorization Error');
            break;
            
          case 'auth/operation-not-allowed':
            showError('This operation is not allowed. Please contact support.', 'Operation Not Allowed');
            break;
            
          case 'auth/invalid-email':
            showError('Please enter a valid email address.', 'Invalid Email');
            break;
            
          case 'auth/weak-password':
            showError('Password is too weak. Please choose a stronger password.', 'Weak Password');
            break;
            
          default:
            // Show full error message if available, otherwise generic message
            const errorMessage = firebaseError.message || 'An unexpected error occurred. Please try again.';
            console.error('❌ [Login] Firebase error code:', firebaseError.code);
            console.error('❌ [Login] Firebase error message:', errorMessage);
            showError(errorMessage.length > 100 ? `${errorMessage.substring(0, 100)}...` : errorMessage, 'Login Failed');
        }
      } else {
        // Handle non-Firebase errors (API errors, etc.)
        if (error && typeof error === 'object' && 'response' in error) {
          // This is likely an axios/API error
          handleApiError(error);
        } else {
          // Generic error fallback
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
          console.error('❌ [Login] Unexpected error:', errorMessage);
          showError(errorMessage.length > 100 ? `${errorMessage.substring(0, 100)}...` : errorMessage, 'Login Failed');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate after successful authentication (shared for email/password and social login)
   */
  const navigateAfterLogin = async (userRole: string) => {
    // Wait a moment for AuthContext to sync
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    
    // Navigate based on role and status
    if (userRole === 'consultant') {
      console.log('Login - User is consultant, checking verification status...');
      
      // Check consultant verification status to determine navigation
      try {
        const statusRes = await api.get('/consultant-flow/status');
        const backendStatus = statusRes.data?.status;
        console.log('Login - Consultant status:', backendStatus);
        
        if (backendStatus === 'no_profile' || backendStatus === 'incomplete') {
          console.log('Login - No profile found, navigating to profile creation');
          navigation.replace('Screen', { 
            screen: 'ConsultantProfileFlow'
          });
        } else if (backendStatus === 'pending') {
          console.log('Login - Profile pending, navigating to pending approval');
          navigation.replace('Screen', { 
            screen: 'PendingApproval'
          });
        } else if (backendStatus === 'approved') {
          console.log('Login - Profile approved, checking services status');
          // Check if consultant has approved services
          try {
            const applicationsResponse = await getConsultantApplications();
            const approvedServices = applicationsResponse.filter(app => app.status === 'approved');
            
            if (approvedServices.length > 0) {
              console.log('Login - Profile and services approved, navigating to consultant applications screen');
              navigation.replace('Screen', { 
                screen: 'Applications',
                params: { role: 'consultant' }
              });
            } else {
              console.log('Login - Profile approved but no services approved, navigating to pending approval');
              navigation.replace('Screen', { 
                screen: 'PendingApproval'
              });
            }
          } catch (servicesError) {
            console.error('Login - Error checking services:', servicesError);
            // If services check fails, navigate to pending approval
            navigation.replace('Screen', { 
              screen: 'PendingApproval'
            });
          }
        } else if (backendStatus === 'rejected') {
          console.log('Login - Profile rejected, navigating to pending approval');
          navigation.replace('Screen', { 
            screen: 'PendingApproval'
          });
        } else {
          console.log('Login - Unknown status, navigating to profile creation');
          navigation.replace('Screen', { 
            screen: 'ConsultantProfileFlow'
          });
        }
      } catch (statusError) {
        console.error('Login - Error checking consultant status:', statusError);
        // If status check fails, navigate to profile creation as fallback
        navigation.replace('Screen', { 
          screen: 'ConsultantProfileFlow'
        });
      }
    } else {
      console.log('Login - User is student, navigating to student tabs');
      navigation.replace('Screen', { 
        screen: 'MainTabs',
        params: { role: 'student' }
      });
    }
  };

  /**
   * Handle social login
   */
  const handleSocialLogin = async (
    provider: 'google' | 'facebook' | 'apple',
    loginFunction: (options?: { role?: string }) => Promise<any>
  ) => {
    setSocialLoading(provider);
    try {
      const user = await loginFunction();
      
      if (!user) {
        // User cancelled
        setSocialLoading(null);
        return;
      }

      // Check if this is a social login (email already verified)
      const isSocialLogin = user.providerData.some(
        (provider: any) => provider.providerId !== 'password'
      );

      if (isSocialLogin) {
        // Social logins don't need email verification
        console.log('Social Login - Email verified, proceeding with login');
        
        // Get token and set for backend calls
        const token = await user.getIdToken();
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Fetch role from backend
        console.log('Social Login - Fetching user role from backend...');
        const res = await api.get('/auth/me');
        console.log('Social Login - /auth/me response:', JSON.stringify(res.data, null, 2));
        
        const userRole = res.data?.role || 'student';
        console.log('Social Login - User role:', userRole);
        
        // Save role to AsyncStorage
        await AsyncStorage.setItem('role', userRole);
        console.log('Social Login - Role saved to AsyncStorage:', userRole);
        
        // For consultants, also fetch and save verification status
        if (userRole === 'consultant') {
          try {
            const statusRes = await api.get('/consultant-flow/status');
            const backendStatus = statusRes.data?.status;
            let verificationStatus: 'incomplete' | 'pending' | 'approved' | 'rejected';
            
            if (backendStatus === 'no_profile') {
              verificationStatus = 'incomplete';
            } else if (backendStatus === 'pending') {
              verificationStatus = 'pending';
            } else if (backendStatus === 'approved') {
              verificationStatus = 'approved';
            } else if (backendStatus === 'rejected') {
              verificationStatus = 'rejected';
            } else {
              verificationStatus = 'incomplete';
            }
            
            await AsyncStorage.setItem('consultantVerificationStatus', verificationStatus);
            console.log('Social Login - Consultant verification status saved:', verificationStatus);
          } catch (error) {
            console.error('Social Login - Error fetching consultant status:', error);
            await AsyncStorage.setItem('consultantVerificationStatus', 'incomplete');
          }
        }
        
        // Navigate based on role
        await navigateAfterLogin(userRole);
      }
    } catch (error: any) {
      console.error(`Social Login - ${provider} error:`, error);
      // Error is already handled in useSocialLogin hook
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={authStyles.loginContainer}>
          <ScrollView
            style={authStyles.scrollContainer}
            contentContainerStyle={authStyles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <Text style={authStyles.authHeading}>Login</Text>
          
          {/* Email Input */}
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
          
          {/* Password Input */}
          <Text style={authStyles.label}>Password</Text>
          <View style={authStyles.inputWrapper}>
            <TextInput
              style={authStyles.input}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.lightGray}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={{ padding: 8, justifyContent: 'center', alignItems: 'center' }}
            >
              {showPassword ? (
                <LucideIcons.EyeOff size={24} color="#333333" strokeWidth={1.5} />
              ) : (
                <LucideIcons.Eye size={24} color="#333333" strokeWidth={1.5} />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Forgot Password */}
          <TouchableOpacity
            style={authStyles.forgotPassword}
            onPress={() => {
              navigation.navigate('ForgotPassword');
            }}
          >
            <Text>Forgot password?</Text>
          </TouchableOpacity>
          
          {/* Login Button */}
          <AppButton
            title={loading ? "Logging in..." : "Log in"}
            onPress={handleLogin}
            style={authStyles.signUpBtn}
            textStyle={authStyles.signUpText}
            disabled={loading}
          />
          
          {loading && (
            <ActivityIndicator size="small" color="#FFC107" style={{ marginTop: 10 }} />
          )}
        </ScrollView>

        {/* Bottom Section - Fixed at bottom */}
        <View style={authStyles.bottomSection}>
          <View style={authStyles.dividerWrapper}>
            <View style={authStyles.divider} />
            <Text style={authStyles.dividerText}>Or Login With</Text>
            <View style={authStyles.divider} />
          </View>

          {/* Social Buttons */}
          <View style={authStyles.socialRow}>
            <TouchableOpacity 
              style={authStyles.socialButton}
              onPress={() => handleSocialLogin('facebook', facebookLogin)}
              disabled={socialLoading !== null}
            >
              <View style={authStyles.iconContainer}>
                {socialLoading === 'facebook' ? (
                  <ActivityIndicator size="small" color="#333333" />
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
              onPress={() => handleSocialLogin('google', googleLogin)}
              disabled={socialLoading !== null}
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
                onPress={() => handleSocialLogin('apple', appleLogin)}
                disabled={socialLoading !== null}
              >
                <View style={authStyles.iconContainer}>
                  {socialLoading === 'apple' ? (
                    <ActivityIndicator size="small" color="#333333" />
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

          {/* Footer */}
          <Text style={authStyles.footer}>
            Don't have an account?{' '}
            <Text
              style={authStyles.loginLink}
              onPress={() => navigation.navigate('Register')}
            >
              Register
            </Text>
          </Text>
        </View>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;
