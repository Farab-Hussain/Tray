// src/models/review.model.ts
import { Timestamp } from "firebase-admin/firestore";

export interface Review {
  id: string;
  studentId: string;
  consultantId: string;
  bookingId: string;
  rating: number; // 1-5
  comment: string;
  recommend: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface ReviewWithDetails extends Review {
  studentName?: string;
  studentProfileImage?: string;
  consultantName?: string;
}

