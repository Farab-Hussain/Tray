import { Timestamp } from "firebase-admin/firestore";

// Consultant Application - for service application requests
export interface ConsultantApplication {
  id: string;
  consultantId: string;
  consultantName?: string; // Populated when fetching applications
  type: "existing" | "new" | "update";
  serviceId?: string; // only for existing service type
  customService?: {
    title: string;
    description: string;
    duration?: number;
    price: number;
    imageUrl?: string;
    imagePublicId?: string;
    category?: string;
    accessType: 'one-time' | 'weekly' | 'monthly' | 'yearly' | 'lifetime';
    pricing?: {
      weekly?: number;
      monthly?: number;
      yearly?: number;
      lifetime?: number;
    };
  };
  status: "pending" | "approved" | "rejected";
  submittedAt: Timestamp;
  reviewedAt: Timestamp | null;
  reviewNotes?: string; // Admin notes for approval/rejection
}

// Type for creating consultant applications
export interface ConsultantApplicationInput {
  consultantId: string;
  type: "existing" | "new" | "update";
  serviceId?: string;
  customService?: {
    title: string;
    description: string;
    duration?: number;
    price: number;
    imageUrl?: string;
    imagePublicId?: string;
    category?: string;
    accessType: 'one-time' | 'weekly' | 'monthly' | 'yearly' | 'lifetime';
    pricing?: {
      weekly?: number;
      monthly?: number;
      yearly?: number;
      lifetime?: number;
    };
  };
}
