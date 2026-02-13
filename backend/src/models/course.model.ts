// src/models/course.model.ts
import { Timestamp } from "firebase-admin/firestore";

export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription: string; // For course cards and previews
  instructorId: string; // Consultant who created the course
  instructorName: string;
  instructorBio?: string;
  instructorAvatar?: string;
  category: string;
  subcategory?: string;
  tags: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  price: number; // In cents (legacy, kept for compatibility)
  currency: string; // e.g., 'USD'
  isFree: boolean;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  duration: number; // Total duration in minutes
  durationText: string; // Human readable (e.g., "3h 45min")
  lessonsCount: number;
  status: 'draft' | 'pending' | 'approved' | 'published' | 'archived';
  approvedBy?: string; // Admin who approved
  approvedAt?: Timestamp;
  rejectionReason?: string;
  publishedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Statistics
  enrollmentCount: number;
  completionCount: number;
  averageRating: number;
  ratingCount: number;
  reviewCount: number;
  
  // Course structure
  objectives: string[]; // Learning objectives
  prerequisites: string[]; // Required knowledge/skills
  targetAudience: string[]; // Who this course is for
  
  // Metadata
  difficultyScore: number; // 1-10 scale
  timeCommitment: string; // e.g., "5 hours per week"
  certificateAvailable: boolean;
  certificateTemplate?: string;
  
  // SEO and Marketing
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  featured: boolean;
  trending: boolean;
  bestseller: boolean;
  
  // Launch and availability management
  accessDuration: {
    type: 'lifetime' | 'custom'; // How long access lasts
    days?: number; // Number of days if custom
  };
  isLaunched: boolean; // Whether course is officially launched
  launchDate?: Timestamp; // When course was launched
  
  // Enhanced pricing and enrollment
  pricingOptions?: {
    monthly?: number;
    yearly?: number;
    lifetime?: number;
    custom?: {
      duration: string;
      price: number;
    }[];
  };
  enrollmentType?: 'instant' | 'scheduled' | 'subscription';
  availabilitySchedule?: {
    startDate: Timestamp;
    endDate?: Timestamp;
    enrollmentDeadline?: Timestamp;
    maxEnrollments?: number;
    currentEnrollments?: number;
  };
}

export interface CourseInput {
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  subcategory?: string;
  tags: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  price: number;
  currency: string;
  isFree: boolean;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  duration: number;
  durationText: string;
  lessonsCount: number;
  objectives: string[];
  prerequisites: string[];
  targetAudience: string[];
  difficultyScore: number;
  timeCommitment: string;
  certificateAvailable: boolean;
  certificateTemplate?: string;
  pricingOptions?: {
    monthly?: number;
    yearly?: number;
    lifetime?: number;
    custom?: {
      duration: string;
      price: number;
    }[];
  };
  enrollmentType?: 'instant' | 'scheduled' | 'subscription';
  accessDuration?: {
    type: 'lifetime' | 'custom';
    days?: number;
  };
  isLaunched?: boolean;
  launchDate?: Timestamp;
  instructorId?: string;
  instructorName?: string;
  instructorBio?: string;
  instructorAvatar?: string;
  featured?: boolean;
  trending?: boolean;
  bestseller?: boolean;
  approvedBy?: string;
  approvedAt?: Timestamp;
  rejectionReason?: string;
  publishedAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  enrollmentCount?: number;
  completionCount?: number;
  averageRating?: number;
  ratingCount?: number;
  reviewCount?: number;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  availabilitySchedule?: {
    startDate: Timestamp;
    endDate?: Timestamp;
    enrollmentDeadline?: Timestamp;
    maxEnrollments?: number;
    currentEnrollments?: number;
  };
}

export interface CourseLesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  duration: number; // In minutes
  durationText: string;
  type: 'video' | 'text' | 'quiz' | 'assignment' | 'resource';
  contentUrl?: string; // For video lessons
  contentData?: {
    text?: string; // For text lessons
    questions?: QuizQuestion[]; // For quiz lessons
    instructions?: string; // For assignments
    resourceUrl?: string; // For downloadable resources
    resourceType?: string; // PDF, DOC, etc.
  };
  isPreview: boolean; // Free preview lesson
  isRequired: boolean; // Must complete for course certificate
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Statistics
  completionCount: number;
  averageWatchTime?: number; // For video lessons in minutes
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'text';
  options?: string[]; // For multiple choice
  correctAnswer: string | boolean;
  explanation?: string;
  points: number;
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt: Timestamp;
  completedAt?: Timestamp;
  lastAccessedAt?: Timestamp;
  progress: number; // 0-100 percentage
  status: 'active' | 'completed' | 'dropped' | 'suspended';
  certificateIssued: boolean;
  certificateUrl?: string;
  paymentId?: string; // Stripe payment ID
  subscriptionId?: string; // If accessed via subscription
  refundRequested: boolean;
  refundProcessed: boolean;
  refundAmount?: number; // In cents
  refundReason?: string;
  refundProcessedAt?: Timestamp;
  
  // Learning analytics
  totalTimeSpent: number; // In minutes
  lessonsCompleted: number;
  quizzesPassed: number;
  averageQuizScore: number;
  lastLessonCompleted?: string;
  currentLesson?: string; // Resume from this lesson
  
  // Engagement metrics
  notesCount: number;
  bookmarksCount: number;
  discussionPostsCount: number;
}

export interface CourseProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  studentId: string;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  progress: number; // 0-100 for this lesson
  timeSpent: number; // In minutes
  watchTime?: number; // For video lessons
  lastPosition?: number; // For video lessons (seconds)
  notes?: string; // Student notes
  bookmarked: boolean;
  quizAttempts: QuizAttempt[];
  assignmentSubmissions: AssignmentSubmission[];
}

export interface QuizAttempt {
  id: string;
  quizQuestionId: string;
  studentAnswer: string | boolean;
  isCorrect: boolean;
  score: number;
  attemptedAt: Timestamp;
  timeSpent: number; // In seconds
}

export interface AssignmentSubmission {
  id: string;
  lessonId: string;
  studentId: string;
  submissionUrl?: string;
  submissionText?: string;
  submissionType: 'file' | 'text';
  submittedAt: Timestamp;
  graded: boolean;
  grade?: number;
  feedback?: string;
  gradedBy?: string; // Instructor ID
  gradedAt?: Timestamp;
}

export interface CourseReview {
  id: string;
  courseId: string;
  studentId: string;
  rating: number; // 1-5
  title?: string;
  comment: string;
  pros?: string[];
  cons?: string[];
  helpfulCount: number;
  verifiedPurchase: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  response?: string; // Instructor response
  respondedAt?: Timestamp;
  respondedBy?: string;
}

export interface CourseBookmark {
  id: string;
  courseId: string;
  lessonId: string;
  studentId: string;
  timestamp: number; // For video lessons
  notes?: string;
  createdAt: Timestamp;
}

export interface CourseNote {
  id: string;
  courseId: string;
  lessonId: string;
  studentId: string;
  content: string;
  timestamp?: number; // For video lessons
  isPrivate: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CourseCategory {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon?: string;
  color?: string;
  parentId?: string; // For nested categories
  order: number;
  isActive: boolean;
  courseCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Course filters and search
export interface CourseFilters {
  category?: string;
  subcategory?: string;
  level?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  duration?: {
    min: number;
    max: number;
  };
  rating?: number; // Minimum rating
  tags?: string[];
  language?: string;
  isFree?: boolean;
  hasCertificate?: boolean;
  instructorId?: string;
  featured?: boolean;
  trending?: boolean;
  bestseller?: boolean;
  search?: string; // Text search in title/description
  sort?: 'newest' | 'oldest' | 'price-low' | 'price-high' | 'rating' | 'popular' | 'trending';
  page?: number;
  limit?: number;
}

export interface CourseSearchResult {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  facets?: {
    categories: { name: string; count: number }[];
    levels: { name: string; count: number }[];
    priceRanges: { range: string; count: number }[];
    languages: { name: string; count: number }[];
  };
}

// NEW: Course purchase and subscription interfaces
export interface CoursePurchase {
  id: string;
  courseId: string;
  studentId: string;
  pricingOption: 'monthly' | 'yearly' | 'lifetime' | 'custom';
  customDuration?: string; // For custom pricing options
  pricePaid: number; // In cents
  currency: string;
  paymentId: string; // Stripe payment ID
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  purchasedAt: Timestamp;
  accessStartsAt: Timestamp; // When access begins
  accessEndsAt?: Timestamp; // When access ends (if not lifetime)
  isActive: boolean;
  autoRenew: boolean; // For subscriptions
  nextBillingDate?: Timestamp; // For subscriptions
  cancellationDate?: Timestamp; // When user cancelled
  refundRequested: boolean;
  refundProcessed: boolean;
  refundAmount?: number; // In cents
  refundReason?: string;
  refundProcessedAt?: Timestamp;
}

export interface CourseSubscription {
  id: string;
  courseId: string;
  studentId: string;
  pricingOption: 'monthly' | 'yearly';
  price: number; // In cents
  currency: string;
  stripeSubscriptionId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  createdAt: Timestamp;
  canceledAt?: Timestamp;
  endedAt?: Timestamp;
}

export interface CourseCertificate {
  id: string;
  courseId: string;
  studentId: string;
  enrollmentId: string;
  certificateUrl: string;
  issuedAt: Timestamp;
  verificationCode: string; // Unique code for verification
  templateId?: string;
  instructorSignature?: string;
  issuerName: string;
  issuerTitle: string;
  completionDate: Timestamp;
  grade?: string; // Optional grade/score
  isRevoked: boolean;
  revokedAt?: Timestamp;
  revokeReason?: string;
}
