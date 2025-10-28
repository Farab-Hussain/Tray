'use client';

import React, { useState } from 'react';
import ApplicationCard from '@/components/consultant/ApplicationCard';
import { ConsultantApplication } from '@/types';
import { Plus, FileText, X } from 'lucide-react';

const ConsultantApplicationsPage = () => {
  const [applications, setApplications] = useState<ConsultantApplication[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    serviceTitle: '',
    serviceDescription: '',
    serviceDuration: 60,
    servicePrice: 100,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.serviceTitle.trim()) {
      errors.serviceTitle = 'Service title is required';
    }
    if (!formData.serviceDescription.trim()) {
      errors.serviceDescription = 'Service description is required';
    } else if (formData.serviceDescription.length < 20) {
      errors.serviceDescription = 'Description must be at least 20 characters';
    }
    if (formData.serviceDuration <= 0) {
      errors.serviceDuration = 'Duration must be greater than 0';
    }
    if (formData.servicePrice <= 0) {
      errors.servicePrice = 'Price must be greater than 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitApplication = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Simulate submission
    setTimeout(() => {
      const newApplication: ConsultantApplication = {
        id: `app-${Date.now()}`,
        consultantId: 'demo-uid',
        type: 'new',
        customService: {
          title: formData.serviceTitle,
          description: formData.serviceDescription,
          duration: formData.serviceDuration,
          price: formData.servicePrice,
        },
        status: 'pending',
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
      };

      setApplications([...applications, newApplication]);
      setSuccessMessage('Application submitted successfully! Awaiting admin review.');
      setShowModal(false);
      setFormData({
        serviceTitle: '',
        serviceDescription: '',
        serviceDuration: 60,
        servicePrice: 100,
      });
      setIsSubmitting(false);
      
      setTimeout(() => setSuccessMessage(null), 5000);
    }, 1000);
  };

  // Filter applications by status
  const pendingApps = applications.filter(app => app.status === 'pending');
  const approvedApps = applications.filter(app => app.status === 'approved');
  const rejectedApps = applications.filter(app => app.status === 'rejected');

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
          <p className="text-gray-600">
            Submit and manage your service applications
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          New Application
        </button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <div className="w-5 h-5 text-green-600 flex-shrink-0">✓</div>
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingApps.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Approved</p>
              <p className="text-2xl font-bold text-green-600">{approvedApps.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{rejectedApps.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Applications Lists */}
      {applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
          <p className="text-gray-600 mb-6">
            Start by submitting your first service application
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Submit Application
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Applications */}
          {pendingApps.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Review</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingApps.map(app => (
                  <ApplicationCard key={app.id} application={app} />
                ))}
              </div>
            </div>
          )}

          {/* Approved Applications */}
          {approvedApps.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Approved</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {approvedApps.map(app => (
                  <ApplicationCard key={app.id} application={app} />
                ))}
              </div>
            </div>
          )}

          {/* Rejected Applications */}
          {rejectedApps.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Rejected</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rejectedApps.map(app => (
                  <ApplicationCard key={app.id} application={app} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Application Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Submit New Application</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Service Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.serviceTitle}
                  onChange={(e) => setFormData({ ...formData, serviceTitle: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    formErrors.serviceTitle ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Career Mentorship Session"
                />
                {formErrors.serviceTitle && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.serviceTitle}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Service Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.serviceDescription}
                  onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-32 resize-none ${
                    formErrors.serviceDescription ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe your service in detail..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.serviceDescription.length} characters (minimum 20)
                </p>
                {formErrors.serviceDescription && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.serviceDescription}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={formData.serviceDuration}
                    onChange={(e) => setFormData({ ...formData, serviceDuration: parseInt(e.target.value) || 0 })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      formErrors.serviceDuration ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.serviceDuration && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.serviceDuration}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Price (USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-gray-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={formData.servicePrice}
                      onChange={(e) => setFormData({ ...formData, servicePrice: parseFloat(e.target.value) || 0 })}
                      className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        formErrors.servicePrice ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {formErrors.servicePrice && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.servicePrice}</p>
                  )}
                </div>
              </div>

              {formErrors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{formErrors.submit}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitApplication}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Submit Application
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

export default ConsultantApplicationsPage;
