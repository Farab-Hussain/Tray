'use client';

import React, { useState, useEffect } from 'react';
import { 
  PanelLeft, 
  PanelRight, 
  Bell, 
  Clock, 
  TrendingUp, 
  BarChart3,
  RefreshCw,
  Activity,
  Server,
  Settings
} from 'lucide-react';
import Button from '../custom/Button';
import { LucideIcon } from 'lucide-react';
import { consultantFlowAPI } from '@/utils/api';
import type { DashboardStats } from '@/types';

interface AdminWidget {
  id: string;
  title: string;
  icon: LucideIcon;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  color: 'green' | 'red' | 'yellow' | 'blue' | 'purple';
}


type AdminAnalyticsOverview = {
  totalRevenue?: number;
};

type AdminAnalyticsData = {
  overview?: AdminAnalyticsOverview;
};

const RightSide = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AdminAnalyticsData | null>(null);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };


  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadDashboardStats(),
        loadAnalytics()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await consultantFlowAPI.getDashboardStats();
      setDashboardStats(response.data as DashboardStats);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await consultantFlowAPI.getAnalytics();
      setAnalyticsData(response.data as AdminAnalyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  useEffect(() => {
    loadDashboardStats();
    loadAnalytics();
  }, []);

  // Simplified widgets - only essential metrics
  const widgets: AdminWidget[] = [
    {
      id: 'pending-reviews',
      title: 'Pending Reviews',
      icon: Clock,
      value: dashboardStats?.summary?.totalPendingReviews || 0,
      change: { value: 8, isPositive: false },
      color: 'yellow'
    },
    {
      id: 'revenue',
      title: 'Revenue',
      icon: TrendingUp,
      value: (() => {
        const totalRevenue = analyticsData?.overview?.totalRevenue ?? 0;
        if (totalRevenue >= 1000) {
          return `$${(totalRevenue / 1000).toFixed(1)}K`;
        }
        return `$${totalRevenue}`;
      })(),
      change: { value: 18, isPositive: true },
      color: 'blue'
    }
  ];


  const getColorClasses = (color: AdminWidget['color']) => {
    switch (color) {
      case 'green':
        return 'bg-green-50 border-green-200 text-green-600';
      case 'red':
        return 'bg-red-50 border-red-200 text-red-600';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 text-yellow-600';
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-600';
      case 'purple':
        return 'bg-purple-50 border-purple-200 text-purple-600';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  if (!isOpen) {
    return (
      <div className="hidden layout sm:flex sticky top-0 border flex-col justify-start items-start min-w-0 p-2 sm:p-5 transition-all duration-700 w-12 sm:w-16 lg:w-20 h-auto lg:h-screen bg-white shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          icon={PanelLeft}
          onClick={handleClick}
          className="mb-4 hover:bg-gray-100 rounded-lg"
        >
          {""}
        </Button>
        <div className="w-full flex flex-col items-center gap-3">
          <div className="group relative">
            <div className="p-3 rounded-xl hover:bg-blue-50 hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-200" title="Quick Stats">
              <BarChart3 className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          
          <div className="group relative">
            <div className="p-3 rounded-xl hover:bg-yellow-50 hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-yellow-200" title="Notifications">
              <Bell className="h-5 w-5 text-gray-600 group-hover:text-yellow-600 transition-colors" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          
          <div className="group relative">
            <div className="p-3 rounded-xl hover:bg-green-50 hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-green-200" title="Activity">
              <Activity className="h-5 w-5 text-gray-600 group-hover:text-green-600 transition-colors" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          
          <div className="group relative">
            <div className="p-3 rounded-xl hover:bg-purple-50 hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-purple-200" title="System Status">
              <Server className="h-5 w-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          
          <div className="group relative">
            <div className="p-3 rounded-xl hover:bg-red-50 hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-red-200" title="Settings">
              <Settings className="h-5 w-5 text-gray-600 group-hover:text-red-600 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden layout sm:flex sticky top-0 border flex-col justify-start items-start min-w-0 p-2 sm:p-5 transition-all duration-700 w-28 sm:w-1/5 lg:w-1/6 h-auto lg:h-screen overflow-y-auto overflow-x-visible bg-white shadow-sm z-10">
      <Button
        variant="ghost"
        size="sm"
        icon={PanelRight}
        onClick={handleClick}
        className="mb-4 hover:bg-gray-100 rounded-lg"
      >
        {""}
      </Button>

      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Admin Panel
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-2">
            <BarChart3 className="w-3 h-3" />
            Quick Stats
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {widgets.map((widget) => (
              <div key={widget.id} className="bg-white border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1 rounded ${getColorClasses(widget.color)}`}>
                    <widget.icon className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium text-gray-900 truncate">{widget.title}</span>
                </div>
                <div className="text-sm font-bold text-gray-900">{widget.value}</div>
                {widget.change && (
                  <div className={`text-xs flex items-center gap-1 ${
                    widget.change.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className={`w-2 h-2 ${widget.change.isPositive ? '' : 'rotate-180'}`} />
                    {widget.change.value}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSide;