'use client';

import React, { useState, useEffect } from 'react';
import AdminSection from '@/components/admin/AdminSection';
import MobileHeader from '@/components/shared/MobileHeader';
import { Loader2, Save, RefreshCw, DollarSign } from 'lucide-react';
import { api } from '@/utils/api';

interface PlatformSettings {
  general: {
    platformName: string;
    platformDescription: string;
    timezone: string;
    language: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    requireTwoFactor: boolean;
    passwordMinLength: number;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    adminAlerts: boolean;
    userWelcomeEmail: boolean;
  };
  features: {
    enableVideoCalls: boolean;
    enableFileSharing: boolean;
    enableReviews: boolean;
    enableMessaging: boolean;
  };
}

const SettingsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [platformFeeAmount, setPlatformFeeAmount] = useState<number>(5.00);
  const [platformFeeLoading, setPlatformFeeLoading] = useState(true);
  const [platformFeeSaving, setPlatformFeeSaving] = useState(false);
  const [platformFeeError, setPlatformFeeError] = useState<string | null>(null);
  const [platformFeeSuccess, setPlatformFeeSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<PlatformSettings>({
    general: {
      platformName: 'Tray Consultant Platform',
      platformDescription: 'Professional consulting marketplace',
      timezone: 'UTC',
      language: 'en'
    },
    security: {
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      requireTwoFactor: false,
      passwordMinLength: 8
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      adminAlerts: true,
      userWelcomeEmail: true
    },
    features: {
      enableVideoCalls: true,
      enableFileSharing: true,
      enableReviews: true,
      enableMessaging: true
    }
  });

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
      } catch (error: any) {
        console.error('Error fetching platform fee:', error);
        setPlatformFeeError('Failed to load platform fee. Using default.');
      } finally {
        setPlatformFeeLoading(false);
      }
    };

    fetchSettings();
    fetchPlatformFee();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Replace with actual API call when backend settings endpoint is ready
      // await api.put('/admin/settings', settings);
      
      // For now, just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Settings saved:', settings);
      
      // Show success message (you could add a toast notification here)
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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
    } catch (error: any) {
      console.error('Error updating platform fee:', error);
      setPlatformFeeError(error.response?.data?.error || 'Failed to update platform fee');
    } finally {
      setPlatformFeeSaving(false);
    }
  };

  const handleReset = () => {
    // Reset to default settings
    setSettings({
      general: {
        platformName: 'Tray Consultant Platform',
        platformDescription: 'Professional consulting marketplace',
        timezone: 'UTC',
        language: 'en'
      },
      security: {
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        requireTwoFactor: false,
        passwordMinLength: 8
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        adminAlerts: true,
        userWelcomeEmail: true
      },
      features: {
        enableVideoCalls: true,
        enableFileSharing: true,
        enableReviews: true,
        enableMessaging: true
      }
    });
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
      {/* Mobile Header */}
      <MobileHeader title="Platform Settings" />
      
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Platform Settings</h1>
            <p className="text-sm sm:text-base text-gray-600">Configure platform settings and preferences</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleReset}
              className="px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Reset to Default
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

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

      {/* General Settings */}
      <AdminSection title="General Settings" subtitle="Basic platform configuration">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.general.platformName}
                onChange={(e) => setSettings({
                  ...settings,
                  general: { ...settings.general, platformName: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={settings.general.timezone}
                onChange={(e) => setSettings({
                  ...settings,
                  general: { ...settings.general, timezone: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="UTC">UTC</option>
                <option value="EST">Eastern Time</option>
                <option value="PST">Pacific Time</option>
                <option value="GMT">Greenwich Mean Time</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Description
              </label>
              <textarea
                value={settings.general.platformDescription}
                onChange={(e) => setSettings({
                  ...settings,
                  general: { ...settings.general, platformDescription: e.target.value }
                })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
          </div>
        </div>
      </AdminSection>

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
                This fixed amount will be charged per booking transaction. The fee is deducted from the consultant's payment.
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
                
    </div>
  );
};

export default SettingsPage;
