import { Timestamp } from "firebase-admin/firestore";

// Consultant Application - for service application requests
export interface ConsultantApplication {
  id: string;
  consultantId: string;
  consultantName?: string; // Populated when fetching applications
  type: "existing" | "new";
  serviceId?: string; // only for existing service type
  customService?: {
    title: string;
    description: string;
    duration: number; // in minutes
    price: number;
    imageUrl?: string;
    imagePublicId?: string;
  };
  status: "pending" | "approved" | "rejected";
  submittedAt: Timestamp;
  reviewedAt: Timestamp | null;
  reviewNotes?: string; // Admin notes for approval/rejection
}

// Type for creating consultant applications
export interface ConsultantApplicationInput {
  consultantId: string;
  type: "existing" | "new";
  serviceId?: string;
  customService?: {
    title: string;
    description: string;
    duration: number;
    price: number;
    imageUrl?: string;
    imagePublicId?: string;
  };
}
