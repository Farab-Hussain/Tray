import { Timestamp } from "firebase-admin/firestore";

/**
 * Converts a Firestore Timestamp to an ISO string
 */
export const timestampToISO = (timestamp: Timestamp | undefined | null): string | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  // Handle if it's already a Date or has toDate method
  if (typeof (timestamp as any).toDate === 'function') {
    return (timestamp as any).toDate().toISOString();
  }
  return undefined;
};

/**
 * Serializes a job application object, converting Timestamps to ISO strings
 */
export const serializeApplication = (application: any): any => {
  if (!application) return application;
  
  return {
    ...application,
    // Explicitly preserve status field
    status: application.status || 'pending',
    appliedAt: timestampToISO(application.appliedAt) || application.appliedAt,
    reviewedAt: timestampToISO(application.reviewedAt) || application.reviewedAt,
  };
};

/**
 * Serializes an array of job applications
 */
export const serializeApplications = (applications: any[]): any[] => {
  return applications.map(serializeApplication);
};

