'use client';

import React, { useState, useEffect } from 'react';
import AdminCard from '@/components/admin/AdminCard';
import AdminSection from '@/components/admin/AdminSection';
import MobileHeader from '@/components/shared/MobileHeader';
import { 
  Activity, 
  Search,
  Loader2,
  AlertTriangle,
  User,
  Shield,
  Database
} from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  user: string;
  details: string;
  type: 'user' | 'system' | 'admin' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  ipAddress?: string;
}

const ActivityLogPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'user' | 'system' | 'admin' | 'security'>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call when backend activity logs endpoint is ready
        // const response = await api.get('/admin/activity-logs');
        // setActivities(response.data);
        
        // For now, show empty state
        setActivities([]);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivityLogs();
  }, []);

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesSeverity = filterSeverity === 'all' || activity.severity === filterSeverity;
    
    return matchesSearch && matchesType && matchesSeverity;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'system':
        return <Database className="w-4 h-4 text-gray-600" />;
      case 'security':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (severity) {
      case 'critical':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'high':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'medium':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'low':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getTypeBadge = (type: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (type) {
      case 'user':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'admin':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'system':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'security':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading activity logs...</p>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Mobile Header */}
      <MobileHeader title="Activity Log" />
      
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Activity Log</h1>
        <p className="text-sm sm:text-base text-gray-600">Monitor platform activities and system events</p>
      </div>

      {/* Activity Statistics */}
      <AdminSection title="Activity Statistics" subtitle="Overview of platform activities">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <AdminCard
            title="Total Activities"
            value={activities.length}
            icon={Activity}
            color="blue"
            subtitle="Last 24 hours"
          />
          <AdminCard
            title="User Actions"
            value={activities.filter(a => a.type === 'user').length}
            icon={User}
            color="green"
            subtitle="User interactions"
          />
          <AdminCard
            title="Admin Actions"
            value={activities.filter(a => a.type === 'admin').length}
            icon={Shield}
            color="purple"
            subtitle="Administrative tasks"
          />
          <AdminCard
            title="Security Events"
            value={activities.filter(a => a.type === 'security').length}
            icon={AlertTriangle}
            color="red"
            subtitle="Security-related"
          />
        </div>
      </AdminSection>

      {/* Activity Log */}
      <AdminSection title="Activity Log" subtitle="Detailed activity history">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'user' | 'admin' | 'system' | 'security')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="all">All Types</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="system">System</option>
                <option value="security">Security</option>
              </select>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as 'all' | 'critical' | 'high' | 'medium' | 'low')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Activities List */}
          <div className="space-y-3 sm:space-y-4">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                      {getTypeIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{activity.action}</h3>
                        <div className="flex gap-2">
                          <span className={getTypeBadge(activity.type)}>
                            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                          </span>
                          <span className={getSeverityBadge(activity.severity)}>
                            {activity.severity.charAt(0).toUpperCase() + activity.severity.slice(1)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 line-clamp-2">{activity.details}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500">
                        <span>User: {activity.user}</span>
                        <span>Time: {new Date(activity.timestamp).toLocaleString()}</span>
                        {activity.ipAddress && <span>IP: {activity.ipAddress}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredActivities.length === 0 && !isLoading && (
            <div className="text-center py-6 sm:py-8">
              <Activity className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm sm:text-base text-gray-500">
                {activities.length === 0 
                  ? "No activity logs yet" 
                  : "No activities found matching your criteria"
                }
              </p>
            </div>
          )}
        </div>
      </AdminSection>
    </div>
  );
};

export default ActivityLogPage;
