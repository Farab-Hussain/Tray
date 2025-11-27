import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AppButton from '../../components/ui/AppButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authStyles } from '../../constants/styles/authStyles';
import { COLORS } from '../../constants/core/colors';
import * as LucideIcons from 'lucide-react-native';
import { signInWithEmailAndPassword, type UserCredential } from 'firebase/auth';
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
  const [socialLoading, setSocialLoading] = useState<
    'google' | 'facebook' | 'apple' | null
  >(null);

  const { googleLogin, facebookLogin, appleLogin } = useSocialLogin();

  /**
   * IMPORTANT: This Login screen does NOT restrict access based on which button was clicked.
   * It always fetches the user's actual role from the backend database and navigates accordingly.
   * 
   * This means:
   * - A consultant can login from any login screen (student/consultant/recruiter button)
   * - A student can login from any login screen
   * - A recruiter can login from any login screen
   * - After login, users are redirected to the screen matching their ACTUAL role in the database
   * 
   * This is the correct behavior - users should be able to login regardless of which entry point they use.
   */

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (__DEV__) {
        console.log('Login - Attempting to sign in with Firebase...');
      }
      if (__DEV__) {
        console.log(
          'Login - Firebase auth instance:',
          auth ? 'Available' : 'Not available',
        );
      }

      // Add retry logic for network failures
      let userCredential: UserCredential | null = null;
      let retries = 0;
      const maxRetries = 3;
      let lastError: unknown = null;

      while (retries < maxRetries) {
        try {
          userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password,
          );
          break; // Success, exit retry loop
        } catch (error: unknown) {
          lastError = error;
          // Check if it's a network error that we should retry
          if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            (error as { code: string }).code ===
              'auth/network-request-failed' &&
            retries < maxRetries - 1
          ) {
            retries++;
            if (__DEV__) {
              console.log(
                `⚠️ [Login] Network error, retrying... (${retries}/${maxRetries})`,
              );
            }
            await new Promise<void>(resolve =>
              setTimeout(() => resolve(), 1000 * retries),
            ); // Exponential backoff
            continue;
          }
          throw error; // Re-throw if not network error or max retries reached
        }
      }

      if (!userCredential) {
        throw lastError || new Error('Login failed after retries');
      }

      const token = await userCredential.user.getIdToken();

      if (__DEV__) {
        console.log('Login - Firebase sign-in successful, token obtained');
      }

      // Check if email is verified (required)
      if (!userCredential.user.emailVerified) {
        if (__DEV__) {
          console.log('Login - User email not verified');
        }
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

                  // Use backend SMTP as primary method
                  try {
                    if (__DEV__) {
                      console.log('Login - Sending email via backend SMTP...');
                    }
                    const userToken = await user.getIdToken();
                    const backendResponse = await api.post(
                      '/auth/resend-verification-email',
                      {
                        email: user.email,
                        uid: user.uid,
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${userToken}`,
                        },
                      },
                    );

                    if (
                      backendResponse.data?.success &&
                      backendResponse.data?.emailSent
                    ) {
                      emailSent = true;
                      if (__DEV__) {
                        console.log(
                          '✅ Login - Backend sent verification email via SMTP!',
                        );
                      }
                    } else if (backendResponse.data?.verificationLink) {
                      if (__DEV__) {
                        console.log(
                          '✅ Login - Backend generated verification link (SMTP failed, but link available)',
                        );
                      }
                      emailSent = true; // Mark as sent for UI purposes
                    }
                  } catch (backendError: any) {
                    // Backend email sending failed - error already logged
                    emailError = backendError;
                    // No Firebase fallback - we use custom token system only
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
                              fromLogin: true,
                            });
                          },
                        },
                        { text: 'OK' },
                      ],
                    );
                  } else {
                    // Email sending failed - show helpful error message
                    const errorMessage = emailError?.message || 'Unknown error';
                    const errorCode =
                      emailError?.code ||
                      emailError?.response?.data?.code ||
                      'unknown';

                    let userMessage = `Failed to resend verification email.\n\n`;

                    if (errorCode === 'auth/unauthorized-continue-uri') {
                      userMessage +=
                        '⚠️ Email configuration error. Please use the verification screen to resend.';
                    } else {
                      userMessage += `Error: ${errorMessage}\n\n`;
                      userMessage +=
                        'Please try again later or use the verification screen.';
                    }

                    Alert.alert('Error', userMessage, [
                      {
                        text: 'Go to Verification',
                        onPress: () => {
                          navigation.navigate('EmailVerification', {
                            email: userEmail,
                            fromLogin: true,
                          });
                        },
                      },
                      { text: 'OK' },
                    ]);
                  }
                } catch (error: any) {
                  if (__DEV__) {
                    console.error('Login - Resend verification error:', error);
                  }
                  Alert.alert(
                    'Error',
                    `Failed to resend verification email: ${
                      error?.message || 'Unknown error'
                    }. Please try again or use the verification screen.`,
                  );
                }
              },
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ],
        );
        return;
      }

      if (__DEV__) {
        console.log('Login - Email verified, proceeding with login');
      }

      // Set token for backend calls
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      // Fetch role from backend with timeout and error handling
      if (__DEV__) {
        console.log('Login - Fetching user role from backend...');
      }
      let userRole = 'student'; // Default fallback

      try {
        // Add timeout for the API call
        // Mark this request to suppress error toasts (we'll handle it ourselves)
        const requestConfig = {
          __suppressErrorToast: true, // Custom flag to suppress toast
        } as any;

        const res = (await Promise.race([
          api.get('/auth/me', requestConfig),
          new Promise((_, reject) =>
            setTimeout(() => {
              const timeoutError = new Error('Backend request timeout') as any;
              timeoutError.__suppressErrorToast = true;
              timeoutError.isBackendUnavailable = true;
              reject(timeoutError);
            }, 10000),
          ),
        ])) as any;

        if (__DEV__) {
          console.log(
            'Login - /auth/me response:',
            JSON.stringify(res.data, null, 2),
          );
        }
        userRole = res.data?.role || res.data?.activeRole || 'student';
        if (__DEV__) {
          console.log('Login - User role:', userRole);
        }
      } catch (apiError: any) {
        if (__DEV__) {
          console.error(
            '❌ [Login] Error fetching user role from backend:',
            apiError,
          );
        }

        // Mark error as handled to prevent duplicate error messages
        if (apiError) {
          apiError.__handled = true;
        }

        // Check if backend is unavailable
        const isBackendUnavailable =
          apiError?.isBackendUnavailable ||
          apiError?.isNgrokError ||
          apiError?.response?.status === 503 ||
          apiError?.response?.status === 502 ||
          apiError?.code === 'ECONNREFUSED' ||
          apiError?.code === 'ECONNABORTED' ||
          apiError?.message?.includes('timeout') ||
          apiError?.message?.includes('Backend request timeout');

        if (isBackendUnavailable) {
          // Backend unavailable - try to use cached role or default
          if (__DEV__) {
            console.warn(
              '⚠️ [Login] Backend unavailable, trying to use cached role...',
            );
          }
          try {
            const cachedRole = await AsyncStorage.getItem('role');
            if (
              cachedRole &&
              ['student', 'consultant', 'admin'].includes(cachedRole)
            ) {
              userRole = cachedRole;
              if (__DEV__) {
                console.log('✅ [Login] Using cached role:', userRole);
              }
            } else {
              if (__DEV__) {
                console.warn(
                  '⚠️ [Login] No valid cached role, using default: student',
                );
              }
              userRole = 'student';
            }
          } catch (storageError) {
            if (__DEV__) {
              console.error(
                '❌ [Login] Error reading cached role:',
                storageError,
              );
            }
            userRole = 'student'; // Default fallback
          }

          // Show warning but allow login to continue
          Alert.alert(
            'Backend Unavailable',
            'Unable to connect to the server. You are logged in with limited functionality. Please check your connection and try again later.',
            [{ text: 'OK' }],
          );
        } else {
          // Other API error - rethrow to be handled below
          throw apiError;
        }
      }

      if (__DEV__) {
        console.log('Login - Final user role:', userRole);
      }
      if (__DEV__) {
        console.log('Login - User email:', email);
      }

      // Save role to AsyncStorage immediately so AuthContext can read it
      await AsyncStorage.setItem('role', userRole);
      if (__DEV__) {
        console.log('Login - Role saved to AsyncStorage:', userRole);
      }

      // For consultants, also fetch and save verification status
      if (userRole === 'consultant') {
        try {
          // Add timeout for consultant status check
          const statusRes = (await Promise.race([
            api.get('/consultant-flow/status'),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('Backend request timeout')),
                10000,
              ),
            ),
          ])) as any;

          const backendStatus = statusRes.data?.status;
          let verificationStatus:
            | 'incomplete'
            | 'pending'
            | 'approved'
            | 'rejected';

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

          await AsyncStorage.setItem(
            'consultantVerificationStatus',
            verificationStatus,
          );
          if (__DEV__) {
            console.log(
              'Login - Consultant verification status saved:',
              verificationStatus,
            );
          }
        } catch (error) {
          if (__DEV__) {
            console.error('Login - Error fetching consultant status:', error);
          }
          // Use cached status or default to incomplete
          try {
            const cachedStatus = await AsyncStorage.getItem(
              'consultantVerificationStatus',
            );
            if (!cachedStatus) {
              await AsyncStorage.setItem(
                'consultantVerificationStatus',
                'incomplete',
              );
            }
          } catch (storageError) {
            await AsyncStorage.setItem(
              'consultantVerificationStatus',
              'incomplete',
            );
          }
        }
      }

      // Navigate based on role
      await navigateAfterLogin(userRole);
    } catch (error: unknown) {
      // Log error for debugging (only in development or for critical errors)
      if (__DEV__) {
        console.error('❌ [Login] Login error:', error);
      }

      // Handle Firebase authentication errors
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message?: string };

        switch (firebaseError.code) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            showError(
              'Invalid email or password. Please check your credentials and try again.',
              'Login Failed',
            );
            break;

          case 'auth/network-request-failed':
            if (__DEV__) {
              console.error('❌ [Login] Network error - Possible causes:');
              console.error('   - No internet connection');
              console.error('   - Firebase configuration issue');
              if (__DEV__) {
                console.error('   - iOS/Android network security config');
              }
              if (__DEV__) {
                console.error('   - Firewall/proxy blocking connection');
              }
            }
            showError(
              'Network error. Please check your internet connection and try again.',
              'Connection Error',
            );
            break;

          case 'auth/api-key-not-valid':
          case 'auth/invalid-api-key':
            if (__DEV__) {
              console.error(
                '❌ [Login] Firebase API key invalid - check .env file',
              );
            }
            showError(
              'App configuration error. Please contact support or check your network connection.',
              'Configuration Error',
            );
            break;

          case 'auth/app-not-authorized':
            showError(
              'This app is not authorized. Please contact support.',
              'Authorization Error',
            );
            break;

          case 'auth/operation-not-allowed':
            showError(
              'This operation is not allowed. Please contact support.',
              'Operation Not Allowed',
            );
            break;

          case 'auth/invalid-email':
            showError('Please enter a valid email address.', 'Invalid Email');
            break;

          case 'auth/weak-password':
            showError(
              'Password is too weak. Please choose a stronger password.',
              'Weak Password',
            );
            break;

          default:
            // Show full error message if available, otherwise generic message
            const errorMessage =
              firebaseError.message ||
              'An unexpected error occurred. Please try again.';
            if (__DEV__) {
              console.error(
                '❌ [Login] Firebase error code:',
                firebaseError.code,
              );
              console.error('❌ [Login] Firebase error message:', errorMessage);
            }
            showError(
              errorMessage.length > 100
                ? `${errorMessage.substring(0, 100)}...`
                : errorMessage,
              'Login Failed',
            );
        }
      } else {
        // Handle non-Firebase errors (API errors, etc.)
        if (error && typeof error === 'object' && 'response' in error) {
          // This is likely an axios/API error
          handleApiError(error);
        } else {
          // Generic error fallback
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred. Please try again.';
          if (__DEV__) {
            console.error('❌ [Login] Unexpected error:', errorMessage);
          }
          showError(
            errorMessage.length > 100
              ? `${errorMessage.substring(0, 100)}...`
              : errorMessage,
            'Login Failed',
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate after successful authentication (shared for email/password and social login)
   * Always uses the actual role from the backend, not any role parameter from navigation
   */
  const navigateAfterLogin = async (userRole: string) => {
    // Wait a moment for AuthContext to sync
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500));

    if (__DEV__) {
      console.log('✅ [Login] Navigating based on actual user role from database:', userRole);
    }

    // Navigate based on actual role from database (not from button clicked)
    if (userRole === 'consultant') {
      if (__DEV__) {
        console.log(
          'Login - User is consultant, checking verification status...',
        );
      }

      // Check consultant verification status to determine navigation
      try {
        // Add timeout for consultant status check
        const statusRes = (await Promise.race([
          api.get('/consultant-flow/status'),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Backend request timeout')),
              10000,
            ),
          ),
        ])) as any;

        const backendStatus = statusRes.data?.status;
        if (__DEV__) {
          console.log('Login - Consultant status:', backendStatus);
        }

        if (backendStatus === 'no_profile' || backendStatus === 'incomplete') {
          if (__DEV__) {
            console.log(
              'Login - No profile found, navigating to profile creation',
            );
          }
          navigation.replace('Screen', {
            screen: 'ConsultantProfileFlow',
          });
        } else if (backendStatus === 'pending') {
          if (__DEV__) {
            console.log(
              'Login - Profile pending, navigating to pending approval',
            );
          }
          navigation.replace('Screen', {
            screen: 'PendingApproval',
          });
        } else if (backendStatus === 'approved') {
          if (__DEV__) {
            console.log('Login - Profile approved, checking services status');
          }
          // Check if consultant has approved services
          try {
            // Add timeout for applications check
            const applicationsResponse = (await Promise.race([
              getConsultantApplications(),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error('Backend request timeout')),
                  10000,
                ),
              ),
            ])) as any;

            const approvedServices = applicationsResponse.filter(
              (app: any) => app.status === 'approved',
            );

            if (approvedServices.length > 0) {
              if (__DEV__) {
                console.log(
                  'Login - Profile and services approved, navigating to consultant applications screen',
                );
              }
              navigation.replace('Screen', {
                screen: 'Applications',
                params: { role: 'consultant' },
              });
            } else {
              if (__DEV__) {
                console.log(
                  'Login - Profile approved but no services approved, navigating to pending approval',
                );
              }
              navigation.replace('Screen', {
                screen: 'PendingApproval',
              });
            }
          } catch (servicesError) {
            if (__DEV__) {
              console.error('Login - Error checking services:', servicesError);
            }
            // If services check fails, navigate to pending approval
            navigation.replace('Screen', {
              screen: 'PendingApproval',
            });
          }
        } else if (backendStatus === 'rejected') {
          if (__DEV__) {
            console.log(
              'Login - Profile rejected, navigating to pending approval',
            );
          }
          navigation.replace('Screen', {
            screen: 'PendingApproval',
          });
        } else {
          if (__DEV__) {
            console.log(
              'Login - Unknown status, navigating to profile creation',
            );
          }
          navigation.replace('Screen', {
            screen: 'ConsultantProfileFlow',
          });
        }
      } catch (statusError: any) {
        if (__DEV__) {
          console.error(
            'Login - Error checking consultant status:',
            statusError,
          );
        }

        // If backend is unavailable, navigate to pending approval (safer default)
        const isBackendUnavailable =
          statusError?.isBackendUnavailable ||
          statusError?.isNgrokError ||
          statusError?.response?.status === 503 ||
          statusError?.message?.includes('timeout');

        if (isBackendUnavailable) {
          if (__DEV__) {
            console.warn(
              '⚠️ [Login] Backend unavailable, navigating to pending approval as fallback',
            );
          }
          navigation.replace('Screen', {
            screen: 'PendingApproval',
          });
        } else {
          // Other error - navigate to profile creation as fallback
          navigation.replace('Screen', {
            screen: 'ConsultantProfileFlow',
          });
        }
      }
    } else if (userRole === 'recruiter') {
      if (__DEV__) {
        console.log('Login - User is recruiter, navigating to recruiter tabs (uses student tabs structure)');
      }
      // Recruiters use the same navigation structure as students (MainTabs)
      // The RoleBasedTabs component will show RecruiterHome based on role
      navigation.replace('Screen', {
        screen: 'MainTabs',
        params: { role: 'recruiter' },
      });
    } else {
      // Default: student role or any other role
      if (__DEV__) {
        console.log('Login - User is student (or default), navigating to student tabs');
      }
      navigation.replace('Screen', {
        screen: 'MainTabs',
        params: { role: userRole || 'student' },
      });
    }
  };

  /**
   * Handle social login
   */
  const handleSocialLogin = async (
    provider: 'google' | 'facebook' | 'apple',
    loginFunction: (options?: { role?: string }) => Promise<any>,
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
        (provider: any) => provider.providerId !== 'password',
      );

      if (isSocialLogin) {
        // Social logins don't need email verification
        if (__DEV__) {
          console.log('Social Login - Email verified, proceeding with login');
        }

        // Get token and set for backend calls
        const token = await user.getIdToken();
        api.defaults.headers.common.Authorization = `Bearer ${token}`;

        // Fetch role from backend
        if (__DEV__) {
          console.log('Social Login - Fetching user role from backend...');
        }
        const res = await api.get('/auth/me');
        if (__DEV__) {
          console.log(
            'Social Login - /auth/me response:',
            JSON.stringify(res.data, null, 2),
          );
        }

        const userRole = res.data?.role || 'student';
        if (__DEV__) {
          console.log('Social Login - User role:', userRole);
        }

        // Save role to AsyncStorage
        await AsyncStorage.setItem('role', userRole);
        if (__DEV__) {
          console.log('Social Login - Role saved to AsyncStorage:', userRole);
        }

        // For consultants, also fetch and save verification status
        if (userRole === 'consultant') {
          try {
            const statusRes = await api.get('/consultant-flow/status');
            const backendStatus = statusRes.data?.status;
            let verificationStatus:
              | 'incomplete'
              | 'pending'
              | 'approved'
              | 'rejected';

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

            await AsyncStorage.setItem(
              'consultantVerificationStatus',
              verificationStatus,
            );
            if (__DEV__) {
              console.log(
                'Social Login - Consultant verification status saved:',
                verificationStatus,
              );
            }
          } catch (error) {
            if (__DEV__) {
              console.error(
                'Social Login - Error fetching consultant status:',
                error,
              );
            }
            await AsyncStorage.setItem(
              'consultantVerificationStatus',
              'incomplete',
            );
          }
        }

        // Navigate based on role
        await navigateAfterLogin(userRole);
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error(`Social Login - ${provider} error:`, error);
      }
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
            <Text style={authStyles.authHeading}>Login</Text>

            {/* Email Input */}
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
                style={{
                  padding: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {showPassword ? (
                  <LucideIcons.EyeOff
                    size={24}
                    color="#333333"
                    strokeWidth={1.5}
                  />
                ) : (
                  <LucideIcons.Eye
                    size={24}
                    color="#333333"
                    strokeWidth={1.5}
                  />
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
              title={loading ? 'Logging in...' : 'Log in'}
              onPress={handleLogin}
              style={authStyles.signUpBtn}
              textStyle={authStyles.signUpText}
              disabled={loading}
            />

            {loading && (
              <ActivityIndicator
                size="small"
                color="#FFC107"
                style={{ marginTop: 10 }}
              />
            )}
          </View>

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
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default Login;
