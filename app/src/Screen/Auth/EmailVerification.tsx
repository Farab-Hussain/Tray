import React, { useState, useEffect, useCallback } from 'react';
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
import { sendEmailVerification, applyActionCode } from 'firebase/auth';
import { Linking } from 'react-native';
import { api } from '../../lib/fetcher';
import { authStyles } from '../../constants/styles/authStyles';
import { COLORS } from '../../constants/core/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EmailVerification = ({ route }: any) => {
  const navigation = useNavigation();
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
          console.log('EmailVerification - Social login detected, skipping verification');
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
        console.log('EmailVerification - Deep link received:', url);
        
        // Extract oobCode from URL (handles both tray:// and https:// formats)
        // Use regex parsing directly for React Native compatibility
        let oobCode: string | null = null;
        let mode: string | null = null;
        
        // Parse oobCode from URL string (works for both standard URLs and custom schemes)
        const oobCodeMatch = url.match(/[?&]oobCode=([^&]+)/);
        if (oobCodeMatch) {
          oobCode = decodeURIComponent(oobCodeMatch[1]);
        }
        
        // Parse mode from URL string
          const modeMatch = url.match(/[?&]mode=([^&]+)/);
          if (modeMatch) {
            mode = decodeURIComponent(modeMatch[1]);
        }
        
        if (mode === 'verifyEmail' && oobCode) {
          console.log('EmailVerification - Processing verification link...');
          
          try {
            // Try to verify using Firebase client SDK
            await applyActionCode(auth, oobCode);
            console.log('✅ EmailVerification - Email verified via action code!');
            
            // Reload user to get updated verification status
            const user = auth.currentUser;
            if (user) {
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
          } catch (error: any) {
            console.error('EmailVerification - Action code verification failed:', error);
            
            // Try backend endpoint as fallback
            try {
              const user = auth.currentUser;
              if (!user || !user.email) {
                throw new Error('No user or email found');
              }
              
              const token = await user.getIdToken();
              if (token) {
                const backendResponse = await api.post('/auth/verify-email', {
                  oobCode: oobCode,
                  email: user.email // Include email as fallback
                }, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (backendResponse.data?.success) {
                  console.log('✅ EmailVerification - Email verified via backend!');
                  const currentUser = auth.currentUser;
                  if (currentUser) {
                    await currentUser.reload();
                    if (currentUser.emailVerified) {
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
              }
            } catch (backendError: any) {
              console.error('EmailVerification - Backend verification also failed:', backendError);
              Alert.alert(
                'Verification Failed',
                'Failed to verify email. The link may be expired or invalid. Please request a new verification email.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      } catch (error: any) {
        console.error('EmailVerification - Deep link handling error:', error);
      }
    };

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url && (url.includes('mode=verifyEmail') || url.includes('oobCode='))) {
        handleDeepLink(url);
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url && (url.includes('mode=verifyEmail') || url.includes('oobCode='))) {
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

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [completeRegistration, route?.params?.email]);

  const handleResendVerification = async () => {
    if (!canResend) return;

    setIsResending(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'No user found. Please log in again.');
        setIsResending(false);
        return;
      }

      // Reload user to ensure latest state
      try {
        await user.reload();
        console.log('EmailVerification - User reloaded successfully');
      } catch (reloadError: any) {
        console.warn('EmailVerification - User reload warning:', reloadError?.message);
      }
      
      console.log('EmailVerification - Resending verification email...');
      console.log('EmailVerification - User email:', user.email);
      console.log('EmailVerification - User UID:', user.uid);
      console.log('EmailVerification - User emailVerified:', user.emailVerified);
      
      let emailSent = false;
      let emailError: any = null;
      
      // Use backend SMTP as primary method (bypasses Firebase rate limits)
      try {
        console.log('EmailVerification - Sending email via backend SMTP...');
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
            console.log('✅ EmailVerification - Backend reports email already verified!');
            // Reload user to check Firebase verification status
            await user.reload();
            
            if (user.emailVerified) {
              // Email is verified in Firebase too, proceed with registration
              console.log('✅ EmailVerification - Email verified in Firebase, proceeding...');
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
              console.log('⚠️ EmailVerification - Backend verified but Firebase not, syncing...');
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
                console.error('EmailVerification - Direct verification failed:', verifyError);
              }
            }
          } else if (backendResponse.data?.emailSent) {
                console.log('✅ EmailVerification - Backend sent verification email via SMTP!');
                emailSent = true;
                Alert.alert(
                  'Verification Email Sent ✓',
                  `A verification email has been sent via SMTP to:\n\n${user.email}\n\nPlease check your inbox and spam folder.`,
                  [{ text: 'OK' }]
                );
              } else if (backendResponse.data?.verificationLink) {
            console.log('✅ EmailVerification - Backend generated verification link (SMTP failed, but link available)');
                Alert.alert(
                  'Verification Link Generated',
                  `Backend generated a verification link. SMTP email failed, but you can use the link to verify.\n\nPlease check:\n• SPAM/JUNK folder\n• Wait 2-3 minutes\n\nIf email still doesn't arrive, contact support.`,
                  [{ text: 'OK' }]
                );
                emailSent = true; // Mark as sent for UI purposes
              }
            }
          } catch (backendError: any) {
        console.error('❌ EmailVerification - Backend SMTP error details:');
        console.error('   Status:', backendError?.response?.status);
        console.error('   Response Data:', backendError?.response?.data);
        console.error('   Error Message:', backendError?.message);
        console.error('   Full Error:', JSON.stringify(backendError?.response?.data || backendError, null, 2));
        console.warn('⚠️ EmailVerification - Backend SMTP failed, trying Firebase as fallback...');
        
        // Extract error message from backend response
        const backendErrorMessage = backendError?.response?.data?.message || 
                                    backendError?.response?.data?.error || 
                                    backendError?.message || 
                                    'Backend SMTP service unavailable';
        emailError = {
          message: backendErrorMessage,
          code: backendError?.response?.data?.code || backendError?.code || 'backend_error',
          original: backendError,
          response: backendError?.response
        };
        
        // Fallback to Firebase if backend fails
        try {
          await sendEmailVerification(user, {
            url: `tray://email-verification`,
            handleCodeInApp: true,
          });
          emailSent = true;
          console.log('✅ EmailVerification - Firebase sent verification email (fallback)!');
          emailError = null; // Clear error since Firebase worked
        } catch (firebaseError: any) {
          // If custom scheme not allowlisted, try simple method
          if (firebaseError?.code === 'auth/unauthorized-continue-uri') {
            try {
              await sendEmailVerification(user);
              emailSent = true;
              console.log('✅ EmailVerification - Firebase sent verification email (simple method)!');
              emailError = null; // Clear error since it worked
            } catch (simpleError: any) {
              // Keep the backend error if it's more descriptive, otherwise use Firebase error
              const firebaseErrorMessage = simpleError?.message || 'Firebase email verification failed';
              emailError = {
                message: `${backendErrorMessage}\n\nFirebase fallback also failed: ${firebaseErrorMessage}`,
                code: simpleError?.code || 'all_methods_failed',
                original: simpleError
              };
              console.error('❌ EmailVerification - All methods failed:', simpleError?.message);
            }
          } else {
            // Keep the backend error if it's more descriptive
            const firebaseErrorMessage = firebaseError?.message || 'Firebase email verification failed';
            emailError = {
              message: `${backendErrorMessage}\n\nFirebase fallback also failed: ${firebaseErrorMessage}`,
              code: firebaseError?.code || 'firebase_fallback_failed',
              original: firebaseError
            };
            console.error('❌ EmailVerification - Firebase fallback also failed:', firebaseError?.message);
          }
        }
      }
      
      // Provide user feedback based on result
      if (emailSent) {
        Alert.alert(
          'Verification Email Sent ✓',
          `Firebase reports the email was sent to:\n\n${user.email}\n\n⚠️ IMPORTANT - If you don't receive it:\n\n1. Check SPAM/JUNK folder (most common)\n2. Check Gmail Promotions tab\n3. Wait 2-3 minutes (delivery delay)\n4. Check Firebase Console → Authentication → Usage (quota may be exceeded)\n5. Gmail often blocks Firebase emails\n\n📧 Common Issues:\n• Firebase daily email quota exceeded\n• Email provider blocking Firebase\n• Email in spam (check spam folder!)\n\nIf email still doesn't arrive after checking spam and waiting, you may need to:\n• Verify manually from Firebase Console (contact admin)\n• Try a different email address\n• Check Firebase project email settings`,
          [{ text: 'OK' }]
        );
        
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
        
        const errorCode = emailError?.code || emailError?.original?.code || 'unknown';
        
        let userMessage = `Failed to resend verification email.\n\n`;
        
        if (errorCode === 'auth/user-not-found') {
          userMessage += '⚠️ User not found. Please log in again.';
        } else if (errorCode === 'auth/unauthorized-continue-uri') {
          userMessage += '⚠️ Email configuration error. Please contact support.';
        } else if (errorCode === 'backend_error' || errorMessage.includes('Backend SMTP')) {
          userMessage += `⚠️ Email service temporarily unavailable.\n\n${errorMessage}\n\nPlease try again in a few moments.`;
        } else {
          userMessage += `Error: ${errorMessage}\n\n`;
          userMessage += 'Please try again later or contact support if the issue persists.';
        }
        
        Alert.alert('Error', userMessage, [{ text: 'OK' }]);
      }
    } catch (error: any) {
      console.error('EmailVerification - Unexpected error:', error);
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
          console.log('EmailVerification - Firebase shows unverified, checking backend...');
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
            
            // If backend says email is verified, sync with Firebase
            if (backendCheck.data?.emailVerified) {
              console.log('EmailVerification - Backend says email is verified, syncing...');
              
              // Try to verify directly via backend
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
                console.error('EmailVerification - Direct verification failed:', verifyError);
              }
            }
          } catch (backendError: any) {
            console.warn('EmailVerification - Backend check failed:', backendError);
          }
          
          // Show standard message if still not verified
          Alert.alert(
            'Not Verified Yet',
            'Your email has not been verified yet. Please check your email inbox (and spam folder) for a verification email from Firebase/Tray and click the verification link.\n\nNote: This is different from profile approval emails - you need the Firebase verification email.',
            [
              {
                text: 'Verify Now',
                onPress: async () => {
                  // Try to verify directly via backend
                  try {
                    const token = await user.getIdToken();
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
                          'Email Verified! ✓',
                          'Your email has been verified! Completing your registration...',
                          [
                            {
                              text: 'Continue',
                              onPress: completeRegistration,
                            },
                          ]
                        );
                      } else {
                        Alert.alert('Error', 'Verification failed. Please try clicking the link in your email.');
                      }
                    }
                  } catch (verifyError: any) {
                    console.error('EmailVerification - Direct verification failed:', verifyError);
                    Alert.alert('Error', 'Could not verify email. Please check your email and click the verification link.');
                  }
                },
              },
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
