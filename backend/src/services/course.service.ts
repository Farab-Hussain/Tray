// src/services/course.service.ts
import { 
  Course, 
  CourseInput, 
  CourseLesson, 
  CourseEnrollment, 
  CourseProgress,
  CourseReview,
  CourseFilters,
  CourseSearchResult,
  CourseBookmark,
  CourseNote
} from '../models/course.model';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

export class CourseService {
  private coursesCollection = db.collection('courses');
  private lessonsCollection = db.collection('courseLessons');
  private enrollmentsCollection = db.collection('courseEnrollments');
  private progressCollection = db.collection('courseProgress');
  private reviewsCollection = db.collection('courseReviews');
  private bookmarksCollection = db.collection('courseBookmarks');
  private notesCollection = db.collection('courseNotes');

  /**
   * Create a new course
   */
  async create(courseData: CourseInput, instructorId: string): Promise<Course> {
    const courseId = randomUUID();
    const now = Timestamp.now();

    // Get instructor info
    const instructorDoc = await db.collection('users').doc(instructorId).get();
    const instructorData = instructorDoc.data() || {};

    const course: Course = {
      id: courseId,
      ...courseData,
      instructorId,
      instructorName: `${instructorData.firstName || ''} ${instructorData.lastName || ''}`.trim() || instructorData.displayName || 'Instructor',
      instructorBio: instructorData.bio,
      instructorAvatar: instructorData.photoURL,
      status: 'draft',
      enrollmentCount: 0,
      completionCount: 0,
      averageRating: 0,
      ratingCount: 0,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: undefined,
      approvedBy: undefined,
      approvedAt: undefined,
      rejectionReason: undefined,
      featured: false,
      trending: false,
      bestseller: false,
    };

    await this.coursesCollection.doc(courseId).set(course);
    return course;
  }

  /**
   * Get course by ID
   */
  async getById(courseId: string): Promise<Course> {
    const doc = await this.coursesCollection.doc(courseId).get();
    if (!doc.exists) {
      throw new Error('Course not found');
    }
    return doc.data() as Course;
  }

  /**
   * Get course by slug
   */
  async getBySlug(slug: string): Promise<Course> {
    const snapshot = await this.coursesCollection.where('slug', '==', slug).limit(1).get();
    if (snapshot.empty) {
      throw new Error('Course not found');
    }
    return snapshot.docs[0].data() as Course;
  }

  /**
   * Update course
   */
  async update(courseId: string, instructorId: string, updates: Partial<CourseInput>): Promise<Course> {
    const course = await this.getById(courseId);
    
    if (course.instructorId !== instructorId) {
      throw new Error('Only course instructor can update course');
    }

    const updatedCourse = {
      ...course,
      ...updates,
      updatedAt: Timestamp.now(),
    };

    await this.coursesCollection.doc(courseId).update(updatedCourse);
    return updatedCourse;
  }

  /**
   * Delete course
   */
  async delete(courseId: string, instructorId: string): Promise<void> {
    const course = await this.getById(courseId);
    
    if (course.instructorId !== instructorId) {
      throw new Error('Only course instructor can delete course');
    }

    // Check if course has enrollments
    const enrollmentsSnapshot = await this.enrollmentsCollection
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    if (!enrollmentsSnapshot.empty) {
      throw new Error('Cannot delete course with active enrollments');
    }

    await this.coursesCollection.doc(courseId).delete();
    
    // Delete related lessons
    const lessonsSnapshot = await this.lessonsCollection
      .where('courseId', '==', courseId)
      .get();
    
    const batch = db.batch();
    lessonsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  /**
   * Search courses with filters
   */
  async search(filters: CourseFilters): Promise<CourseSearchResult> {
    let query = this.coursesCollection.where('status', '==', 'published');

    // Apply filters
    if (filters.category) {
      query = query.where('category', '==', filters.category);
    }
    if (filters.level) {
      query = query.where('level', '==', filters.level);
    }
    if (filters.isFree !== undefined) {
      query = query.where('isFree', '==', filters.isFree);
    }
    if (filters.hasCertificate) {
      query = query.where('certificateAvailable', '==', true);
    }
    if (filters.instructorId) {
      query = query.where('instructorId', '==', filters.instructorId);
    }
    if (filters.featured) {
      query = query.where('featured', '==', true);
    }
    if (filters.trending) {
      query = query.where('trending', '==', true);
    }
    if (filters.bestseller) {
      query = query.where('bestseller', '==', true);
    }

    // Price range filtering
    if (filters.priceRange) {
      query = query.where('price', '>=', filters.priceRange.min)
                  .where('price', '<=', filters.priceRange.max);
    }

    // Rating filtering
    if (filters.rating) {
      query = query.where('averageRating', '>=', filters.rating);
    }

    // Text search (basic implementation)
    if (filters.search) {
      // Note: For full-text search, consider using Algolia or Elasticsearch
      // This is a basic implementation using Firestore queries
      const searchTerm = filters.search.toLowerCase();
      // You would need to add search keywords field to course documents
    }

    // Sorting
    const sortField = this.getSortField(filters.sort || 'newest');
    query = query.orderBy(sortField.field, sortField.direction);

    // Pagination
    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    const snapshot = await query.limit(limit).offset(offset).get();
    const courses = snapshot.docs.map(doc => doc.data() as Course);

    // Get total count for pagination
    const totalSnapshot = await this.coursesCollection
      .where('status', '==', 'published')
      .get();
    const total = totalSnapshot.size;

    return {
      courses,
      total,
      page,
      limit,
      hasMore: offset + courses.length < total,
    };
  }

  /**
   * Get instructor's courses
   */
  async getInstructorCourses(instructorId: string, filters: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ courses: Course[]; total: number }> {
    let query = this.coursesCollection.where('instructorId', '==', instructorId);

    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    query = query.orderBy('createdAt', 'desc')
                .limit(limit)
                .offset(offset);

    const snapshot = await query.get();
    const courses = snapshot.docs.map(doc => doc.data() as Course);

    // Get total count
    const totalQuery = this.coursesCollection.where('instructorId', '==', instructorId);
    if (filters.status) {
      totalQuery.where('status', '==', filters.status);
    }
    const totalSnapshot = await totalQuery.get();
    const total = totalSnapshot.size;

    return { courses, total };
  }

  /**
   * Submit course for approval
   */
  async submitForApproval(courseId: string, instructorId: string): Promise<Course> {
    const course = await this.getById(courseId);
    
    if (course.instructorId !== instructorId) {
      throw new Error('Only course instructor can submit for approval');
    }

    if (course.status !== 'draft') {
      throw new Error('Only draft courses can be submitted for approval');
    }

    // Validate course has required lessons
    const lessonsSnapshot = await this.lessonsCollection
      .where('courseId', '==', courseId)
      .get();

    if (lessonsSnapshot.empty) {
      throw new Error('Course must have at least one lesson before submission');
    }

    const updatedCourse = {
      ...course,
      status: 'pending' as const,
      updatedAt: Timestamp.now(),
    };

    await this.coursesCollection.doc(courseId).update(updatedCourse);
    return updatedCourse;
  }

  /**
   * Approve course (Admin only)
   */
  async approveCourse(courseId: string, adminId: string): Promise<Course> {
    const course = await this.getById(courseId);
    
    if (course.status !== 'pending') {
      throw new Error('Only pending courses can be approved');
    }

    const updatedCourse = {
      ...course,
      status: 'published' as const,
      approvedBy: adminId,
      approvedAt: Timestamp.now(),
      publishedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await this.coursesCollection.doc(courseId).update(updatedCourse);
    return updatedCourse;
  }

  /**
   * Reject course (Admin only)
   */
  async rejectCourse(courseId: string, adminId: string, reason: string): Promise<Course> {
    const course = await this.getById(courseId);
    
    if (course.status !== 'pending') {
      throw new Error('Only pending courses can be rejected');
    }

    const updatedCourse = {
      ...course,
      status: 'draft' as const,
      approvedBy: adminId,
      rejectionReason: reason,
      updatedAt: Timestamp.now(),
    };

    await this.coursesCollection.doc(courseId).update(updatedCourse);
    return updatedCourse;
  }

  /**
   * Get pending courses (Admin only)
   */
  async getPendingCourses(): Promise<Course[]> {
    const snapshot = await this.coursesCollection
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as Course);
  }

  /**
   * Enroll student in course
   */
  async enrollStudent(courseId: string, studentId: string, paymentDetails?: {
    paymentId?: string;
    subscriptionId?: string;
  }): Promise<CourseEnrollment> {
    const course = await this.getById(courseId);
    
    // Check if already enrolled
    const existingEnrollment = await this.enrollmentsCollection
      .where('courseId', '==', courseId)
      .where('studentId', '==', studentId)
      .limit(1)
      .get();

    if (!existingEnrollment.empty) {
      throw new Error('Student already enrolled in this course');
    }

    const enrollmentId = randomUUID();
    const enrollment: CourseEnrollment = {
      id: enrollmentId,
      courseId,
      studentId,
      enrolledAt: Timestamp.now(),
      completedAt: undefined,
      lastAccessedAt: Timestamp.now(),
      progress: 0,
      status: 'active',
      certificateIssued: false,
      paymentId: paymentDetails?.paymentId,
      subscriptionId: paymentDetails?.subscriptionId,
      refundRequested: false,
      refundProcessed: false,
      totalTimeSpent: 0,
      lessonsCompleted: 0,
      quizzesPassed: 0,
      averageQuizScore: 0,
      notesCount: 0,
      bookmarksCount: 0,
      discussionPostsCount: 0,
    };

    await this.enrollmentsCollection.doc(enrollmentId).set(enrollment);

    // Update course enrollment count
    await this.coursesCollection.doc(courseId).update({
      enrollmentCount: course.enrollmentCount + 1,
    });

    return enrollment;
  }

  /**
   * Get student's enrollments
   */
  async getStudentEnrollments(studentId: string, filters: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ enrollments: CourseEnrollment[]; total: number }> {
    let query = this.enrollmentsCollection.where('studentId', '==', studentId);

    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    query = query.orderBy('enrolledAt', 'desc')
                .limit(limit)
                .offset(offset);

    const snapshot = await query.get();
    const enrollments = snapshot.docs.map(doc => doc.data() as CourseEnrollment);

    // Get total count
    const totalQuery = this.enrollmentsCollection.where('studentId', '==', studentId);
    if (filters.status) {
      totalQuery.where('status', '==', filters.status);
    }
    const totalSnapshot = await totalQuery.get();
    const total = totalSnapshot.size;

    return { enrollments, total };
  }

  /**
   * Get course enrollments (Instructor only)
   */
  async getCourseEnrollments(courseId: string, instructorId: string, filters: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ enrollments: CourseEnrollment[]; total: number }> {
    const course = await this.getById(courseId);
    
    if (course.instructorId !== instructorId) {
      throw new Error('Only course instructor can view enrollments');
    }

    let query = this.enrollmentsCollection.where('courseId', '==', courseId);

    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    query = query.orderBy('enrolledAt', 'desc')
                .limit(limit)
                .offset(offset);

    const snapshot = await query.get();
    const enrollments = snapshot.docs.map(doc => doc.data() as CourseEnrollment);

    // Get total count
    const totalQuery = this.enrollmentsCollection.where('courseId', '==', courseId);
    if (filters.status) {
      totalQuery.where('status', '==', filters.status);
    }
    const totalSnapshot = await totalQuery.get();
    const total = totalSnapshot.size;

    return { enrollments, total };
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
    const progressId = `${enrollmentId}_${lessonId}`;
    
    const progressRef = this.progressCollection.doc(progressId);
    const progressDoc = await progressRef.get();

    const progress: CourseProgress = progressDoc.exists 
      ? progressDoc.data() as CourseProgress
      : {
          id: progressId,
          enrollmentId,
          lessonId,
          studentId: '', // Will be filled from enrollment
          startedAt: Timestamp.now(),
          completedAt: undefined,
          progress: 0,
          timeSpent: 0,
          bookmarked: false,
          quizAttempts: [],
          assignmentSubmissions: [],
        };

    // Get student ID from enrollment if not present
    if (!progress.studentId) {
      const enrollmentDoc = await this.enrollmentsCollection.doc(enrollmentId).get();
      const enrollment = enrollmentDoc.data() as CourseEnrollment;
      progress.studentId = enrollment.studentId;
    }

    // Update progress
    progress.progress = progressData.progress;
    progress.timeSpent += progressData.timeSpent;
    if (progressData.watchTime) {
      progress.watchTime = progressData.watchTime;
    }
    if (progressData.lastPosition) {
      progress.lastPosition = progressData.lastPosition;
    }
    if (progressData.completed && !progress.completedAt) {
      progress.completedAt = Timestamp.now();
    }

    await progressRef.set(progress, { merge: true });

    // Update overall enrollment progress
    await this.updateEnrollmentProgress(enrollmentId);

    return progress;
  }

  /**
   * Update overall enrollment progress
   */
  private async updateEnrollmentProgress(enrollmentId: string): Promise<void> {
    const enrollmentDoc = await this.enrollmentsCollection.doc(enrollmentId).get();
    const enrollment = enrollmentDoc.data() as CourseEnrollment;

    // Get all lessons for the course
    const lessonsSnapshot = await this.lessonsCollection
      .where('courseId', '==', enrollment.courseId)
      .orderBy('order')
      .get();

    const totalLessons = lessonsSnapshot.size;
    if (totalLessons === 0) return;

    // Get progress for all lessons
    const progressPromises = lessonsSnapshot.docs.map(async (lessonDoc) => {
      const lessonId = lessonDoc.id;
      const progressId = `${enrollmentId}_${lessonId}`;
      const progressDoc = await this.progressCollection.doc(progressId).get();
      return progressDoc.exists ? progressDoc.data() as CourseProgress : null;
    });

    const allProgress = await Promise.all(progressPromises);
    const completedLessons = allProgress.filter(p => p && p.completedAt).length;

    const overallProgress = Math.round((completedLessons / totalLessons) * 100);
    const lessonsCompleted = completedLessons;

    // Update enrollment
    const updates: Partial<CourseEnrollment> = {
      progress: overallProgress,
      lessonsCompleted,
      lastAccessedAt: Timestamp.now(),
    };

    if (overallProgress === 100 && !enrollment.completedAt) {
      updates.completedAt = Timestamp.now();
      updates.status = 'completed';
      
      // Update course completion count
      const courseDoc = await this.coursesCollection.doc(enrollment.courseId).get();
      const course = courseDoc.data() as Course;
      await this.coursesCollection.doc(enrollment.courseId).update({
        completionCount: course.completionCount + 1,
      });

      // Issue certificate if available
      if (course.certificateAvailable && !enrollment.certificateIssued) {
        updates.certificateIssued = true;
        // TODO: Generate certificate URL
      }
    }

    await this.enrollmentsCollection.doc(enrollmentId).update(updates);
  }

  /**
   * Add course review
   */
  async addReview(courseId: string, studentId: string, reviewData: {
    rating: number;
    title?: string;
    comment: string;
    pros?: string[];
    cons?: string[];
  }): Promise<CourseReview> {
    // Check if student is enrolled and completed
    const enrollmentSnapshot = await this.enrollmentsCollection
      .where('courseId', '==', courseId)
      .where('studentId', '==', studentId)
      .where('status', '==', 'completed')
      .limit(1)
      .get();

    if (enrollmentSnapshot.empty) {
      throw new Error('Only students who completed the course can leave a review');
    }

    // Check if already reviewed
    const existingReviewSnapshot = await this.reviewsCollection
      .where('courseId', '==', courseId)
      .where('studentId', '==', studentId)
      .limit(1)
      .get();

    if (!existingReviewSnapshot.empty) {
      throw new Error('Student has already reviewed this course');
    }

    const reviewId = randomUUID();
    const review: CourseReview = {
      id: reviewId,
      courseId,
      studentId,
      rating: reviewData.rating,
      title: reviewData.title,
      comment: reviewData.comment,
      pros: reviewData.pros,
      cons: reviewData.cons,
      helpfulCount: 0,
      verifiedPurchase: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await this.reviewsCollection.doc(reviewId).set(review);

    // Update course rating
    await this.updateCourseRating(courseId);

    return review;
  }

  /**
   * Update course average rating
   */
  private async updateCourseRating(courseId: string): Promise<void> {
    const reviewsSnapshot = await this.reviewsCollection
      .where('courseId', '==', courseId)
      .get();

    const reviews = reviewsSnapshot.docs.map(doc => doc.data() as CourseReview);
    
    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await this.coursesCollection.doc(courseId).update({
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      ratingCount: reviews.length,
      reviewCount: reviews.length,
    });
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
    let query = this.reviewsCollection.where('courseId', '==', courseId);

    if (filters.rating) {
      query = query.where('rating', '==', filters.rating);
    }

    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    // Sorting
    const sortField = this.getReviewSortField(filters.sort || 'newest');
    query = query.orderBy(sortField.field, sortField.direction);

    query = query.limit(limit).offset(offset);

    const snapshot = await query.get();
    const reviews = snapshot.docs.map(doc => doc.data() as CourseReview);

    // Get total count
    const totalQuery = this.reviewsCollection.where('courseId', '==', courseId);
    if (filters.rating) {
      totalQuery.where('rating', '==', filters.rating);
    }
    const totalSnapshot = await totalQuery.get();
    const total = totalSnapshot.size;

    return { reviews, total };
  }

  /**
   * Helper method to get sort field for courses
   */
  private getSortField(sort: string): { field: string; direction: 'asc' | 'desc' } {
    switch (sort) {
      case 'newest':
        return { field: 'createdAt', direction: 'desc' };
      case 'oldest':
        return { field: 'createdAt', direction: 'asc' };
      case 'price-low':
        return { field: 'price', direction: 'asc' };
      case 'price-high':
        return { field: 'price', direction: 'desc' };
      case 'rating':
        return { field: 'averageRating', direction: 'desc' };
      case 'popular':
        return { field: 'enrollmentCount', direction: 'desc' };
      case 'trending':
        return { field: 'trending', direction: 'desc' };
      default:
        return { field: 'createdAt', direction: 'desc' };
    }
  }

  /**
   * Helper method to get sort field for reviews
   */
  private getReviewSortField(sort: string): { field: string; direction: 'asc' | 'desc' } {
    switch (sort) {
      case 'newest':
        return { field: 'createdAt', direction: 'desc' };
      case 'oldest':
        return { field: 'createdAt', direction: 'asc' };
      case 'rating-high':
        return { field: 'rating', direction: 'desc' };
      case 'rating-low':
        return { field: 'rating', direction: 'asc' };
      case 'helpful':
        return { field: 'helpfulCount', direction: 'desc' };
      default:
        return { field: 'createdAt', direction: 'desc' };
    }
  }

  /**
   * Get featured courses
   */
  async getFeaturedCourses(limit: number = 10): Promise<Course[]> {
    const snapshot = await this.coursesCollection
      .where('status', '==', 'published')
      .where('featured', '==', true)
      .orderBy('enrollmentCount', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as Course);
  }

  /**
   * Get trending courses
   */
  async getTrendingCourses(limit: number = 10): Promise<Course[]> {
    const snapshot = await this.coursesCollection
      .where('status', '==', 'published')
      .where('trending', '==', true)
      .orderBy('enrollmentCount', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as Course);
  }

  /**
   * Get bestseller courses
   */
  async getBestsellerCourses(limit: number = 10): Promise<Course[]> {
    const snapshot = await this.coursesCollection
      .where('status', '==', 'published')
      .where('bestseller', '==', true)
      .orderBy('enrollmentCount', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as Course);
  }

  /**
   * Get course statistics for instructor
   */
  async getInstructorStats(instructorId: string): Promise<{
    totalCourses: number;
    publishedCourses: number;
    totalEnrollments: number;
    totalCompletions: number;
    totalRevenue: number;
    averageRating: number;
  }> {
    const coursesSnapshot = await this.coursesCollection
      .where('instructorId', '==', instructorId)
      .get();

    const courses = coursesSnapshot.docs.map(doc => doc.data() as Course);
    const publishedCourses = courses.filter(c => c.status === 'published');

    const totalEnrollments = publishedCourses.reduce((sum, course) => sum + course.enrollmentCount, 0);
    const totalCompletions = publishedCourses.reduce((sum, course) => sum + course.completionCount, 0);
    const totalRevenue = publishedCourses.reduce((sum, course) => sum + (course.price * course.enrollmentCount), 0);
    
    const ratedCourses = publishedCourses.filter(c => c.ratingCount > 0);
    const averageRating = ratedCourses.length > 0 
      ? ratedCourses.reduce((sum, course) => sum + course.averageRating, 0) / ratedCourses.length
      : 0;

    return {
      totalCourses: courses.length,
      publishedCourses: publishedCourses.length,
      totalEnrollments,
      totalCompletions,
      totalRevenue,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }
}

export const courseService = new CourseService();
