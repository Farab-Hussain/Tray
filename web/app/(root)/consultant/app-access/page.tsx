'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { consultantFlowAPI, consultantAPI } from '@/utils/api';
import { Loader2, CheckCircle, Clock, XCircle, AlertCircle, Smartphone, Plus, FileText } from 'lucide-react';

type ProfileStatus = 'pending' | 'approved' | 'rejected' | 'none';

interface AccessCheckResult {
  profileStatus: ProfileStatus;
  hasServices: boolean;
  servicesCount: number;
  canAccessApp: boolean;
  message: string;
}

const AppAccessPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [accessCheck, setAccessCheck] = useState<AccessCheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    checkAppAccess();
  }, []);

  const checkAppAccess = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Check profile status
      const statusResponse = await consultantFlowAPI.getMyStatus();
      const statusData = statusResponse.data as { 
        hasProfile: boolean; 
        status?: string;
        profile?: { uid: string; status?: string };
      };

      let profileStatus: ProfileStatus = 'none';
      let hasServices = false;
      let servicesCount = 0;

      if (!statusData.hasProfile) {
        profileStatus = 'none';
      } else if (statusData.profile?.status) {
        profileStatus = statusData.profile.status as ProfileStatus;

        // If approved, check services
        if (profileStatus === 'approved' && statusData.profile.uid) {
          const servicesResponse = await consultantAPI.getConsultantServices(statusData.profile.uid);
          const services = (servicesResponse.data as { services?: unknown[] }).services || [];
          servicesCount = services.length;
          hasServices = servicesCount > 0;
        }
      }

      // Determine access and message
      const canAccessApp = profileStatus === 'approved' && hasServices;
      let message = '';

      if (profileStatus === 'none') {
        message = 'Please create your consultant profile to continue.';
      } else if (profileStatus === 'pending') {
        message = 'Your profile is under review. Please wait for admin approval.';
      } else if (profileStatus === 'rejected') {
        message = 'Your profile was rejected. Please contact support or resubmit.';
      } else if (profileStatus === 'approved' && !hasServices) {
        message = 'Your profile is verified! Apply for services or create your own to access the app.';
      } else if (canAccessApp) {
        message = 'All set! You can now access the mobile app.';
      }

      setAccessCheck({
        profileStatus,
        hasServices,
        servicesCount,
        canAccessApp,
        message
      });
    } catch (error: unknown) {
      console.error('Error checking app access:', error);
      setErrorMessage('Failed to check access status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessApp = () => {
    // TODO: Replace with actual mobile app deep link or redirect
    // For now, just show an alert
    alert('Redirecting to mobile app... (Deep link integration needed)');
    // In production: window.location.href = 'yourapp://consultant/dashboard';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-16 h-16 text-green-600 animate-spin mb-4" />
        <p className="text-lg text-gray-600">Checking your access status...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
          <p className="text-red-700">{errorMessage}</p>
          <button
            onClick={checkAppAccess}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!accessCheck) {
    return null;
  }

  // Render different screens based on status
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <Smartphone className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mobile App Access</h1>
        <p className="text-gray-600">Check your eligibility to access the mobile app</p>
      </div>

      {/* Profile Not Created */}
      {accessCheck.profileStatus === 'none' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Profile Required</h2>
          <p className="text-gray-600 mb-6">{accessCheck.message}</p>
          <button
            onClick={() => router.push('/consultant/profile')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Profile
          </button>
        </div>
      )}

      {/* Profile Pending */}
      {accessCheck.profileStatus === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <Clock className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-yellow-900 mb-3">Under Review</h2>
          <p className="text-yellow-700 mb-6">{accessCheck.message}</p>
          <div className="text-sm text-yellow-600">
            We&apos;ll notify you once your profile is approved.
          </div>
          <button
            onClick={() => router.push('/consultant/status')}
            className="mt-6 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors inline-flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            View Application Status
          </button>
        </div>
      )}

      {/* Profile Rejected */}
      {accessCheck.profileStatus === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-900 mb-3">Profile Rejected</h2>
          <p className="text-red-700 mb-6">{accessCheck.message}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/consultant/profile')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Update & Resubmit
            </button>
            <button
              onClick={() => router.push('/consultant/status')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Profile Approved but No Services */}
      {accessCheck.profileStatus === 'approved' && !accessCheck.hasServices && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-blue-900 mb-3">Profile Verified! 🎉</h2>
          <p className="text-blue-700 mb-6">{accessCheck.message}</p>
          <div className="bg-white border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Next Steps:</h3>
            <ul className="text-left space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>Apply for existing platform services</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>Create your own custom services</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Wait for admin approval</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span>Access the mobile app once approved</span>
              </li>
            </ul>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/consultant/services')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Browse Services
            </button>
            <button
              onClick={() => router.push('/consultant/applications')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Service
            </button>
          </div>
        </div>
      )}

      {/* All Requirements Met - Can Access App */}
      {accessCheck.canAccessApp && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-green-900 mb-3">You&apos;re All Set! 🎉</h2>
          <p className="text-green-700 text-lg mb-6">{accessCheck.message}</p>
          
          <div className="bg-white border border-green-200 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Profile Status</p>
                <p className="text-lg font-bold text-green-600">✓ Verified</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Services</p>
                <p className="text-lg font-bold text-green-600">{accessCheck.servicesCount}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleAccessApp}
            className="w-full px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors inline-flex items-center justify-center gap-3 shadow-lg"
          >
            <Smartphone className="w-6 h-6" />
            Open Mobile App
          </button>

          <div className="mt-6 pt-6 border-t border-green-200">
            <p className="text-sm text-gray-600 mb-4">Quick Actions:</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/consultant/my-services')}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Manage Services
              </button>
              <button
                onClick={() => router.push('/consultant/status')}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => router.push('/consultant/status')}
          className="text-gray-600 hover:text-gray-900 underline"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AppAccessPage;

