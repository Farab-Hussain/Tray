"use client";

import React, { useState, useEffect } from "react";
import { consultantFlowAPI } from "@/utils/api";
import { ConsultantProfile } from "@/types";
import ProfileStatusBadge from "@/components/consultant/ProfileStatusBadge";
import ApprovalModal from "@/components/admin/ApprovalModal";
import AdminTable from "@/components/admin/AdminTable";
import MobileHeader from "@/components/shared/MobileHeader";
import { Loader2, Eye, CheckCircle, XCircle, Filter } from "lucide-react";

type FilterStatus = "all" | "pending" | "approved" | "rejected";

const AdminConsultantProfilesPage = () => {
  const [profiles, setProfiles] = useState<ConsultantProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<ConsultantProfile[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending");
  const [selectedProfile, setSelectedProfile] =
    useState<ConsultantProfile | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalAction, setModalAction] = useState<"approve" | "reject">(
    "approve"
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (filterStatus === "all") {
      setFilteredProfiles(profiles);
    } else {
      setFilteredProfiles(profiles.filter((p) => p.status === filterStatus));
    }
  }, [filterStatus, profiles]);

  const loadProfiles = async () => {
    try {
      setIsLoading(true);
      const response = await consultantFlowAPI.getAllProfiles();
      setProfiles(
        (response.data as { profiles: ConsultantProfile[] }).profiles
      );
    } catch (error: unknown) {
      console.error("Error loading profiles:", error);
      setErrorMessage("Failed to load profiles. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = (profile: ConsultantProfile) => {
    setSelectedProfile(profile);
    setModalAction("approve");
    setShowApprovalModal(true);
  };

  const handleReject = (profile: ConsultantProfile) => {
    setSelectedProfile(profile);
    setModalAction("reject");
    setShowApprovalModal(true);
  };

  const handleConfirmAction = async (notes?: string) => {
    if (!selectedProfile) return;

    try {
      if (modalAction === "approve") {
        await consultantFlowAPI.approveProfile(selectedProfile.uid);
        setSuccessMessage(
          `Profile for ${selectedProfile.personalInfo.fullName} approved successfully!`
        );
      } else {
        await consultantFlowAPI.rejectProfile(selectedProfile.uid, notes);
        setSuccessMessage(
          `Profile for ${selectedProfile.personalInfo.fullName} rejected.`
        );
      }

      setShowApprovalModal(false);
      setSelectedProfile(null);
      loadProfiles();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: unknown) {
      console.error("Error updating profile status:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error.response as { data?: { error?: string } })?.data?.error
          : undefined;
      setErrorMessage(
        errorMessage || "Failed to update profile. Please try again."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading profiles...</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Mobile Header */}
      <MobileHeader title="Consultant Profiles" />

      {/* Desktop Header */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Consultant Profiles
            </h1>
            <p className="text-gray-600">
              Review and approve consultant profile applications
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Profiles</option>
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
          <p className="text-sm text-gray-600 mb-1">Total Profiles</p>
          <p className="text-2xl font-bold text-gray-900">{profiles.length}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700 mb-1">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-800">
            {profiles.filter((p) => p.status === "pending").length}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-800">
            {profiles.filter((p) => p.status === "approved").length}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700 mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-800">
            {profiles.filter((p) => p.status === "rejected").length}
          </p>
        </div>
      </div>

      {/* Profiles List */}
      {filteredProfiles.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">
            No profiles found for the selected filter.
          </p>
        </div>
      ) : (
        <AdminTable
          minWidth="800px"
          className="bg-white border border-gray-200 rounded-lg"
        >
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consultant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Experience
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProfiles.map((profile) => (
              <tr key={profile.uid} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {profile.personalInfo.fullName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {profile.personalInfo.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {profile.professionalInfo.category}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {profile.personalInfo.experience} years
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ProfileStatusBadge status={profile.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {(() => {
                      try {
                        const rawCreatedAt = profile.createdAt as unknown;
                        let date: Date;
                        // Handle Firestore timestamp format {_seconds: number, _nanoseconds: number}
                        if (
                          rawCreatedAt &&
                          typeof rawCreatedAt === 'object' &&
                          '_seconds' in rawCreatedAt &&
                          typeof (rawCreatedAt as { _seconds?: number })._seconds === 'number'
                        ) {
                          date = new Date((rawCreatedAt as { _seconds: number })._seconds * 1000);
                        }
                        // Handle ISO string format
                        else if (typeof rawCreatedAt === 'string') {
                          date = new Date(rawCreatedAt);
                        }
                        // Handle Date object
                        else if (rawCreatedAt instanceof Date) {
                          date = rawCreatedAt;
                        }
                        // Fallback to current date if invalid
                        else {
                          date = new Date();
                        }

                        // Check if date is valid
                        if (isNaN(date.getTime())) {
                          return 'N/A';
                        }

                        return date.toLocaleDateString();
                      } catch (error) {
                        console.error('Error parsing date:', error, profile.createdAt);
                        return 'N/A';
                      }
                    })()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedProfile(profile);
                        setShowDetailsModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {profile.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(profile)}
                          className="text-green-600 hover:text-green-900"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(profile)}
                          className="text-red-600 hover:text-red-900"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}

      {/* Approval/Rejection Modal */}
      {showApprovalModal && selectedProfile && (
        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedProfile(null);
          }}
          onConfirm={handleConfirmAction}
          action={modalAction}
          title={
            modalAction === "approve" ? "Approve Profile" : "Reject Profile"
          }
          message={
            modalAction === "approve"
              ? `Are you sure you want to approve the profile for ${selectedProfile.personalInfo.fullName}? They will be able to apply for services.`
              : `Are you sure you want to reject the profile for ${selectedProfile.personalInfo.fullName}?`
          }
          requireNotes={modalAction === "reject"}
        />
      )}

      {/* Profile Details Modal */}
      {showDetailsModal && selectedProfile && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Profile Details
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedProfile(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">👤</span>
                  </div>
                  Personal Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium text-gray-900">
                        {selectedProfile.personalInfo.fullName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">
                        {selectedProfile.personalInfo.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Experience</p>
                      <p className="font-medium text-gray-900">
                        {selectedProfile.personalInfo.experience} years
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <ProfileStatusBadge status={selectedProfile.status} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Bio</p>
                    <p className="text-gray-700">
                      {selectedProfile.personalInfo.bio}
                    </p>
                  </div>
                  {selectedProfile.personalInfo.qualifications &&
                    selectedProfile.personalInfo.qualifications.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Qualifications
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedProfile.personalInfo.qualifications.map(
                            (qual, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded"
                              >
                                {qual}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">💼</span>
                  </div>
                  Professional Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-medium text-gray-900">
                        {selectedProfile.professionalInfo.category}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Hourly Rate</p>
                      <p className="font-medium text-gray-900">
                        ${selectedProfile.professionalInfo.hourlyRate}/hour
                      </p>
                    </div>
                    {selectedProfile.professionalInfo.title && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Title</p>
                        <p className="font-medium text-gray-900">
                          {selectedProfile.professionalInfo.title}
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedProfile.professionalInfo.specialties &&
                    selectedProfile.professionalInfo.specialties.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Specialties
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedProfile.professionalInfo.specialties.map(
                            (spec, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                              >
                                {spec}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Actions */}
              {selectedProfile.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleApprove(selectedProfile);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleReject(selectedProfile);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsultantProfilesPage;
