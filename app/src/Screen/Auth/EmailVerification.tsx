import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Mail, RefreshCw, ArrowLeft } from 'lucide-react-native';
import { auth } from '../../lib/firebase';
// Custom email verification system - no Firebase email verification used
import { Linking } from 'react-native';
import { api, isNgrokError } from '../../lib/fetcher';
import { authStyles } from '../../constants/styles/authStyles';
import { COLORS } from '../../constants/core/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';

const EmailVerification = ({ route }: any) => {
  const navigation = useNavigation();
  const { refreshUser } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [, setIsCompletingRegistration] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds cool down
  const [canResend, setCanResend] = useState(false);
  const { fromLogin } = route?.params || {};
  const isFromLogin = fromLogin === true;
  
  const getTitle = () => {
    return isFromLogin ? 'Verify Your Email to Login' : 'Verify Your Email';
  };
  
  const getDescription = () => {
    return isFromLogin 
      ? 'Please verify your email address to complete the login process.'
      : 'We\'ve sent a verification email to:';
  };

  const completeRegistration = useCallback(async () => {
    setIsCompletingRegistration(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user found');
      }

      const token = await user.getIdToken();
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      // Check if this is from login (user already exists) or registration (new user)
      const { role, name, fromLogin: isFromLoginParam } = route?.params || {};
      
      if (isFromLoginParam) {
        // User is logging in, just navigate to appropriate screen
                if (__DEV__) {
          console.log('EmailVerification - User verified from login, fetching role...')
        };
        
        try {
          const res = await api.get('/auth/me');
          const userRole = res.data?.activeRole || res.data?.role || 'student';
          const userRoles = res.data?.roles || (res.data?.role ? [res.data.role] : ['student']);
          
          // Save role in both old and new formats for compatibility
          await AsyncStorage.setItem('role', userRole);
          await AsyncStorage.setItem('activeRole', userRole);
          await AsyncStorage.setItem('roles', JSON.stringify(userRoles));
          
                    if (__DEV__) {
            console.log('EmailVerification - Role saved:', { userRole, userRoles })
          };
          
          // Refresh auth context with latest role/profile data before navigating
          await refreshUser();

          // Navigate based on role
          if (userRole === 'consultant') {
                        if (__DEV__) {
              console.log('EmailVerification - Navigating to consultant flow')
            };
            (navigation as any).replace('Screen', {
              screen: 'PendingApproval',
            });
          } else {
            // Student or recruiter - navigate to MainTabs
                        if (__DEV__) {
              console.log(`EmailVerification - Navigating to MainTabs with role: ${userRole}`)
            };
            (navigation as any).replace('Screen', {
              screen: 'MainTabs',
              params: { role: userRole },
            });
          }
        } catch (error) {
                    if (__DEV__) {
            console.error('Error fetching user role:', error)
          };
          Alert.alert('Issue', 'Failed to fetch user information. Please try logging in again.');
        }
      } else {
        // User is registering, complete registration process
                if (__DEV__) {
          console.log('EmailVerification - Completing registration with role:', role)
        };
        
        // Send user data to backend
        const userName = name || user.email?.split('@')[0] || null;
        await api.post('/auth/register', {
          uid: user.uid,
          email: user.email,
          role: role || 'student',
          ...(userName && { name: userName }), // Only include name if it's not empty
        });

                if (__DEV__) {
          console.log('EmailVerification - Backend registration completed')
        };

        // Refresh auth context with latest role/profile data before navigating
        await refreshUser();

        // Navigate based on role
        if (role === 'consultant') {
                    if (__DEV__) {
            console.log('EmailVerification - Navigating to consultant profile flow')
          };
          (navigation as any).replace('Screen', {
            screen: 'ConsultantProfileFlow',
          });
        } else {
          // Student or recruiter - navigate to MainTabs
                    if (__DEV__) {
            console.log(`EmailVerification - Navigating to MainTabs with role: ${role || 'student'}`)
          };
          (navigation as any).replace('Screen', {
            screen: 'MainTabs',
            params: { role: role || 'student' },
          });
        }
      }
    } catch (error: any) {
            if (__DEV__) {
        console.error('Complete registration error:', error)
      };
      Alert.alert(
        'Error',
        'Failed to complete the process. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCompletingRegistration(false);
    }
  }, [route?.params, navigation]);

  useEffect(() => {
    // Check if user is a social login (email already verified)
    const checkSocialLogin = async () => {
      const user = auth.currentUser;
      if (user) {
        const isSocialLogin = user.providerData.some(
          (provider: any) => provider.providerId !== 'password'
        );
        
        if (isSocialLogin) {
          // Social logins don't need email verification - skip this screen
                    if (__DEV__) {
            console.log('EmailVerification - Social login detected, skipping verification')
          };
          await completeRegistration();
          return;
        }
      }
    };

    checkSocialLogin();

    // Get email from route params
    const email = route?.params?.email || '';
    setUserEmail(email);
    
    // Handle deep link for email verification
    const handleDeepLink = async (url: string) => {
      try {
                if (__DEV__) {
          console.log('EmailVerification - Deep link received:', url)
        };
        
        // Extract oobCode from URL (handles both tray:// and https:// formats)
        // Use regex parsing directly for React Native compatibility
        // Handle custom token-based verification (bypasses Firebase rate limits)
        const urlParts = url.split('?');
        let token: string | null = null;
        let uid: string | null = null;
        
        if (urlParts.length > 1) {
          const params = urlParts[1].split('&');
          for (const param of params) {
            const [key, value] = param.split('=');
            if (key === 'token') {
              token = decodeURIComponent(value);
            } else if (key === 'uid') {
              uid = decodeURIComponent(value);
            }
          }
        }
        
        if (token && uid) {
                    if (__DEV__) {
            console.log('EmailVerification - Processing custom token verification...')
          };
          
          try {
            const user = auth.currentUser;
            if (!user) {
              throw new Error('No user found');
            }
            
            const idToken = await user.getIdToken();
            if (idToken) {
              const backendResponse = await api.post('/auth/verify-email', {
                token: token,
                uid: uid
              }, {
                headers: {
                  'Authorization': `Bearer ${idToken}`
                }
              });
              
              if (backendResponse.data?.success) {
                                if (__DEV__) {
                  console.log('✅ EmailVerification - Email verified via custom token!')
                };
                await user.reload();
                
                if (user.emailVerified) {
                  Alert.alert(
                    'Email Verified! ✓',
                    'Your email has been successfully verified!',
                    [
                      {
                        text: 'Continue',
                        onPress: completeRegistration,
                      },
                    ]
                  );
                }
              }
            }
          } catch (error: any) {
                        if (__DEV__) {
              console.error('EmailVerification - Token verification failed:', error)
            };
            Alert.alert(
              'Verification Failed',
              error?.response?.data?.error || 'Failed to verify email. The link may be expired or invalid. Please request a new verification email.',
              [{ text: 'OK' }]
            );
          }
        } else {
          // Unknown verification link format
                    if (__DEV__) {
            console.warn('EmailVerification - Unknown verification link format:', url)
          };
          Alert.alert(
            'Invalid Link',
            'This verification link is invalid or expired. Please request a new verification email.',
            [{ text: 'OK' }]
          );
        }
      } catch (error: any) {
                if (__DEV__) {
          console.error('EmailVerification - Deep link handling error:', error)
        };
      }
    };

    // Check if app was opened via deep link (custom token verification only)
    Linking.getInitialURL().then((url) => {
      if (url && url.includes('token=')) {
        handleDeepLink(url);
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url && url.includes('token=')) {
        handleDeepLink(url);
      }
    });
    
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

    // Check verification when app comes to foreground (after web verification)
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const currentUser = auth.currentUser;
        if (currentUser && !currentUser.emailVerified) {
          // Reload user to sync verification status after returning from web
          try {
            await currentUser.reload();
            if (currentUser.emailVerified) {
                            if (__DEV__) {
                console.log('✅ EmailVerification - Email verified after app returned to foreground!')
              };
              // User is verified - trigger completeRegistration if available
              if (completeRegistration) {
                completeRegistration();
              }
            } else {
              // Still not verified, check with backend
              try {
                const token = await currentUser.getIdToken();
                const backendCheck = await api.post('/auth/resend-verification-email', {
                  email: currentUser.email,
                  uid: currentUser.uid
                }, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (backendCheck.data?.emailVerified) {
                  // Backend says verified - reload and check again
                  await currentUser.reload();
                  if (currentUser.emailVerified && completeRegistration) {
                    completeRegistration();
                  }
                }
              } catch (error) {
                                if (__DEV__) {
                  console.warn('EmailVerification - Backend check on app state change failed:', error)
                };
              }
            }
          } catch (error) {
                        if (__DEV__) {
              console.warn('EmailVerification - Error reloading user on app state change:', error)
            };
          }
        }
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearInterval(timer);
      subscription.remove();
      appStateSubscription.remove();
    };
  }, [completeRegistration, route?.params?.email]);

  const handleResendVerification = async () => {
    if (!canResend) return;

    setIsResending(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Issue', 'No user found. Please log in again.');
        setIsResending(false);
        return;
      }

      // Reload user to ensure latest state
      try {
        await user.reload();
                if (__DEV__) {
          console.log('EmailVerification - User reloaded successfully')
        };
      } catch (reloadError: any) {
                if (__DEV__) {
          console.warn('EmailVerification - User reload warning:', reloadError?.message)
        };
      }
      
            if (__DEV__) {
        console.log('EmailVerification - Resending verification email...')
      };
            if (__DEV__) {
        console.log('EmailVerification - User email:', user.email)
      };
            if (__DEV__) {
        console.log('EmailVerification - User UID:', user.uid)
      };
            if (__DEV__) {
        console.log('EmailVerification - User emailVerified:', user.emailVerified)
      };
      
      let emailSent = false;
      let emailError: any = null;
      let backendErrorMessage = 'Backend service unavailable'; // Extract backend error message (needed for later error handling)
      
      // Use backend SMTP as primary method
      try {
                if (__DEV__) {
          console.log('EmailVerification - Sending email via backend SMTP...')
        };
            const token = await user.getIdToken();
            const backendResponse = await api.post('/auth/resend-verification-email', {
              email: user.email,
              uid: user.uid
            }, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (backendResponse.data?.success) {
          // Check if email is already verified
          if (backendResponse.data?.emailVerified) {
                        if (__DEV__) {
              console.log('✅ EmailVerification - Backend reports email already verified!')
            };
            // Reload user to check Firebase verification status
            await user.reload();
            
            if (user.emailVerified) {
              // Email is verified in Firebase too, proceed with registration
                            if (__DEV__) {
                console.log('✅ EmailVerification - Email verified in Firebase, proceeding...')
              };
              Alert.alert(
                'Email Already Verified ✓',
                'Your email is already verified! Completing registration...',
                [
                  {
                    text: 'Continue',
                    onPress: completeRegistration,
                  },
                ]
              );
              return; // Exit early since we're proceeding
            } else {
              // Backend says verified but Firebase doesn't - sync them
                            if (__DEV__) {
                console.log('⚠️ EmailVerification - Backend verified but Firebase not, syncing...')
              };
              try {
                // Try to verify directly via backend
                const verifyResponse = await api.post('/auth/verify-email', {
                  email: user.email,
                  uid: user.uid
                }, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (verifyResponse.data?.success) {
                  await user.reload();
                  if (user.emailVerified) {
                    Alert.alert(
                      'Email Verified ✓',
                      'Your email has been verified! Completing registration...',
                      [
                        {
                          text: 'Continue',
                          onPress: completeRegistration,
                        },
                      ]
                    );
                    return;
                  }
                }
              } catch (verifyError: any) {
                // Silently ignore verification errors - just log for debugging
                                if (__DEV__) {
                  console.warn('EmailVerification - Direct verification failed (silently ignored):', verifyError?.response?.status || verifyError?.message)
                };
              }
            }
          } else if (backendResponse.data?.emailSent) {
                                if (__DEV__) {
                  console.log('✅ EmailVerification - Backend sent verification email via SMTP!')
                };
                emailSent = true;
                Alert.alert(
                  'Verification Email Sent ✓',
                  `A verification email has been sent via SMTP to:\n\n${user.email}\n\nPlease check your inbox and spam folder.`,
                  [{ text: 'OK' }]
                );
              } else if (backendResponse.data?.verificationLink) {
                        if (__DEV__) {
              console.log('✅ EmailVerification - Backend generated verification link (SMTP failed, but link available)')
            };
                Alert.alert(
                  'Verification Link Generated',
                  `Backend generated a verification link. SMTP email failed, but you can use the link to verify.\n\nPlease check:\n• SPAM/JUNK folder\n• Wait 2-3 minutes\n\nIf email still doesn't arrive, contact support.`,
                  [{ text: 'OK' }]
                );
                emailSent = true; // Mark as sent for UI purposes
              }
            }
          } catch (backendError: any) {
        
        // Check if this is an ngrok/backend connection error
        const isBackendUnavailable = isNgrokError(backendError) || (backendError as any)?.isBackendUnavailable;
        
        if (isBackendUnavailable) {
          // Backend is down/unavailable - skip to Firebase immediately
                    if (__DEV__) {
            console.warn('⚠️ EmailVerification - Backend unavailable (ngrok connection error), skipping to Firebase...')
          };
          emailError = {
            message: backendErrorMessage,
            code: 'backend_unavailable',
            original: backendError
          };
          } else {
          // Real backend error (not connection issue) - try Firebase fallback
          const backendStatus = backendError?.response?.status;
          const backendErrorCode = backendError?.response?.data?.code;
          
          // Extract error message from backend response
          backendErrorMessage = backendError?.response?.data?.message || 
                                      backendError?.response?.data?.error || 
                                      backendError?.message || 
                                      'Backend SMTP service unavailable';
          
          // Log backend error details
                    if (__DEV__) {
            console.error('❌ EmailVerification - Backend SMTP error details:')
          };
                    if (__DEV__) {
            console.error('   Status:', backendStatus)
          };
                    if (__DEV__) {
            console.error('   Response Data:', backendError?.response?.data)
          };
                    if (__DEV__) {
            console.error('   Error Message:', backendError?.message)
          };
          
          emailError = {
            message: backendErrorMessage,
            code: backendErrorCode || backendError?.code || 'backend_error',
            original: backendError,
            response: backendError?.response
          };
        }
        
      }
      
      // No Firebase fallback needed - backend uses custom tokens (bypasses rate limits)
      
      // Provide user feedback based on result
      if (emailSent) {
        // Alert.alert(
        //   'Verification Email Sent ✓',
        //   // `Firebase reports the email was sent to:\n\n${user.email}\n\n⚠️ IMPORTANT - If you don't receive it:\n\n1. Check SPAM/JUNK folder (most common)\n2. Check Gmail Promotions tab\n3. Wait 2-3 minutes (delivery delay)\n4. Check Firebase Console → Authentication → Usage (quota may be exceeded)\n5. Gmail often blocks Firebase emails\n\n📧 Common Issues:\n• Firebase daily email quota exceeded\n• Email provider blocking Firebase\n• Email in spam (check spam folder!)\n\nIf email still doesn't arrive after checking spam and waiting, you may need to:\n• Verify manually from Firebase Console (contact admin)\n• Try a different email address\n• Check Firebase project email settings`,
        //   // [{ text: 'OK' }]
        // );
        
        // Reset timer
        setTimeLeft(60);
        setCanResend(false);
      } else {
        // Email sending failed - show helpful error message
        // Extract error message from various possible error formats
        let errorMessage = 'Email service temporarily unavailable';
        if (emailError) {
          if (typeof emailError === 'string') {
            errorMessage = emailError;
          } else if (emailError?.message) {
            errorMessage = emailError.message;
          } else if (emailError?.response?.data?.message) {
            errorMessage = emailError.response.data.message;
          } else if (emailError?.response?.data?.error) {
            errorMessage = emailError.response.data.error;
          } else if (emailError?.original?.response?.data?.message) {
            errorMessage = emailError.original.response.data.message;
          } else if (emailError?.original?.response?.data?.error) {
            errorMessage = emailError.original.response.data.error;
          } else if (emailError?.original?.message) {
            errorMessage = emailError.original.message;
          } else if (emailError?.response?.message) {
            errorMessage = emailError.response.message;
          }
        }
        
        // Extract error code - Firebase errors can have code in multiple places
        let errorCode = emailError?.code || 
                       emailError?.original?.code || 
                       emailError?.response?.data?.code ||
                       emailError?.original?.response?.data?.code ||
                       'unknown';
        
        // If error code is still unknown, try to extract from error message
        if (errorCode === 'unknown' && emailError?.message) {
          const codeMatch = emailError.message.match(/\(([a-z/-]+)\)/);
          if (codeMatch) {
            errorCode = codeMatch[1];
          }
        }
        
        // Also check original error's message if still unknown
        if (errorCode === 'unknown' && emailError?.original?.message) {
          const codeMatch = emailError.original.message.match(/\(([a-z/-]+)\)/);
          if (codeMatch) {
            errorCode = codeMatch[1];
          }
        }
        
        let userMessage = `Failed to resend verification email.\n\n`;
        
        if (errorCode === 'auth/user-not-found') {
          userMessage = 'Failed to resend verification email.\n\n';
          userMessage += '⚠️ User not found. Please log in again.';
        } else if (errorCode === 'auth/unauthorized-continue-uri') {
          userMessage = 'Failed to resend verification email.\n\n';
          userMessage += '⚠️ Email configuration error. Please contact support.';
        } else if (errorCode === 'backend_unavailable' || errorCode === 'backend_error' || errorMessage.includes('Backend SMTP')) {
          userMessage = 'Failed to resend verification email.\n\n';
          if (errorCode === 'backend_unavailable') {
            userMessage += '⚠️ Backend service unavailable.\n\n';
            userMessage += 'The backend server is currently unavailable. The app tried to use Firebase as a fallback, but it also failed.\n\n';
            userMessage += 'Please try again in a few moments or contact support.';
          } else {
            userMessage += `⚠️ Email service temporarily unavailable.\n\n${errorMessage}\n\nPlease try again in a few moments.`;
          }
        } else {
          userMessage += `Error: ${errorMessage}\n\n`;
          userMessage += 'Please try again later or contact support if the issue persists.';
        }
        
        Alert.alert('Issue', userMessage, [{ text: 'OK' }]);
      }
    } catch (error: any) {
            if (__DEV__) {
        console.error('EmailVerification - Unexpected error:', error)
      };
      Alert.alert(
        'Error',
        `An unexpected error occurred: ${error?.message || 'Unknown error'}. Please try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsResending(false);
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
          // Firebase says not verified, but check with backend
                    if (__DEV__) {
            console.log('EmailVerification - Firebase shows unverified, checking backend...')
          };
          try {
            const token = await user.getIdToken();
            const backendCheck = await api.post('/auth/resend-verification-email', {
              email: user.email,
              uid: user.uid
            }, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            // If backend says email is verified, reload Firebase user and check again
            if (backendCheck.data?.emailVerified) {
                            if (__DEV__) {
                console.log('EmailVerification - Backend says email is verified, reloading Firebase user...')
              };
              
              // Reload Firebase user to sync verification status
              await user.reload();
              
              // Check again after reload
              if (user.emailVerified) {
                                if (__DEV__) {
                  console.log('EmailVerification - Email verified confirmed after reload!')
                };
                Alert.alert(
                  'Email Verified! ✓',
                  'Your email has been verified! Completing your registration...',
                  [
                    {
                      text: 'Continue',
                      onPress: completeRegistration,
                    },
                  ]
                );
                return;
              } else {
                // Backend says verified but Firebase doesn't - force sync via verify-email endpoint
                                if (__DEV__) {
                  console.log('EmailVerification - Backend verified but Firebase not synced, forcing sync...')
                };
                try {
                  const verifyResponse = await api.post('/auth/verify-email', {
                    email: user.email,
                    uid: user.uid
                  }, {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  
                  if (verifyResponse.data?.success) {
                    // Reload again after forcing verification
                    await user.reload();
                    if (user.emailVerified) {
                      Alert.alert(
                        'Email Verified! ✓',
                        'Your email has been verified! Completing your registration...',
                        [
                          {
                            text: 'Continue',
                            onPress: completeRegistration,
                          },
                        ]
                      );
                      return;
                    }
                  }
                } catch (verifyError: any) {
                  // Silently ignore verification errors - just log for debugging
                                    if (__DEV__) {
                    console.warn('EmailVerification - Force sync failed (silently ignored):', verifyError?.response?.status || verifyError?.message)
                  };
                }
              }
            }
          } catch (backendError: any) {
            // Silently ignore backend errors when checking verification status
            // Just log for debugging but don't show errors to user
            const isBackendUnavailable = isNgrokError(backendError) || (backendError as any)?.isBackendUnavailable;
            if (isBackendUnavailable) {
                            if (__DEV__) {
                console.warn('EmailVerification - Backend unavailable, skipping backend check')
              };
            } else {
              // Silently log backend check errors - don't show to user
                            if (__DEV__) {
                console.warn('EmailVerification - Backend check failed (silently ignored):', backendError?.response?.status || backendError?.message)
              };
            }
          }
          
          // Show standard message if still not verified (no error shown - just informational)
          Alert.alert(
            'Not Verified Yet',
            'Your email has not been verified yet. Please check your email inbox (and spam folder) for a verification email from Tray and click the verification link.\n\nNote: This is different from profile approval emails - you need the email verification link.',
            [
              {
                text: 'Check Spam Folder',
                onPress: () => {
                  Alert.alert(
                    'Check Spam Folder',
                    'Sometimes verification emails end up in spam. Please check your spam/junk folder for an email from Tray.',
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
      // Silently ignore errors when checking verification - just log for debugging
            if (__DEV__) {
        console.warn('Check verification error (silently ignored):', error?.message || error)
      };
      // Don't show error alert - just show "not verified" message if email is not verified
      const user = auth.currentUser;
      if (user) {
        try {
          await user.reload();
          if (!user.emailVerified) {
            Alert.alert(
              'Not Verified Yet',
              'Your email has not been verified yet. Please check your email inbox (and spam folder) for a verification email from Tray and click the verification link.',
              [{ text: 'OK' }]
            );
          }
        } catch (reloadError) {
          // Silently ignore reload errors too
                    if (__DEV__) {
            console.warn('User reload error (silently ignored):', reloadError)
          };
        }
      }
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
              1. Check your email inbox (and spam folder) for verification email
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 4 }}>
              2. Click the verification link in the email
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
            Didn't receive the verification email? Check your spam folder or try resending.
          </Text>
          <Text style={{
            fontSize: 12,
            color: COLORS.orange,
            textAlign: 'center',
            lineHeight: 18,
            marginTop: 8,
          }}>
            Note: Profile approval emails are different from email verification emails.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EmailVerification;