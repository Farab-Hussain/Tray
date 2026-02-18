// Course Service - Clean Working Version
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { Logger } from '../utils/logger';

// Basic Course Interface
export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  category: string;
  level: string;
  price: number;
  currency: string;
  thumbnailUrl: string;
  status: 'draft' | 'pending' | 'published' | 'archived';
  totalVideos: number;
  totalDuration: number;
  enrollmentCount: number;
  rating: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Course Input Interface
export interface CourseInput {
  title: string;
  description: string;
  instructorId?: string;
  instructorName?: string;
  category: string;
  level: string;
  price: number;
  currency: string;
  thumbnailUrl: string;
  status?: 'draft' | 'pending' | 'published' | 'archived';
  slug: string;
}

// Instructor Stats Interface
export interface InstructorStats {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
}

export class CourseService {
  private coursesCollection = db.collection('courses');
  private enrollmentsCollection = db.collection('courseEnrollments');
  private reviewsCollection = db.collection('courseReviews');

  private logLifecycleEvent(params: {
    action: string;
    courseId: string;
    actorId?: string;
    fromStatus?: string;
    toStatus?: string;
    details?: string;
  }): void {
    const { action, courseId, actorId, fromStatus, toStatus, details } = params;
    const transition = fromStatus || toStatus ? ` status: ${fromStatus || 'unknown'} -> ${toStatus || 'unknown'}` : '';
    const actor = actorId ? ` actor: ${actorId}` : '';
    const extra = details ? ` ${details}` : '';
    Logger.info('CourseLifecycle', courseId, `${action}.${transition}${actor}${extra}`.trim());
  }

  private createHttpError(message: string, statusCode: number, details?: any): Error & {
    statusCode: number;
    details?: any;
  } {
    const error = new Error(message) as Error & { statusCode: number; details?: any };
    error.statusCode = statusCode;
    if (details !== undefined) {
      error.details = details;
    }
    return error;
  }

  private async getCourseOrThrow(courseId: string): Promise<any> {
    const doc = await this.coursesCollection.doc(courseId).get();
    if (!doc.exists) {
      throw this.createHttpError('Course not found', 404);
    }
    return { id: doc.id, ...doc.data() };
  }

  private assertInstructorOwnership(course: any, instructorId: string): void {
    if (!course?.instructorId || course.instructorId !== instructorId) {
      throw this.createHttpError('You do not have permission to modify this course', 403);
    }
  }

  private validateCourseForSubmission(course: any): string[] {
    const issues: string[] = [];

    if (!course?.title || !String(course.title).trim()) {
      issues.push('title is required');
    }

    if (!course?.description || !String(course.description).trim()) {
      issues.push('description is required');
    }

    if (!course?.category || !String(course.category).trim()) {
      issues.push('category is required');
    }

    if (!course?.level || !String(course.level).trim()) {
      issues.push('level is required');
    }

    if (!course?.language || !String(course.language).trim()) {
      issues.push('language is required');
    }

    if (!Array.isArray(course?.objectives) || course.objectives.length === 0) {
      issues.push('at least one learning objective is required');
    }

    const lessonsCount = Number(course?.lessonsCount || 0);
    if (lessonsCount <= 0) {
      issues.push('lessonsCount must be greater than 0');
    }

    const duration = Number(course?.duration || 0);
    if (duration <= 0) {
      issues.push('duration must be greater than 0');
    }

    const isFree = Boolean(course?.isFree);
    const price = Number(course?.price || 0);
    if (!isFree && price <= 0) {
      issues.push('price must be greater than 0 for paid courses');
    }

    const videos = Array.isArray(course?.videos) ? course.videos : [];
    if (videos.length === 0) {
      issues.push('at least one lesson video is required');
    } else {
      const hasPlayableVideo = videos.some((video: any) => Boolean(video?.videoUrl));
      if (!hasPlayableVideo) {
        issues.push('at least one lesson must include a playable video URL');
      }
    }

    return issues;
  }

  /**
   * Create a new course
   */
  async createCourse(courseData: any, instructorId?: string): Promise<any> {
    console.log('🚀 [Backend CourseService] createCourse called at:', new Date().toISOString());
    console.log('📦 [Backend CourseService] Course data:', JSON.stringify(courseData, null, 2));
    console.log('👤 [Backend CourseService] Instructor ID:', instructorId);
    
    try {
      console.log('🔧 [Backend CourseService] Building course object...');
      
      // Create course object with all required fields from the frontend
      const course: any = {
        title: courseData.title,
        description: courseData.description,
        shortDescription: courseData.shortDescription || courseData.description?.substring(0, 150),
        instructorId: instructorId || courseData.instructorId,
        instructorName: courseData.instructorName || '',
        category: courseData.category,
        level: courseData.level,
        language: courseData.language || 'en',
        price: courseData.price || 0,
        currency: courseData.currency || 'USD',
        isFree: courseData.isFree || false,
        thumbnailUrl: courseData.thumbnailUrl || '',
        previewVideoUrl: courseData.previewVideoUrl || '',
        duration: courseData.duration || 0,
        durationText: courseData.durationText || '0 minutes',
        lessonsCount: courseData.lessonsCount || 0,
        objectives: courseData.objectives || [],
        prerequisites: courseData.prerequisites || [],
        targetAudience: courseData.targetAudience || [],
        difficultyScore: courseData.difficultyScore || 1,
        timeCommitment: courseData.timeCommitment || 'Self-paced',
        certificateAvailable: courseData.certificateAvailable || false,
        tags: courseData.tags || [],
        videos: Array.isArray(courseData.videos)
          ? courseData.videos.map((video: any, index: number) => ({
              id: video.id || `video-${index + 1}`,
              title: video.title || `Video ${index + 1}`,
              description: video.description || '',
              thumbnailUrl: video.thumbnailUrl || '',
              videoUrl: video.videoUrl || '',
            }))
          : [],
        slug: courseData.slug || '',
        
        // Status and metadata
        status: 'draft',
        enrollmentCount: 0,
        completionCount: 0,
        averageRating: 0,
        ratingCount: 0,
        reviewCount: 0,
        featured: false,
        trending: false,
        bestseller: false,
        isLaunched: false,
        
        // Access duration
        accessDuration: {
          type: 'lifetime'
        },
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('✅ [Backend CourseService] Course object built, preparing for Firestore...');
      console.log('⏰ [Backend CourseService] Starting Firestore add operation at:', new Date().toISOString());
      
      const docRef = await this.coursesCollection.add(course);
      
      console.log('✅ [Backend CourseService] Firestore add completed, ID:', docRef.id);
      console.log('⏰ [Backend CourseService] Firestore add completed at:', new Date().toISOString());
      
      const result = { ...course, id: docRef.id };
      this.logLifecycleEvent({
        action: 'create',
        courseId: docRef.id,
        actorId: instructorId || courseData.instructorId,
        toStatus: course.status,
      });
      
      console.log('✅ [Backend CourseService] Course created successfully with ID:', docRef.id);
      console.log('⏰ [Backend CourseService] createCourse completed at:', new Date().toISOString());
      return result;
    } catch (error: any) {
      console.error('❌ [Backend CourseService] Error creating course:', error);
      console.error('❌ [Backend CourseService] Error stack:', error?.stack);
      throw error;
    }
  }

  /**
   * Get course by ID
   */
  async getCourseById(courseId: string): Promise<Course | null> {
    const doc = await this.coursesCollection.doc(courseId).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as Course) : null;
  }

  /**
   * Update course
   */
  async updateCourse(
    courseId: string,
    updatesOrInstructorId: Partial<Course> | string,
    maybeUpdates?: Partial<Course>
  ): Promise<Course> {
    const isInstructorScoped = typeof updatesOrInstructorId === 'string';
    const updates = isInstructorScoped ? (maybeUpdates || {}) : updatesOrInstructorId;

    if (isInstructorScoped) {
      const instructorId = updatesOrInstructorId as string;
      const existingCourse = await this.getCourseOrThrow(courseId);
      this.assertInstructorOwnership(existingCourse, instructorId);
    }

    const sanitizeForFirestore = (value: any): any => {
      if (value === undefined) {
        return undefined;
      }

      if (value === null || value instanceof Date) {
        return value;
      }

      if (Array.isArray(value)) {
        return value
          .map(item => sanitizeForFirestore(item))
          .filter(item => item !== undefined);
      }

      if (typeof value === 'object') {
        const entries = Object.entries(value)
          .map(([key, item]) => [key, sanitizeForFirestore(item)] as const)
          .filter(([, item]) => item !== undefined);

        if (entries.length === 0) {
          return undefined;
        }

        return Object.fromEntries(entries);
      }

      return value;
    };

    const sanitizedUpdates = sanitizeForFirestore(updates) || {};

    await this.coursesCollection.doc(courseId).update({
      ...sanitizedUpdates,
      updatedAt: new Date(),
    });
    this.logLifecycleEvent({
      action: 'update',
      courseId,
      actorId: isInstructorScoped ? (updatesOrInstructorId as string) : undefined,
    });

    const doc = await this.coursesCollection.doc(courseId).get();
    return { id: doc.id, ...doc.data() } as Course;
  }

  /**
   * Delete course
   */
  async deleteCourse(courseId: string, _instructorId?: string): Promise<void> {
    if (_instructorId) {
      const existingCourse = await this.getCourseOrThrow(courseId);
      this.assertInstructorOwnership(existingCourse, _instructorId);
    }
    await this.coursesCollection.doc(courseId).delete();
    this.logLifecycleEvent({
      action: 'delete',
      courseId,
      actorId: _instructorId,
    });
  }

  /**
   * Search courses
   */
  async searchCourses(filters: {
    query?: string;
    category?: string;
    level?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ courses: Course[]; total: number; hasMore: boolean }> {
    let query: any = this.coursesCollection;

    // Apply filters
    if (filters.category) {
      query = query.where('category', '==', filters.category);
    }
    if (filters.level) {
      query = query.where('level', '==', filters.level);
    }
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    // Search by title
    if (filters.query) {
      query = query.where('title', '>=', filters.query);
      query = query.where('title', '<=', filters.query + '\uf8ff');
    }

    // Pagination
    const limit = filters.limit || 10;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    query = query.orderBy('createdAt', 'desc').limit(limit).offset(offset);

    try {
      const snapshot = await query.get();
      const courses = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Course));

      return {
        courses,
        total: courses.length,
        hasMore: courses.length === limit,
      };
    } catch (error: any) {
      const isMissingIndex =
        error?.code === 9 ||
        String(error?.message || '').includes('FAILED_PRECONDITION') ||
        String(error?.message || '').includes('requires an index');

      if (!isMissingIndex) {
        throw error;
      }

      // Fallback for environments missing composite indexes:
      // fetch a bounded set and filter/sort in memory.
      const fallbackSnapshot = await this.coursesCollection.limit(200).get();
      let fallbackCourses = fallbackSnapshot.docs.map(
        (doc: any) => ({ id: doc.id, ...doc.data() } as Course),
      );

      if (filters.status) {
        fallbackCourses = fallbackCourses.filter(
          course => (course as any).status === filters.status,
        );
      }

      if (filters.category) {
        fallbackCourses = fallbackCourses.filter(
          course => course.category === filters.category,
        );
      }

      if (filters.level) {
        fallbackCourses = fallbackCourses.filter(
          course => course.level === filters.level,
        );
      }

      if (filters.query) {
        const needle = filters.query.toLowerCase();
        fallbackCourses = fallbackCourses.filter(
          course => (course.title || '').toLowerCase().includes(needle),
        );
      }

      fallbackCourses.sort((a: any, b: any) => {
        const aTime = a?.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a?.createdAt || 0).getTime();
        const bTime = b?.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b?.createdAt || 0).getTime();
        return bTime - aTime;
      });

      const start = offset;
      const end = start + limit;
      const paged = fallbackCourses.slice(start, end);

      return {
        courses: paged,
        total: fallbackCourses.length,
        hasMore: end < fallbackCourses.length,
      };
    }
  }

  /**
   * Get instructor courses
   */
  async getInstructorCourses(instructorId: string): Promise<Course[]> {
    const snapshot = await this.coursesCollection
      .where('instructorId', '==', instructorId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
  }

  /**
   * Get instructor stats
   */
  async getInstructorStats(instructorId: string): Promise<InstructorStats> {
    const courses = await this.getInstructorCourses(instructorId);
    
    const publishedCourses = courses.filter(c => c.status === 'published');
    const totalStudents = publishedCourses.reduce((sum, course) => sum + course.enrollmentCount, 0);
    const totalRevenue = publishedCourses.reduce((sum, course) => sum + (course.price * course.enrollmentCount), 0);
    const averageRating = publishedCourses.length > 0 
      ? publishedCourses.reduce((sum, course) => sum + course.rating, 0) / publishedCourses.length 
      : 0;

    return {
      totalCourses: courses.length,
      publishedCourses: publishedCourses.length,
      totalStudents,
      totalRevenue,
      averageRating,
    };
  }

  /**
   * Generate slug from title
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Format duration
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Enroll student in course
   */
  async enrollInCourse(courseId: string, studentId: string, paymentId?: string): Promise<any> {
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    if (course.status !== 'published') {
      throw this.createHttpError('Only published courses can be enrolled', 403);
    }

    const isPaidCourse = !Boolean((course as any).isFree) && Number(course.price || 0) > 0;
    if (isPaidCourse && !paymentId) {
      throw this.createHttpError('Payment is required before enrollment', 402);
    }

    // Check if already enrolled
    const existingEnrollment = await this.enrollmentsCollection
      .where('courseId', '==', courseId)
      .where('studentId', '==', studentId)
      .limit(1)
      .get();

    if (!existingEnrollment.empty) {
      throw new Error('Already enrolled in this course');
    }

    // Create enrollment
    const enrollment = {
      courseId,
      studentId,
      enrolledAt: new Date(),
      progress: 0,
      completedAt: null,
      status: 'active',
      paymentId: paymentId || null,
    };

    const enrollmentDoc = await this.enrollmentsCollection.add(enrollment);

    // Update course enrollment count
    const courseRef = this.coursesCollection.doc(courseId);
    await courseRef.update({
      enrollmentCount: FieldValue.increment(1),
    });

    return { id: enrollmentDoc.id, ...enrollment };
  }

  /**
   * Get student enrollments
   */
  async getStudentEnrollments(studentId: string): Promise<any[]> {
    try {
      const snapshot = await this.enrollmentsCollection
        .where('studentId', '==', studentId)
        .orderBy('enrolledAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error: any) {
      const message = String(error?.message || '');
      const code = String(error?.code || '');
      const isMissingIndex =
        code === '9' ||
        message.includes('FAILED_PRECONDITION') ||
        message.toLowerCase().includes('requires an index');

      if (!isMissingIndex) throw error;

      // Fallback query avoids composite index dependency; maintain expected order in memory.
      const fallbackSnapshot = await this.enrollmentsCollection
        .where('studentId', '==', studentId)
        .get();

      const enrollments = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      enrollments.sort((a: any, b: any) => {
        const aTime = a?.enrolledAt?.toDate
          ? a.enrolledAt.toDate().getTime()
          : new Date(a?.enrolledAt || 0).getTime();
        const bTime = b?.enrolledAt?.toDate
          ? b.enrolledAt.toDate().getTime()
          : new Date(b?.enrolledAt || 0).getTime();
        return bTime - aTime;
      });

      return enrollments;
    }
  }

  /**
   * Create enhanced course (alias for createCourse)
   */
  async createEnhancedCourse(courseData: CourseInput, instructorId: string): Promise<Course> {
    return this.createCourse(courseData);
  }

  /**
   * Get enhanced course by ID (alias for getCourseById)
   */
  async getEnhancedCourseById(courseId: string): Promise<Course | null> {
    return this.getCourseById(courseId);
  }

  /**
   * Get enhanced enrollment (alias for getStudentEnrollments)
   */
  async getEnhancedEnrollment(enrollmentId: string): Promise<any> {
    const doc = await this.enrollmentsCollection.doc(enrollmentId).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() }) : null;
  }

  /**
   * Get student video progress (placeholder)
   */
  async getStudentVideoProgress(studentId: string, courseId: string): Promise<any[]> {
    // Placeholder implementation
    return [];
  }

  /**
   * Update video progress (placeholder)
   */
  async updateVideoProgress(enrollmentId: string, videoId: string, progress: any): Promise<void> {
    // Placeholder implementation
  }

  /**
   * Calculate course progress (placeholder)
   */
  async calculateCourseProgress(enrollmentId: string): Promise<number> {
    // Placeholder implementation
    return 0;
  }

  async getCourseBySlug(slug: string): Promise<Course | null> {
    const snapshot = await this.coursesCollection.where('slug', '==', slug).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Course;
  }

  async getMyCourses(instructorId: string): Promise<Course[]> {
    return this.getInstructorCourses(instructorId);
  }

  async submitForApproval(courseId: string, _instructorId: string): Promise<Course> {
    const existingCourse = await this.getCourseOrThrow(courseId);
    this.assertInstructorOwnership(existingCourse, _instructorId);

    if (existingCourse.status !== 'draft') {
      throw this.createHttpError(
        `Only draft courses can be submitted for approval (current status: ${existingCourse.status})`,
        400
      );
    }

    const validationIssues = this.validateCourseForSubmission(existingCourse);
    if (validationIssues.length > 0) {
      throw this.createHttpError('Course is not ready for submission', 400, {
        missingFields: validationIssues,
      });
    }

    await this.coursesCollection.doc(courseId).update({
      status: 'pending',
      submittedAt: new Date(),
      submittedBy: _instructorId,
      rejectionReason: null,
      rejectedBy: null,
      rejectedAt: null,
      updatedAt: new Date(),
    });
    this.logLifecycleEvent({
      action: 'submit_for_approval',
      courseId,
      actorId: _instructorId,
      fromStatus: existingCourse.status,
      toStatus: 'pending',
    });
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    return course;
  }

  async approveCourse(courseId: string, _adminId: string): Promise<Course> {
    const existingCourse = await this.getCourseOrThrow(courseId);
    if (existingCourse.status !== 'pending') {
      throw this.createHttpError(
        `Only pending courses can be approved (current status: ${existingCourse.status})`,
        400
      );
    }

    await this.coursesCollection.doc(courseId).update({
      status: 'published',
      approvedBy: _adminId,
      approvedAt: new Date(),
      publishedAt: new Date(),
      rejectionReason: null,
      updatedAt: new Date(),
    });
    this.logLifecycleEvent({
      action: 'approve',
      courseId,
      actorId: _adminId,
      fromStatus: existingCourse.status,
      toStatus: 'published',
    });
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    return course;
  }

  async rejectCourse(courseId: string, _adminId: string, reason: string): Promise<Course> {
    const existingCourse = await this.getCourseOrThrow(courseId);
    if (existingCourse.status !== 'pending') {
      throw this.createHttpError(
        `Only pending courses can be rejected (current status: ${existingCourse.status})`,
        400
      );
    }

    await this.coursesCollection.doc(courseId).update({
      status: 'draft',
      rejectionReason: reason,
      rejectedBy: _adminId,
      rejectedAt: new Date(),
      updatedAt: new Date(),
    });
    this.logLifecycleEvent({
      action: 'reject',
      courseId,
      actorId: _adminId,
      fromStatus: existingCourse.status,
      toStatus: 'draft',
      details: `reason: ${reason}`,
    });
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    return course;
  }

  async getPendingCourses(): Promise<Course[]> {
    try {
      const snapshot = await this.coursesCollection
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Course));
    } catch (error: any) {
      const message = error?.message || '';
      const code = error?.code || '';
      const isMissingIndex =
        code === 9 ||
        code === '9' ||
        message.includes('FAILED_PRECONDITION') ||
        message.toLowerCase().includes('requires an index');

      // Graceful fallback while composite index is being created/deployed.
      if (!isMissingIndex) throw error;

      const fallbackSnapshot = await this.coursesCollection
        .where('status', '==', 'pending')
        .get();

      const courses = fallbackSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Course));
      courses.sort((a: any, b: any) => {
        const aTime = a?.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a?.createdAt || 0).getTime();
        const bTime = b?.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b?.createdAt || 0).getTime();
        return bTime - aTime;
      });
      return courses;
    }
  }

  async getMyEnrollments(studentId: string): Promise<any[]> {
    return this.getStudentEnrollments(studentId);
  }

  async getCourseEnrollments(courseId: string, _instructorId?: string): Promise<any[]> {
    if (_instructorId) {
      const existingCourse = await this.getCourseOrThrow(courseId);
      this.assertInstructorOwnership(existingCourse, _instructorId);
    }

    const snapshot = await this.enrollmentsCollection.where('courseId', '==', courseId).get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  }

  async updateLessonProgress(
    enrollmentId: string,
    lessonId: string,
    _studentId: string,
    progressData: { watchedDuration?: number; totalDuration?: number; lastPosition?: number; completed?: boolean }
  ): Promise<{ enrollmentId: string; lessonId: string; progress: number }> {
    await this.updateVideoProgress(enrollmentId, lessonId, progressData);
    const progress = await this.calculateCourseProgress(enrollmentId);
    return { enrollmentId, lessonId, progress };
  }

  async addReview(courseId: string, studentId: string, reviewData: any): Promise<any> {
    const review = {
      courseId,
      studentId,
      rating: reviewData?.rating ?? 0,
      comment: reviewData?.comment ?? '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const doc = await this.reviewsCollection.add(review);
    return { id: doc.id, ...review };
  }

  async getCourseReviews(
    courseId: string,
    page: number = 1,
    limit: number = 20,
    _sort: string = 'newest'
  ): Promise<{ reviews: any[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const snapshot = await this.reviewsCollection
      .where('courseId', '==', courseId)
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(limit)
      .get();
    const reviews = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    return { reviews, total: reviews.length, page, limit };
  }

  async getFeaturedCourses(limit: number = 10): Promise<Course[]> {
    const snapshot = await this.coursesCollection
      .where('status', '==', 'published')
      .where('featured', '==', true)
      .limit(limit)
      .get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Course));
  }

  async getTrendingCourses(limit: number = 10): Promise<Course[]> {
    const snapshot = await this.coursesCollection
      .where('status', '==', 'published')
      .where('trending', '==', true)
      .limit(limit)
      .get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Course));
  }

  async getBestsellerCourses(limit: number = 10): Promise<Course[]> {
    const snapshot = await this.coursesCollection
      .where('status', '==', 'published')
      .where('bestseller', '==', true)
      .limit(limit)
      .get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Course));
  }

  async purchaseCourse(
    courseId: string,
    studentId: string,
    paymentId?: string,
    pricingOption?: string,
    customDuration?: string
  ): Promise<any> {
    const purchase = {
      courseId,
      studentId,
      paymentId: paymentId || null,
      pricingOption: pricingOption || null,
      customDuration: customDuration || null,
      amount: 0,
      purchasedAt: new Date(),
    };
    const doc = await db.collection('coursePurchases').add(purchase);
    return { id: doc.id, ...purchase };
  }

  async getStudentPurchases(studentId: string): Promise<any[]> {
    const snapshot = await db.collection('coursePurchases').where('studentId', '==', studentId).get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  }

  async hasCourseAccess(courseId: string, studentId: string): Promise<boolean> {
    const [enrollments, purchases] = await Promise.all([
      this.enrollmentsCollection
        .where('courseId', '==', courseId)
        .where('studentId', '==', studentId)
        .limit(1)
        .get(),
      db.collection('coursePurchases')
        .where('courseId', '==', courseId)
        .where('studentId', '==', studentId)
        .limit(1)
        .get(),
    ]);
    return !enrollments.empty || !purchases.empty;
  }

  async launchCourse(courseId: string, _instructorId: string): Promise<Course> {
    const existingCourse = await this.getCourseOrThrow(courseId);
    this.assertInstructorOwnership(existingCourse, _instructorId);
    if (existingCourse.status !== 'published') {
      throw this.createHttpError(
        `Only published courses can be launched (current status: ${existingCourse.status})`,
        400
      );
    }

    await this.coursesCollection.doc(courseId).update({
      isLaunched: true,
      launchDate: new Date(),
      updatedAt: new Date(),
    });
    this.logLifecycleEvent({
      action: 'launch',
      courseId,
      actorId: _instructorId,
      fromStatus: existingCourse.status,
      toStatus: existingCourse.status,
    });
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    return course;
  }

  async issueCertificate(courseId: string, studentId: string, enrollmentId?: string): Promise<any> {
    const certificate = {
      studentId,
      courseId,
      enrollmentId: enrollmentId || null,
      verificationCode: this.generateSlug(`${courseId}-${studentId}-${Date.now()}`).slice(0, 12).toUpperCase(),
      issuedAt: new Date(),
      isRevoked: false,
    };
    const doc = await db.collection('courseCertificates').add(certificate);
    return { id: doc.id, ...certificate };
  }

  async getStudentCertificates(studentId: string): Promise<any[]> {
    const snapshot = await db
      .collection('courseCertificates')
      .where('studentId', '==', studentId)
      .where('isRevoked', '==', false)
      .get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  }

  async verifyCertificate(verificationCode: string): Promise<any | null> {
    const snapshot = await db
      .collection('courseCertificates')
      .where('verificationCode', '==', verificationCode)
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
}

export const courseService = new CourseService();
