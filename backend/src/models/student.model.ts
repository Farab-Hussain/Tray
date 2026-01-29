import { Timestamp } from "firebase-admin/firestore";

// Enums for type safety
export type TransportationStatus = 'own-car' | 'public-transport' | 'none';
export type WorkType = 'full-time' | 'part-time' | 'contract' | 'internship';
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type ShiftTime = 'morning' | 'evening' | 'night';

// Main student interface
export interface Student {
  uid: string;
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    profileImage?: string;
  };
  academicInfo: {
    education: Array<{
      degree: string;
      institution: string;
      graduationYear?: number;
      gpa?: number;
    }>;
    certifications?: Array<{
      name: string;
      issuer: string;
      date: string;
    }>;
  };
  workPreferences: {
    workRestrictions?: string[];
    transportationStatus?: TransportationStatus;
    shiftFlexibility?: {
      days: DayOfWeek[];
      shifts: ShiftTime[];
    };
    preferredWorkTypes?: WorkType[];
    jobsToAvoid?: string[];
  };
  authorization: {
    workAuthorized: boolean;
    authorizationDocuments?: string[];
    backgroundCheckRequired?: boolean;
  };
  careerGoals: {
    careerInterests?: string[];
    targetIndustries?: string[];
    salaryExpectation?: {
      min: number;
      max: number;
    };
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
  externalProfiles?: {
    linkedIn?: string;
    portfolio?: string;
    github?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Input type for creating students
export interface StudentInput {
  uid: string;
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    profileImage?: string;
  };
  academicInfo: {
    education: Array<{
      degree: string;
      institution: string;
      graduationYear?: number;
      gpa?: number;
    }>;
    certifications?: Array<{
      name: string;
      issuer: string;
      date: string;
    }>;
  };
  workPreferences?: {
    workRestrictions?: string[];
    transportationStatus?: TransportationStatus;
    shiftFlexibility?: {
      days: DayOfWeek[];
      shifts: ShiftTime[];
    };
    preferredWorkTypes?: WorkType[];
    jobsToAvoid?: string[];
  };
  authorization?: {
    workAuthorized: boolean;
    authorizationDocuments?: string[];
    backgroundCheckRequired?: boolean;
  };
  careerGoals?: {
    careerInterests?: string[];
    targetIndustries?: string[];
    salaryExpectation?: {
      min: number;
      max: number;
    };
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
  externalProfiles?: {
    linkedIn?: string;
    portfolio?: string;
    github?: string;
  };
}

// Migration helper type
export interface ResumeToStudentMigration {
  studentId: string;
  resumeData: any; // Resume interface
  studentData: StudentInput;
  migrationDate: Timestamp;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}