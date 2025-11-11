'use client';

import React, { useState, useEffect } from 'react';
import AdminCard from '@/components/admin/AdminCard';
import AdminSection from '@/components/admin/AdminSection';
import MobileHeader from '@/components/shared/MobileHeader';
import { consultantFlowAPI } from '@/utils/api';
import { 
  Users, 
  DollarSign, 
  Calendar,
  CheckCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  FileText,
  XCircle
} from 'lucide-react';
type AxiosErrorLike = {
  isAxiosError?: boolean;
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
};

interface AdminAnalytics {
  overview: {
    totalUsers: number;
    activeConsultants: number;
    totalBookings: number;
    totalRevenue: number;
    pendingApplications: number;
    completedBookings: number;
    cancelledBookings: number;
  };
  trends: {
    newUsersThisMonth: number;
    newConsultantsThisMonth: number;
    bookingsThisMonth: number;
    revenueThisMonth: number;
    bookingsGrowth: number;
    revenueGrowth: number;
  };
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

const AnalyticsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AdminAnalytics | null>(null);

  const isAxiosError = (error: unknown): error is AxiosErrorLike => {
    return (
      typeof error === 'object' &&
      error !== null &&
      'isAxiosError' in error &&
      Boolean((error as AxiosErrorLike).isAxiosError)
    );
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await consultantFlowAPI.getAnalytics();
        setAnalyticsData(response.data as AdminAnalytics);
      } catch (err: unknown) {
        console.error('Error fetching analytics:', err);
        if (isAxiosError(err)) {
          setError(err.response?.data?.error || err.message || 'Failed to load analytics');
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load analytics');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 sm:py-6">
        <MobileHeader title="Analytics Dashboard" />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Mobile Header */}
      <MobileHeader title="Analytics Dashboard" />
      
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Platform-wide metrics and insights</p>
      </div>

      {/* Overview Metrics */}
      <AdminSection title="Platform Overview" subtitle="Essential platform metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <AdminCard
            title="Total Users"
            value={analyticsData.overview.totalUsers}
            icon={Users}
            color="blue"
            subtitle="Registered users"
          />
          <AdminCard
            title="Active Consultants"
            value={analyticsData.overview.activeConsultants}
            icon={CheckCircle}
            color="green"
            subtitle="Approved consultants"
          />
          <AdminCard
            title="Total Bookings"
            value={analyticsData.overview.totalBookings}
            icon={Calendar}
            color="purple"
            subtitle={`${analyticsData.overview.completedBookings} completed`}
          />
          <AdminCard
            title="Total Revenue"
            value={formatCurrency(analyticsData.overview.totalRevenue)}
            icon={DollarSign}
            color="green"
            subtitle="Platform revenue"
          />
        </div>
      </AdminSection>

      {/* Additional Metrics */}
      <AdminSection title="Additional Metrics" subtitle="Platform health indicators">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <AdminCard
            title="Pending Applications"
            value={analyticsData.overview.pendingApplications}
            icon={FileText}
            color="yellow"
            subtitle="Awaiting review"
          />
          <AdminCard
            title="Completed Bookings"
            value={analyticsData.overview.completedBookings}
            icon={CheckCircle}
            color="green"
            subtitle="Successful sessions"
          />
          <AdminCard
            title="Cancelled Bookings"
            value={analyticsData.overview.cancelledBookings}
            icon={XCircle}
            color="red"
            subtitle="Cancelled sessions"
          />
        </div>
      </AdminSection>

      {/* Trends */}
      <AdminSection title="Monthly Trends" subtitle="This month's performance">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">New Users</h3>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.trends.newUsersThisMonth}</p>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">New Consultants</h3>
              <CheckCircle className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.trends.newConsultantsThisMonth}</p>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Bookings</h3>
              {analyticsData.trends.bookingsGrowth >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.trends.bookingsThisMonth}</p>
            <p className={`text-xs mt-1 ${analyticsData.trends.bookingsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analyticsData.trends.bookingsGrowth >= 0 ? '+' : ''}{analyticsData.trends.bookingsGrowth.toFixed(1)}% vs last month
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Revenue</h3>
              {analyticsData.trends.revenueGrowth >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.trends.revenueThisMonth)}</p>
            <p className={`text-xs mt-1 ${analyticsData.trends.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analyticsData.trends.revenueGrowth >= 0 ? '+' : ''}{analyticsData.trends.revenueGrowth.toFixed(1)}% vs last month
            </p>
          </div>
        </div>
      </AdminSection>

      {/* Recent Activity */}
      {analyticsData.recentActivity && analyticsData.recentActivity.length > 0 && (
        <AdminSection title="Recent Activity" subtitle="Latest platform activities">
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
            <div className="space-y-3">
              {analyticsData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    activity.type === 'profile_approved' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {activity.type === 'profile_approved' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Calendar className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AdminSection>
      )}
    </div>
  );
};

export default AnalyticsPage;
