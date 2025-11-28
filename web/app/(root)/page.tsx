'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const HomePage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      // Wait for auth to load
      return;
    }

    if (!user) {
      // Not authenticated, redirect to login
      router.replace('/login');
      return;
    }

    // Redirect based on user role
    if (user.role === 'admin') {
      router.replace('/admin');
    } else {
      // Non-admin users should use the mobile app
      // Web dashboard is admin-only
      router.replace('/login');
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};

export default HomePage;