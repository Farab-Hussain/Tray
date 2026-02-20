// src/services/course.service.ts
import { api } from '../lib/fetcher';
import { logger } from '../utils/logger';

export interface CourseVideoMeta {
  id?: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  videoUrl: string;
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
  videos?: CourseVideoMeta[];
  slug: string;
  instructorId: string;
  instructorName: string;
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
}

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
  rejectionReason?: string;
  submittedBy?: string;
  submittedAt?: Date | string;
  approvedBy?: string;
  approvedAt?: Date | string;
  rejectedBy?: string;
  rejectedAt?: Date | string;
  publishedAt?: Date | string;
  objectives: string[];
  prerequisites: string[];
  targetAudience: string[];
  difficultyScore: number;
  timeCommitment: string;
  certificateAvailable: boolean;
  videos?: CourseVideoMeta[];
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
  videos?: CourseVideoMeta[];
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
  private inFlightRequests = new Map<string, Promise<any>>();
  private responseCache = new Map<string, { expiresAt: number; data: any }>();
  private readonly validStatuses = new Set(['draft', 'pending', 'approved', 'published', 'archived']);

  private toIsoDate(value: any): string | undefined {
    if (!value) return undefined;
    if (typeof value?.toDate === 'function') {
      const d = value.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString() : undefined;
    }
    if (typeof value?._seconds === 'number') {
      const ms = value._seconds * 1000 + Math.floor((value._nanoseconds || 0) / 1_000_000);
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
    }
    if (typeof value?.seconds === 'number') {
      const ms = value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1_000_000);
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
    }
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  private normalizeStatus(raw: any): Course['status'] {
    const status = String(raw || '').toLowerCase();
    return this.validStatuses.has(status) ? (status as Course['status']) : 'draft';
  }

  private normalizeCourse(course: any): Course {
    const createdAt = this.toIsoDate(course?.createdAt);
    const updatedAt = this.toIsoDate(course?.updatedAt);

    return {
      ...course,
      id: String(course?.id || ''),
      title: String(course?.title || ''),
      description: String(course?.description || ''),
      shortDescription: String(course?.shortDescription || course?.description || ''),
      instructorId: String(course?.instructorId || ''),
      instructorName: String(course?.instructorName || ''),
      category: String(course?.category || ''),
      level: (String(course?.level || 'beginner').toLowerCase() as Course['level']),
      language: String(course?.language || 'en'),
      tags: Array.isArray(course?.tags) ? course.tags : [],
      objectives: Array.isArray(course?.objectives) ? course.objectives : [],
      prerequisites: Array.isArray(course?.prerequisites) ? course.prerequisites : [],
      targetAudience: Array.isArray(course?.targetAudience) ? course.targetAudience : [],
      videos: Array.isArray(course?.videos) ? course.videos : [],
      status: this.normalizeStatus(course?.status),
      price: Number(course?.price || 0),
      isFree: Boolean(course?.isFree),
      currency: String(course?.currency || 'USD'),
      duration: Number(course?.duration || 0),
      durationText: String(course?.durationText || ''),
      lessonsCount: Number(course?.lessonsCount || 0),
      ratingCount: Number(course?.ratingCount || 0),
      averageRating: Number(course?.averageRating || 0),
      enrollmentCount: Number(course?.enrollmentCount || 0),
      completionCount: Number(course?.completionCount || 0),
      submittedAt: this.toIsoDate(course?.submittedAt),
      approvedAt: this.toIsoDate(course?.approvedAt),
      rejectedAt: this.toIsoDate(course?.rejectedAt),
      publishedAt: this.toIsoDate(course?.publishedAt),
      createdAt: createdAt as any,
      updatedAt: updatedAt as any,
    };
  }

  private normalizeCourseReview(review: any): CourseReview {
    return {
      ...review,
      id: String(review?.id || ''),
      courseId: String(review?.courseId || ''),
      studentId: String(review?.studentId || ''),
      studentName: review?.studentName ? String(review.studentName) : undefined,
      studentAvatar: review?.studentAvatar ? String(review.studentAvatar) : undefined,
      rating: Number(review?.rating || 0),
      comment: String(review?.comment || ''),
      createdAt: (this.toIsoDate(review?.createdAt) as any) || new Date(0),
      updatedAt: (this.toIsoDate(review?.updatedAt) as any) || new Date(0),
      instructorRespondedAt: this.toIsoDate(review?.instructorRespondedAt) as any,
    };
  }

  private normalizeEnrollment(enrollment: any): CourseEnrollment {
    return {
      ...enrollment,
      id: String(enrollment?.id || ''),
      courseId: String(enrollment?.courseId || ''),
      studentId: String(enrollment?.studentId || ''),
      status: (String(enrollment?.status || 'active') as CourseEnrollment['status']),
      progress: Number(enrollment?.progress || 0),
      timeSpent: Number(enrollment?.timeSpent || 0),
      lessonsCompleted: Number(enrollment?.lessonsCompleted || 0),
      totalLessons: Number(enrollment?.totalLessons || 0),
      completionRate: Number(enrollment?.completionRate || 0),
      autoRenew: Boolean(enrollment?.autoRenew),
      refundRequested: Boolean(enrollment?.refundRequested),
      refundProcessed: Boolean(enrollment?.refundProcessed),
      enrolledAt: (this.toIsoDate(enrollment?.enrolledAt) as any) || new Date(0),
      completedAt: this.toIsoDate(enrollment?.completedAt) as any,
      lastAccessAt: this.toIsoDate(enrollment?.lastAccessAt) as any,
      accessEndsAt: this.toIsoDate(enrollment?.accessEndsAt) as any,
      nextBillingDate: this.toIsoDate(enrollment?.nextBillingDate) as any,
    };
  }

  private async dedupeRequest<T>(
    key: string,
    requestFactory: () => Promise<T>,
    ttlMs: number = 0,
  ): Promise<T> {
    const now = Date.now();
    const cached = this.responseCache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.data as T;
    }

    const existing = this.inFlightRequests.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = requestFactory()
      .then((data: T) => {
        if (ttlMs > 0) {
          this.responseCache.set(key, {
            expiresAt: now + ttlMs,
            data,
          });
        }
        return data;
      })
      .finally(() => {
        this.inFlightRequests.delete(key);
      });

    this.inFlightRequests.set(key, promise as Promise<any>);
    return promise;
  }

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
      const suffix = queryString ? `?${queryString}` : '';
      const cacheKey = `courses:public:${queryString}`;

      const normalize = (payload: any): CourseSearchResult => {
        if (payload?.courses && Array.isArray(payload.courses)) {
          return payload as CourseSearchResult;
        }

        if (Array.isArray(payload)) {
          return {
            courses: payload,
            total: payload.length,
            page: Number(filters.page || 1),
            limit: Number(filters.limit || payload.length || 10),
            hasMore: false,
          };
        }

        if (Array.isArray(payload?.data)) {
          return {
            courses: payload.data,
            total: payload.total || payload.data.length,
            page: Number(payload.page || filters.page || 1),
            limit: Number(payload.limit || filters.limit || payload.data.length || 10),
            hasMore: Boolean(payload.hasMore),
          };
        }

        return {
          courses: [],
          total: 0,
          page: Number(filters.page || 1),
          limit: Number(filters.limit || 10),
          hasMore: false,
        };
      };

      return await this.dedupeRequest<CourseSearchResult>(
        cacheKey,
        async () => {
          try {
            const response = await api.get(`/courses/public${suffix}`);
            const result = normalize(response.data);
            return {
              ...result,
              courses: (result.courses || []).map(course => this.normalizeCourse(course)),
            };
          } catch (error: any) {
            // If listing endpoint is unavailable in this environment, return empty data
            // so the UI can still render featured/trending sections without error loops.
            if (error?.response?.status === 404) {
              return {
                courses: [],
                total: 0,
                page: Number(filters.page || 1),
                limit: Number(filters.limit || 10),
                hasMore: false,
              };
            }
            throw error;
          }
        },
        1500,
      );

    } catch (error: any) {
      logger.error('Error searching courses:', error);
      throw new Error(error.response?.data?.error || 'Failed to search courses');
    }
  }

  /**
   * Get course by ID
   */
  async getCourseById(courseId: string): Promise<Course> {
    try {
      const response = await api.get(`/courses/${courseId}`);

      return this.normalizeCourse(response.data.course);
    } catch (error: any) {
      logger.error('Error fetching course:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch course');
    }
  }

  /**
   * Get course by slug
   */
  async getCourseBySlug(slug: string): Promise<Course> {
    try {
      const response = await api.get(`/courses/slug/${slug}`);

      return this.normalizeCourse(response.data.course);
    } catch (error: any) {
      logger.error('Error fetching course by slug:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch course');
    }
  }

  /**
   * Get featured courses
   */
  async getFeaturedCourses(limit: number = 10): Promise<{ courses: Course[] }> {
    try {
      return await this.dedupeRequest<{ courses: Course[] }>(
        `courses:featured:${limit}`,
        async () => {
          const response = await api.get(`/courses/featured?limit=${limit}`);
          return {
            ...response.data,
            courses: (response.data?.courses || []).map((course: any) => this.normalizeCourse(course)),
          };
        },
        10000,
      );
    } catch (error: any) {
      logger.error('Error fetching featured courses:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch featured courses');
    }
  }

  /**
   * Get trending courses
   */
  async getTrendingCourses(limit: number = 10): Promise<{ courses: Course[] }> {
    try {
      return await this.dedupeRequest<{ courses: Course[] }>(
        `courses:trending:${limit}`,
        async () => {
          const response = await api.get(`/courses/trending?limit=${limit}`);
          return {
            ...response.data,
            courses: (response.data?.courses || []).map((course: any) => this.normalizeCourse(course)),
          };
        },
        10000,
      );
    } catch (error: any) {
      logger.error('Error fetching trending courses:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch trending courses');
    }
  }

  /**
   * Get bestseller courses
   */
  async getBestsellerCourses(limit: number = 10): Promise<{ courses: Course[] }> {
    try {
      return await this.dedupeRequest<{ courses: Course[] }>(
        `courses:bestseller:${limit}`,
        async () => {
          const response = await api.get(`/courses/bestseller?limit=${limit}`);
          return {
            ...response.data,
            courses: (response.data?.courses || []).map((course: any) => this.normalizeCourse(course)),
          };
        },
        10000,
      );
    } catch (error: any) {
      logger.debug('Bestseller courses fetch issue:', error);
      throw new Error(error.response?.data?.error || 'Unable to load bestseller courses');
    }
  }

  /**
   * Create a new course (Consultant only)
   */
  async createCourse(courseData: CourseInput): Promise<Course> {
    try {
      logger.debug('🚀 [CourseService] Creating course with timeout: 600000ms (10 minutes)');
      logger.debug('📦 [CourseService] Course data:', JSON.stringify(courseData, null, 2));
      logger.debug('⏰ [CourseService] Starting API call at:', new Date().toISOString());
      
      // Increased timeout to 10 minutes to handle potential network delays
      const response = await api.post('/courses', courseData, { timeout: 600000 });
      
      logger.debug('✅ [CourseService] Course created successfully');
      logger.debug('📋 [CourseService] Response:', response.data);
      return this.normalizeCourse(response.data?.course || response.data);
    } catch (error: any) {
      logger.error('❌ [CourseService] Course creation failed:', error);
      
      // Enhanced error logging
      if (error.code === 'ECONNABORTED') {
        logger.error('⏰ [CourseService] Request timeout - server took too long to respond');
        logger.error('⏰ [CourseService] This might be due to:');
        logger.error('   - Slow Firestore operations');
        logger.error('   - Network connectivity issues');
        logger.error('   - Server overload');
        throw new Error('Course creation timed out after 10 minutes. Please try again or contact support if the issue persists.');
      } else if (error.response) {
        logger.error('🔴 [CourseService] Server responded with error:', error.response.status, error.response.data);
        throw new Error(error.response.data?.error || `Server error: ${error.response.status}`);
      } else if (error.request) {
        logger.error('🔴 [CourseService] No response received from server');
        logger.error('🔴 [CourseService] Network error - check connection');
        throw new Error('No response from server. Please check your internet connection and try again.');
      } else {
        logger.error('🔴 [CourseService] Unexpected error:', error.message);
        throw new Error(error.message || 'Unable to create course');
      }
    }
  }

  /**
   * Update course (Consultant only)
   */
  async updateCourse(courseId: string, updates: Partial<CourseInput>): Promise<Course> {
    try {
      const response = await api.put(`/courses/${courseId}`, updates);

      return this.normalizeCourse(response.data.course);
    } catch (error: any) {
      logger.error('Error updating course:', error);
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
      logger.error('Error deleting course:', error);
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
        if (value !== undefined && value !== null && value !== '') {
          queryParts.push(`${key}=${value.toString()}`);
        }
      });
      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

      // Reduce timeout to 10 seconds to fail fast
      const response = await api.get(`/courses/instructor/my${queryString}`, { timeout: 10000 });

      return {
        ...response.data,
        courses: (response.data?.courses || []).map((course: any) => this.normalizeCourse(course)),
      };
    } catch (error: any) {
      logger.debug('Course fetch issue:', error);
      throw new Error(error.response?.data?.error || 'Unable to load courses');
    }
  }

  /**
   * Get instructor's courses (using the current authenticated user)
   */
  async getInstructorCourses(_instructorId: string, filters: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<Course[]> {
    try {
      // Build query string manually
      const queryParts: string[] = [];
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParts.push(`${key}=${value.toString()}`);
        }
      });
      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

      // Use the /instructor/my endpoint which gets courses for the authenticated user
      // Increased timeout to 30 seconds to handle slow backend responses
      const response = await api.get(`/courses/instructor/my${queryString}`, { timeout: 30000 });

      return (response.data.courses || []).map((course: any) => this.normalizeCourse(course));
    } catch (error: any) {
      logger.debug('Instructor courses fetch issue:', error);
      
      // Provide specific error message for timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your internet connection and try again.');
      }
      
      throw new Error(error.response?.data?.error || 'Unable to load instructor courses');
    }
  }

  /**
   * Submit course for approval (Consultant only)
   */
  async submitForApproval(courseId: string): Promise<Course> {
    try {
      const response = await api.post(`/courses/${courseId}/submit-for-approval`, {});

      return this.normalizeCourse(response.data.course);
    } catch (error: any) {
      logger.error('Error submitting course for approval:', error);
      const apiError = error?.response?.data;
      const missingFields = apiError?.details?.missingFields;
      if (Array.isArray(missingFields) && missingFields.length > 0) {
        throw new Error(
          `${apiError?.error || 'Course is not ready for submission'}\n• ${missingFields.join('\n• ')}`,
        );
      }
      throw new Error(apiError?.error || 'Failed to submit course');
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

      return this.normalizeEnrollment(response.data.enrollment);
    } catch (error: any) {
      logger.error('Error enrolling in course:', error);
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

      return {
        ...response.data,
        enrollments: (response.data?.enrollments || []).map((item: any) => this.normalizeEnrollment(item)),
      };
    } catch (error: any) {
      logger.error('Error fetching enrollments:', error);
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

      return {
        ...response.data,
        enrollments: (response.data?.enrollments || []).map((item: any) => this.normalizeEnrollment(item)),
      };
    } catch (error: any) {
      logger.error('Error fetching course enrollments:', error);
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
      logger.error('Error updating lesson progress:', error);
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

      return this.normalizeCourseReview(response.data.review);
    } catch (error: any) {
      logger.error('Error adding course review:', error);
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

      return {
        ...response.data,
        reviews: (response.data?.reviews || []).map((review: any) => this.normalizeCourseReview(review)),
      };
    } catch (error: any) {
      logger.error('Error fetching course reviews:', error);
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
      logger.error('Error fetching instructor stats:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch stats');
    }
  }

  /**
   * Get instructor statistics (using current authenticated user)
   */
  async getInstructorStatsById(_instructorId: string): Promise<InstructorStats> {
    try {
      // Use /instructor/stats endpoint which gets stats for authenticated user
      const response = await api.get('/courses/instructor/stats');

      return response.data.stats;
    } catch (error: any) {
      logger.error('Error fetching instructor stats by ID:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch instructor stats');
    }
  }

  /**
   * Get pending courses (Admin only)
   */
  async getPendingCourses(): Promise<{ courses: Course[] }> {
    try {
      const response = await api.get('/courses/admin/pending');

      return {
        ...response.data,
        courses: (response.data?.courses || []).map((course: any) => this.normalizeCourse(course)),
      };
    } catch (error: any) {
      logger.error('Error fetching pending courses:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch pending courses');
    }
  }

  /**
   * Approve course (Admin only)
   */
  async approveCourse(courseId: string): Promise<Course> {
    try {
      const response = await api.post(`/courses/${courseId}/approve`, {});

      return this.normalizeCourse(response.data.course);
    } catch (error: any) {
      logger.error('Error approving course:', error);
      throw new Error(error.response?.data?.error || 'Failed to approve course');
    }
  }

  /**
   * Reject course (Admin only)
   */
  async rejectCourse(courseId: string, reason: string): Promise<Course> {
    try {
      const response = await api.post(`/courses/${courseId}/reject`, { reason });

      return this.normalizeCourse(response.data.course);
    } catch (error: any) {
      logger.error('Error rejecting course:', error);
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
      logger.error('Error purchasing course:', error);
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
      logger.error('Error checking course access:', error);
      throw new Error(error.message || 'Failed to check access');
    }
  }

  /**
   * Launch a course
   */
  async launchCourse(courseId: string): Promise<Course> {
    try {
      const response = await api.post(`/courses/${courseId}/launch`);

      return this.normalizeCourse(response.data.course);
    } catch (error: any) {
      logger.error('Error launching course:', error);
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
      logger.error('Error issuing certificate:', error);
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
      logger.error('Error fetching purchase history:', error);
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
      logger.error('Error fetching certificates:', error);
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
      logger.error('Error verifying certificate:', error);
      throw new Error(error.message || 'Failed to verify certificate');
    }
  }
}

export const courseService = new CourseService();
