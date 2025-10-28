import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../lib/firebase';
import { api } from '../lib/fetcher';

interface AuthContextType {
  user: User | null;
  role: string | null;
  intendedRole: string | null;
  loading: boolean;
  consultantVerificationStatus: 'incomplete' | 'pending' | 'approved' | 'rejected' | null;
  needsProfileCreation: boolean;
  refreshUser: () => Promise<void>;
  refreshConsultantStatus: () => Promise<void>;
  setIntendedRole: (role: string) => void;
  logout: () => Promise<void>;
  }

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  intendedRole: null,
  loading: true,
  consultantVerificationStatus: null,
  needsProfileCreation: false,
  refreshUser: async () => {},
  refreshConsultantStatus: async () => {},
  setIntendedRole: () => {},
  logout: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [intendedRole, setIntendedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [consultantVerificationStatus, setConsultantVerificationStatus] = useState<'incomplete' | 'pending' | 'approved' | 'rejected' | null>(null);
  const [needsProfileCreation, setNeedsProfileCreation] = useState<boolean>(false);
  
  // Use ref to track if we're currently fetching to prevent duplicate calls
  const isFetchingRole = useRef(false);
  const lastFetchTime = useRef<number>(0);
  const isFetchingStatus = useRef(false);
  const lastStatusFetchTime = useRef<number>(0);

  const fetchUserRole = useCallback(async (force = false, retryCount = 0) => {
    // Prevent duplicate calls within 5 seconds unless forced
    const now = Date.now();
    if (!force && (isFetchingRole.current || now - lastFetchTime.current < 5000)) {
      console.log('⚠️ Skipping role fetch (too soon or already fetching)');
      return;
    }
    
    // Check if we're in the middle of registration process
    const isRegistering = await AsyncStorage.getItem('isRegistering');
    if (isRegistering === 'true' && retryCount === 0) {
      console.log('🔄 Registration in progress, delaying role fetch...');
      // Wait a bit longer for registration to complete
      setTimeout(() => {
        fetchUserRole(force, retryCount + 1);
      }, 2000);
      return;
    }
    
    isFetchingRole.current = true;
    
    try {
      console.log(`Fetching user role from /auth/me... (attempt ${retryCount + 1})`);
      const res = await api.get('/auth/me');
      console.log('Full /auth/me response:', JSON.stringify(res.data, null, 2));
      
      // Check if profile needs to be created
      if (res.data?.needsProfileCreation) {
        console.log('Profile needs to be created');
        setNeedsProfileCreation(true);
        setRole(null); // Clear role until profile is created
        return;
      }
      
      // Clear needsProfileCreation flag if profile exists
      setNeedsProfileCreation(false);
      
      if (res.data?.role) {
        console.log('Role fetched:', res.data.role);
        setRole(res.data.role);
        await AsyncStorage.setItem('role', res.data.role);

        // If consultant, check verification status
        if (res.data.role === 'consultant') {
          // Only refresh consultant status if we don't already have it cached
          const cachedStatus = await AsyncStorage.getItem('consultantVerificationStatus');
          if (!cachedStatus) {
            await refreshConsultantStatus();
          }
        }
      } else {
        console.log('No role found in response. User data:', res.data);
        // Check AsyncStorage first before defaulting
        const cachedRole = await AsyncStorage.getItem('role');
        if (cachedRole) {
          console.log('Using cached role from AsyncStorage:', cachedRole);
          setRole(cachedRole);
        } else {
          console.log('No cached role, defaulting to student');
          setRole('student');
          await AsyncStorage.setItem('role', 'student');
        }
      }
      
      lastFetchTime.current = now;
    } catch (err: any) {
      console.error('Error fetching role:', err);
      
      // Check if user is suspended (403 error)
      if (err?.response?.status === 403 && err?.response?.data?.suspended) {
        console.log('🚫 User is suspended, logging out...');
        await logout();
        return;
      }
      
      // Check if it's a 404 (user just registered, backend not ready yet)
      if (err?.response?.status === 404) {
        console.log('⚠️  User not found in backend (404). Attempt:', retryCount + 1);
        
        // Check for cached role first
        const cachedRole = await AsyncStorage.getItem('role');
        if (cachedRole) {
          console.log('✅ Using cached role from AsyncStorage:', cachedRole);
          setRole(cachedRole);
        }
        
        // Retry with exponential backoff (max 3 retries)
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          console.log(`🔄 Retrying in ${delay}ms...`);
          
          setTimeout(() => {
            fetchUserRole(force, retryCount + 1);
          }, delay);
          
          isFetchingRole.current = false;
          return;
        } else {
          console.log('❌ Max retries reached, keeping cached role');
        }
      }
      
      // For other errors, check cache before defaulting to student
      const cachedRole = await AsyncStorage.getItem('role');
      if (cachedRole) {
        console.log('Using cached role after error:', cachedRole);
        setRole(cachedRole);
      } else {
        console.log('No cached role, defaulting to student');
        setRole('student');
        await AsyncStorage.setItem('role', 'student');
      }
    } finally {
      isFetchingRole.current = false;
    }
  }, [logout]);

  const refreshConsultantStatus = useCallback(async () => {
    if (!user?.uid) return;
    
    // Prevent duplicate calls within 10 seconds
    const now = Date.now();
    if (isFetchingStatus.current || now - lastStatusFetchTime.current < 10000) {
      console.log('⚠️ Skipping consultant status fetch (too soon or already fetching)');
      return;
    }
    
    isFetchingStatus.current = true;
    
    try {
      const statusRes = await api.get('/consultant-flow/status');
      
      // Map backend status to our verification status
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
      
      setConsultantVerificationStatus(verificationStatus);
      await AsyncStorage.setItem('consultantVerificationStatus', verificationStatus);
      lastStatusFetchTime.current = now;
    } catch (error) {
      console.error('Error fetching consultant status:', error);
      // If profile doesn't exist, set as incomplete
      setConsultantVerificationStatus('incomplete');
    } finally {
      isFetchingStatus.current = false;
    }
  }, [user]);

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      try {
        // Reload the Firebase Auth user to get updated profile data (photoURL, displayName, etc.)
        await auth.currentUser.reload();
        // Update local user state with the refreshed data
        setUser({ ...auth.currentUser });
        // Note: We don't fetch role again here since it's already cached
        // Role will only be  on login or when explicitly needed
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      // Clear any leftover registration flag from previous sessions
      await AsyncStorage.removeItem('isRegistering');
      
      // Try to load stored role from AsyncStorage
      const storedRole = await AsyncStorage.getItem('role');
      if (storedRole) {
        console.log('Loaded stored role:', storedRole);
        setRole(storedRole);
        
        // If consultant, also load verification status
        if (storedRole === 'consultant') {
          const storedStatus = await AsyncStorage.getItem('consultantVerificationStatus');
          if (storedStatus) {
            console.log('Loaded stored consultant status:', storedStatus);
            setConsultantVerificationStatus(storedStatus as any);
          }
        }
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Check if email is verified before proceeding
        if (!firebaseUser.emailVerified) {
          console.log('User email not verified, skipping role fetch');
          setRole(null);
          setLoading(false);
          return;
        }
        
        // User logged in and email verified - fetch their role from backend
        // The fetchUserRole function now has robust retry logic
        await fetchUserRole();
      } else {
        // User logged out - clear role
        setRole(null);
        await AsyncStorage.removeItem('role');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [fetchUserRole]);


  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem("role");
      await AsyncStorage.removeItem("consultantVerificationStatus");
      setUser(null);
      setRole(null);
      setConsultantVerificationStatus(null);
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  const value = {
    user,
    role,
    intendedRole,
    loading,
    consultantVerificationStatus,
    needsProfileCreation,
    refreshUser,
    refreshConsultantStatus,
    setIntendedRole,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
