'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MultiStepProfileForm from '@/components/consultant/MultiStepProfileForm';
import ProfileCard from '@/components/consultant/ProfileCard';
import { ConsultantProfile, ConsultantProfileInput } from '@/types';
import { Loader2 } from 'lucide-react';
import { consultantFlowAPI } from '@/utils/api';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<ConsultantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [prefillData, setPrefillData] = useState<{ uid?: string; name?: string; email?: string }>({});
  const [isValidatingAuth, setIsValidatingAuth] = useState(true);

  // Validate authentication and save token from URL
  useEffect(() => {
    const validateAuth = async () => {
      if (typeof window === 'undefined') return;

      try {
        setIsValidatingAuth(true);
        
        const uid = searchParams.get('uid');
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const token = searchParams.get('token');
        
        // Check if we have a token (either from URL or localStorage)
        const existingToken = localStorage.getItem('authToken');
        const currentToken = token || existingToken;
        
        if (!currentToken) {
          console.error('❌ No authentication token found');
          setErrorMessage('Authentication required. Please log in from the mobile app.');
          setIsValidatingAuth(false);
          return;
        }
        
        // If token is provided from URL, save it and validate
        if (token) {
          localStorage.setItem('authToken', token);
          console.log('✅ Auth token saved from mobile app');
        }
        
        // Validate token by making a test API call
        try {
          await consultantFlowAPI.getMyStatus();
          console.log('✅ Token validated successfully');
          
          // Save prefill data
          if (uid || name || email) {
            setPrefillData({ 
              uid: uid || undefined, 
              name: name || undefined, 
              email: email || undefined 
            });
          }
        } catch (apiError) {
          console.error('❌ Token validation failed:', apiError);
          const axiosError = apiError as { response?: { status?: number } };
          
          if (axiosError.response?.status === 401) {
            localStorage.removeItem('authToken');
            setErrorMessage('Your session has expired. Please log in again from the mobile app.');
          } else {
            // Other errors (like 404 for no profile) are acceptable
            console.log('⚠️ API call failed but token might be valid:', axiosError.response?.status);
            
            // Save prefill data even if profile doesn't exist yet
            if (uid || name || email) {
              setPrefillData({ 
                uid: uid || undefined, 
                name: name || undefined, 
                email: email || undefined 
              });
            }
          }
        }
      } catch (error) {
        console.error('❌ Auth validation error:', error);
        setErrorMessage('Authentication failed. Please try again.');
      } finally {
        setIsValidatingAuth(false);
      }
    };

    validateAuth();
  }, [searchParams]);

  // Load profile after auth validation
  useEffect(() => {
    const loadProfile = async () => {
      // Wait for auth validation to complete
      if (isValidatingAuth) return;
      
      // If auth validation failed, don't try to load profile
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        const response = await consultantFlowAPI.getMyStatus();
        const data = response.data as { hasProfile: boolean; profile?: { uid: string } };
        
        if (data.hasProfile && data.profile) {
          // Fetch full profile details
          const fullProfileResponse = await consultantFlowAPI.getProfile(data.profile.uid);
          const profileResponse = fullProfileResponse.data as { profile: ConsultantProfile };
          setProfile(profileResponse.profile);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          console.log('Authentication required - user can create profile with UID from params');
        } else if (axiosError.response?.status !== 404) {
          // Don't show error for 404 - it just means no profile exists yet
          console.log('Profile not found - user can create one');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [isValidatingAuth]);

  const handleCreateProfile = async (data: ConsultantProfileInput) => {
    try {
      setErrorMessage(null);
      console.log('Creating profile with data:', data);
      
      const response = await consultantFlowAPI.createProfile(data);
      const profileResponse = response.data as { profile: ConsultantProfile };
      
      setProfile(profileResponse.profile);
      setSuccessMessage('Profile created successfully! Awaiting admin approval.');
      setIsEditing(false);

      setTimeout(() => {
        router.push('/consultant/status');
      }, 2000);
    } catch (err) {
      console.error('Error creating profile:', err);
      const error = err as { response?: { data?: { error?: string } } };
      setErrorMessage(error.response?.data?.error || 'Failed to create profile. Please try again.');
    }
  };

  const handleUpdateProfile = async (data: ConsultantProfileInput) => {
    try {
      setErrorMessage(null);
      console.log('Updating profile with data:', data);
      
      if (!profile) return;
      
      const response = await consultantFlowAPI.updateProfile(profile.uid, data);
      const profileResponse = response.data as { profile: ConsultantProfile };
      
      setProfile(profileResponse.profile);
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      const error = err as { response?: { data?: { error?: string } } };
      setErrorMessage(error.response?.data?.error || 'Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Show validation loading state
  if (isValidatingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">Validating authentication...</p>
      </div>
    );
  }

  // Show profile loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Consultant Profile</h1>
          <p className="text-gray-600">Manage your professional profile</p>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{errorMessage}</p>
        </div>
      )}

      {!profile || isEditing ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <MultiStepProfileForm
            initialData={profile || undefined}
            prefillData={prefillData}
            onSubmit={profile ? handleUpdateProfile : handleCreateProfile}
            onCancel={profile ? handleCancel : undefined}
            submitButtonText={profile ? 'Update Profile' : 'Create Profile'}
          />
        </div>
      ) : (
        <ProfileCard
          profile={profile}
          onEdit={() => setIsEditing(true)}
        />
      )}

      {profile && profile.status === 'approved' && (
        <div className="mt-6 p-6 bg-white rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Approved!</h2>
          <p className="text-gray-600 mb-4">
            Your profile has been approved. You can now browse and apply for services.
          </p>
          <button
            onClick={() => router.push('/consultant/services')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Browse Services
          </button>
        </div>
      )}
    </div>
  );
}

const ConsultantProfilePage = () => {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading profile...</p>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
};

export default ConsultantProfilePage;
