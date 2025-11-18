import { Timestamp } from "firebase-admin/firestore";

// Job application data model
export interface JobApplication {
  id: string;
  jobId: string;
  userId: string; // Student user ID
  resumeId: string;
  coverLetter?: string;
  matchScore: number; // Number of matching skills (e.g., 3 out of 4)
  matchRating: "gold" | "silver" | "bronze" | "basic"; // CRITICAL: Used for sorting
  matchedSkills: string[]; // Which skills matched
  missingSkills: string[]; // Which skills are missing
  status: "pending" | "reviewed" | "shortlisted" | "rejected" | "hired";
  appliedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewNotes?: string; // Notes from hiring manager
  // For sorting: Applications are sorted by matchRating (gold first, then silver, etc.)
}

// Input type for creating job applications
export interface JobApplicationInput {
  jobId: string;
  resumeId: string;
  coverLetter?: string;
}

// Application with populated user and resume data (for hiring manager view)
export interface JobApplicationWithDetails extends JobApplication {
  user?: {
    uid: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  resume?: {
    id: string;
    skills: string[];
    experience: Array<any>;
    education: Array<any>;
    resumeFileUrl?: string;
  };
  job?: {
    id: string;
    title: string;
    company: string;
    requiredSkills: string[];
  };
}

