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
  if (!application) {
    console.warn('[serializeApplication] Application is null or undefined');
    return null;
  }
  
  try {
    const serialized: any = {
      // Core fields
      id: application.id || '',
      jobId: application.jobId || '',
      userId: application.userId || '',
      resumeId: application.resumeId || '',
      coverLetter: application.coverLetter || undefined,
      // Explicitly preserve status field
      status: application.status || 'pending',
      // Timestamp conversions
      appliedAt: timestampToISO(application.appliedAt) || application.appliedAt,
      reviewedAt: timestampToISO(application.reviewedAt) || application.reviewedAt,
      // Match-related fields with defaults
      matchScore: typeof application.matchScore === 'number' ? application.matchScore : 0,
      matchRating: application.matchRating || 'basic',
      matchedSkills: Array.isArray(application.matchedSkills) ? application.matchedSkills : [],
      missingSkills: Array.isArray(application.missingSkills) ? application.missingSkills : [],
      // Optional fields
      reviewNotes: application.reviewNotes || undefined,
      complianceEvaluation: application.complianceEvaluation || undefined,
    };
    
    // Remove undefined fields to keep response clean
    Object.keys(serialized).forEach(key => {
      if (serialized[key] === undefined) {
        delete serialized[key];
      }
    });
    
    return serialized;
  } catch (error: any) {
    console.error('[serializeApplication] Error serializing application:', error);
    console.error('[serializeApplication] Application data:', application);
    // Return a minimal safe object if serialization fails
    return {
      id: application.id || '',
      jobId: application.jobId || '',
      userId: application.userId || '',
      resumeId: application.resumeId || '',
      status: application.status || 'pending',
      matchScore: 0,
      matchRating: 'basic',
      matchedSkills: [],
      missingSkills: [],
    };
  }
};

/**
 * Serializes an array of job applications
 */
export const serializeApplications = (applications: any[]): any[] => {
  return applications.map(serializeApplication);
};
