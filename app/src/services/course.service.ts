// src/services/course.service.ts
import { fetcher, api } from '../lib/fetcher';

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
  slug: string;
  enrollmentCount: number;
  completionCount: number;
  averageRating: number;
  ratingCount: number;
  reviewCount: number;
  featured: boolean;
  trending: boolean;
  bestseller: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
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
  slug: string;
}

export interface CourseLesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  duration: number;
  durationText: string;
  type: 'video' | 'text' | 'quiz' | 'assignment' | 'resource';
  contentUrl?: string;
  contentData?: {
    text?: string;
    questions?: QuizQuestion[];
    instructions?: string;
    resourceUrl?: string;
    resourceType?: string;
  };
  isPreview: boolean;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
  completionCount: number;
  averageWatchTime?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'text';
  options?: string[];
  correctAnswer: string | boolean;
  explanation?: string;
  points: number;
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt: string;
  completedAt?: string;
  lastAccessedAt?: string;
  progress: number;
  status: 'active' | 'completed' | 'dropped' | 'suspended';
  certificateIssued: boolean;
  certificateUrl?: string;
  paymentId?: string;
  subscriptionId?: string;
  refundRequested: boolean;
  refundProcessed: boolean;
  refundAmount?: number;
  refundReason?: string;
  refundProcessedAt?: string;
  totalTimeSpent: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  averageQuizScore: number;
  lastLessonCompleted?: string;
  currentLesson?: string;
  notesCount: number;
  bookmarksCount: number;
  discussionPostsCount: number;
}

export interface CourseProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  studentId: string;
  startedAt: string;
  completedAt?: string;
  progress: number;
  timeSpent: number;
  watchTime?: number;
  lastPosition?: number;
  notes?: string;
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
  attemptedAt: string;
  timeSpent: number;
}

export interface AssignmentSubmission {
  id: string;
  lessonId: string;
  studentId: string;
  submissionUrl?: string;
  submissionText?: string;
  submissionType: 'file' | 'text';
  submittedAt: string;
  graded: boolean;
  grade?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
}

export interface CourseReview {
  id: string;
  courseId: string;
  studentId: string;
  rating: number;
  title?: string;
  comment: string;
  pros?: string[];
  cons?: string[];
  helpfulCount: number;
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
}

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
  rating?: number;
  tags?: string[];
  language?: string;
  isFree?: boolean;
  hasCertificate?: boolean;
  instructorId?: string;
  featured?: boolean;
  trending?: boolean;
  bestseller?: boolean;
  search?: string;
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

export interface InstructorStats {
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  totalCompletions: number;
  totalRevenue: number;
  averageRating: number;
}

class CourseService {
  private getAuthHeaders() {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Search courses with filters
   */
  async searchCourses(filters: CourseFilters = {}): Promise<CourseSearchResult> {
    try {
      const queryParams = new URLSearchParams();
      
      // Add all filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            if (key === 'priceRange' || key === 'duration') {
              queryParams.set(`${key}Min`, value.min.toString());
              queryParams.set(`${key}Max`, value.max.toString());
            } else if (key === 'tags') {
              queryParams.set(key, (value as string[]).join(','));
            }
          } else {
            queryParams.set(key, value.toString());
          }
        }
      });

      const response = await axios.get(
        `${API_BASE_URL}/courses/search?${queryParams.toString()}`,
        { headers: this.getAuthHeaders() }
      );

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
      const response = await axios.get(
        `${API_BASE_URL}/courses/${courseId}`,
        { headers: this.getAuthHeaders() }
      );

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
      const response = await axios.get(
        `${API_BASE_URL}/courses/slug/${slug}`,
        { headers: this.getAuthHeaders() }
      );

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
      const response = await axios.get(
        `${API_BASE_URL}/courses/featured?limit=${limit}`,
        { headers: this.getAuthHeaders() }
      );

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
      const response = await axios.get(
        `${API_BASE_URL}/courses/trending?limit=${limit}`,
        { headers: this.getAuthHeaders() }
      );

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
      const response = await axios.get(
        `${API_BASE_URL}/courses/bestseller?limit=${limit}`,
        { headers: this.getAuthHeaders() }
      );

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
      const response = await axios.post(
        `${API_BASE_URL}/courses`,
        courseData,
        { headers: this.getAuthHeaders() }
      );

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
      const response = await axios.put(
        `${API_BASE_URL}/courses/${courseId}`,
        updates,
        { headers: this.getAuthHeaders() }
      );

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
      await axios.delete(
        `${API_BASE_URL}/courses/${courseId}`,
        { headers: this.getAuthHeaders() }
      );
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
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.set(key, value.toString());
        }
      });

      const response = await axios.get(
        `${API_BASE_URL}/courses/instructor/my?${queryParams.toString()}`,
        { headers: this.getAuthHeaders() }
      );

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
      const response = await axios.post(
        `${API_BASE_URL}/courses/${courseId}/submit-for-approval`,
        {},
        { headers: this.getAuthHeaders() }
      );

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
      const response = await axios.post(
        `${API_BASE_URL}/courses/${courseId}/enroll`,
        paymentDetails || {},
        { headers: this.getAuthHeaders() }
      );

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
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.set(key, value.toString());
        }
      });

      const response = await axios.get(
        `${API_BASE_URL}/courses/enrollments/my?${queryParams.toString()}`,
        { headers: this.getAuthHeaders() }
      );

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
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.set(key, value.toString());
        }
      });

      const response = await axios.get(
        `${API_BASE_URL}/courses/${courseId}/enrollments?${queryParams.toString()}`,
        { headers: this.getAuthHeaders() }
      );

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
      const response = await axios.put(
        `${API_BASE_URL}/courses/progress/${enrollmentId}/${lessonId}`,
        progressData,
        { headers: this.getAuthHeaders() }
      );

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
      const response = await axios.post(
        `${API_BASE_URL}/courses/${courseId}/reviews`,
        reviewData,
        { headers: this.getAuthHeaders() }
      );

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
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.set(key, value.toString());
        }
      });

      const response = await axios.get(
        `${API_BASE_URL}/courses/${courseId}/reviews?${queryParams.toString()}`,
        { headers: this.getAuthHeaders() }
      );

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
      const response = await axios.get(
        `${API_BASE_URL}/courses/instructor/stats`,
        { headers: this.getAuthHeaders() }
      );

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
      const response = await axios.get(
        `${API_BASE_URL}/courses/admin/pending`,
        { headers: this.getAuthHeaders() }
      );

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
      const response = await axios.post(
        `${API_BASE_URL}/courses/${courseId}/approve`,
        {},
        { headers: this.getAuthHeaders() }
      );

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
      const response = await axios.post(
        `${API_BASE_URL}/courses/${courseId}/reject`,
        { reason },
        { headers: this.getAuthHeaders() }
      );

      return response.data.course;
    } catch (error: any) {
      console.error('Error rejecting course:', error);
      throw new Error(error.response?.data?.error || 'Failed to reject course');
    }
  }
}

export const courseService = new CourseService();
