import { Timestamp } from "firebase-admin/firestore";

// Full consultant data (for database storage and detailed views)
export interface Consultant {
  uid: string;
  name: string;
  email: string;
  category: string;
  bio?: string;
  experience?: number;
  rating?: number;
  totalReviews?: number;
  hourlyRate?: number;
  profileImage?: string | null;
  availability?: Record<string, string[]>; // { monday: ["09:00", "10:00"], ... }
  
  // Contact methods for the frontend card
  contactMethods?: {
    chat?: boolean;     // Enable chat/messaging
    call?: boolean;     // Enable phone calls
    video?: boolean;    // Enable video calls
  };
  
  // Additional fields for better frontend support
  title?: string;       // Professional title (e.g., "Senior Career Consultant")
  specialties?: string[]; // Array of specialties
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

// Lightweight consultant data for cards (optimized for frontend)
export interface ConsultantCard {
  uid: string;
  name: string;
  category: string;
  rating?: number;
  totalReviews?: number;
  profileImage?: string | null;
}
