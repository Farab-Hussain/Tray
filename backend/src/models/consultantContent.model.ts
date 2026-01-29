// src/models/consultantContent.model.ts
import { Timestamp } from "firebase-admin/firestore";

export interface ConsultantContent {
  id: string;
  consultantId: string;
  title: string;
  description: string;
  contentType: 'video' | 'pdf' | 'article' | 'tip' | 'guide' | 'resource';
  contentUrl?: string; // For video/pdf files
  contentData?: {
    text?: string; // For articles/tips/guides
    duration?: number; // For videos in seconds
    fileSize?: number; // For PDFs in bytes
    pageCount?: number; // For PDFs
  };
  thumbnailUrl?: string;
  tags: string[];
  category: string;
  isFree: boolean;
  price?: number; // In cents (if not free)
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'published';
  approvedBy?: string; // Admin who approved
  approvedAt?: Timestamp;
  rejectionReason?: string;
  viewCount: number;
  downloadCount: number;
  likeCount: number;
  rating: number;
  ratingCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}

export interface ConsultantContentInput {
  title: string;
  description: string;
  contentType: 'video' | 'pdf' | 'article' | 'tip' | 'guide' | 'resource';
  contentUrl?: string;
  contentData?: {
    text?: string;
    duration?: number;
    fileSize?: number;
    pageCount?: number;
  };
  thumbnailUrl?: string;
  tags: string[];
  category: string;
  isFree: boolean;
  price?: number;
}

export interface ContentRating {
  id: string;
  contentId: string;
  userId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Timestamp;
}
