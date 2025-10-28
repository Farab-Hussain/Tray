'use client';

import React, { useState, useEffect } from 'react';
import AdminCard from '@/components/admin/AdminCard';
import AdminSection from '@/components/admin/AdminSection';
import MobileHeader from '@/components/shared/MobileHeader';
import { 
  Users, 
  DollarSign, 
  Calendar,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface BasicAnalytics {
  totalUsers: number;
  activeConsultants: number;
  totalBookings: number;
  totalRevenue: number;
}

const AnalyticsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<BasicAnalytics | null>(null);

  useEffect(() => {
    const fetchBasicAnalytics = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API calls when backend analytics endpoints are ready
        // const [usersResponse, consultantsResponse, bookingsResponse] = await Promise.all([
        //   api.get('/admin/users/count'),
        //   api.get('/admin/consultants/count'),
        //   api.get('/admin/bookings/count'),
        //   api.get('/admin/revenue/total')
        // ]);
        
        // For now, show basic counts
        setAnalyticsData({
          totalUsers: 0,
          activeConsultants: 0,
          totalBookings: 0,
          totalRevenue: 0
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setAnalyticsData({
          totalUsers: 0,
          activeConsultants: 0,
          totalBookings: 0,
          totalRevenue: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBasicAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Mobile Header */}
      <MobileHeader title="Analytics Dashboard" />
      
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Basic platform metrics and insights</p>
      </div>

      {/* Basic Metrics */}
      <AdminSection title="Platform Overview" subtitle="Essential platform metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <AdminCard
            title="Total Users"
            value={analyticsData?.totalUsers || 0}
            icon={Users}
            color="blue"
            subtitle="Registered users"
          />
          <AdminCard
            title="Active Consultants"
            value={analyticsData?.activeConsultants || 0}
            icon={CheckCircle}
            color="green"
            subtitle="Approved consultants"
          />
          <AdminCard
            title="Total Bookings"
            value={analyticsData?.totalBookings || 0}
            icon={Calendar}
            color="purple"
            subtitle="Completed sessions"
          />
          <AdminCard
            title="Total Revenue"
            value={`$${analyticsData?.totalRevenue || 0}`}
            icon={DollarSign}
            color="green"
            subtitle="Platform revenue"
          />
        </div>
      </AdminSection>

      {/* Coming Soon Section */}
      <AdminSection title="Advanced Analytics" subtitle="Coming soon with more detailed insights">
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analytics Coming Soon</h3>
            <p className="text-gray-600 mb-4 max-w-2xl mx-auto">
              We&apos;re working on adding more detailed analytics including user growth trends, 
              conversion rates, geographic distribution, and performance metrics.
            </p>
            <div className="text-sm text-gray-500">
              Features will be added as the platform grows and more data becomes available.
            </div>
          </div>
        </div>
      </AdminSection>
    </div>
  );
};

export default AnalyticsPage;
