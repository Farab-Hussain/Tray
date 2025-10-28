import { fetcher, api } from '../lib/fetcher';

export const UserService = {
  // Get user profile from backend (uses /auth/me endpoint)
  async getUserProfile() {
    return await fetcher('/auth/me');
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
  }) {
    // Map avatarUrl to profileImage for backend compatibility
    const backendData = {
      ...profileData,
      profileImage: profileData.avatarUrl || profileData.profileImage,
    };
    delete backendData.avatarUrl; // Remove frontend field
    
    const response = await api.put('/auth/profile', backendData);
    return response.data;
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
      console.log('📥 [UserService] Fetched user data:', userData);
      return userData;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  },
};
