import { Timestamp } from "firebase-admin/firestore";

// Job posting data model
export interface Job {
  id: string;
  postedBy: string; // User ID (hiring manager/employer with admin rules)
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: "full-time" | "part-time" | "contract" | "internship";
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  requiredSkills: string[]; // Array of skill names - e.g., ["JavaScript", "React", "Node.js", "TypeScript"]
  experienceRequired?: number; // Years
  educationRequired?: string;
  status: "active" | "closed" | "draft";
  expiryDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  applicationCount?: number; // Cached count
  goldApplicantsCount?: number; // Count of Gold-rated applicants
  silverApplicantsCount?: number; // Count of Silver-rated applicants;
  // NEW: Fair-chance hiring indicators
  fairChanceHiring?: {
    banTheBox: boolean; // Don't ask about criminal history initially
    felonyFriendly: boolean; // Open to candidates with felony records
    caseByCaseReview: boolean; // Review criminal history case by case
    noBackgroundCheck: boolean; // No background check required
    secondChancePolicy: boolean; // Has second-chance hiring policy
  };
  // NEW: Background check requirements
  backgroundCheckRequired?: boolean;
  backgroundCheckType?: 'basic' | 'standard' | 'enhanced' | 'none';
}

// Input type for creating/updating jobs
export interface JobInput {
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: "full-time" | "part-time" | "contract" | "internship";
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  requiredSkills: string[];
  experienceRequired?: number;
  educationRequired?: string;
  status?: "active" | "closed" | "draft";
  expiryDate?: Timestamp;
  // NEW: Fair-chance hiring indicators
  fairChanceHiring?: {
    banTheBox: boolean;
    felonyFriendly: boolean;
    caseByCaseReview: boolean;
    noBackgroundCheck: boolean;
    secondChancePolicy: boolean;
  };
  // NEW: Background check requirements
  backgroundCheckRequired?: boolean;
  backgroundCheckType?: 'basic' | 'standard' | 'enhanced' | 'none';
}

// Lightweight job data for cards (optimized for frontend)
export interface JobCard {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  requiredSkills: string[];
  applicationCount?: number;
  createdAt: Timestamp;
  matchScore?: number; // Optional: match score for current user
  matchRating?: "gold" | "silver" | "bronze" | "basic"; // Optional: match rating for current user
  // NEW: Fair-chance indicators for job cards
  fairChanceIndicators?: {
    banTheBox: boolean;
    felonyFriendly: boolean;
    secondChancePolicy: boolean;
  };
}

