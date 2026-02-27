'use client';

import React, { useState, useEffect } from 'react';
import AdminCard from '@/components/admin/AdminCard';
import AdminSection from '@/components/admin/AdminSection';
import MobileHeader from '@/components/shared/MobileHeader';
import { adminAIAPI, consultantFlowAPI } from '@/utils/api';
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
      detail?: string;
    };
  };
  message?: string;
};

interface AdminInsightsResponse {
  platform_analytics_intelligence: {
    dropoff_analysis: Array<{
      stage: string;
      issue: string;
      impact: 'high' | 'medium' | 'low';
      action: string;
    }>;
    top_performing_consultants: Array<{
      name: string;
      reason: string;
    }>;
    placement_rate_analysis: {
      value_pct: number | null;
      status: 'strong' | 'developing' | 'critical';
      explanation: string;
    };
    revenue_by_role_insight: Array<{
      role: string;
      revenue: number;
      insight: string;
    }>;
  };
  risk_monitoring: {
    suspicious_employer_behavior: Array<{
      signal: string;
      risk_level: 'high' | 'medium' | 'low';
      recommended_action: string;
    }>;
    discriminatory_job_description_flags: Array<{
      excerpt: string;
      reason: string;
      recommended_rewrite: string;
    }>;
    abnormal_account_activity: Array<{
      signal: string;
      risk_level: 'high' | 'medium' | 'low';
      recommended_action: string;
    }>;
  };
  growth_recommendations: {
    high_demand_industries: Array<{
      industry: string;
      evidence: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    new_course_categories: Array<{
      category: string;
      why_now: string;
    }>;
    underserved_talent_segments: Array<{
      segment: string;
      opportunity: string;
      recommended_program: string;
    }>;
  };
}

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
  aiSnapshot?: {
    topConsultants?: string[];
    revenueByRole?: Record<string, number>;
    dropoffPoints?: string[];
    suspiciousSignals?: string[];
    recentJobDescriptions?: string[];
    abnormalActivitySignals?: string[];
    highDemandIndustries?: string[];
    underservedSegments?: string[];
  };
}

const AnalyticsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AdminAnalytics | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [insights, setInsights] = useState<AdminInsightsResponse | null>(null);

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

  const getSnapshotPayload = (data: AdminAnalytics) => {
    const placementRatePct =
      data.overview.totalBookings > 0
        ? Number(((data.overview.completedBookings / data.overview.totalBookings) * 100).toFixed(1))
        : null;

    return {
      snapshot: {
        total_users: data.overview.totalUsers,
        active_consultants: data.overview.activeConsultants,
        total_bookings: data.overview.totalBookings,
        completed_bookings: data.overview.completedBookings,
        cancelled_bookings: data.overview.cancelledBookings,
        total_revenue: data.overview.totalRevenue,
        revenue_this_month: data.trends.revenueThisMonth,
        bookings_growth_pct: data.trends.bookingsGrowth,
        revenue_growth_pct: data.trends.revenueGrowth,
        pending_applications: data.overview.pendingApplications,
        placement_rate_pct: placementRatePct,
        top_consultants: data.aiSnapshot?.topConsultants || [],
        revenue_by_role: data.aiSnapshot?.revenueByRole || {},
        dropoff_points: data.aiSnapshot?.dropoffPoints || [],
        suspicious_signals: data.aiSnapshot?.suspiciousSignals || [],
        recent_job_descriptions: data.aiSnapshot?.recentJobDescriptions || [],
        abnormal_activity_signals: data.aiSnapshot?.abnormalActivitySignals || [],
        high_demand_industries: data.aiSnapshot?.highDemandIndustries || [],
        underserved_segments: data.aiSnapshot?.underservedSegments || [],
      },
      provider: 'openai',
    };
  };

  const handleGenerateInsights = async () => {
    try {
      setInsightsLoading(true);
      setInsightsError(null);
      const response = await adminAIAPI.generateInsights(getSnapshotPayload(analyticsData));
      setInsights(response.data as AdminInsightsResponse);
    } catch (err: unknown) {
      console.error('Error generating admin AI insights:', err);
      if (isAxiosError(err)) {
        setInsightsError(
          err.response?.data?.detail ||
          err.response?.data?.error ||
          err.message ||
          'Failed to generate insights'
        );
      } else if (err instanceof Error) {
        setInsightsError(err.message);
      } else {
        setInsightsError('Failed to generate insights');
      }
    } finally {
      setInsightsLoading(false);
    }
  };

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

      <button
        type="button"
        onClick={handleGenerateInsights}
        disabled={insightsLoading}
        className="inline-flex w-fit items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {insightsLoading ? 'Generating AI insights...' : 'Generate AI Insights'}
      </button>

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

      {insightsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <p className="text-red-700">{insightsError}</p>
        </div>
      )}

      {insights && (
        <>
          <AdminSection
            title="AI Platform Analytics Intelligence"
            subtitle="Drop-off points, top consultants, placement and revenue insights"
          >
            <div className="space-y-4">
              {insights.platform_analytics_intelligence.dropoff_analysis.map((item, index) => (
                <div key={`dropoff-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900">{item.stage} · {item.impact.toUpperCase()} impact</p>
                  <p className="text-sm text-gray-700 mt-1">{item.issue}</p>
                  <p className="text-sm text-green-700 mt-1">{item.action}</p>
                </div>
              ))}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900">Placement Rate Analysis</p>
                <p className="text-sm text-gray-700 mt-1">{insights.platform_analytics_intelligence.placement_rate_analysis.explanation}</p>
              </div>
            </div>
          </AdminSection>

          <AdminSection
            title="AI Risk Monitoring"
            subtitle="Employer risk, job description policy risk, and abnormal activity signals"
          >
            <div className="space-y-4">
              {insights.risk_monitoring.suspicious_employer_behavior.map((item, index) => (
                <div key={`risk-employer-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900">{item.signal}</p>
                  <p className="text-xs text-gray-500 mt-1">Risk: {item.risk_level.toUpperCase()}</p>
                  <p className="text-sm text-gray-700 mt-1">{item.recommended_action}</p>
                </div>
              ))}
              {insights.risk_monitoring.discriminatory_job_description_flags.map((item, index) => (
                <div key={`risk-jd-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900">Potential discriminatory language</p>
                  <p className="text-sm text-gray-700 mt-1">{item.excerpt}</p>
                  <p className="text-sm text-gray-700 mt-1">{item.reason}</p>
                  <p className="text-sm text-green-700 mt-1">{item.recommended_rewrite}</p>
                </div>
              ))}
            </div>
          </AdminSection>

          <AdminSection
            title="AI Growth Recommendations"
            subtitle="Industry demand, new course ideas, and underserved segments"
          >
            <div className="space-y-4">
              {insights.growth_recommendations.high_demand_industries.map((item, index) => (
                <div key={`growth-industry-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900">{item.industry}</p>
                  <p className="text-xs text-gray-500 mt-1">Priority: {item.priority.toUpperCase()}</p>
                  <p className="text-sm text-gray-700 mt-1">{item.evidence}</p>
                </div>
              ))}
              {insights.growth_recommendations.new_course_categories.map((item, index) => (
                <div key={`growth-course-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900">{item.category}</p>
                  <p className="text-sm text-gray-700 mt-1">{item.why_now}</p>
                </div>
              ))}
              {insights.growth_recommendations.underserved_talent_segments.map((item, index) => (
                <div key={`growth-segment-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900">{item.segment}</p>
                  <p className="text-sm text-gray-700 mt-1">{item.opportunity}</p>
                  <p className="text-sm text-green-700 mt-1">{item.recommended_program}</p>
                </div>
              ))}
            </div>
          </AdminSection>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
