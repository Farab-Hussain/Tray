import { Timestamp } from "firebase-admin/firestore";

// New availability structure for specific date/time slots
export interface AvailabilitySlot {
  date: string; // YYYY-MM-DD format
  timeSlots: string[]; // Array of time slots like ["09:00 AM", "10:00 AM", "02:00 PM"]
}

export interface ConsultantProfile {
  uid: string;
  personalInfo: {
    email: string;
    fullName: string;
    bio: string;
    profileImage?: string | null;
    profileImagePublicId?: string | null;
    experience: number;
    qualifications?: string[];
  };
  professionalInfo: {
    title?: string;
    category: string;
    customCategory?: string;
    specialties?: string[];
    hourlyRate?: number;
    availability?: Record<string, string[]>; // Legacy format: monday: ["10:00", "12:00"]
    availabilitySlots?: AvailabilitySlot[]; // New format: specific dates with time slots
  };
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


export interface ConsultantProfileInput {
  uid: string;
  personalInfo: {
    email: string;
    fullName: string;
    bio: string;
    profileImage?: string | null;
    profileImagePublicId?: string | null;
    experience: number;
    qualifications?: string[];
  };
  professionalInfo: {
    title?: string;
    category: string;
    customCategory?: string;
    specialties?: string[];
    hourlyRate?: number;
    availability?: Record<string, string[]>;
    availabilitySlots?: AvailabilitySlot[];
  };
}
