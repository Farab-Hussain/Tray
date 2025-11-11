'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { consultantFlowAPI } from '@/utils/api';
import AdminCard from '@/components/admin/AdminCard';
import AdminActionCard from '@/components/admin/AdminActionCard';
import AdminSection from '@/components/admin/AdminSection';
import AdminStatItem from '@/components/admin/AdminStatItem';
import MobileHeader from '@/components/shared/MobileHeader';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  TrendingUp,
  MessageSquare,
  Settings,
  Shield,
  BarChart3,
  UserCheck,
  AlertTriangle,
  Activity,
  Database,
  RefreshCw
} from 'lucide-react';
import { DashboardStats } from '@/types';

const AdminDashboardPage = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadStats();
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(loadStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const response = await consultantFlowAPI.getDashboardStats();
      setStats(response.data as DashboardStats);
      setLastUpdated(new Date());
    } catch (error: unknown) {
      console.error('Error loading stats:', error);
      setErrorMessage('Failed to load dashboard statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadStats();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Mobile Header */}
      <MobileHeader title="Admin Dashboard" />
      
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600">Complete platform management and analytics</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="text-xs sm:text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {stats && (
        <>
          {/* Key Metrics */}
          <AdminSection title="Key Metrics" subtitle="Overview of platform performance">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <AdminCard
                title="Total Users"
                value={stats.profiles?.total || 0}
                icon={Users}
                color="blue"
                subtitle="Registered consultants"
                trend={{ value: 12, isPositive: true }}
              />
              <AdminCard
                title="Pending Reviews"
                value={stats.summary?.totalPendingReviews || 0}
                icon={Clock}
                color="yellow"
                subtitle="Requires immediate attention"
                trend={{ value: 8, isPositive: false }}
              />
              <AdminCard
                title="Approved Profiles"
                value={stats.summary?.totalApproved || 0}
                icon={CheckCircle}
                color="green"
                subtitle="Active consultants"
                trend={{ value: 15, isPositive: true }}
              />
              <AdminCard
                title="Service Applications"
                value={stats.applications?.total || 0}
                icon={FileText}
                color="purple"
                subtitle="Total applications"
                trend={{ value: 22, isPositive: true }}
              />
            </div>
          </AdminSection>

          {/* Quick Actions */}
          <AdminSection title="Quick Actions" subtitle="Common administrative tasks">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <AdminActionCard
                title="Review Pending Profiles"
                description="Review and approve consultant profile applications"
                icon={UserCheck}
                color="yellow"
                count={stats.profiles?.pending || 0}
                onClick={() => router.push('/admin/consultant-profiles?status=pending')}
              />
              <AdminActionCard
                title="Review Service Applications"
                description="Approve or reject consultant service applications"
                icon={FileText}
                color="blue"
                count={stats.applications?.pending || 0}
                onClick={() => router.push('/admin/service-applications?status=pending')}
              />
              <AdminActionCard
                title="Platform Analytics"
                description="View detailed platform usage and performance metrics"
                icon={BarChart3}
                color="green"
                onClick={() => router.push('/admin/analytics')}
              />
              <AdminActionCard
                title="User Management"
                description="Manage user accounts, roles, and permissions"
                icon={Shield}
                color="purple"
                onClick={() => router.push('/admin/users')}
              />
              <AdminActionCard
                title="System Settings"
                description="Configure platform settings and preferences"
                icon={Settings}
                color="indigo"
                onClick={() => router.push('/admin/settings')}
              />
              <AdminActionCard
                title="Support Messages"
                description="View and respond to user support requests"
                icon={MessageSquare}
                color="red"
                count={0} // This would come from a support API
                onClick={() => router.push('/admin/support')}
              />
            </div>
          </AdminSection>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Consultant Profiles */}
            <AdminSection title="Consultant Profiles" subtitle="Profile management statistics">
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                <div className="space-y-1">
                  <AdminStatItem
                    label="Total Profiles"
                    value={stats.profiles?.total || 0}
                    icon={Users}
                    color="blue"
                  />
                  <AdminStatItem
                    label="Pending Review"
                    value={stats.profiles?.pending || 0}
                    icon={Clock}
                    color="yellow"
                  />
                  <AdminStatItem
                    label="Approved"
                    value={stats.profiles?.approved || 0}
                    icon={CheckCircle}
                    color="green"
                  />
                  <AdminStatItem
                    label="Rejected"
                    value={stats.profiles?.rejected || 0}
                    icon={XCircle}
                    color="red"
                  />
                </div>
                <button
                  onClick={() => router.push('/admin/consultant-profiles')}
                  className="mt-4 sm:mt-6 w-full px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                >
                  Manage Profiles
                </button>
              </div>
            </AdminSection>

            {/* Service Applications */}
            <AdminSection title="Service Applications" subtitle="Application management statistics">
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                <div className="space-y-1">
                  <AdminStatItem
                    label="Total Applications"
                    value={stats.applications?.total || 0}
                    icon={FileText}
                    color="blue"
                  />
                  <AdminStatItem
                    label="Pending Review"
                    value={stats.applications?.pending || 0}
                    icon={Clock}
                    color="yellow"
                  />
                  <AdminStatItem
                    label="Approved"
                    value={stats.applications?.approved || 0}
                    icon={CheckCircle}
                    color="green"
                  />
                  <AdminStatItem
                    label="Rejected"
                    value={stats.applications?.rejected || 0}
                    icon={XCircle}
                    color="red"
                  />
                </div>
                <button
                  onClick={() => router.push('/admin/service-applications')}
                  className="mt-4 sm:mt-6 w-full px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                >
                  Manage Applications
                </button>
              </div>
            </AdminSection>
          </div>

          {/* Platform Health */}
          <AdminSection title="Platform Health" subtitle="System status and performance">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <AdminCard
                title="System Status"
                value="Operational"
                icon={Activity}
                color="green"
                subtitle="All systems running normally"
              />
              <AdminCard
                title="Database Health"
                value="99.9%"
                icon={Database}
                color="green"
                subtitle="Uptime this month"
              />
              <AdminCard
                title="Response Time"
                value="120ms"
                icon={TrendingUp}
                color="blue"
                subtitle="Average API response"
              />
            </div>
          </AdminSection>

          {/* Recent Activity */}
          <AdminSection title="Recent Activity" subtitle="Latest platform activities">
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Profile approved</p>
                    <p className="text-xs sm:text-sm text-gray-500">John Doe&apos;s consultant profile was approved</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">2 min ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">New application</p>
                    <p className="text-xs sm:text-sm text-gray-500">Jane Smith submitted a service application</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">15 min ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">New registration</p>
                    <p className="text-xs sm:text-sm text-gray-500">Mike Johnson registered as a consultant</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">1 hour ago</span>
                </div>
              </div>
              <button
                onClick={() => router.push('/admin/activity')}
                className="mt-4 w-full px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                View All Activity
              </button>
            </div>
          </AdminSection>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;