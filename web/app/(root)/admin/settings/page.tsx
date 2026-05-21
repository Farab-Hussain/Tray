'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminSection from '@/components/admin/AdminSection';
import {
  Loader2,
  Save,
  RefreshCw,
  DollarSign,
  Lock,
  UserPlus,
  Eye,
  EyeOff,
  GraduationCap,
  Briefcase,
  Users,
} from 'lucide-react';
import { api, authAPI, pricingAPI, type PricingSettings } from '@/utils/api';

type SettingsTab = 'pricing' | 'account';

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'account' ? 'account' : 'pricing';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const [isLoading, setIsLoading] = useState(true);
  const [platformFeeAmount, setPlatformFeeAmount] = useState<number>(5.0);
  const [platformFeeLoading, setPlatformFeeLoading] = useState(true);
  const [platformFeeSaving, setPlatformFeeSaving] = useState(false);
  const [platformFeeError, setPlatformFeeError] = useState<string | null>(null);
  const [platformFeeSuccess, setPlatformFeeSuccess] = useState<string | null>(null);

  const [studentConsultantFeeInput, setStudentConsultantFeeInput] = useState('25');
  const [recruiterPostingFeeInput, setRecruiterPostingFeeInput] = useState('5');
  const [recruiterPostingsPerBundleInput, setRecruiterPostingsPerBundleInput] = useState('3');
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [pricingSuccess, setPricingSuccess] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'account' || tab === 'pricing') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [feeRes, pricingRes] = await Promise.all([
          api.get<{ platformFeeAmount: number }>('/payment/platform-fee'),
          pricingAPI.getPricingSettings(),
        ]);

        if (feeRes.data?.platformFeeAmount !== undefined) {
          setPlatformFeeAmount(feeRes.data.platformFeeAmount);
        }

        if (pricingRes.data) {
          setStudentConsultantFeeInput(String(pricingRes.data.studentConsultantFee ?? 25));
          setRecruiterPostingFeeInput(String(pricingRes.data.recruiterPostingFee ?? 5));
          setRecruiterPostingsPerBundleInput(
            String(pricingRes.data.recruiterPostingsPerBundle ?? 3)
          );
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setPlatformFeeError('Some settings could not be loaded. Defaults are shown.');
      } finally {
        setIsLoading(false);
        setPlatformFeeLoading(false);
        setPricingLoading(false);
      }
    };

    load();
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
      setPlatformFeeSuccess('Per-booking platform fee updated.');
      setTimeout(() => setPlatformFeeSuccess(null), 3000);
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to update platform fee';
      setPlatformFeeError(errorMessage);
    } finally {
      setPlatformFeeSaving(false);
    }
  };

  const handleSavePricing = async () => {
    const studentConsultantFee = parseFloat(studentConsultantFeeInput);
    const recruiterPostingFee = parseFloat(recruiterPostingFeeInput);
    const recruiterPostingsPerBundle = parseInt(recruiterPostingsPerBundleInput, 10);

    if (
      Number.isNaN(studentConsultantFee) ||
      Number.isNaN(recruiterPostingFee) ||
      Number.isNaN(recruiterPostingsPerBundle) ||
      studentConsultantFee < 0 ||
      recruiterPostingFee < 0 ||
      recruiterPostingsPerBundle < 1
    ) {
      setPricingError('Fees must be non-negative and bundle must include at least 1 posting');
      return;
    }

    setPricingSaving(true);
    setPricingError(null);
    setPricingSuccess(null);

    const payload: PricingSettings = {
      studentConsultantFee,
      recruiterPostingFee,
      recruiterPostingsPerBundle,
    };

    try {
      const res = await pricingAPI.updatePricingSettings(payload);
      const saved = res.data?.settings ?? payload;
      setStudentConsultantFeeInput(String(saved.studentConsultantFee));
      setRecruiterPostingFeeInput(String(saved.recruiterPostingFee));
      setRecruiterPostingsPerBundleInput(String(saved.recruiterPostingsPerBundle));
      setPricingSuccess(
        `Role pricing saved (access fee $${saved.studentConsultantFee}, recruiter bundle $${saved.recruiterPostingFee} / ${saved.recruiterPostingsPerBundle} posts).`
      );
      setTimeout(() => setPricingSuccess(null), 4000);
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to update pricing';
      setPricingError(errorMessage);
    } finally {
      setPricingSaving(false);
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
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to change password';
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      setAdminError('Please enter a valid email address');
      return;
    }

    setIsCreatingAdmin(true);
    setAdminError(null);
    setAdminSuccess(null);

    try {
      await authAPI.createAdminUser({ email: adminEmail, password: adminPassword });
      setAdminSuccess('Admin user created successfully!');
      setAdminEmail('');
      setAdminPassword('');
      setTimeout(() => setAdminSuccess(null), 3000);
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to create admin user';
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

  const tabClass = (tab: SettingsTab) =>
    `px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
      activeTab === tab
        ? 'bg-green-600 text-white shadow-sm'
        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
    }`;

  return (
    <div className="py-4 sm:py-6 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pricing & Settings</h1>
        <p className="mt-1 text-sm sm:text-base text-gray-600">
          Manage one-time access fees by role, recruiter job bundles, and per-session booking fees.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={tabClass('pricing')} onClick={() => setActiveTab('pricing')}>
          Pricing & Fees
        </button>
        <button type="button" className={tabClass('account')} onClick={() => setActiveTab('account')}>
          Account & Admin
        </button>
      </div>

      {activeTab === 'pricing' && (
        <>
          <AdminSection
            title="Student & Consultant — Platform Access"
            subtitle="One-time fee required before booking sessions or purchasing courses (mobile app)"
          >
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    Applies to both <strong>Student</strong> and <strong>Consultant</strong> roles.
                    Users must pay this once to unlock bookings and course purchases.
                  </p>
                </div>
              </div>
              <div className="max-w-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  One-time access fee (USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={studentConsultantFeeInput}
                    onChange={(e) => setStudentConsultantFeeInput(e.target.value)}
                    disabled={pricingLoading}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Default: $25. Shown on the mandatory paywall after signup.</p>
              </div>
            </div>
          </AdminSection>

          <AdminSection
            title="Recruiter / Hiring Manager — Job Postings"
            subtitle="Bundle price for posting jobs on the platform"
          >
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    Recruiters buy a bundle of job posting credits. Each published job uses one credit.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bundle price (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={recruiterPostingFeeInput}
                      onChange={(e) => setRecruiterPostingFeeInput(e.target.value)}
                      disabled={pricingLoading}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postings per bundle
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={recruiterPostingsPerBundleInput}
                    onChange={(e) => setRecruiterPostingsPerBundleInput(e.target.value)}
                    disabled={pricingLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-700">
                  <strong>Preview:</strong> $
                  {parseFloat(recruiterPostingFeeInput || '0').toFixed(2)} for{' '}
                  {recruiterPostingsPerBundleInput || '0'} job posting
                  {recruiterPostingsPerBundleInput !== '1' ? 's' : ''}
                </p>
              </div>
            </div>
          </AdminSection>

          <AdminSection
            title="Per-session booking fee"
            subtitle="Fixed fee deducted from each consultant booking payment (separate from the $25 access fee)"
          >
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 flex-1">
                  Charged on top of the consultant&apos;s session price when a student pays for a booking.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  />
                </div>
                <button
                  onClick={handleSavePlatformFee}
                  disabled={platformFeeSaving || platformFeeLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {platformFeeSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save booking fee
                </button>
              </div>
              {platformFeeError && (
                <p className="mt-3 text-sm text-red-700">{platformFeeError}</p>
              )}
              {platformFeeSuccess && (
                <p className="mt-3 text-sm text-green-700">{platformFeeSuccess}</p>
              )}
            </div>
          </AdminSection>

          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              {pricingLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading role pricing...
                </div>
              )}
              {pricingError && <p className="text-sm text-red-700">{pricingError}</p>}
              {pricingSuccess && <p className="text-sm text-green-700">{pricingSuccess}</p>}
              {!pricingLoading && !pricingError && !pricingSuccess && (
                <p className="text-sm text-gray-500">
                  Saves student/consultant access fee and recruiter bundle settings together.
                </p>
              )}
            </div>
            <button
              onClick={handleSavePricing}
              disabled={pricingSaving || pricingLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {pricingSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save role pricing
            </button>
          </div>
        </>
      )}

      {activeTab === 'account' && (
        <>
          <AdminSection title="Change Password" subtitle="Update your admin account password">
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  {passwordSuccess}
                </div>
              )}
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isChangingPassword ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </AdminSection>

          <AdminSection title="Create Admin User" subtitle="Add another admin to this dashboard">
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => {
                      setAdminEmail(e.target.value);
                      setAdminError(null);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setAdminError(null);
                    }}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showAdminPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {adminError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {adminError}
                </div>
              )}
              {adminSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  {adminSuccess}
                </div>
              )}
              <button
                onClick={handleCreateAdmin}
                disabled={isCreatingAdmin || !adminEmail || !adminPassword}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isCreatingAdmin ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create Admin User
                  </>
                )}
              </button>
            </div>
          </AdminSection>
        </>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
