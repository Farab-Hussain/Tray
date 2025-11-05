'use client';

import React, { useState, useEffect } from 'react';
import { authAPI, consultantAPI } from '@/utils/api';
import AdminCard from '@/components/admin/AdminCard';
import AdminSection from '@/components/admin/AdminSection';
import AdminTable from '@/components/admin/AdminTable';
import MobileHeader from '@/components/shared/MobileHeader';
import { 
  Users, 
  Shield, 
  UserCheck, 
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Star,
  Crown
} from 'lucide-react';

interface User {
  id: string;
  uid?: string;
  name: string | null;
  email: string;
  role: 'admin' | 'consultant' | 'student';
  isActive: boolean;
  status?: 'active' | 'inactive' | 'suspended';
  createdAt: string | Date;
  updatedAt: string | Date;
  profileImage?: string | null;
  profileComplete?: boolean;
  isTopConsultant?: boolean;
}

const UserManagementPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [topConsultants, setTopConsultants] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'consultant' | 'student'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showTopConsultantModal, setShowTopConsultantModal] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<User | null>(null);
  const [isSettingTop, setIsSettingTop] = useState(false);

  useEffect(() => {
    loadUsers();
    loadTopConsultants();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await authAPI.getAllUsers();
      setUsers((response.data as { users: User[] }).users);
    } catch (error: unknown) {
      console.error('Error loading users:', error);
      setErrorMessage('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTopConsultants = async () => {
    try {
      const response = await consultantAPI.getTop();
      const topConsultantsData = (response.data as { topConsultants: any[] }).topConsultants || [];
      // Extract consultant IDs from the response - the structure might vary
      const topIds = new Set(
        topConsultantsData
          .map((c: any) => {
            // Try different possible field names for consultant ID
            return c.consultantId || c.uid || c.id || c.userId;
          })
          .filter((id: string | undefined) => id !== undefined)
      );
      setTopConsultants(topIds);
    } catch (error: unknown) {
      console.error('Error loading top consultants:', error);
      // Don't show error for this, just continue without top consultant info
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      await authAPI.updateUserStatus(userId, newStatus);
      setSuccessMessage('User status updated successfully!');
      loadUsers(); // Reload users to get updated data
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: unknown) {
      console.error('Error updating user status:', error);
      setErrorMessage('Failed to update user status. Please try again.');
    }
  };

  const handleSetTopConsultant = (user: User) => {
    setSelectedConsultant(user);
    setShowTopConsultantModal(true);
  };

  const confirmSetTopConsultant = async () => {
    if (!selectedConsultant) return;

    setIsSettingTop(true);
    try {
      const consultantId = selectedConsultant.uid || selectedConsultant.id;
      await consultantAPI.setTopConsultant(consultantId);
      setSuccessMessage(`${selectedConsultant.name || 'Consultant'} has been set as top consultant!`);
      setShowTopConsultantModal(false);
      setSelectedConsultant(null);
      await loadTopConsultants(); // Reload top consultants
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error setting top consultant:', error);
      setErrorMessage(error?.response?.data?.error || 'Failed to set top consultant. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSettingTop(false);
    }
  };

  const cancelSetTopConsultant = () => {
    setShowTopConsultantModal(false);
    setSelectedConsultant(null);
  };

  const isTopConsultant = (user: User) => {
    const userId = user.uid || user.id;
    return topConsultants.has(userId);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const userStatus = user.isActive ? 'active' : (user.status || 'inactive');
    const matchesStatus = filterStatus === 'all' || userStatus === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusIcon = (user: User) => {
    const status = user.isActive ? 'active' : (user.status || 'inactive');
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'suspended':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getUserStatus = (user: User) => {
    return user.isActive ? 'active' : (user.status || 'inactive');
  };

  const getRoleBadge = (role: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (role) {
      case 'admin':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'consultant':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'student':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Mobile Header */}
      <MobileHeader title="User Management" />
      
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage user accounts, roles, and permissions</p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* User Statistics */}
      <AdminSection title="User Statistics" subtitle="Overview of user accounts">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <AdminCard
            title="Total Users"
            value={users.length}
            icon={Users}
            color="blue"
            subtitle="All registered users"
          />
          <AdminCard
            title="Active Users"
            value={users.filter(u => u.isActive).length}
            icon={UserCheck}
            color="green"
            subtitle="Currently active"
          />
          <AdminCard
            title="Consultants"
            value={users.filter(u => u.role === 'consultant').length}
            icon={Shield}
            color="purple"
            subtitle="Approved consultants"
          />
          <AdminCard
            title="Students"
            value={users.filter(u => u.role === 'student').length}
            icon={Users}
            color="indigo"
            subtitle="Student accounts"
          />
        </div>
      </AdminSection>

      {/* Filters and Search */}
      <AdminSection title="User List" subtitle="Search and filter users">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as 'all' | 'admin' | 'consultant' | 'student')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="consultant">Consultant</option>
                <option value="student">Student</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive' | 'suspended')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <AdminTable minWidth="800px">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-900 text-sm sm:text-base">User</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-900 text-sm sm:text-base">Role</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-900 text-sm sm:text-base">Status</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-900 text-sm sm:text-base hidden sm:table-cell">Last Login</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-900 text-sm sm:text-base">Profile</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-900 text-sm sm:text-base">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {user.name || 'No Name'}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <span className={getRoleBadge(user.role)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(user)}
                      <span className="text-xs sm:text-sm text-gray-900 capitalize">
                        {getUserStatus(user)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.profileComplete 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.profileComplete ? 'Complete' : 'Incomplete'}
                    </span>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <select
                        value={getUserStatus(user)}
                        onChange={(e) => handleStatusChange(user.id, e.target.value as 'active' | 'inactive' | 'suspended')}
                        className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                      {user.role === 'consultant' && (
                        <button
                          onClick={() => handleSetTopConsultant(user)}
                          disabled={isSettingTop}
                          className={`text-xs px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-green-500 flex items-center gap-1 ${
                            isTopConsultant(user)
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 cursor-default'
                              : 'bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100'
                          }`}
                          title={isTopConsultant(user) ? 'This consultant is already set as top consultant' : 'Set as top consultant'}
                        >
                          {isTopConsultant(user) ? (
                            <>
                              <Crown className="w-3 h-3" />
                              Top
                            </>
                          ) : (
                            <>
                              <Star className="w-3 h-3" />
                              Set Top
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>

          {filteredUsers.length === 0 && (
            <div className="text-center py-6 sm:py-8">
              <Users className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm sm:text-base text-gray-500">No users found matching your criteria</p>
            </div>
          )}
        </div>
      </AdminSection>

      {/* Set Top Consultant Confirmation Modal */}
      {showTopConsultantModal && selectedConsultant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Set as Top Consultant</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to set <span className="font-semibold">{selectedConsultant.name || selectedConsultant.email}</span> as the top consultant?
              {isTopConsultant(selectedConsultant) && (
                <span className="block mt-2 text-sm text-yellow-600">
                  Note: This consultant is already set as top consultant. This will reset the top consultant status.
                </span>
              )}
              {!isTopConsultant(selectedConsultant) && (
                <span className="block mt-2 text-sm text-gray-500">
                  This will replace the current top consultant (if any) with this consultant.
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelSetTopConsultant}
                disabled={isSettingTop}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSetTopConsultant}
                disabled={isSettingTop}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 flex items-center gap-2"
              >
                {isSettingTop ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    Set as Top Consultant
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
