import { Timestamp } from "firebase-admin/firestore";

// Resume data model
export interface Resume {
  id: string;
  userId: string; // Student user ID
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    profileImage?: string;
  };
  skills: string[]; // Array of skill names - students list skills here
  experience: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduationYear?: number;
    gpa?: number;
  }>;
  backgroundInformation?: string; // Additional background info
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  resumeFileUrl?: string; // PDF/DOC file URL - students attach resume
  resumeFilePublicId?: string; // Cloudinary public ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Input type for creating/updating resumes
export interface ResumeInput {
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    profileImage?: string;
  };
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduationYear?: number;
    gpa?: number;
  }>;
  backgroundInformation?: string;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  resumeFileUrl?: string;
  resumeFilePublicId?: string;
}

