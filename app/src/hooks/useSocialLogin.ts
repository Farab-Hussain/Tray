import { signInWithCredential, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken, Settings } from 'react-native-fbsdk-next';
import appleAuth from '@invertase/react-native-apple-authentication';
import { Platform } from 'react-native';
import { auth } from '../lib/firebase';
import { api } from '../lib/fetcher';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showError } from '../utils/toast';
import { GOOGLE_WEB_CLIENT_ID } from '@env';

// Initialize Facebook SDK Settings
// Note: Display name is configured in Info.plist (iOS) and strings.xml (Android)
// Only AppID and ClientToken need to be set programmatically
try {
  Settings.setAppID('1062926749049');
  Settings.setClientToken('b9857fc3912f5f51556932745d508d08');
} catch (error) {
  if (__DEV__) {
    console.warn('⚠️ Facebook SDK Settings initialization warning:', error);
  }
}

// Configure Google Sign-In
// Only configure if GoogleSignin is available and GOOGLE_WEB_CLIENT_ID is set
if (GOOGLE_WEB_CLIENT_ID && GoogleSignin && typeof GoogleSignin.configure === 'function') {
  try {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID, 
      offlineAccess: true,
    });
    if (__DEV__) {
      console.log('✅ Google Sign-In configured successfully');
    }
  } catch (configError: any) {
    if (__DEV__) {
      console.error('❌ Google Sign-In configuration error:', configError);
    }
  }
} else {
  if (__DEV__) {
    if (!GOOGLE_WEB_CLIENT_ID) {
      console.warn('⚠️ GOOGLE_WEB_CLIENT_ID is not configured. Google Sign-In will not work.');
    }
    if (!GoogleSignin || typeof GoogleSignin.configure !== 'function') {
      console.error('❌ GoogleSignin native module is not available. Make sure the library is properly linked.');
    }
  }
}

interface SocialLoginOptions {
  role?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useSocialLogin = () => {
  /**
   * Handle backend sync after social login
   */
  const handleBackendSync = async (firebaseUser: any, role: string = 'student') => {
    try {
      const token = await firebaseUser.getIdToken();
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      // Save role to AsyncStorage
      await AsyncStorage.setItem('role', role);
            if (__DEV__) {
        console.log('Social Login - Role saved to AsyncStorage:', role)
      };

      // Check if user already exists in backend
      try {
        const res = await api.get('/auth/me');
                if (__DEV__) {
          console.log('Social Login - User already exists in backend')
        };
        
        // Update role if needed
        if (res.data?.role !== role) {
          // Optionally update role in backend if different
                    if (__DEV__) {
            console.log('Social Login - Role mismatch, keeping existing role:', res.data?.role)
          };
          await AsyncStorage.setItem('role', res.data?.role || role);
        }
        
        // Update profile image if missing and user has photoURL from social login
        if (firebaseUser.photoURL && !res.data.profileImage && !res.data.avatarUrl) {
                    if (__DEV__) {
            console.log('Social Login - Updating missing profile image with photoURL:', firebaseUser.photoURL)
          };
          try {
            await api.put('/auth/profile', { profileImage: firebaseUser.photoURL });
                        if (__DEV__) {
              console.log('Social Login - Profile image updated successfully')
            };
          } catch (updateError) {
                        if (__DEV__) {
              console.error('Social Login - Error updating profile image:', updateError)
            };
          }
        }
      } catch (error: any) {
        // User doesn't exist in backend, register them
        if (error?.response?.status === 404) {
                    if (__DEV__) {
            console.log('Social Login - User not found in backend, registering...')
          };
                    if (__DEV__) {
            console.log('Social Login - Firebase user photoURL:', firebaseUser.photoURL)
          };
          await api.post('/auth/register', {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            profileImage: firebaseUser.photoURL || null, // Include Google/Facebook/Apple profile image
            role: role,
          });
                    if (__DEV__) {
            console.log('Social Login - User registered in backend with profile image:', firebaseUser.photoURL)
          };
        } else {
          throw error;
        }
      }

      // For consultants, also fetch and save verification status
      if (role === 'consultant') {
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
                    if (__DEV__) {
            console.log('Social Login - Consultant verification status saved:', verificationStatus)
          };
        } catch (error) {
                    if (__DEV__) {
            console.error('Social Login - Error fetching consultant status:', error)
          };
          await AsyncStorage.setItem('consultantVerificationStatus', 'incomplete');
        }
      }
    } catch (error: any) {
            if (__DEV__) {
        console.error('Social Login - Backend sync error:', error)
      };
      throw error;
    }
  };

  /**
   * Google Sign-In
   */
  const googleLogin = async (options?: SocialLoginOptions) => {
    try {
      // Verify GoogleSignin is available
      if (!GoogleSignin || typeof GoogleSignin.signIn !== 'function') {
        throw new Error('Google Sign-In native module is not available. Please ensure the library is properly installed and linked.');
      }

      // Check if Google Sign-In is configured
      if (!GOOGLE_WEB_CLIENT_ID) {
        throw new Error('Google Sign-In is not configured. Please set GOOGLE_WEB_CLIENT_ID in your environment variables.');
      }

      // Check if Google Play Services are available (Android only)
      if (Platform.OS === 'android' && GoogleSignin.hasPlayServices && typeof GoogleSignin.hasPlayServices === 'function') {
        try {
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        } catch (playServicesError: any) {
                    if (__DEV__) {
            console.error('Google Play Services error:', playServicesError)
          };
          throw new Error('Google Play Services is required for Google Sign-In. Please update Google Play Services.');
        }
      }

      // Sign in with Google
      // Note: signIn() may throw SIGN_IN_CANCELLED if user cancels
      await GoogleSignin.signIn();
      
      // Get tokens - this will throw if user isn't signed in or cancelled
      // Note: isSignedIn() method may not be available in all versions, so we rely on getTokens()
      let idToken: string | null = null;
      try {
        // Verify getTokens method exists
        if (!GoogleSignin.getTokens || typeof GoogleSignin.getTokens !== 'function') {
          throw new Error('GoogleSignin.getTokens is not available. The native module may not be properly linked.');
        }
        
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      } catch (tokenError: any) {
        // If getTokens fails, user likely cancelled or wasn't signed in
        if (tokenError.message?.includes('requires a user to be signed in') || 
            tokenError.message?.includes('SIGN_IN_REQUIRED') ||
            tokenError.code === 'SIGN_IN_REQUIRED' ||
            tokenError.message?.includes('not available')) {
          if (__DEV__) {
            console.log('Google Sign-In cancelled or not available - no signed in user for tokens');
          }
          return null;
        }
        // Re-throw other token errors
        throw tokenError;
      }
      
      if (!idToken) {
        if (__DEV__) {
          console.log('Google Sign-In failed - No ID token received');
        }
        return null;
      }

      // Create Firebase credential
      const googleCredential = GoogleAuthProvider.credential(idToken);
      
      // Sign in to Firebase
      const userCredential = await signInWithCredential(auth, googleCredential);
      
            if (__DEV__) {
        console.log('Social Login - Google sign-in successful:', userCredential.user.email)
      };

      // Sync with backend
      await handleBackendSync(userCredential.user, options?.role || 'student');

      if (options?.onSuccess) {
        options.onSuccess();
      }

      return userCredential.user;
    } catch (error: any) {
            if (__DEV__) {
        console.error('Google Sign-In error:', error)
      };
      
      // Handle user cancellation - don't show error, just return null
      if (error.code === 'SIGN_IN_CANCELLED' || 
          error.message?.includes('cancelled') ||
          error.message?.includes('requires a user to be signed in') ||
          error.message?.includes('SIGN_IN_REQUIRED')) {
        if (__DEV__) {
          console.log('Google Sign-In cancelled by user');
        }
        return null;
      }

      // Handle DEVELOPER_ERROR with helpful message
      if (error.code === 'DEVELOPER_ERROR' || error.message?.includes('DEVELOPER_ERROR')) {
        const developerErrorMessage = 
          'Google Sign-In configuration error. Please ensure:\n' +
          '1. GOOGLE_WEB_CLIENT_ID is set in your .env file\n' +
          '2. SHA-1 fingerprint is added to Firebase Console\n' +
          '3. OAuth client is properly configured in Google Cloud Console';
        showError(developerErrorMessage, 'Google Sign-In Configuration Error');
        
        if (options?.onError) {
          options.onError(error);
        }
        
        throw error;
      }

      // Only show error if it's not a cancellation
      // Cancellation should return null silently
      const errorMessage = error.message || 'Google Sign-In failed. Please try again.';
      showError(errorMessage, 'Google Sign-In Error');
      
      if (options?.onError) {
        options.onError(error);
      }
      
      throw error;
    }
  };

  /**
   * Facebook Sign-In
   */
  const facebookLogin = async (options?: SocialLoginOptions) => {
    try {
      if (__DEV__) {
        console.log('Facebook Sign-In - Starting login process');
      }
      
      // Log out first to ensure fresh login
      LoginManager.logOut();
      
      if (__DEV__) {
        console.log('Facebook Sign-In - Logged out previous session, requesting login');
      }
      
      // Add timeout wrapper around login to prevent hanging
      // Facebook login can hang if redirect doesn't complete
      const loginTimeout = 90000; // 90 seconds for the login dialog itself
      const loginPromise = LoginManager.logInWithPermissions(['public_profile', 'email']);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Facebook login dialog timed out. The login window may not have closed properly. Please try again.'));
        }, loginTimeout);
      });
      
      if (__DEV__) {
        console.log('Facebook Sign-In - Waiting for login dialog (90s timeout)...');
      }
      
      // Race between login and timeout
      const result = await Promise.race([loginPromise, timeoutPromise]) as any;
      
      if (__DEV__) {
        console.log('Facebook Sign-In - Login result:', { 
          isCancelled: result.isCancelled,
          declinedPermissions: result.declinedPermissions,
          grantedPermissions: result.grantedPermissions
        });
      }
      
      if (result.isCancelled) {
        if (__DEV__) {
          console.log('Facebook Sign-In cancelled by user')
        };
        return null;
      }

      // Wait a bit for the token to be available
      // Sometimes the token needs a moment to propagate
      if (__DEV__) {
        console.log('Facebook Sign-In - Waiting for access token...');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get access token with retry logic
      let data = await AccessToken.getCurrentAccessToken();
      let retries = 0;
      const maxRetries = 5;
      
      while (!data?.accessToken && retries < maxRetries) {
        if (__DEV__) {
          console.log(`Facebook Sign-In - Token not available, retrying... (${retries + 1}/${maxRetries})`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        data = await AccessToken.getCurrentAccessToken();
        retries++;
      }
      
      if (!data?.accessToken) {
        // If no token after retries, user likely cancelled
        // Don't throw error, just return null silently
        if (__DEV__) {
          console.log('Facebook Sign-In cancelled - No access token received after retries');
        }
        return null;
      }

      if (__DEV__) {
        console.log('Facebook Sign-In - Access token received successfully');
      };

      // Create Firebase credential
      const facebookCredential = FacebookAuthProvider.credential(data.accessToken);
      
      // Sign in to Firebase
      const userCredential = await signInWithCredential(auth, facebookCredential);
      
            if (__DEV__) {
        console.log('Social Login - Facebook sign-in successful:', userCredential.user.email)
      };

      // Sync with backend
      await handleBackendSync(userCredential.user, options?.role || 'student');

      if (options?.onSuccess) {
        options.onSuccess();
      }

      return userCredential.user;
    } catch (error: any) {
            if (__DEV__) {
        console.error('Facebook Sign-In error:', error)
      };
      
      // Handle user cancellation
      if (error.message?.includes('cancelled') || error.message?.includes('User cancelled') || error.code === 'EUNSPECIFIED') {
                if (__DEV__) {
          console.log('Facebook Sign-In cancelled by user')
        };
        return null;
      }

      // Handle timeout errors specifically
      if (error.message?.includes('timed out') || error.message?.includes('timeout')) {
        const timeoutError = 'Facebook login took too long. This might happen if:\n\n• The redirect back to the app didn\'t complete\n• Your internet connection is slow\n• Facebook servers are experiencing issues\n\nPlease try:\n• Ensuring the Facebook app is installed\n• Checking your internet connection\n• Restarting the app';
        showError(timeoutError, 'Facebook Login Timeout');
        if (options?.onError) {
          options.onError(error);
        }
        throw error;
      }

      // Handle specific Facebook SDK errors
      if (error.message?.includes('App ID not found') || error.message?.includes('FacebookAppID')) {
        const configError = 'Facebook Sign-In is not properly configured. Please contact support.';
        showError(configError, 'Facebook Configuration Error');
        if (options?.onError) {
          options.onError(new Error(configError));
        }
        return null;
      }

      const errorMessage = error.message || 'Facebook Sign-In failed. Please try again.';
      showError(errorMessage, 'Facebook Sign-In Error');
      
      if (options?.onError) {
        options.onError(error);
      }
      
      throw error;
    }
  };

  /**
   * Apple Sign-In (iOS only)
   */
  const appleLogin = async (options?: SocialLoginOptions) => {
    if (Platform.OS !== 'ios') {
            if (__DEV__) {
        console.warn('Apple Sign-In is only available on iOS')
      };
      return null;
    }

    try {
      // Check if Apple Sign-In is available
      if (!appleAuth.isSupported) {
        throw new Error('Apple Sign-In is not supported on this device');
      }

      // Perform Apple authentication request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      // Check if the request was successful
      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Sign-In failed: No identity token received');
      }

      // Create a nonce for security
      const { identityToken, nonce, fullName, email } = appleAuthRequestResponse;

      // Create Firebase credential
      const appleCredential = new OAuthProvider('apple.com').credential({
        idToken: identityToken,
        rawNonce: nonce,
      });

      // Sign in to Firebase
      const userCredential = await signInWithCredential(auth, appleCredential);
      
      // Apple only provides name on first sign-in, so update Firebase user if available
      if (fullName) {
        const displayName = `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim();
        if (displayName && userCredential.user.displayName !== displayName) {
          await userCredential.user.updateProfile({ displayName });
          if (__DEV__) {
            console.log('Social Login - Updated Firebase user displayName from Apple:', displayName);
          }
        }
      }

      // Apple may provide email in response (only on first sign-in)
      // If email is provided and different from Firebase user email, log it
      if (email && email !== userCredential.user.email) {
        if (__DEV__) {
          console.log('Social Login - Apple provided email:', email, 'Firebase user email:', userCredential.user.email);
        }
      }
      
            if (__DEV__) {
        console.log('Social Login - Apple sign-in successful:', userCredential.user.email || email)
      };

      // Sync with backend
      await handleBackendSync(userCredential.user, options?.role || 'student');

      if (options?.onSuccess) {
        options.onSuccess();
      }

      return userCredential.user;
    } catch (error: any) {
            if (__DEV__) {
        console.error('Apple Sign-In error:', error)
      };
      
      // Handle user cancellation
      if (error.code === appleAuth.Error.CANCELED || error.message?.includes('cancelled')) {
                if (__DEV__) {
          console.log('Apple Sign-In cancelled by user')
        };
        return null;
      }

      const errorMessage = error.message || 'Apple Sign-In failed. Please try again.';
      showError(errorMessage, 'Apple Sign-In Error');
      
      if (options?.onError) {
        options.onError(error);
      }
      
      throw error;
    }
  };

  return {
    googleLogin,
    facebookLogin,
    appleLogin,
  };
};

