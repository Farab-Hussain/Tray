'use client';

import React, { useMemo, useState } from 'react';
import { Loader2, Send, Sparkles, Users, ShieldCheck, MailCheck, AlertTriangle } from 'lucide-react';
import AdminSection from '@/components/admin/AdminSection';
import MobileHeader from '@/components/shared/MobileHeader';
import { newsletterAPI } from '@/utils/api';

type RoleOption = {
  value: string;
  label: string;
  hint?: string;
};

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'all', label: 'All users', hint: 'Every verified account' },
  { value: 'student', label: 'Students' },
  { value: 'consultant', label: 'Consultants' },
  { value: 'recruiter', label: 'Recruiters' },
  { value: 'admin', label: 'Admins' },
];

const NewsletterPage = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [roleFilters, setRoleFilters] = useState<string[]>(['all']);
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedRoles = useMemo(() => {
    if (roleFilters.includes('all')) return null; // backend treats null as all
    return roleFilters;
  }, [roleFilters]);

  const toggleRole = (value: string) => {
    if (value === 'all') {
      setRoleFilters(['all']);
      return;
    }

    setRoleFilters((prev) => {
      const next = prev.filter((r) => r !== 'all');
      return prev.includes(value) ? next.filter((r) => r !== value) : [...next, value];
    });
  };

  const handleSend = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();

    if (!trimmedSubject || !trimmedBody) {
      setErrorMessage('Subject and message body are required.');
      return;
    }

    const extractErrorMessage = (error: unknown): string | undefined => {
      if (error && typeof error === 'object' && 'response' in error) {
        const resp = (error as { response?: { data?: { error?: string } } }).response;
        return resp?.data?.error;
      }
      if (error instanceof Error) return error.message;
      return undefined;
    };

    try {
      setIsSending(true);
      await newsletterAPI.sendNewsletter({
        subject: trimmedSubject,
        body: trimmedBody,
        roles: selectedRoles || undefined,
      });
      setSuccessMessage('Newsletter dispatched to recipients.');
      setSubject('');
      setBody('');
      setRoleFilters(['all']);
    } catch (error: unknown) {
      const apiMessage = extractErrorMessage(error);
      setErrorMessage(apiMessage || 'Failed to send newsletter.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <MobileHeader title="Broadcast Email" />

      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Broadcast Email</h1>
          <p className="text-gray-600">Send a platform-wide announcement to user inboxes.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MailCheck className="w-4 h-4" />
          Deliver via email
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-sm text-red-800">
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-medium">Could not send newsletter</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 text-sm text-green-800">
          <ShieldCheck className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-medium">Success</p>
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <AdminSection title="Compose" subtitle="Write the subject and body for this announcement">
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Product updates, maintenance window, or announcement"
                  maxLength={140}
                />
                <div className="text-xs text-gray-500 text-right">{subject.length}/140</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Message body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full min-h-[200px] rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Write the announcement. Use line breaks to create paragraphs."
                />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Paragraphs and line breaks are preserved in the email.</span>
                  <span>{body.length} chars</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setBody((prev) => `${prev ? `${prev}\n\n` : ''}We have shipped a new set of improvements to FairChance. Update your app to get the latest experience.`)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                  type="button"
                >
                  <Sparkles className="w-4 h-4" /> Insert quick blurb
                </button>
                <button
                  onClick={() => setBody('')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                  type="button"
                  disabled={!body}
                >
                  Clear body
                </button>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  type="button"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isSending ? 'Sending...' : 'Send to users'}
                </button>
                <p className="text-xs text-gray-500">Emails are delivered in batches; this can take a few seconds.</p>
              </div>
            </div>
          </AdminSection>
        </div>

        <div className="space-y-6">
          <AdminSection title="Recipients" subtitle="Choose who should receive this email">
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-3">
              <div className="space-y-3">
                {ROLE_OPTIONS.map((role) => {
                  const checked = roleFilters.includes(role.value) || (role.value === 'all' && roleFilters.includes('all'));
                  return (
                    <label
                      key={role.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        checked ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleRole(role.value)}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        readOnly
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{role.label}</p>
                        {role.hint && <p className="text-xs text-gray-500">{role.hint}</p>}
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Users className="w-4 h-4" />
                If no role is selected, everyone with an email will receive this.
              </div>
            </div>
          </AdminSection>

          <AdminSection title="Preview" subtitle="What the email looks like">
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
              <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Subject</p>
                <p className="text-base font-semibold text-gray-900">{subject || 'Your subject will appear here'}</p>
              </div>
              <div className="border border-gray-100 rounded-lg p-4 bg-white min-h-[140px]">
                {body ? (
                  body.split(/\n+/).map((para, idx) => (
                    <p key={idx} className="text-sm text-gray-800 leading-6 mb-3 last:mb-0">{para}</p>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Start typing to see a live preview.</p>
                )}
              </div>
            </div>
          </AdminSection>
        </div>
      </div>
    </div>
  );
};

export default NewsletterPage;
