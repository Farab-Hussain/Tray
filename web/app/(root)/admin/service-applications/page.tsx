'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { consultantFlowAPI, api } from '@/utils/api';
import { ConsultantApplication } from '@/types';
import ApprovalModal from '@/components/admin/ApprovalModal';
import MobileHeader from '@/components/shared/MobileHeader';
import { Loader2, CheckCircle, XCircle, Filter } from 'lucide-react';
import Image from 'next/image';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

type FirestoreTimestamp =
  | { _seconds: number; _nanoseconds?: number }
  | { seconds: number; nanoseconds?: number }
  | string
  | number;

type AdminApplication = ConsultantApplication & {
  existingServiceTitle?: string;
  existingServiceDescription?: string;
  existingServiceImageUrl?: string;
  submittedDate?: Date | null;
};

const AdminServiceApplicationsPage = () => {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<AdminApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [selectedApplication, setSelectedApplication] = useState<AdminApplication | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredApplications(applications);
    } else {
      setFilteredApplications(applications.filter(a => a.status === filterStatus));
    }
  }, [filterStatus, applications]);

  const parseTimestamp = (timestamp: FirestoreTimestamp | null | undefined): Date | null => {
    if (!timestamp) return null;

    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }

    if (typeof timestamp === 'string') {
      const parsed = Date.parse(timestamp);
      return Number.isNaN(parsed) ? null : new Date(parsed);
    }

    if ('_seconds' in timestamp) {
      const millis = timestamp._seconds * 1000 + Math.floor((timestamp._nanoseconds || 0) / 1_000_000);
      return new Date(millis);
    }

    if ('seconds' in timestamp) {
      const millis = timestamp.seconds * 1000 + Math.floor((timestamp.nanoseconds || 0) / 1_000_000);
      return new Date(millis);
    }

    return null;
  };

  const fetchPlatformServices = useCallback(async () => {
    try {
      const servicesResponse = await api.get<{
        services?: Array<{ id: string; title?: string; description?: string; imageUrl?: string }>;
      }>('/consultants/services/available');
      let services: Array<{ id: string; title?: string; description?: string; imageUrl?: string }> =
        servicesResponse.data?.services ?? [];

      if (services.length > 0) {
        return services;
      }

      const topConsultantsResponse = await api.get<{
        topConsultants?: Array<{ uid: string; rating?: number }>;
      }>('/consultants/top');
      const topConsultants: Array<{ uid: string; rating?: number }> =
        topConsultantsResponse.data?.topConsultants ?? [];

      if (!topConsultants.length) {
        return [];
      }

      const selectedTopConsultant = topConsultants.reduce(
        (best, current) => {
          const bestRating = best?.rating ?? 0;
          const currentRating = current?.rating ?? 0;
          return currentRating > bestRating ? current : best;
        },
        topConsultants[0],
      );

      const consultantServicesResponse = await api.get<{
        services?: Array<{ id: string; title?: string; description?: string; imageUrl?: string }>;
      }>(`/consultants/${selectedTopConsultant?.uid}/services`);

      services = consultantServicesResponse.data?.services ?? [];
      return services;
    } catch (error) {
      console.error('Error fetching platform services for admin list:', error);
      return [];
    }
  }, []);

  const loadApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await consultantFlowAPI.getAllApplications();
      const rawApplications = (response.data as { applications: ConsultantApplication[] })
        .applications;

      const services = await fetchPlatformServices();
      const serviceMap = new Map<string, { title?: string; description?: string; imageUrl?: string }>();
      services.forEach(service => {
        if (service.id) {
          serviceMap.set(service.id, { 
            title: service.title, 
            description: service.description,
            imageUrl: (service as any).imageUrl 
          });
        }
      });

      const enrichedApplications: AdminApplication[] = rawApplications.map(app => ({
        ...app,
        existingServiceTitle:
          (app.type === 'existing' || app.type === 'update') && app.serviceId
            ? serviceMap.get(app.serviceId)?.title
            : undefined,
        existingServiceDescription:
          (app.type === 'existing' || app.type === 'update') && app.serviceId
            ? serviceMap.get(app.serviceId)?.description
            : undefined,
        existingServiceImageUrl:
          (app.type === 'existing' || app.type === 'update') && app.serviceId
            ? serviceMap.get(app.serviceId)?.imageUrl
            : undefined,
        submittedDate: parseTimestamp(app.submittedAt as FirestoreTimestamp),
      }));

      setApplications(enrichedApplications);
    } catch (error: unknown) {
      console.error('Error loading applications:', error);
      setErrorMessage('Failed to load applications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPlatformServices]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleApprove = (application: AdminApplication) => {
    setSelectedApplication(application);
    setModalAction('approve');
    setShowApprovalModal(true);
  };

  const handleReject = (application: AdminApplication) => {
    setSelectedApplication(application);
    setModalAction('reject');
    setShowApprovalModal(true);
  };

  const handleConfirmAction = async (notes?: string) => {
    if (!selectedApplication) return;

    try {
      if (modalAction === 'approve') {
        await consultantFlowAPI.approveApplication(selectedApplication.id, notes);
        setSuccessMessage('Application approved successfully! Service has been created.');
      } else {
        await consultantFlowAPI.rejectApplication(selectedApplication.id, notes);
        setSuccessMessage('Application rejected.');
      }

      setShowApprovalModal(false);
      setSelectedApplication(null);
      loadApplications();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: unknown) {
      console.error('Error updating application status:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error.response as { data?: { error?: string } })?.data?.error 
        : undefined;
      setErrorMessage(errorMessage || 'Failed to update application. Please try again.');
    }
  };

  const getServiceTitle = (app: AdminApplication) => {
    if ((app.type === 'new' || app.type === 'update') && app.customService?.title) {
      return app.customService.title;
    }
    if (app.existingServiceTitle) {
      return app.existingServiceTitle;
    }
    return app.serviceId || 'Existing platform service';
  };

  const getServiceDescription = (app: AdminApplication) => {
    if ((app.type === 'new' || app.type === 'update') && app.customService?.description) {
      return app.customService.description;
    }
    return app.existingServiceDescription || 'Existing platform service';
  };

  const getApplicationTypeBadge = (app: AdminApplication) => {
    const badgeStyles: Record<AdminApplication['type'], string> = {
      new: 'bg-blue-100 text-blue-800',
      existing: 'bg-purple-100 text-purple-800',
      update: 'bg-orange-100 text-orange-800',
    };

    const labels: Record<AdminApplication['type'], string> = {
      new: 'New Service',
      existing: 'Existing Service',
      update: 'Update Request',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded ${badgeStyles[app.type]}`}
      >
        {labels[app.type]}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Mobile Header */}
      <MobileHeader title="Service Applications" />
      
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Applications</h1>
            <p className="text-gray-600">Review and approve consultant service applications</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Applications</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Applications</p>
          <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700 mb-1">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-800">
            {applications.filter(a => a.status === 'pending').length}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-800">
            {applications.filter(a => a.status === 'approved').length}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700 mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-800">
            {applications.filter(a => a.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">No applications found for the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map(application => (
            <div
              key={application.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="mb-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getServiceTitle(application)}
                  </h3>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {application.submittedDate
                        ? application.submittedDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'Date not available'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {getApplicationTypeBadge(application)}
                  {getStatusBadge(application.status)}
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{getServiceDescription(application)}</p>
                
                {/* Service Image */}
                {(() => {
                  let imageUrl: string | undefined;
                  
                  if (application.type === 'new' && application.customService?.imageUrl) {
                    imageUrl = application.customService.imageUrl;
                  } else if ((application.type === 'existing' || application.type === 'update') && (application as AdminApplication).existingServiceImageUrl) {
                    imageUrl = (application as AdminApplication).existingServiceImageUrl;
                  }
                  
                  return imageUrl ? (
                    <div className="mb-3">
                      <Image
                        src={imageUrl} 
                        alt={getServiceTitle(application)}
                        width={128}
                        height={96}
                        className="w-32 h-24 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          console.error('Failed to load service image:', imageUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : null;
                })()}
                
                {application.type === 'new' && application.customService && (
                  <div className="flex gap-4 text-sm text-gray-600 mb-3">
                    <span>Duration: {application.customService.duration} min</span>
                    <span>Price: ${application.customService.price}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Consultant:</span> {application.consultantName || 'Unknown Consultant'}
                </div>
                
                {application.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(application)}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(application)}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}

                {application.reviewNotes && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Review Notes:</span> {application.reviewNotes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {showApprovalModal && selectedApplication && (
        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedApplication(null);
          }}
          onConfirm={handleConfirmAction}
          action={modalAction}
          title={modalAction === 'approve' ? 'Approve Application' : 'Reject Application'}
          message={
            modalAction === 'approve'
              ? `Are you sure you want to approve this service application? The service will be created and assigned to the consultant.`
              : `Are you sure you want to reject this service application?`
          }
          requireNotes={true}
        />
      )}
    </div>
  );
};

export default AdminServiceApplicationsPage;

