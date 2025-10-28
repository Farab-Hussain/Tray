'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileStatusBadge from '@/components/consultant/ProfileStatusBadge';
import { ConsultantProfile, ConsultantApplication } from '@/types';
import { CheckCircle, Clock, XCircle, ArrowRight, Loader2, Smartphone } from 'lucide-react';
import { consultantFlowAPI } from '@/utils/api';

const ConsultantStatusPage = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<ConsultantProfile | null>(null);
  const [applications, setApplications] = useState<ConsultantApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        setIsLoading(true);
        const response = await consultantFlowAPI.getMyStatus();
        const { hasProfile, profile: profileData } = response.data as { hasProfile: boolean; profile?: { uid: string } };
        
        if (hasProfile && profileData) {
          // Fetch full profile details
          const fullProfileResponse = await consultantFlowAPI.getProfile(profileData.uid);
          setProfile((fullProfileResponse.data as { profile: ConsultantProfile }).profile);
          
          // Fetch applications
          const appsResponse = await consultantFlowAPI.getMyApplications();
          setApplications((appsResponse.data as { applications: ConsultantApplication[] }).applications);
        }
      } catch (error: unknown) {
        console.error('Error loading status:', error);
        setErrorMessage('Failed to load status. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStatus();
  }, []);

  const getStatusIcon = () => {
    if (!profile) return null;
    switch (profile.status) {
      case 'pending':
        return <Clock className="w-12 h-12 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-12 h-12 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    if (!profile) return '';
    switch (profile.status) {
      case 'pending':
        return 'Your profile is under review by our admin team';
      case 'approved':
        return 'Congratulations! Your profile has been approved';
      case 'rejected':
        return 'Your profile needs changes. Please review and resubmit';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading status...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-600 mb-4">No profile found</p>
        <button
          onClick={() => router.push('/consultant/profile')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Create Profile
        </button>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Status</h1>
          <p className="text-gray-600">Track your profile and service applications</p>
        </div>
        <button
          onClick={() => router.push('/consultant/app-access')}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2 font-semibold"
        >
          <Smartphone className="w-5 h-5" />
          Access Mobile App
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Profile Status Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {getStatusIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold text-gray-900">Profile Status</h2>
              <ProfileStatusBadge status={profile.status} />
            </div>
            <p className="text-gray-600 mb-4">{getStatusMessage()}</p>
            
            {profile.status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Your profile is currently being reviewed. This usually takes 24-48 hours. You&apos;ll receive an email once the review is complete.
                </p>
              </div>
            )}

            {profile.status === 'approved' && (
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/consultant/services')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Browse Services
                </button>
                <button
                  onClick={() => router.push('/consultant/profile')}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  View Profile
                </button>
              </div>
            )}

            {profile.status === 'rejected' && (
              <button
                onClick={() => router.push('/consultant/profile')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Update Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Application Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Timeline</h2>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-900">Profile Submitted</p>
              <p className="text-sm text-gray-500">Your profile has been submitted for review</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-500" />
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-900">Admin Review</p>
              <p className="text-sm text-gray-500">Waiting for admin approval</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-gray-500" />
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-900">Get Started</p>
              <p className="text-sm text-gray-500">Browse and apply for services</p>
              {applications.length === 0 && (
                <button
                  onClick={() => router.push('/consultant/services')}
                  className="mt-2 inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Browse available services
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultantStatusPage;
