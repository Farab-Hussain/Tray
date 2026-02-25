'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { authAPI, resumeAdminAPI, uploadAdminAPI } from '@/utils/api';
import AdminCard from '@/components/admin/AdminCard';
import AdminSection from '@/components/admin/AdminSection';
import MobileHeader from '@/components/shared/MobileHeader';
import { CheckCircle, Clock, Search, ShieldAlert, XCircle } from 'lucide-react';

type SectionKey =
  | 'drivingTransportation'
  | 'workAuthorizationDocumentation'
  | 'physicalWorkplaceRequirements'
  | 'schedulingWorkEnvironment'
  | 'drugTestingSafetyPolicies'
  | 'professionalLicensingCertifications'
  | 'roleBasedCompatibilitySensitive';

type ReviewStatus = 'self_reported' | 'pending' | 'verified' | 'rejected';

interface UserItem {
  id: string;
  uid?: string;
  name: string | null;
  email: string;
  role: 'admin' | 'consultant' | 'student';
}

interface EvidenceFile {
  section: SectionKey;
  fileUrl: string;
  fileName?: string;
  publicId?: string;
}

interface WorkEligibilityChecklist {
  verificationStatusBySection?: Partial<Record<SectionKey, ReviewStatus>>;
  evidenceFiles?: EvidenceFile[];
}

interface ResumeRecord {
  workEligibilityChecklist?: WorkEligibilityChecklist;
}

const sectionList: Array<{ key: SectionKey; label: string }> = [
  { key: 'drivingTransportation', label: 'Driving & Transportation' },
  {
    key: 'workAuthorizationDocumentation',
    label: 'Work Authorization & Documentation',
  },
  {
    key: 'physicalWorkplaceRequirements',
    label: 'Physical & Workplace Requirements',
  },
  { key: 'schedulingWorkEnvironment', label: 'Scheduling & Work Environment' },
  { key: 'drugTestingSafetyPolicies', label: 'Drug Testing & Safety Policies' },
  {
    key: 'professionalLicensingCertifications',
    label: 'Professional Licensing & Certifications',
  },
  {
    key: 'roleBasedCompatibilitySensitive',
    label: 'Role-Based Compatibility (Sensitive)',
  },
];

const statusClasses: Record<ReviewStatus, string> = {
  self_reported: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-800',
  verified: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const statusIcon = (status: ReviewStatus) => {
  if (status === 'verified') return <CheckCircle className="w-4 h-4" />;
  if (status === 'pending') return <Clock className="w-4 h-4" />;
  if (status === 'rejected') return <XCircle className="w-4 h-4" />;
  return <ShieldAlert className="w-4 h-4" />;
};

const WorkEligibilityAdminPage = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [isSavingSection, setIsSavingSection] = useState<SectionKey | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openingFileKey, setOpeningFileKey] = useState<string | null>(null);
  const [resume, setResume] = useState<ResumeRecord | null>(null);
  const [notesBySection, setNotesBySection] = useState<Partial<Record<SectionKey, string>>>({});

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const response = await authAPI.getAllUsers();
        const allUsers = ((response.data as { users: UserItem[] }).users || []).filter(
          user => user.role === 'student',
        );
        setUsers(allUsers);
      } catch {
        setErrorMessage('Failed to load users.');
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      user =>
        (user.name || '').toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.uid || user.id).toLowerCase().includes(q),
    );
  }, [users, search]);

  const loadResume = async () => {
    if (!selectedUserId) return;
    try {
      setIsLoadingResume(true);
      setErrorMessage(null);
      const response = await resumeAdminAPI.getResumeByUserId(selectedUserId);
      setResume((response.data as { resume: ResumeRecord }).resume);
    } catch (error: unknown) {
      setResume(null);
      const apiError = error as { response?: { data?: { error?: string } } };
      setErrorMessage(apiError?.response?.data?.error || 'Failed to load work eligibility.');
    } finally {
      setIsLoadingResume(false);
    }
  };

  const verificationStatusBySection =
    resume?.workEligibilityChecklist?.verificationStatusBySection || {};
  const evidenceFiles = resume?.workEligibilityChecklist?.evidenceFiles || [];

  const getSectionStatus = (section: SectionKey): ReviewStatus =>
    verificationStatusBySection[section] || 'self_reported';

  const getSectionEvidence = (section: SectionKey) =>
    evidenceFiles.filter((file: EvidenceFile) => file.section === section);

  const updateSection = async (section: SectionKey, status: 'pending' | 'verified' | 'rejected') => {
    if (!selectedUserId) return;
    try {
      setIsSavingSection(section);
      await resumeAdminAPI.reviewWorkEligibilitySection(selectedUserId, {
        section,
        status,
        reviewNote: notesBySection[section]?.trim() || undefined,
      });
      await loadResume();
      setSuccessMessage(`Updated ${section} to ${status}`);
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { error?: string } } };
      setErrorMessage(apiError?.response?.data?.error || 'Failed to update section status.');
    } finally {
      setIsSavingSection(null);
    }
  };

  const openEvidenceFile = async (file: EvidenceFile, idx: number) => {
    try {
      const key = `${file.publicId || file.fileUrl || 'file'}-${idx}`;
      setOpeningFileKey(key);

      if (file.publicId) {
        const response = await uploadAdminAPI.getFileAccessUrl(file.publicId);
        const url = (response.data as { url?: string })?.url;
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
          return;
        }
      }

      if (file.fileUrl) {
        window.open(file.fileUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      setErrorMessage('No accessible URL found for this file.');
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { error?: string } } };
      setErrorMessage(apiError?.response?.data?.error || 'Failed to open evidence file.');
    } finally {
      setOpeningFileKey(null);
    }
  };

  return (
    <div className="py-4 sm:py-6 space-y-6">
      <MobileHeader title="Work Eligibility Review" />

      <div className="hidden lg:block">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Work Eligibility Review
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Review student self-attested eligibility sections and update verification statuses.
        </p>
      </div>

      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {errorMessage}
        </div>
      )}

      <AdminSection title="Select Student" subtitle="Choose a student account to review">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or uid..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isLoadingUsers}
            >
              <option value="">
                {isLoadingUsers ? 'Loading students...' : 'Select a student'}
              </option>
              {filteredUsers.map(user => {
                const uid = user.uid || user.id;
                return (
                  <option key={uid} value={uid}>
                    {user.name || 'No Name'} - {user.email} ({uid})
                  </option>
                );
              })}
            </select>
            <button
              onClick={loadResume}
              disabled={!selectedUserId || isLoadingResume}
              className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {isLoadingResume ? 'Loading...' : 'Load Eligibility'}
            </button>
          </div>
        </div>
      </AdminSection>

      <AdminSection title="Section Reviews" subtitle="Set status and optional notes per section">
        <div className="grid grid-cols-1 gap-4">
          {sectionList.map(section => {
            const status = getSectionStatus(section.key);
            const sectionEvidence = getSectionEvidence(section.key);
            return (
              <div key={section.key} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-gray-900">{section.label}</h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${statusClasses[status]}`}
                  >
                    {statusIcon(status)}
                    {status.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  Evidence files: <span className="font-medium">{sectionEvidence.length}</span>
                </div>

                {sectionEvidence.length > 0 && (
                  <div className="mb-3 space-y-1">
                    {sectionEvidence.map((file: EvidenceFile, idx: number) => (
                      file.fileUrl || file.publicId ? (
                        <button
                          key={`${file.publicId || file.fileUrl}-${idx}`}
                          type="button"
                          onClick={() => openEvidenceFile(file, idx)}
                          className="block text-sm text-blue-600 hover:underline text-left"
                        >
                          {openingFileKey === `${file.publicId || file.fileUrl || 'file'}-${idx}`
                            ? 'Opening...'
                            : file.fileName || 'Evidence file'}
                        </button>
                      ) : (
                        <p key={`missing-${idx}`} className="text-sm text-red-600">
                          {file.fileName || 'Evidence file'} (missing URL)
                        </p>
                      )
                    ))}
                  </div>
                )}

                <textarea
                  value={notesBySection[section.key] || ''}
                  onChange={e =>
                    setNotesBySection(prev => ({ ...prev, [section.key]: e.target.value }))
                  }
                  placeholder="Optional review note"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={2}
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateSection(section.key, 'pending')}
                    disabled={!selectedUserId || isSavingSection === section.key}
                    className="px-3 py-2 rounded-lg bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-700 disabled:opacity-50"
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => updateSection(section.key, 'verified')}
                    disabled={!selectedUserId || isSavingSection === section.key}
                    className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => updateSection(section.key, 'rejected')}
                    disabled={!selectedUserId || isSavingSection === section.key}
                    className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </AdminSection>

      <AdminSection title="Summary" subtitle="Quick status counts for loaded student">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AdminCard
            title="Verified"
            value={sectionList.filter(s => getSectionStatus(s.key) === 'verified').length}
            subtitle="Sections approved"
            icon={CheckCircle}
            color="green"
          />
          <AdminCard
            title="Pending"
            value={sectionList.filter(s => getSectionStatus(s.key) === 'pending').length}
            subtitle="Awaiting decision"
            icon={Clock}
            color="yellow"
          />
          <AdminCard
            title="Rejected"
            value={sectionList.filter(s => getSectionStatus(s.key) === 'rejected').length}
            subtitle="Needs correction"
            icon={XCircle}
            color="red"
          />
        </div>
      </AdminSection>
    </div>
  );
};

export default WorkEligibilityAdminPage;
