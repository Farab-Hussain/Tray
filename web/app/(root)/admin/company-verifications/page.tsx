'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import MobileHeader from '@/components/shared/MobileHeader';
import AdminSection from '@/components/admin/AdminSection';
import AdminTable from '@/components/admin/AdminTable';
import { companyAdminAPI } from '@/utils/api';

interface CompanyRow {
  id: string;
  name: string;
  industry?: string;
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  createdAt?: string;
  retention90DayRate?: string;
}

const statusBadge = (status?: string) => {
  if (status === 'approved') return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700"><CheckCircle className="h-3 w-3"/>Approved</span>;
  if (status === 'rejected') return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"><XCircle className="h-3 w-3"/>Rejected</span>;
  if (status === 'pending') return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700"><Clock className="h-3 w-3"/>Pending</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">Not submitted</span>;
};

export default function CompanyVerificationsPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<'approved' | 'rejected'>('approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await companyAdminAPI.getAll({
        verificationStatus: filter === 'all' ? undefined : filter,
        limit: 200,
      });
      const data = (res as { data?: { companies?: CompanyRow[] } }).data;
      setCompanies(data?.companies ?? []);
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e?.response?.data?.error || e?.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.industry || '').toLowerCase().includes(q) ||
      (c.id || '').toLowerCase().includes(q)
    );
  }, [companies, search]);

  const startReview = (company: CompanyRow) => {
    if (company.verificationStatus !== 'pending') {
      setError('This company has not submitted for verification yet.');
      return;
    }
    setDecisionId(company.id);
    setDecisionStatus('approved');
    setRejectionReason('');
    setAdminNotes('');
  };

  const submitDecision = async () => {
    if (!decisionId) return;
    if (decisionStatus === 'rejected' && !rejectionReason.trim()) {
      setError('Rejection reason is required.');
      return;
    }
    try {
      setLoading(true);
      await companyAdminAPI.reviewVerification(decisionId, {
        status: decisionStatus,
        rejectionReason: decisionStatus === 'rejected' ? rejectionReason.trim() : undefined,
        adminNotes: adminNotes.trim() || undefined,
      });
      setDecisionId(null);
      await load();
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e?.response?.data?.error || e?.message || 'Failed to submit decision');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <MobileHeader title="Company Verifications" />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Company Verifications</h1>
            <p className="text-sm text-gray-600">Approve or reject submitted company profiles.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['pending','approved','rejected','all'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded border px-3 py-1 text-sm font-medium ${filter===f ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'}`}
              >{f === 'all' ? 'All' : f.charAt(0).toUpperCase()+f.slice(1)}</button>
            ))}
          </div>
        </div>

        <AdminSection title="Companies">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm sm:max-w-sm"
                placeholder="Search by name, industry, or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="text-sm text-gray-500">{filteredCompanies.length} result(s)</div>
            </div>

            {error && (
              <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <AdminTable minWidth="720px">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Industry</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Retention</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Created</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : filteredCompanies.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">No companies found.</td></tr>
                ) : (
                  filteredCompanies.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{c.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{c.industry || '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{statusBadge(c.verificationStatus)}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{c.retention90DayRate || '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          className={`inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-semibold ${c.verificationStatus === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                          onClick={() => c.verificationStatus === 'pending' ? startReview(c) : null}
                          disabled={c.verificationStatus !== 'pending'}
                        >Review</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </AdminTable>
          </div>
        </AdminSection>

        {decisionId && (
          <AdminSection title="Review Decision">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex gap-2">
                {(['approved','rejected'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setDecisionStatus(opt)}
                    className={`rounded px-3 py-1 text-sm font-semibold ${decisionStatus===opt ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >{opt.charAt(0).toUpperCase()+opt.slice(1)}</button>
                ))}
              </div>
              {decisionStatus === 'rejected' && (
                <div className="mt-3">
                  <label className="text-sm text-gray-700">Rejection Reason *</label>
                  <textarea
                    className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
              <div className="mt-3">
                <label className="text-sm text-gray-700">Admin Notes (optional)</label>
                <textarea
                  className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white"
                  onClick={submitDecision}
                  disabled={loading}
                >Submit</button>
                <button
                  className="rounded bg-gray-100 px-4 py-2 text-sm text-gray-700"
                  onClick={() => { setDecisionId(null); setRejectionReason(''); setAdminNotes(''); }}
                >Cancel</button>
              </div>
            </div>
          </AdminSection>
        )}
      </div>
    </div>
  );
}
