// src/services/course.service.ts
import { api } from '../lib/fetcher';

export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  instructorId: string;
  instructorName: string;
  instructorBio?: string;
  instructorAvatar?: string;
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
  status: 'draft' | 'pending' | 'approved' | 'published' | 'archived';
  objectives: string[];
  prerequisites: string[];
  targetAudience: string[];
  difficultyScore: number;
  timeCommitment: string;
  certificateAvailable: boolean;
  rating?: number;
  ratingCount?: number;
  enrollmentCount?: number;
  completionCount?: number;
  averageRating?: number;
  isLaunched?: boolean;
  featured?: boolean;
  trending?: boolean;
  bestseller?: boolean;
  pricingOptions?: {
    monthly?: number;
    yearly?: number;
    lifetime?: number;
    custom?: { duration: string; price: number }[];
  };
  availabilitySchedule?: {
    startDate: Date;
    endDate?: Date;
    enrollmentDeadline?: Date;
    maxEnrollments?: number;
  };
  enrollmentType?: 'instant' | 'scheduled' | 'subscription' | 'manual';
}

export interface CourseInput {
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  subcategory?: string;
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
  tags: string[];
  pricingOptions?: {
    monthly?: number;
    yearly?: number;
    lifetime?: number;
    custom?: { duration: string; price: number }[];
  };
  availabilitySchedule?: {
    startDate: Date;
    endDate?: Date;
    enrollmentDeadline?: Date;
    maxEnrollments?: number;
  };
  enrollmentType?: 'instant' | 'scheduled' | 'subscription' | 'manual';
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt: Date;
  progress: number;
  completedAt?: Date;
  certificateIssued?: boolean;
  certificateId?: string;
  status: 'active' | 'completed' | 'cancelled' | 'suspended';
  lastAccessAt?: Date;
  timeSpent: number;
  lessonsCompleted: number;
  totalLessons: number;
  currentLesson?: string;
  completionRate: number;
  accessEndsAt?: Date;
  autoRenew: boolean;
  nextBillingDate?: Date;
  refundRequested: boolean;
  refundProcessed: boolean;
}

export interface CourseProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  progress: number;
  timeSpent: number;
  watchTime?: number;
  lastPosition?: number;
  completed?: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseReview {
  id: string;
  courseId: string;
  studentId: string;
  studentName?: string;
  studentAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  pros?: string[];
  cons?: string[];
  helpful?: number;
  verified?: boolean;
  createdAt: Date;
  updatedAt: Date;
  instructorResponse?: string;
  instructorRespondedAt?: Date;
}

export interface CourseFilters {
  category?: string;
  subcategory?: string;
  level?: string | string[];
  language?: string;
  priceRange?: { min: number; max: number };
  durationRange?: { min: number; max: number };
  rating?: number;
  tags?: string[];
  instructor?: string;
  search?: string;
  sort?: 'newest' | 'oldest' | 'rating-high' | 'rating-low' | 'price-low' | 'price-high' | 'popular';
  page?: number;
  limit?: number;
}

export interface CourseSearchResult {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface InstructorStats {
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  totalCompletions: number;
  totalRevenue: number;
  averageRating: number;
}

class CourseService {
  // No need for getAuthHeaders since we use api instance with interceptors

  /**
   * Search courses with filters
   */
  async searchCourses(filters: CourseFilters = {}): Promise<CourseSearchResult> {
    try {
      // Build query string manually to avoid URLSearchParams issues
      const queryParts: string[] = [];
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
            queryParts.push(`${key}Min=${value.min}`);
            queryParts.push(`${key}Max=${value.max}`);
          } else if (key === 'tags') {
            queryParts.push(`${key}=${(value as string[]).join(',')}`);
          } else {
            queryParts.push(`${key}=${value.toString()}`);
          }
        }
      });
      const queryString = queryParts.join('&');

      const response = await api.get(`/courses/public?${queryString}`);

      return response.data;
    } catch (error: any) {
      console.error('Error searching courses:', error);
      throw new Error(error.response?.data?.error || 'Failed to search courses');
    }
  }

  /**
   * Get course by ID
   */
  async getCourseById(courseId: string): Promise<Course> {
    try {
      const response = await api.get(`/courses/${courseId}`);

      return response.data.course;
    } catch (error: any) {
      console.error('Error fetching course:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch course');
    }
  }

  /**
   * Get course by slug
   */
  async getCourseBySlug(slug: string): Promise<Course> {
    try {
      const response = await api.get(`/courses/slug/${slug}`);

      return response.data.course;
    } catch (error: any) {
      console.error('Error fetching course by slug:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch course');
    }
  }

  /**
   * Get featured courses
   */
  async getFeaturedCourses(limit: number = 10): Promise<{ courses: Course[] }> {
    try {
      const response = await api.get(`/courses/featured?limit=${limit}`);

      return response.data;
    } catch (error: any) {
      console.error('Error fetching featured courses:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch featured courses');
    }
  }

  /**
   * Get trending courses
   */
  async getTrendingCourses(limit: number = 10): Promise<{ courses: Course[] }> {
    try {
      const response = await api.get(`/courses/trending?limit=${limit}`);

      return response.data;
    } catch (error: any) {
      console.error('Error fetching trending courses:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch trending courses');
    }
  }

  /**
   * Get bestseller courses
   */
  async getBestsellerCourses(limit: number = 10): Promise<{ courses: Course[] }> {
    try {
      const response = await api.get(`/courses/bestseller?limit=${limit}`);

      return response.data;
    } catch (error: any) {
      console.error('Error fetching bestseller courses:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch bestseller courses');
    }
  }

  /**
   * Create a new course (Consultant only)
   */
  async createCourse(courseData: CourseInput): Promise<Course> {
    try {
      const response = await api.post('/courses/', courseData, { timeout: 10000 });

      return response.data.course;
    } catch (error: any) {
      console.error('Error creating course:', error);
      throw new Error(error.response?.data?.error || 'Failed to create course');
    }
  }

  /**
   * Update course (Consultant only)
   */
  async updateCourse(courseId: string, updates: Partial<CourseInput>): Promise<Course> {
    try {
      const response = await api.put(`/courses/${courseId}`, updates);

      return response.data.course;
    } catch (error: any) {
      console.error('Error updating course:', error);
      throw new Error(error.response?.data?.error || 'Failed to update course');
    }
  }

  /**
   * Delete course (Consultant only)
   */
  async deleteCourse(courseId: string): Promise<void> {
    try {
      await api.delete(`/courses/${courseId}`);
    } catch (error: any) {
      console.error('Error deleting course:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete course');
    }
  }

  /**
   * Get instructor's courses (Consultant only)
   */
  async getMyCourses(filters: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ courses: Course[]; total: number }> {
    try {
      // Build query string manually
      const queryParts: string[] = [];
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParts.push(`${key}=${value.toString()}`);
        }
      });
      const queryString = queryParts.join('&');

      const response = await api.get(`/courses/instructor/my?${queryString}`, { timeout: 30000 });

      return response.data;
    } catch (error: any) {
      console.error('Error fetching my courses:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch courses');
    }
  }

  /**
   * Submit course for approval (Consultant only)
   */
  async submitForApproval(courseId: string): Promise<Course> {
    try {
      const response = await api.post(`/courses/${courseId}/submit-for-approval`, {});

      return response.data.course;
    } catch (error: any) {
      console.error('Error submitting course for approval:', error);
      throw new Error(error.response?.data?.error || 'Failed to submit course');
    }
  }

  /**
   * Enroll in course
   */
  async enrollInCourse(courseId: string, paymentDetails?: {
    paymentId?: string;
    subscriptionId?: string;
  }): Promise<CourseEnrollment> {
    try {
      const response = await api.post(`/courses/${courseId}/enroll`, paymentDetails || {});

      return response.data.enrollment;
    } catch (error: any) {
      console.error('Error enrolling in course:', error);
      throw new Error(error.response?.data?.error || 'Failed to enroll in course');
    }
  }

  /**
   * Get student's enrollments
   */
  async getMyEnrollments(filters: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ enrollments: CourseEnrollment[]; total: number }> {
    try {
      // Build query string manually
      const queryParts: string[] = [];
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParts.push(`${key}=${value.toString()}`);
        }
      });
      const queryString = queryParts.join('&');

      const response = await api.get(`/courses/enrollments/my?${queryString}`);

      return response.data;
    } catch (error: any) {
      console.error('Error fetching enrollments:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch enrollments');
    }
  }

  /**
   * Get course enrollments (Instructor only)
   */
  async getCourseEnrollments(courseId: string, filters: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ enrollments: CourseEnrollment[]; total: number }> {
    try {
      // Build query string manually
      const queryParts: string[] = [];
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParts.push(`${key}=${value.toString()}`);
        }
      });
      const queryString = queryParts.join('&');

      const response = await api.get(`/courses/${courseId}/enrollments?${queryString}`);

      return response.data;
    } catch (error: any) {
      console.error('Error fetching course enrollments:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch enrollments');
    }
  }

  /**
   * Update lesson progress
   */
  async updateLessonProgress(
    enrollmentId: string,
    lessonId: string,
    progressData: {
      progress: number;
      timeSpent: number;
      watchTime?: number;
      lastPosition?: number;
      completed?: boolean;
    }
  ): Promise<CourseProgress> {
    try {
      const response = await api.put(`/courses/progress/${enrollmentId}/${lessonId}`, progressData);

      return response.data.progress;
    } catch (error: any) {
      console.error('Error updating lesson progress:', error);
      throw new Error(error.response?.data?.error || 'Failed to update progress');
    }
  }

  /**
   * Add course review
   */
  async addCourseReview(courseId: string, reviewData: {
    rating: number;
    title?: string;
    comment: string;
    pros?: string[];
    cons?: string[];
  }): Promise<CourseReview> {
    try {
      const response = await api.post(`/courses/${courseId}/reviews`, reviewData);

      return response.data.review;
    } catch (error: any) {
      console.error('Error adding course review:', error);
      throw new Error(error.response?.data?.error || 'Failed to add review');
    }
  }

  /**
   * Get course reviews
   */
  async getCourseReviews(courseId: string, filters: {
    rating?: number;
    page?: number;
    limit?: number;
    sort?: 'newest' | 'oldest' | 'rating-high' | 'rating-low' | 'helpful';
  } = {}): Promise<{ reviews: CourseReview[]; total: number }> {
    try {
      // Build query string manually
      const queryParts: string[] = [];
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParts.push(`${key}=${value.toString()}`);
        }
      });
      const queryString = queryParts.join('&');

      const response = await api.get(`/courses/${courseId}/reviews?${queryString}`);

      return response.data;
    } catch (error: any) {
      console.error('Error fetching course reviews:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch reviews');
    }
  }

  /**
   * Get instructor statistics (Consultant only)
   */
  async getInstructorStats(): Promise<InstructorStats> {
    try {
      const response = await api.get('/courses/instructor/stats');

      return response.data.stats;
    } catch (error: any) {
      console.error('Error fetching instructor stats:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch stats');
    }
  }

  /**
   * Get pending courses (Admin only)
   */
  async getPendingCourses(): Promise<{ courses: Course[] }> {
    try {
      const response = await api.get('/courses/admin/pending');

      return response.data;
    } catch (error: any) {
      console.error('Error fetching pending courses:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch pending courses');
    }
  }

  /**
   * Approve course (Admin only)
   */
  async approveCourse(courseId: string): Promise<Course> {
    try {
      const response = await api.post(`/courses/${courseId}/approve`, {});

      return response.data.course;
    } catch (error: any) {
      console.error('Error approving course:', error);
      throw new Error(error.response?.data?.error || 'Failed to approve course');
    }
  }

  /**
   * Reject course (Admin only)
   */
  async rejectCourse(courseId: string, reason: string): Promise<Course> {
    try {
      const response = await api.post(`/courses/${courseId}/reject`, { reason });

      return response.data.course;
    } catch (error: any) {
      console.error('Error rejecting course:', error);
      throw new Error(error.response?.data?.error || 'Failed to reject course');
    }
  }

  // NEW: Enhanced course purchase and management methods

  /**
   * Purchase a course with specific pricing option
   */
  async purchaseCourse(
    courseId: string,
    paymentId: string,
    pricingOption: 'monthly' | 'yearly' | 'lifetime' | 'custom',
    customDuration?: string
  ): Promise<any> {
    try {
      const response = await api.post('/courses/purchase', {
        courseId,
        pricingOption,
        customDuration,
        paymentId,
      });

      return response.data.purchase;
    } catch (error: any) {
      console.error('Error purchasing course:', error);
      throw new Error(error.message || 'Failed to purchase course');
    }
  }

  /**
   * Check if student has access to a course
   */
  async checkCourseAccess(courseId: string): Promise<any> {
    try {
      const response = await api.get(`/courses/${courseId}/access`);

      return response.data;
    } catch (error: any) {
      console.error('Error checking course access:', error);
      throw new Error(error.message || 'Failed to check access');
    }
  }

  /**
   * Launch a course
   */
  async launchCourse(courseId: string): Promise<Course> {
    try {
      const response = await api.post(`/courses/${courseId}/launch`);

      return response.data.course;
    } catch (error: any) {
      console.error('Error launching course:', error);
      throw new Error(error.message || 'Failed to launch course');
    }
  }

  /**
   * Issue certificate for course completion
   */
  async issueCertificate(courseId: string, enrollmentId: string): Promise<any> {
    try {
      const response = await api.post('/courses/issue-certificate', {
        enrollmentId,
        courseId,
      });

      return response.data.certificate;
    } catch (error: any) {
      console.error('Error issuing certificate:', error);
      throw new Error(error.message || 'Failed to issue certificate');
    }
  }

  /**
   * Get student's purchase history
   */
  async getStudentPurchases(): Promise<any> {
    try {
      const response = await api.get('/courses/purchases/my');

      return response.data;
    } catch (error: any) {
      console.error('Error fetching purchase history:', error);
      throw new Error(error.message || 'Failed to fetch purchase history');
    }
  }

  /**
   * Get student's certificates
   */
  async getStudentCertificates(): Promise<any> {
    try {
      const response = await api.get('/courses/certificates/my');

      return response.data;
    } catch (error: any) {
      console.error('Error fetching certificates:', error);
      throw new Error(error.message || 'Failed to fetch certificates');
    }
  }

  /**
   * Verify certificate
   */
  async verifyCertificate(verificationCode: string): Promise<any> {
    try {
      const response = await api.get(`/courses/certificates/verify/${verificationCode}`);

      return response.data;
    } catch (error: any) {
      console.error('Error verifying certificate:', error);
      throw new Error(error.message || 'Failed to verify certificate');
    }
  }
}

export const courseService = new CourseService();
