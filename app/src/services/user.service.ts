import { fetcher, api } from '../lib/fetcher';
import { normalizeAvatarUrl, normalizeTimestampToIso } from '../utils/normalize';
import { resolveUserDisplayName } from '../utils/displayName';
import { logger } from '../utils/logger';

const USER_BY_ID_CACHE_TTL_MS = 5 * 60 * 1000;
const userByIdCache = new Map<string, { data: ReturnType<typeof normalizeUserPayload>; expires: number }>();

const isWeakDisplayName = (name?: string | null, uid?: string): boolean => {
  const trimmed = String(name || '').trim();
  if (!trimmed || trimmed === 'User') return true;
  if (uid && trimmed === `User ${uid.slice(0, 8)}`) return true;
  if (uid && trimmed === `Student ${uid.slice(0, 8)}`) return true;
  return false;
};

const normalizeUserPayload = (userData: any) => {
  if (!userData || typeof userData !== 'object') return userData;
  const normalized = {
    ...userData,
    profileImage: normalizeAvatarUrl(userData) || null,
    createdAt: normalizeTimestampToIso(userData.createdAt) || userData.createdAt,
    updatedAt: normalizeTimestampToIso(userData.updatedAt) || userData.updatedAt,
  };
  const resolvedName = resolveUserDisplayName({
    name: normalized.name,
    displayName: normalized.displayName,
    email: normalized.email,
    role: normalized.role,
    uid: normalized.uid,
  });
  normalized.name = resolvedName;
  normalized.displayName = resolvedName;
  return normalized;
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
      links?: Array<{
        id: string;
        platform: 'linkedin' | 'github' | 'portfolio' | 'personal';
        url: string;
      }>;
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
    const cached = userByIdCache.get(userId);
    if (cached && cached.expires > Date.now()) {
      const cachedUser = normalizeUserPayload(cached.data);
      if (!isWeakDisplayName(cachedUser?.name, userId)) {
        return cachedUser;
      }
      userByIdCache.delete(userId);
    }

    try {
      const userData = await fetcher(`/auth/users/${userId}`);
      const normalized = normalizeUserPayload(userData);
      if (!isWeakDisplayName(normalized?.name, userId)) {
        userByIdCache.set(userId, {
          data: normalized,
          expires: Date.now() + USER_BY_ID_CACHE_TTL_MS,
        });
      }
      return normalized;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) {
        if (__DEV__) {
          logger.debug('ℹ️ [UserService] User not found:', userId);
        }
      } else if (status !== 429) {
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
