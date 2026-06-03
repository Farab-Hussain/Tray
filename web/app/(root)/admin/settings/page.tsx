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

  const [clientAccessFeeInput, setClientAccessFeeInput] = useState('25');
  const [consultantAccessFeeInput, setConsultantAccessFeeInput] = useState('0');
  const [hiringManagerAccessFeeInput, setHiringManagerAccessFeeInput] = useState('25');
  const [consultantSalesFeePercentInput, setConsultantSalesFeePercentInput] = useState('10');
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [pricingSuccess, setPricingSuccess] = useState<string | null>(null);

  const [promoCodes, setPromoCodes] = useState<
    Array<{ id: string; code: string; timesRedeemed: number; maxRedemptions: number | null }>
  >([]);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoPercentInput, setPromoPercentInput] = useState('100');
  const [promoMaxRedemptionsInput, setPromoMaxRedemptionsInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

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
        const [pricingRes, promoRes] = await Promise.all([
          pricingAPI.getPricingSettings(),
          pricingAPI.listPromotionCodes().catch(() => ({ data: { codes: [] } })),
        ]);

        if (pricingRes.data) {
          setClientAccessFeeInput(String(pricingRes.data.clientAccessFee ?? 25));
          setConsultantAccessFeeInput(String(pricingRes.data.consultantAccessFee ?? 0));
          setHiringManagerAccessFeeInput(String(pricingRes.data.hiringManagerAccessFee ?? 25));
          setConsultantSalesFeePercentInput(
            String(pricingRes.data.consultantSalesFeePercent ?? 10)
          );
        }
        if (promoRes.data?.codes) {
          setPromoCodes(promoRes.data.codes);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setPricingError('Some settings could not be loaded. Defaults are shown.');
      } finally {
        setIsLoading(false);
        setPricingLoading(false);
        setPromoLoading(false);
      }
    };

    load();
  }, []);

  const handleSavePricing = async () => {
    const clientAccessFee = parseFloat(clientAccessFeeInput);
    const consultantAccessFee = parseFloat(consultantAccessFeeInput);
    const hiringManagerAccessFee = parseFloat(hiringManagerAccessFeeInput);
    const consultantSalesFeePercent = parseFloat(consultantSalesFeePercentInput);

    if (
      [clientAccessFee, consultantAccessFee, hiringManagerAccessFee, consultantSalesFeePercent].some(
        (n) => Number.isNaN(n)
      ) ||
      clientAccessFee < 0 ||
      consultantAccessFee < 0 ||
      hiringManagerAccessFee < 0 ||
      consultantSalesFeePercent < 0 ||
      consultantSalesFeePercent > 100
    ) {
      setPricingError('Fees must be non-negative and sales percent must be 0–100');
      return;
    }

    setPricingSaving(true);
    setPricingError(null);
    setPricingSuccess(null);

    const payload: PricingSettings = {
      clientAccessFee,
      consultantAccessFee,
      hiringManagerAccessFee,
      consultantSalesFeePercent,
    };

    try {
      const res = await pricingAPI.updatePricingSettings(payload);
      const saved = res.data?.settings ?? payload;
      setClientAccessFeeInput(String(saved.clientAccessFee));
      setConsultantAccessFeeInput(String(saved.consultantAccessFee));
      setHiringManagerAccessFeeInput(String(saved.hiringManagerAccessFee));
      setConsultantSalesFeePercentInput(String(saved.consultantSalesFeePercent));
      setPricingSuccess('Role pricing saved successfully.');
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

  const handleCreatePromoCode = async () => {
    const code = promoCodeInput.trim();
    const percentOff = parseFloat(promoPercentInput);
    const maxRedemptions = promoMaxRedemptionsInput
      ? parseInt(promoMaxRedemptionsInput, 10)
      : undefined;

    if (!code) {
      setPromoError('Code is required');
      return;
    }
    if (Number.isNaN(percentOff) || percentOff <= 0 || percentOff > 100) {
      setPromoError('Percent off must be between 1 and 100');
      return;
    }

    setPromoSaving(true);
    setPromoError(null);
    setPromoSuccess(null);

    try {
      await pricingAPI.createPromotionCode({
        code: code.toUpperCase(),
        percentOff,
        maxRedemptions,
      });
      const listRes = await pricingAPI.listPromotionCodes();
      setPromoCodes(listRes.data?.codes ?? []);
      setPromoCodeInput('');
      setPromoSuccess(`Promotion code ${code.toUpperCase()} created.`);
      setTimeout(() => setPromoSuccess(null), 4000);
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to create promotion code';
      setPromoError(errorMessage);
    } finally {
      setPromoSaving(false);
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
          Manage one-time entry fees by role (Client, Consultant, Hiring Manager) and consultant sales commission.
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
            title="Client — Entry Fee"
            subtitle="Student role in the app. One-time fee before booking or purchasing courses."
          >
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 max-w-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entry fee (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  inputMode="decimal"
                  value={clientAccessFeeInput}
                  onChange={(e) => setClientAccessFeeInput(e.target.value)}
                  disabled={pricingLoading}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Default: $25. Set to $0 to waive.</p>
            </div>
          </AdminSection>

          <AdminSection
            title="Consultant — Entry Fee"
            subtitle="One-time consultant entry fee. Default $0 per pricing model."
          >
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 max-w-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entry fee (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  inputMode="decimal"
                  value={consultantAccessFeeInput}
                  onChange={(e) => setConsultantAccessFeeInput(e.target.value)}
                  disabled={pricingLoading}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </AdminSection>

          <AdminSection
            title="Hiring Manager — Entry Fee"
            subtitle="Recruiter role in the app. One-time fee before posting jobs."
          >
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 max-w-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entry fee (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  inputMode="decimal"
                  value={hiringManagerAccessFeeInput}
                  onChange={(e) => setHiringManagerAccessFeeInput(e.target.value)}
                  disabled={pricingLoading}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Default: $25. Unlimited job posts after payment.</p>
            </div>
          </AdminSection>

          <AdminSection
            title="Consultant — Sales Commission"
            subtitle="Percent retained from consultant in-app sales (bookings). Not charged to the client at checkout."
          >
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 max-w-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform fee (% of sale)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={consultantSalesFeePercentInput}
                onChange={(e) => setConsultantSalesFeePercentInput(e.target.value)}
                disabled={pricingLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              />
              <p className="mt-2 text-xs text-gray-500">Default: 10%. Consultant receives the remainder.</p>
            </div>
          </AdminSection>

          <AdminSection
            title="Nonprofit / Partner Promotion Codes"
            subtitle="Create Stripe codes so nonprofits can cover Client or Hiring Manager entry fees."
          >
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    placeholder="NONPROFIT100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Percent off</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={promoPercentInput}
                    onChange={(e) => setPromoPercentInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max redemptions (optional)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={promoMaxRedemptionsInput}
                    onChange={(e) => setPromoMaxRedemptionsInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleCreatePromoCode}
                disabled={promoSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {promoSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Create code
              </button>
              {promoError && <p className="text-sm text-red-700">{promoError}</p>}
              {promoSuccess && <p className="text-sm text-green-700">{promoSuccess}</p>}
              {promoLoading ? (
                <p className="text-sm text-gray-500">Loading codes...</p>
              ) : promoCodes.length > 0 ? (
                <ul className="text-sm text-gray-700 divide-y border border-gray-100 rounded-lg">
                  {promoCodes.map((p) => (
                    <li key={p.id} className="px-4 py-2 flex justify-between">
                      <span className="font-mono font-medium">{p.code}</span>
                      <span className="text-gray-500">
                        {p.timesRedeemed}
                        {p.maxRedemptions != null ? ` / ${p.maxRedemptions}` : ''} used
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No active promotion codes yet.</p>
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
                  Saves all role entry fees and consultant sales commission together.
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
