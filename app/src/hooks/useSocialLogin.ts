import { signInWithCredential, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import appleAuth from '@invertase/react-native-apple-authentication';
import { Platform } from 'react-native';
import { auth } from '../lib/firebase';
import { api } from '../lib/fetcher';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showError } from '../utils/toast';
import { GOOGLE_WEB_CLIENT_ID } from '@env';

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID, 
  offlineAccess: true,
});

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
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Save role to AsyncStorage
      await AsyncStorage.setItem('role', role);
      console.log('Social Login - Role saved to AsyncStorage:', role);

      // Check if user already exists in backend
      try {
        const res = await api.get('/auth/me');
        console.log('Social Login - User already exists in backend');
        
        // Update role if needed
        if (res.data?.role !== role) {
          // Optionally update role in backend if different
          console.log('Social Login - Role mismatch, keeping existing role:', res.data?.role);
          await AsyncStorage.setItem('role', res.data?.role || role);
        }
        
        // Update profile image if missing and user has photoURL from social login
        if (firebaseUser.photoURL && !res.data.profileImage && !res.data.avatarUrl) {
          console.log('Social Login - Updating missing profile image with photoURL:', firebaseUser.photoURL);
          try {
            await api.put('/auth/profile', { profileImage: firebaseUser.photoURL });
            console.log('Social Login - Profile image updated successfully');
          } catch (updateError) {
            console.error('Social Login - Error updating profile image:', updateError);
          }
        }
      } catch (error: any) {
        // User doesn't exist in backend, register them
        if (error?.response?.status === 404) {
          console.log('Social Login - User not found in backend, registering...');
          console.log('Social Login - Firebase user photoURL:', firebaseUser.photoURL);
          await api.post('/auth/register', {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            profileImage: firebaseUser.photoURL || null, // Include Google/Facebook/Apple profile image
            role: role,
          });
          console.log('Social Login - User registered in backend with profile image:', firebaseUser.photoURL);
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
          console.log('Social Login - Consultant verification status saved:', verificationStatus);
        } catch (error) {
          console.error('Social Login - Error fetching consultant status:', error);
          await AsyncStorage.setItem('consultantVerificationStatus', 'incomplete');
        }
      }
    } catch (error: any) {
      console.error('Social Login - Backend sync error:', error);
      throw error;
    }
  };

  /**
   * Google Sign-In
   */
  const googleLogin = async (options?: SocialLoginOptions) => {
    try {
      // Check if Google Play Services are available (Android only)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices();
      }

      // Sign in with Google
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      
      if (!idToken) {
        throw new Error('Google Sign-In failed: No ID token received');
      }

      // Create Firebase credential
      const googleCredential = GoogleAuthProvider.credential(idToken);
      
      // Sign in to Firebase
      const userCredential = await signInWithCredential(auth, googleCredential);
      
      console.log('Social Login - Google sign-in successful:', userCredential.user.email);

      // Sync with backend
      await handleBackendSync(userCredential.user, options?.role || 'student');

      if (options?.onSuccess) {
        options.onSuccess();
      }

      return userCredential.user;
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      
      // Handle user cancellation
      if (error.code === 'SIGN_IN_CANCELLED' || error.message?.includes('cancelled')) {
        console.log('Google Sign-In cancelled by user');
        return null;
      }

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
      // Log in with Facebook
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      
      if (result.isCancelled) {
        console.log('Facebook Sign-In cancelled by user');
        return null;
      }

      // Get access token
      const data = await AccessToken.getCurrentAccessToken();
      
      if (!data?.accessToken) {
        throw new Error('Facebook Sign-In failed: No access token received');
      }

      // Create Firebase credential
      const facebookCredential = FacebookAuthProvider.credential(data.accessToken);
      
      // Sign in to Firebase
      const userCredential = await signInWithCredential(auth, facebookCredential);
      
      console.log('Social Login - Facebook sign-in successful:', userCredential.user.email);

      // Sync with backend
      await handleBackendSync(userCredential.user, options?.role || 'student');

      if (options?.onSuccess) {
        options.onSuccess();
      }

      return userCredential.user;
    } catch (error: any) {
      console.error('Facebook Sign-In error:', error);
      
      // Handle user cancellation
      if (error.message?.includes('cancelled') || error.message?.includes('User cancelled')) {
        console.log('Facebook Sign-In cancelled by user');
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
      console.warn('Apple Sign-In is only available on iOS');
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
      const { identityToken, nonce } = appleAuthRequestResponse;

      // Create Firebase credential
      const appleCredential = new OAuthProvider('apple.com').credential({
        idToken: identityToken,
        rawNonce: nonce,
      });

      // Sign in to Firebase
      const userCredential = await signInWithCredential(auth, appleCredential);
      
      console.log('Social Login - Apple sign-in successful:', userCredential.user.email);

      // Sync with backend
      await handleBackendSync(userCredential.user, options?.role || 'student');

      if (options?.onSuccess) {
        options.onSuccess();
      }

      return userCredential.user;
    } catch (error: any) {
      console.error('Apple Sign-In error:', error);
      
      // Handle user cancellation
      if (error.code === appleAuth.Error.CANCELED || error.message?.includes('cancelled')) {
        console.log('Apple Sign-In cancelled by user');
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

