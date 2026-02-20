import { fetcher, api } from '../lib/fetcher';
import { normalizeAvatarUrl, normalizeTimestampToIso } from '../utils/normalize';
import { logger } from '../utils/logger';

const normalizeUserPayload = (userData: any) => {
  if (!userData || typeof userData !== 'object') return userData;
  return {
    ...userData,
    profileImage: normalizeAvatarUrl(userData) || null,
    createdAt: normalizeTimestampToIso(userData.createdAt) || userData.createdAt,
    updatedAt: normalizeTimestampToIso(userData.updatedAt) || userData.updatedAt,
  };
};

export const UserService = {
  // Get user profile from backend (uses /auth/me endpoint)
  async getUserProfile() {
    const data = await fetcher('/auth/me');
    return normalizeUserPayload(data);
  },

  // Alias for getUserProfile for consistency
  async getProfile() {
    if (__DEV__) {
      logger.debug('📥 [UserService] Fetching user profile...');
    }
    const result = await this.getUserProfile();
    if (__DEV__) {
      logger.debug('✅ [UserService] Profile data received:', result);
    }
    return result;
  },

  // Update user profile (uses /auth/profile endpoint)
  async updateProfile(profileData: {
    name?: string;
    email?: string;
    phone?: string;
    bio?: string;
    location?: string;
    skills?: string[];
    experience?: string;
    avatarUrl?: string | null;
    profileImage?: string | null; // Backend uses profileImage field
    externalProfiles?: {
      linkedin?: string;
      github?: string;
      portfolio?: string;
    };
  }) {
    // Map avatarUrl to profileImage for backend compatibility
    // Handle null explicitly (null means delete, undefined means don't update)
    const backendData: any = {
      ...profileData,
    };
    
    // Explicitly handle profileImage - if avatarUrl is provided (including null), use it
    // Otherwise use profileImage if provided
    if ('avatarUrl' in profileData) {
      backendData.profileImage = profileData.avatarUrl;
    } else if ('profileImage' in profileData) {
      backendData.profileImage = profileData.profileImage;
    }
    
    delete backendData.avatarUrl; // Remove frontend field
    
    if (__DEV__) {
      logger.debug('💾 [UserService] Updating profile with data:', backendData);
    }
    
    const response = await api.put('/auth/profile', backendData);
    
    if (__DEV__) {
      logger.debug('✅ [UserService] Profile update response:', response.data);
    }
    
    return normalizeUserPayload(response.data);
  },

  // Upload avatar image (backend handles this in profile update)
  async uploadAvatar(imageUri: string) {
    // Update profile with the image URI directly
    return this.updateProfile({ profileImage: imageUri });
  },

  // Get user's bookings
  async getUserBookings() {
    return await fetcher('/users/bookings');
  },

  // Get user's reviews
  async getUserReviews() {
    return await fetcher('/users/reviews');
  },

  // Get user info by ID
  async getUserById(userId: string) {
    try {
      // fetcher already returns response.data, so we get the user object directly
      const userData = await fetcher(`/auth/users/${userId}`);
      if (__DEV__) {
        logger.debug('📥 [UserService] Fetched user data:', userData);
      }
      return normalizeUserPayload(userData);
    } catch (error: any) {
      // 404 is expected if user doesn't exist - don't log as error
      if (error?.response?.status === 404) {
        if (__DEV__) {
          logger.debug('ℹ️ [UserService] User not found:', userId);
        }
      } else {
        // Only log non-404 errors
        if (__DEV__) {
          logger.error('❌ [UserService] Error fetching user by ID:', error);
        } else {
          logger.error('❌ [UserService] Failed to fetch user:', userId);
        }
      }
      return null;
    }
  },
};
