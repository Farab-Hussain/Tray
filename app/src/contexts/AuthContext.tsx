import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../lib/firebase';
import { api } from '../lib/fetcher';
import { getConsultantProfile } from '../services/consultantFlow.service';

interface AuthContextType {
  user: User | null;
  role: string | null; // Keep for backward compatibility (maps to activeRole)
  activeRole: string | null; // Currently active role
  roles: string[]; // Array of roles user has access to
  intendedRole: string | null;
  loading: boolean;
  consultantVerificationStatus: 'incomplete' | 'pending' | 'approved' | 'rejected' | null;
  needsProfileCreation: boolean;
  refreshUser: () => Promise<void>;
  refreshConsultantStatus: () => Promise<void>;
  setIntendedRole: (role: string) => void;
  requestConsultantRole: () => Promise<void>;
  switchRole: (newRole: string) => Promise<any>;
  logout: () => Promise<void>;
  }

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  activeRole: null,
  roles: [],
  intendedRole: null,
  loading: true,
  consultantVerificationStatus: null,
  needsProfileCreation: false,
  refreshUser: async () => {},
  refreshConsultantStatus: async () => {},
  setIntendedRole: () => {},
  requestConsultantRole: async () => {},
  switchRole: async () => {},
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
  const [role, setRole] = useState<string | null>(null); // Keep for backward compatibility
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [intendedRole, setIntendedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [consultantVerificationStatus, setConsultantVerificationStatus] = useState<'incomplete' | 'pending' | 'approved' | 'rejected' | null>(null);
  const [needsProfileCreation, setNeedsProfileCreation] = useState<boolean>(false);
  
  // Use ref to track if we're currently fetching to prevent duplicate calls
  const isFetchingRole = useRef(false);
  const lastFetchTime = useRef<number>(0);
  const isFetchingStatus = useRef(false);
  const lastStatusFetchTime = useRef<number>(0);

  // Define logout before fetchUserRole to avoid forward reference
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem("role");
      await AsyncStorage.removeItem("activeRole");
      await AsyncStorage.removeItem("roles");
      await AsyncStorage.removeItem("consultantVerificationStatus");
      setUser(null);
      setRole(null);
      setActiveRole(null);
      setRoles([]);
      setConsultantVerificationStatus(null);
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

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
      
      // Handle new roles array and activeRole structure
      const userRoles = res.data?.roles || (res.data?.role ? [res.data.role] : ['student']);
      const userActiveRole = res.data?.activeRole || res.data?.role || 'student';
      
      console.log('Roles fetched:', userRoles);
      console.log('Active role fetched:', userActiveRole);
      
      setRoles(userRoles);
      setActiveRole(userActiveRole);
      setRole(userActiveRole); // Keep for backward compatibility
      
      await AsyncStorage.setItem('roles', JSON.stringify(userRoles));
      await AsyncStorage.setItem('activeRole', userActiveRole);
      await AsyncStorage.setItem('role', userActiveRole); // Keep for backward compatibility

      // If consultant, check verification status
      if (userActiveRole === 'consultant') {
        // Only refresh consultant status if we don't already have it cached
        const cachedStatus = await AsyncStorage.getItem('consultantVerificationStatus');
        if (!cachedStatus) {
          await refreshConsultantStatus();
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
        
        // Check for cached roles first
        const cachedActiveRole = await AsyncStorage.getItem('activeRole');
        const cachedRoles = await AsyncStorage.getItem('roles');
        
        if (cachedActiveRole && cachedRoles) {
          console.log('✅ Using cached roles from AsyncStorage');
          const parsedRoles = JSON.parse(cachedRoles);
          setRoles(parsedRoles);
          setActiveRole(cachedActiveRole);
          setRole(cachedActiveRole);
          // Don't retry if we have cached roles - user might be registering
          isFetchingRole.current = false;
          return;
        }
        
        // Only retry if we don't have a cached role (max 2 retries instead of 3)
        if (retryCount < 2) {
          const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s (longer delays)
          console.log(`🔄 Retrying in ${delay}ms...`);
          
          setTimeout(() => {
            fetchUserRole(force, retryCount + 1);
          }, delay);
          
          isFetchingRole.current = false;
          return;
        } else {
          console.log('❌ Max retries reached, defaulting to student role');
          // Default to student role after max retries
          const defaultRoles = ['student'];
          setRoles(defaultRoles);
          setActiveRole('student');
          setRole('student');
          await AsyncStorage.setItem('roles', JSON.stringify(defaultRoles));
          await AsyncStorage.setItem('activeRole', 'student');
          await AsyncStorage.setItem('role', 'student');
        }
      }
      
      // For other errors, check cache before defaulting to student
      const cachedActiveRole = await AsyncStorage.getItem('activeRole');
      const cachedRoles = await AsyncStorage.getItem('roles');
      
      if (cachedActiveRole && cachedRoles) {
        console.log('Using cached roles after error');
        const parsedRoles = JSON.parse(cachedRoles);
        setRoles(parsedRoles);
        setActiveRole(cachedActiveRole);
        setRole(cachedActiveRole);
      } else {
        console.log('No cached roles, defaulting to student');
        const defaultRoles = ['student'];
        setRoles(defaultRoles);
        setActiveRole('student');
        setRole('student');
        await AsyncStorage.setItem('roles', JSON.stringify(defaultRoles));
        await AsyncStorage.setItem('activeRole', 'student');
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

  const requestConsultantRole = useCallback(async () => {
    try {
      const response = await api.post('/auth/request-consultant-role');
      console.log('Consultant role requested:', response.data);
      
      // Update roles array
      if (response.data?.roles) {
        setRoles(response.data.roles);
        await AsyncStorage.setItem('roles', JSON.stringify(response.data.roles));
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error requesting consultant role:', error);
      throw error;
    }
  }, []);

  const switchRole = useCallback(async (newRole: string) => {
    try {
      const response = await api.post('/auth/switch-role', { newRole });
      console.log('Role switched:', response.data);
      
      // Update active role and roles array
      if (response.data?.activeRole) {
        setActiveRole(response.data.activeRole);
        setRole(response.data.activeRole); // Keep for backward compatibility
        await AsyncStorage.setItem('activeRole', response.data.activeRole);
        await AsyncStorage.setItem('role', response.data.activeRole);
      }
      
      if (response.data?.roles) {
        setRoles(response.data.roles);
        await AsyncStorage.setItem('roles', JSON.stringify(response.data.roles));
      }
      
      // Clear consultant status cache when switching roles to force fresh fetch
      // This ensures no stale consultant data persists after role switch
      await AsyncStorage.removeItem('consultantVerificationStatus');
      
      // If switching to consultant, refresh consultant status
      if (newRole === 'consultant') {
        await refreshConsultantStatus();
      } else {
        // If switching away from consultant, clear consultant status
        setConsultantVerificationStatus(null);
      }
      
      // Refresh user profile to get latest profileImage from backend
      // This ensures profile image is available after role switch
      await refreshUser();
      
      // Role state is already updated above from response.data
      // The role will be available immediately for RoleBasedTabs
      
      // Return response data including action if present
      return response.data;
    } catch (error: any) {
      // Handle 403 error for missing consultant profile gracefully
      // Don't log as error - it's expected behavior that should show an alert
      if (error?.response?.status === 403 && error?.response?.data?.action === 'create_consultant_profile') {
        // Return the error data so calling code can handle it with an alert
        // instead of showing it as an error
        return {
          error: true,
          action: 'create_consultant_profile',
          message: error.response.data.error || 'Consultant profile is required. Please create your consultant profile first.',
        };
      }
      
      // For other errors, log and throw normally
      console.error('Error switching role:', error);
      throw error;
    }
  }, [refreshConsultantStatus, refreshUser]);

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      try {
        // Reload the Firebase Auth user to get updated profile data (photoURL, displayName, etc.)
        await auth.currentUser.reload();
        
        // Also fetch backend profile to get profileImage (which might be different from photoURL)
        try {
          const backendProfile = await api.get('/auth/me');
          const backendProfileImage = backendProfile.data?.profileImage;
          let finalProfileImage = backendProfileImage || auth.currentUser.photoURL;
          
          // If main profile has no image, check consultant profile as fallback (if user has consultant role)
          if (!finalProfileImage && backendProfile.data?.roles?.includes('consultant')) {
            try {
              console.log('🔄 [refreshUser] Main profile has no image, checking consultant profile as fallback...');
              const consultantProfile = await getConsultantProfile(auth.currentUser.uid);
              const consultantProfileImage = consultantProfile?.personalInfo?.profileImage;
              
              if (consultantProfileImage && consultantProfileImage.trim() !== '') {
                console.log('✅ [refreshUser] Found consultant profile image as fallback:', consultantProfileImage);
                finalProfileImage = consultantProfileImage.trim();
              } else {
                console.log('ℹ️ [refreshUser] No consultant profile image found either');
              }
            } catch (consultantError) {
              // If consultant profile fetch fails, continue with main profile
              console.warn('⚠️ [refreshUser] Failed to fetch consultant profile as fallback:', consultantError);
            }
          }
          
          // Merge Firebase Auth data with backend profileImage
          // If backend has profileImage, use it; otherwise use Firebase photoURL
          const updatedUser = {
            ...auth.currentUser,
            photoURL: finalProfileImage || auth.currentUser.photoURL,
          };
          
          setUser(updatedUser as User);
          console.log('✅ [refreshUser] User refreshed with profileImage:', finalProfileImage || 'none');
        } catch (backendError) {
          // If backend fetch fails, just use Firebase Auth data
          console.warn('⚠️ Failed to fetch backend profile, using Firebase Auth data only:', backendError);
          setUser({ ...auth.currentUser });
        }
        
        // Refresh role data as well
        await fetchUserRole(true);
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }
  }, [fetchUserRole]);

  useEffect(() => {
    const initAuth = async () => {
      // Clear any leftover registration flag from previous sessions
      await AsyncStorage.removeItem('isRegistering');
      
      // Try to load stored roles and activeRole from AsyncStorage
      const storedRoles = await AsyncStorage.getItem('roles');
      const storedActiveRole = await AsyncStorage.getItem('activeRole');
      
      if (storedRoles && storedActiveRole) {
        console.log('Loaded stored roles:', storedRoles);
        console.log('Loaded stored active role:', storedActiveRole);
        const parsedRoles = JSON.parse(storedRoles);
        setRoles(parsedRoles);
        setActiveRole(storedActiveRole);
        setRole(storedActiveRole); // Keep for backward compatibility
        
        // If consultant, also load verification status
        if (storedActiveRole === 'consultant') {
          const storedStatus = await AsyncStorage.getItem('consultantVerificationStatus');
          if (storedStatus) {
            console.log('Loaded stored consultant status:', storedStatus);
            setConsultantVerificationStatus(storedStatus as any);
          }
        }
      } else {
        // Fallback to old role storage for backward compatibility
        const storedRole = await AsyncStorage.getItem('role');
        if (storedRole) {
          console.log('Loaded stored role (legacy):', storedRole);
          const legacyRoles = [storedRole];
          setRoles(legacyRoles);
          setActiveRole(storedRole);
          setRole(storedRole);
          await AsyncStorage.setItem('roles', JSON.stringify(legacyRoles));
          await AsyncStorage.setItem('activeRole', storedRole);
          
          if (storedRole === 'consultant') {
            const storedStatus = await AsyncStorage.getItem('consultantVerificationStatus');
            if (storedStatus) {
              setConsultantVerificationStatus(storedStatus as any);
            }
          }
        }
      }
    };

    initAuth();

    // Safety timeout to ensure loading is always set to false
    const loadingTimeout = setTimeout(() => {
      console.warn('AuthContext - Loading timeout triggered, forcing loading to false');
      setLoading(false);
    }, 8000); // 8 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (__DEV__) {
        console.log('AuthContext - Auth state changed:', firebaseUser ? `User authenticated` : 'No user');
      }
      
      // Clear the safety timeout since we're handling it now
      clearTimeout(loadingTimeout);
      
      try {
        if (firebaseUser) {
          // Reload user to sync verification status from server (important after web verification)
          let reloadedUser = firebaseUser;
          try {
            await firebaseUser.reload();
            // Get updated user reference after reload
            reloadedUser = auth.currentUser;
          } catch (reloadError) {
            console.warn('AuthContext - Error reloading user (continuing anyway):', reloadError);
          }
          
          // Set user after reload to ensure we have latest verification status
          setUser(reloadedUser);
          
          // Check if email is verified before proceeding (required)
          // Use reloadedUser which has the latest verification status
          if (!reloadedUser?.emailVerified) {
            console.log('AuthContext - User email not verified after reload, checking backend...');
            
            // Check backend to see if email is verified (web verification might have happened)
            // Use Promise.race to ensure this doesn't block forever
            try {
              const backendCheckPromise = (async () => {
                const token = await reloadedUser.getIdToken();
                return api.post('/auth/resend-verification-email', {
                  email: reloadedUser.email,
                  uid: reloadedUser.uid
                }, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  },
                  timeout: 5000 // 5 second timeout for backend check
                });
              })();
              
              // Race the backend check with a timeout
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Backend check timeout')), 5000)
              );
              
              const backendCheck = await Promise.race([backendCheckPromise, timeoutPromise]) as any;
              
              // If backend says verified but Firebase doesn't, reload again
              if (backendCheck?.data?.emailVerified && !reloadedUser.emailVerified) {
                console.log('AuthContext - Backend says verified, reloading user again...');
                await reloadedUser.reload();
                // Get fresh reference after second reload
                reloadedUser = auth.currentUser;
                setUser(reloadedUser);
                
                // If still not verified, try to sync via verify-email endpoint
                if (reloadedUser && !reloadedUser.emailVerified) {
                  console.log('AuthContext - Still not verified, attempting sync...');
                  try {
                    const syncPromise = api.post('/auth/verify-email', {
                      email: reloadedUser.email,
                      uid: reloadedUser.uid
                    }, {
                      headers: {
                        'Authorization': `Bearer ${await reloadedUser.getIdToken()}`
                      },
                      timeout: 5000
                    });
                    await Promise.race([syncPromise, timeoutPromise]);
                    // Reload one more time after sync attempt
                    await reloadedUser.reload();
                    reloadedUser = auth.currentUser;
                    setUser(reloadedUser);
                  } catch (syncError) {
                    console.warn('AuthContext - Sync attempt failed:', syncError);
                  }
                }
              }
            } catch (backendError) {
              console.warn('AuthContext - Backend check failed or timed out:', backendError);
            }
            
            // Check again after backend sync attempt
            if (!reloadedUser?.emailVerified) {
              console.log('AuthContext - User email still not verified, skipping role fetch');
              setRole(null);
              setLoading(false);
              return;
            }
          }
          
          // User logged in and email verified - fetch their role from backend
          // The fetchUserRole function now has robust retry logic
          await fetchUserRole();
        } else {
          // User logged out - clear roles
          setUser(null);
          setRole(null);
          setActiveRole(null);
          setRoles([]);
          await AsyncStorage.removeItem('role');
          await AsyncStorage.removeItem('activeRole');
          await AsyncStorage.removeItem('roles');
        }
      } catch (error) {
        console.error('AuthContext - Error in onAuthStateChanged:', error);
      } finally {
        // Always set loading to false
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, [fetchUserRole]);

  const value = {
    user,
    role, // Keep for backward compatibility (maps to activeRole)
    activeRole,
    roles,
    intendedRole,
    loading,
    consultantVerificationStatus,
    needsProfileCreation,
    refreshUser,
    refreshConsultantStatus,
    setIntendedRole,
    requestConsultantRole,
    switchRole,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
