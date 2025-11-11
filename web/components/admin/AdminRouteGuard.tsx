'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Shield } from 'lucide-react';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No user logged in, redirect to login
        router.push('/login');
      } else if (user.role !== 'admin') {
        // User is logged in but not admin, redirect to consultant dashboard
        router.push('/consultant/profile');
      }
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">Verifying admin access...</p>
      </div>
    );
  }

  // Show access denied if user is not admin
  if (user && user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-red-900 text-center mb-2">
            Access Denied
          </h2>
          <p className="text-red-700 text-center mb-6">
            You don&apos;t have permission to access the admin dashboard. 
            Admin privileges are required.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/consultant/profile')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Consultant Dashboard
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show content if user is admin
  if (user && user.role === 'admin') {
    return <>{children}</>;
  }

  // Default case (should not reach here due to useEffect)
  return null;
};

export default AdminRouteGuard;
