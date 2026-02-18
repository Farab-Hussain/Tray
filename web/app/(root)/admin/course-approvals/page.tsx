'use client';

import React, { useCallback, useEffect, useState } from 'react';
import MobileHeader from '@/components/shared/MobileHeader';
import { courseAdminAPI } from '@/utils/api';
import { CheckCircle, Loader2, XCircle, BookOpen, Eye } from 'lucide-react';
import Image from 'next/image';

type FirestoreTimestamp =
  | { _seconds: number; _nanoseconds?: number }
  | { seconds: number; nanoseconds?: number }
  | string
  | number
  | Date;

type AdminCourse = {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  category: string;
  level: string;
  language?: string;
  price: number;
  currency: string;
  isFree: boolean;
  status: string;
  instructorName?: string;
  instructorId?: string;
  thumbnailUrl?: string;
  lessonsCount?: number;
  duration?: number;
  durationText?: string;
  objectives?: string[];
  prerequisites?: string[];
  targetAudience?: string[];
  tags?: string[];
  createdAt?: FirestoreTimestamp;
};

export default function AdminCourseApprovalsPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingCourseId, setProcessingCourseId] = useState<string | null>(null);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  const getApiErrorMessage = (error: unknown, fallback: string): string => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error
    ) {
      const response = (error as { response?: { data?: { error?: string } } }).response;
      if (response?.data?.error) {
        return response.data.error;
      }
    }
    return fallback;
  };

  const loadPendingCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const response = await courseAdminAPI.getPendingCourses();
      const pendingCourses = (response.data as { courses?: AdminCourse[] })?.courses || [];
      setCourses(pendingCourses);
    } catch (error: unknown) {
      console.error('Error loading pending courses:', error);
      setErrorMessage(getApiErrorMessage(error, 'Failed to load pending courses.'));
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingCourses();
  }, [loadPendingCourses]);

  const handleApprove = async (course: AdminCourse) => {
    try {
      setProcessingCourseId(course.id);
      await courseAdminAPI.approveCourse(course.id);
      setSuccessMessage(`"${course.title}" approved and published.`);
      await loadPendingCourses();
    } catch (error: unknown) {
      console.error('Approve course error:', error);
      setErrorMessage(getApiErrorMessage(error, 'Failed to approve course.'));
    } finally {
      setProcessingCourseId(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleReject = async (course: AdminCourse) => {
    const reason = window.prompt('Enter rejection reason (required):', 'Please update and resubmit.');
    if (!reason || !reason.trim()) return;

    try {
      setProcessingCourseId(course.id);
      await courseAdminAPI.rejectCourse(course.id, reason.trim());
      setSuccessMessage(`"${course.title}" rejected and moved back to draft.`);
      await loadPendingCourses();
    } catch (error: unknown) {
      console.error('Reject course error:', error);
      setErrorMessage(getApiErrorMessage(error, 'Failed to reject course.'));
    } finally {
      setProcessingCourseId(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const formatPrice = (course: AdminCourse) => {
    if (course.isFree || course.price === 0) return 'Free';
    return `${course.currency || 'USD'} ${course.price}`;
  };

  const parseTimestamp = (timestamp: FirestoreTimestamp | undefined): Date | null => {
    if (!timestamp) return null;

    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp === 'number') return new Date(timestamp);
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

  const getReadinessChecks = (course: AdminCourse) => {
    const checks = [
      { label: 'Clear title', pass: course.title.trim().length >= 5 },
      { label: 'Detailed description', pass: course.description.trim().length >= 20 },
      { label: 'Category and level set', pass: !!course.category && !!course.level },
      { label: 'At least one lesson', pass: (course.lessonsCount || 0) > 0 },
      { label: 'Learning objectives provided', pass: (course.objectives || []).length > 0 },
    ];
    return checks;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading pending courses...</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <MobileHeader title="Course Approvals" />

      <div className="hidden lg:block mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Approvals</h1>
        <p className="text-gray-600">Review and approve consultant courses submitted for publication</p>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 rounded-lg border border-green-200 bg-green-50 text-green-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mb-5 text-sm text-gray-600">
        Pending courses: <span className="font-semibold text-gray-900">{courses.length}</span>
      </div>

      {courses.length === 0 ? (
        <div className="p-8 rounded-xl border border-gray-200 bg-white text-center">
          <BookOpen className="w-8 h-8 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-700 font-medium">No pending course approvals</p>
          <p className="text-gray-500 text-sm mt-1">Submitted courses will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => {
            const isProcessing = processingCourseId === course.id;
            return (
              <div key={course.id} className="border border-gray-200 bg-white rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {course.shortDescription || course.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">
                        {course.category}
                      </span>
                      <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 capitalize">
                        {course.level}
                      </span>
                      <span className="px-2 py-1 rounded bg-green-100 text-green-700">
                        {formatPrice(course)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Instructor: {course.instructorName || course.instructorId || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted:{' '}
                      {parseTimestamp(course.createdAt)?.toLocaleString() || 'Unknown'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 w-40">
                    <button
                      disabled={isProcessing}
                      onClick={() =>
                        setExpandedCourseId(expandedCourseId === course.id ? null : course.id)
                      }
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      <Eye className="w-4 h-4" />
                      {expandedCourseId === course.id ? 'Hide' : 'View'}
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => handleApprove(course)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => handleReject(course)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>

                {expandedCourseId === course.id && (
                  <div className="mt-4 border-t border-gray-200 pt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Full Description</p>
                        <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-gray-500">Language</p>
                          <p className="text-gray-800 font-medium">{course.language || 'N/A'}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-gray-500">Lessons</p>
                          <p className="text-gray-800 font-medium">{course.lessonsCount || 0}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-gray-500">Duration</p>
                          <p className="text-gray-800 font-medium">
                            {course.durationText || `${course.duration || 0} mins`}
                          </p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-gray-500">Price Type</p>
                          <p className="text-gray-800 font-medium">{course.isFree ? 'Free' : 'Paid'}</p>
                        </div>
                      </div>

                      {course.thumbnailUrl && (
                        <div>
                          <p className="text-sm font-medium text-gray-800 mb-2">Thumbnail</p>
                          <Image
                            src={course.thumbnailUrl}
                            alt={`${course.title} thumbnail`}
                            width={640}
                            height={352}
                            unoptimized
                            className="w-full max-w-md h-44 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="rounded-lg border border-gray-200 p-3">
                          <p className="font-medium text-gray-800 mb-2">Objectives</p>
                          {(course.objectives || []).length > 0 ? (
                            <ul className="list-disc pl-5 text-gray-600 space-y-1">
                              {(course.objectives || []).map((item, index) => (
                                <li key={`${course.id}-objective-${index}`}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500">None provided</p>
                          )}
                        </div>
                        <div className="rounded-lg border border-gray-200 p-3">
                          <p className="font-medium text-gray-800 mb-2">Prerequisites</p>
                          {(course.prerequisites || []).length > 0 ? (
                            <ul className="list-disc pl-5 text-gray-600 space-y-1">
                              {(course.prerequisites || []).map((item, index) => (
                                <li key={`${course.id}-prerequisite-${index}`}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500">None provided</p>
                          )}
                        </div>
                        <div className="rounded-lg border border-gray-200 p-3">
                          <p className="font-medium text-gray-800 mb-2">Target Audience</p>
                          {(course.targetAudience || []).length > 0 ? (
                            <ul className="list-disc pl-5 text-gray-600 space-y-1">
                              {(course.targetAudience || []).map((item, index) => (
                                <li key={`${course.id}-audience-${index}`}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500">None provided</p>
                          )}
                        </div>
                      </div>

                      {(course.tags || []).length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-800 mb-2">Tags</p>
                          <div className="flex flex-wrap gap-2">
                            {(course.tags || []).map((tag, index) => (
                              <span
                                key={`${course.id}-tag-${index}`}
                                className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-gray-200 p-3 h-fit">
                      <p className="text-sm font-semibold text-gray-900 mb-3">Readiness Checklist</p>
                      <div className="space-y-2">
                        {getReadinessChecks(course).map((item) => (
                          <div key={`${course.id}-${item.label}`} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{item.label}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                item.pass
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {item.pass ? 'Pass' : 'Missing'}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        Approve only if quality, policy, and completeness are acceptable.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
