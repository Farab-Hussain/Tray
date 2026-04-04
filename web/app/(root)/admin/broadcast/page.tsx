'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, Bell, ExternalLink, Loader2, Send, ShieldCheck, Target } from 'lucide-react';
import AdminSection from '@/components/admin/AdminSection';
import MobileHeader from '@/components/shared/MobileHeader';
import { broadcastAPI, BroadcastAudience } from '@/utils/api';

const AUDIENCE_OPTIONS: { value: BroadcastAudience; label: string; hint?: string }[] = [
  { value: 'all', label: 'Everyone', hint: 'All active users with push tokens' },
  { value: 'students', label: 'Students' },
  { value: 'consultants', label: 'Consultants' },
  { value: 'recruiters', label: 'Recruiters' },
  { value: 'admins', label: 'Admins' },
];

const BroadcastPage = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<BroadcastAudience>('all');
  const [link, setLink] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSend = useMemo(() => title.trim() && body.trim(), [title, body]);

  const extractErrorMessage = (error: unknown): string | undefined => {
    if (error && typeof error === 'object' && 'response' in error) {
      const resp = (error as { response?: { data?: { error?: string } } }).response;
      return resp?.data?.error;
    }
    if (error instanceof Error) return error.message;
    return undefined;
  };

  const handleSend = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle || !trimmedBody) {
      setErrorMessage('Title and message body are required.');
      return;
    }

    try {
      setIsSending(true);
      await broadcastAPI.sendBroadcast({
        title: trimmedTitle,
        body: trimmedBody,
        audience,
        link: link.trim() || undefined,
      });
      setSuccessMessage('Broadcast push sent to selected audience.');
      setTitle('');
      setBody('');
      setLink('');
      setAudience('all');
    } catch (error: unknown) {
      const apiMessage = extractErrorMessage(error);
      setErrorMessage(apiMessage || 'Failed to send broadcast.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <MobileHeader title="Broadcast Push" />

      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Broadcast Push</h1>
          <p className="text-gray-600">Send a push notification to users.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Bell className="w-4 h-4" />
          Deliver via FCM
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-sm text-red-800">
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-medium">Could not send broadcast</p>
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
          <AdminSection title="Compose" subtitle="Title and body will appear in the push notification">
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Short headline"
                  maxLength={80}
                />
                <div className="text-xs text-gray-500 text-right">{title.length}/80</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Message</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full min-h-[160px] rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="What should users see in the push notification?"
                />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Keep it concise; long text may be truncated by devices.</span>
                  <span>{body.length} chars</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Deep link (optional)</label>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="app://screen or https://..."
                  />
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                    onClick={() => setLink('')}
                    disabled={!link}
                  >
                    Clear
                  </button>
                </div>
                <p className="text-xs text-gray-500">Devices will open this when the notification is tapped.</p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  onClick={handleSend}
                  disabled={isSending || !canSend}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  type="button"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isSending ? 'Sending...' : 'Send push'}
                </button>
                <p className="text-xs text-gray-500">Sent via FCM in batches; may take a moment.</p>
              </div>
            </div>
          </AdminSection>
        </div>

        <div className="space-y-6">
          <AdminSection title="Audience" subtitle="Choose who receives this push">
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-3">
              <div className="space-y-2">
                {AUDIENCE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      audience === option.value ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setAudience(option.value)}
                  >
                    <input
                      type="radio"
                      checked={audience === option.value}
                      readOnly
                      className="mt-0.5 h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{option.label}</p>
                      {option.hint && <p className="text-xs text-gray-500">{option.hint}</p>}
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Target className="w-4 h-4" />
                Only active users with push tokens are targeted.
              </div>
            </div>
          </AdminSection>

          <AdminSection title="Preview" subtitle="What users will see">
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
              <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Title</p>
                <p className="text-base font-semibold text-gray-900">{title || 'Your push title'}</p>
              </div>
              <div className="border border-gray-100 rounded-lg p-4 bg-white min-h-[100px]">
                {body ? (
                  <p className="text-sm text-gray-800 leading-6">{body}</p>
                ) : (
                  <p className="text-sm text-gray-500">Body preview will appear here.</p>
                )}
              </div>
              {link && (
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <ExternalLink className="w-4 h-4" />
                  {link}
                </div>
              )}
            </div>
          </AdminSection>
        </div>
      </div>
    </div>
  );
};

export default BroadcastPage;
