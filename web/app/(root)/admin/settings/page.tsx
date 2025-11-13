'use client';

import React, { useState, useEffect } from 'react';
import AdminSection from '@/components/admin/AdminSection';
import { Loader2, Save, RefreshCw, DollarSign, Lock, UserPlus, Eye, EyeOff } from 'lucide-react';
import { api, authAPI } from '@/utils/api';

const SettingsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [platformFeeAmount, setPlatformFeeAmount] = useState<number>(5.00);
  const [platformFeeLoading, setPlatformFeeLoading] = useState(true);
  const [platformFeeSaving, setPlatformFeeSaving] = useState(false);
  const [platformFeeError, setPlatformFeeError] = useState<string | null>(null);
  const [platformFeeSuccess, setPlatformFeeSuccess] = useState<string | null>(null);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  
  // Create admin user state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call when backend settings endpoint is ready
        // const response = await api.get('/admin/settings');
        // setSettings(response.data);
        
        // For now, keep default settings
        console.log('Settings loaded with default values');
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPlatformFee = async () => {
      try {
        setPlatformFeeLoading(true);
        const response = await api.get<{ platformFeeAmount: number }>('/payment/platform-fee');
        if (response.data?.platformFeeAmount !== undefined) {
          setPlatformFeeAmount(response.data.platformFeeAmount);
        }
      } catch (error: unknown) {
        console.error('Error fetching platform fee:', error);
        setPlatformFeeError('Failed to load platform fee. Using default.');
      } finally {
        setPlatformFeeLoading(false);
      }
    };

    fetchSettings();
    fetchPlatformFee();
  }, []);

  const handleSavePlatformFee = async () => {
    if (platformFeeAmount < 0) {
      setPlatformFeeError('Platform fee must be a non-negative number');
      return;
    }

    setPlatformFeeSaving(true);
    setPlatformFeeError(null);
    setPlatformFeeSuccess(null);

    try {
      await api.put('/payment/platform-fee', { platformFeeAmount });
      setPlatformFeeSuccess('Platform fee updated successfully!');
      setTimeout(() => setPlatformFeeSuccess(null), 3000);
    } catch (error: unknown) {
      console.error('Error updating platform fee:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update platform fee';
      setPlatformFeeError(errorMessage);
    } finally {
      setPlatformFeeSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }

    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await authAPI.changePassword(newPassword, currentPassword);
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (error: unknown) {
      console.error('Error changing password:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to change password';
      setPasswordError(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!adminEmail || !adminPassword) {
      setAdminError('Email and password are required');
      return;
    }

    if (adminPassword.length < 8) {
      setAdminError('Password must be at least 8 characters long');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      setAdminError('Please enter a valid email address');
      return;
    }

    setIsCreatingAdmin(true);
    setAdminError(null);
    setAdminSuccess(null);

    try {
      await authAPI.createAdminUser({
        email: adminEmail,
        password: adminPassword
      });
      setAdminSuccess('Admin user created successfully!');
      setAdminEmail('');
      setAdminPassword('');
      setTimeout(() => setAdminSuccess(null), 3000);
    } catch (error: unknown) {
      console.error('Error creating admin user:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create admin user';
      setAdminError(errorMessage);
    } finally {
      setIsCreatingAdmin(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 space-y-6 sm:space-y-8">
 

      {/* System Status - Disabled until backend monitoring is implemented */}
      {/* 
      <AdminSection title="System Status" subtitle="Current platform health">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <AdminCard
            title="System Status"
            value="Operational"
            icon={CheckCircle}
            color="green"
            subtitle="All systems running normally"
          />
          <AdminCard
            title="Database"
            value="99.9%"
            icon={Database}
            color="green"
            subtitle="Uptime this month"
          />
          <AdminCard
            title="Last Backup"
            value="2 hours ago"
            icon={Clock}
            color="blue"
            subtitle="Database backup"
          />
        </div>
      </AdminSection>
      */}

     

      {/* Platform Fee Settings */}
      <AdminSection title="Platform Fee" subtitle="Manage the fixed platform fee charged per booking">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Fee Amount (USD)
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={platformFeeAmount}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0) {
                        setPlatformFeeAmount(value);
                        setPlatformFeeError(null);
                      }
                    }}
                    disabled={platformFeeLoading}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base disabled:bg-gray-100"
                    placeholder="5.00"
                  />
                </div>
                <button
                  onClick={handleSavePlatformFee}
                  disabled={platformFeeSaving || platformFeeLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {platformFeeSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {platformFeeSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-gray-500">
                This fixed amount will be charged per booking transaction. The fee is deducted from the consultant&apos;s payment.
              </p>
            </div>
            
            {platformFeeLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading current platform fee...</span>
              </div>
            )}
            
            {platformFeeError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{platformFeeError}</p>
              </div>
            )}
            
            {platformFeeSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{platformFeeSuccess}</p>
              </div>
            )}
          </div>
        </div>
      </AdminSection>

      {/* Change Password */}
      <AdminSection title="Change Password" subtitle="Update your account password">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter new password (min. 8 characters)"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Confirm new password"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{passwordError}</p>
              </div>
            )}
            
            {passwordSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{passwordSuccess}</p>
              </div>
            )}

            <button
              onClick={handleChangePassword}
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isChangingPassword ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Changing Password...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Change Password
                </>
              )}
            </button>
            <p className="text-xs sm:text-sm text-gray-500">
              Your password must be at least 8 characters long.
            </p>
          </div>
        </div>
      </AdminSection>

      {/* Create Admin User */}
      <AdminSection title="Create Admin User" subtitle="Create a new admin account">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => {
                    setAdminEmail(e.target.value);
                    setAdminError(null);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="admin@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showAdminPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setAdminError(null);
                  }}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter password (min. 8 characters)"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showAdminPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {adminError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{adminError}</p>
              </div>
            )}
            
            {adminSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{adminSuccess}</p>
              </div>
            )}

            <button
              onClick={handleCreateAdmin}
              disabled={isCreatingAdmin || !adminEmail || !adminPassword}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isCreatingAdmin ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creating Admin...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Admin User
                </>
              )}
            </button>
            <p className="text-xs sm:text-sm text-gray-500">
              The new admin user will be able to access the admin dashboard immediately. Password must be at least 8 characters long.
            </p>
          </div>
        </div>
      </AdminSection>
                
    </div>
  );
};

export default SettingsPage;
