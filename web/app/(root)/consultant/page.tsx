'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Main Consultant Dashboard Entry Point
 * Redirects to the appropriate page based on profile status
 */
const ConsultantDashboard = () => {
  const router = useRouter();

  useEffect(() => {
    // For now, just redirect to profile page
    // In production, this would check profile status and route accordingly
    router.push('/consultant/profile');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <Loader2 className="w-16 h-16 text-green-600 animate-spin mb-4" />
      <p className="text-lg text-gray-600">Loading your dashboard...</p>
    </div>
  );
};

export default ConsultantDashboard;
