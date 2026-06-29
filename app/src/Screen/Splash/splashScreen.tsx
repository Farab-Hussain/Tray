import { useEffect } from 'react';
import { Image, View, Platform } from 'react-native';
import { globalStyles } from '../../constants/core/global';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../lib/firebase';
import { api } from '../../lib/fetcher';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveColdStartCallLaunch, hasColdStartCallIntent } from '../../services/cold-start-call.service';
// import { getConsultantApplications } from '../services/consultantFlow.service';

const SplashScreen = ({ navigation }: any) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      // Wait for Firebase auth to initialize
      if (loading) {
                if (__DEV__) {
          console.log('SplashScreen - Waiting for auth to initialize...')
        };
        return;
      }

      const coldStartPending = await hasColdStartCallIntent();
      const minSplashTime = coldStartPending
        ? 0
        : Platform.OS === 'android'
          ? 800
          : 2500;
      const startTime = Date.now();

      try {
        if (user) {
                    if (__DEV__) {
            console.log('SplashScreen - User found, checking verification status...')
          };
          
          // First, reload user to get latest status from Firebase
          let reloadedUser = user;
          try {
            await user.reload();
            reloadedUser = auth.currentUser || user;
          } catch (reloadError) {
                        if (__DEV__) {
              console.warn('SplashScreen - Error reloading user:', reloadError)
            };
          }
          
          // Check Firebase verification status first
          let isVerified = reloadedUser?.emailVerified || false;
                    if (__DEV__) {
            console.log('SplashScreen - Initial Firebase emailVerified status:', isVerified)
          };
          
          // If Firebase shows unverified, double-check with backend (web verification might have happened)
          if (!isVerified) {
                        if (__DEV__) {
              console.log('SplashScreen - Firebase shows unverified, checking backend...')
            };
            try {
              const { fetchEmailVerificationStatus } = await import(
                '../../services/auth-verification.service'
              );
              const backendCheck = await fetchEmailVerificationStatus();
              const backendSaysVerified = backendCheck?.emailVerified === true;
                            if (__DEV__) {
                console.log('SplashScreen - Backend says emailVerified:', backendSaysVerified)
              };
              
              // If backend says verified but Firebase doesn't, reload client auth state
              if (backendSaysVerified && !isVerified) {
                if (__DEV__) {
                  console.log('SplashScreen - Backend says verified but Firebase doesn\'t, reloading user...')
                };
                try {
                  await reloadedUser.reload();
                  reloadedUser = auth.currentUser || reloadedUser;
                  isVerified = reloadedUser?.emailVerified || false;
                  if (__DEV__) {
                    console.log('SplashScreen - After reload, Firebase emailVerified status:', isVerified)
                  };

                  // If still not verified, use backend's answer as truth
                  if (!isVerified && backendSaysVerified) {
                    if (__DEV__) {
                      console.log('SplashScreen - Firebase still shows unverified, trusting backend (verified)')
                    };
                    isVerified = true;
                  }
                } catch (syncError) {
                  if (__DEV__) {
                    console.warn('SplashScreen - Firebase reload failed:', syncError)
                  };
                  if (backendSaysVerified) {
                    if (__DEV__) {
                      console.log('SplashScreen - Reload failed but backend says verified, trusting backend')
                    };
                    isVerified = true;
                  }
                }
              } else if (backendSaysVerified) {
                // Backend says verified and Firebase already shows verified
                                if (__DEV__) {
                  console.log('SplashScreen - Both backend and Firebase confirm email is verified')
                };
                isVerified = true;
              }
            } catch (backendError: any) {
                            if (__DEV__) {
                console.warn('SplashScreen - Backend check failed or timed out:', backendError?.message || backendError)
              };
              // If backend check fails, trust Firebase's current status
                            if (__DEV__) {
                console.log('SplashScreen - Using Firebase status as source of truth:', isVerified)
              };
            }
          } else {
                        if (__DEV__) {
              console.log('SplashScreen - Email is verified according to Firebase')
            };
          }
          
          // Final check: Only navigate to EmailVerification if email is NOT verified
          if (!isVerified) {
                        if (__DEV__) {
              console.log('SplashScreen - Email NOT verified, redirecting to EmailVerification screen')
            };
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minSplashTime - elapsedTime);
            
            setTimeout(() => {
              navigation.replace('Auth', {
                screen: 'EmailVerification',
                params: { 
                  email: reloadedUser?.email || user.email,
                  fromLogin: true 
                }
              });
            }, remainingTime);
            return;
          }

          // Email IS verified — cold-start incoming call goes directly to call screen (skip home + delay)
          const coldStartCall = await resolveColdStartCallLaunch();
          if (coldStartCall) {
            if (__DEV__) {
              console.log('SplashScreen - Cold start call launch:', coldStartCall.screen);
            }
            navigation.replace('Screen', {
              screen: coldStartCall.screen,
              params: coldStartCall.params,
            });
            return;
          }

          // Email IS verified - navigate to home
                    if (__DEV__) {
            console.log('SplashScreen - Email is VERIFIED, navigating to home screen')
          };
          
          // User is logged in and email verified - get their role and navigate to home
          const storedRole = await AsyncStorage.getItem('role');
          const userRole = storedRole || 'student'; // Default to student if no role found

          if (__DEV__) {
            console.log('SplashScreen - User logged in and verified - Role:', userRole);
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
                    if (__DEV__) {
            console.log('SplashScreen - No user logged in, showing SplashMain')
          };

          // Calculate remaining time to show splash
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, minSplashTime - elapsedTime);

          setTimeout(() => {
                        if (__DEV__) {
              console.log('SplashScreen - Navigating to SplashMain')
            };
            navigation.replace('SplashMain');
          }, remainingTime);
        }
      } catch (error) {
                if (__DEV__) {
          console.error('SplashScreen - Error checking auth status:', error)
        };
        // Ensure navigation happens even on error
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minSplashTime - elapsedTime);
        
        setTimeout(() => {
                    if (__DEV__) {
            console.log('SplashScreen - Navigating to SplashMain (error fallback)')
          };
          try {
            navigation.replace('SplashMain');
          } catch (navError) {
                        if (__DEV__) {
              console.error('SplashScreen - Navigation error:', navError)
            };
            // Last resort - try navigate instead of replace
            try {
              navigation.navigate('SplashMain');
            } catch (finalError) {
                            if (__DEV__) {
                console.error('SplashScreen - Final navigation error:', finalError)
              };
            }
          }
        }, remainingTime);
      }
    };

    checkAuthAndNavigate();
    
    // Safety timeout - ensure navigation happens even if something goes wrong
    // But only navigate to EmailVerification if email is actually not verified
    const safetyTimeout = setTimeout(async () => {
            if (__DEV__) {
        console.warn('SplashScreen - Safety timeout triggered, forcing navigation')
      };
      try {
        if (user) {
          // Check verification status before deciding where to navigate
          let isVerified = false;
          try {
            await user.reload();
            const currentUser = auth.currentUser || user;
            isVerified = currentUser?.emailVerified || false;
                        if (__DEV__) {
              console.log('SplashScreen - Safety timeout: emailVerified status:', isVerified)
            };
            
            // If still not verified, check with backend
            if (!isVerified) {
              try {
                const { fetchEmailVerificationStatus } = await import(
                  '../../services/auth-verification.service'
                );
                const backendCheck = await fetchEmailVerificationStatus();
                if (backendCheck?.emailVerified === true) {
                                    if (__DEV__) {
                    console.log('SplashScreen - Safety timeout: Backend confirms email is verified')
                  };
                  isVerified = true;
                }
              } catch (backendError) {
                                if (__DEV__) {
                  console.warn('SplashScreen - Safety timeout: Backend check failed:', backendError)
                };
              }
            }
          } catch (reloadError) {
                        if (__DEV__) {
              console.warn('SplashScreen - Safety timeout: Error checking verification:', reloadError)
            };
          }
          
          // Only navigate to EmailVerification if email is NOT verified
          if (!isVerified) {
                        if (__DEV__) {
              console.log('SplashScreen - Safety timeout: Navigating to EmailVerification (not verified)')
            };
            navigation.replace('Auth', {
              screen: 'EmailVerification',
              params: { 
                email: user.email,
                fromLogin: true 
              }
            });
          } else {
                        if (__DEV__) {
              console.log('SplashScreen - Safety timeout: Email verified, navigating to home')
            };
            const storedRole = await AsyncStorage.getItem('role');
            const userRole = storedRole || 'student';
            navigation.replace('Screen', {
              screen: 'MainTabs',
              params: { role: userRole }
            });
          }
        } else {
          navigation.replace('SplashMain');
        }
      } catch (error) {
                if (__DEV__) {
          console.error('SplashScreen - Safety timeout navigation error:', error)
        };
        // Fallback: navigate to SplashMain on error
        try {
          navigation.replace('SplashMain');
        } catch (finalError) {
                    if (__DEV__) {
            console.error('SplashScreen - Final fallback navigation error:', finalError)
          };
        }
      }
    }, 10000); // 10 second safety timeout

    return () => {
      clearTimeout(safetyTimeout);
    };
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
