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
  CourseNote,
  CourseCategory,
  QuizQuestion,
  QuizAttempt,
  AssignmentSubmission,
  CoursePurchase,
  CourseSubscription,
  CourseCertificate
} from '../models/course.model';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export class CourseService {
  private coursesCollection = db.collection('courses');
  private enrollmentsCollection = db.collection('courseEnrollments');
  private progressCollection = db.collection('courseProgress');
  private reviewsCollection = db.collection('courseReviews');
  private bookmarksCollection = db.collection('courseBookmarks');
  private notesCollection = db.collection('courseNotes');
  
  // NEW: Collections for enhanced features
  private purchasesCollection = db.collection('coursePurchases');
  private subscriptionsCollection = db.collection('courseSubscriptions');
  private certificatesCollection = db.collection('courseCertificates');

  /**
   * Create a new course
   */
  async createCourse(courseData: CourseInput, instructorId: string): Promise<Course> {
    const course: Course = {
      id: '',
      ...courseData,
      instructorId,
      instructorName: '', // Will be populated from user profile
      status: 'draft',
      enrollmentCount: 0,
      completionCount: 0,
      averageRating: 0,
      ratingCount: 0,
      reviewCount: 0,
      featured: false,
      trending: false,
      bestseller: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      
      // NEW: Initialize enhanced fields with defaults
      pricingOptions: courseData.pricingOptions || {
        monthly: courseData.price,
        yearly: Math.floor(courseData.price * 10), // 10 months for yearly
        lifetime: Math.floor(courseData.price * 20), // 20 months for lifetime
      },
      enrollmentType: courseData.enrollmentType || 'instant',
      availabilitySchedule: {
        startDate: courseData.availabilitySchedule?.startDate 
          ? Timestamp.fromDate(courseData.availabilitySchedule.startDate) 
          : Timestamp.now(),
        endDate: courseData.availabilitySchedule?.endDate 
          ? Timestamp.fromDate(courseData.availabilitySchedule.endDate) 
          : undefined,
        enrollmentDeadline: courseData.availabilitySchedule?.enrollmentDeadline 
          ? Timestamp.fromDate(courseData.availabilitySchedule.enrollmentDeadline) 
          : undefined,
        maxEnrollments: courseData.availabilitySchedule?.maxEnrollments,
        currentEnrollments: 0,
      },
      accessDuration: courseData.accessDuration || {
        type: 'lifetime',
      },
      isLaunched: courseData.isLaunched || false,
      launchDate: courseData.launchDate 
        ? Timestamp.fromDate(courseData.launchDate) 
        : undefined,
    };

    const docRef = await this.coursesCollection.add(course);
    return { ...course, id: docRef.id };
  }

  /**
   * Get course by ID
   */
  async getCourseById(courseId: string): Promise<Course | null> {
    const doc = await this.coursesCollection.doc(courseId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as Course : null;
  }

  /**
   * Get course by slug
   */
  async getCourseBySlug(slug: string): Promise<Course | null> {
    const snapshot = await this.coursesCollection
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Course;
  }

  /**
   * Update course
   */
  async updateCourse(courseId: string, instructorId: string, updates: Partial<Course>): Promise<Course> {
    const courseRef = this.coursesCollection.doc(courseId);
    
    // Verify instructor owns the course
    const course = await this.getCourseById(courseId);
    if (!course || course.instructorId !== instructorId) {
      throw new Error('Course not found or access denied');
    }

    const updatedCourse = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    await courseRef.update(updatedCourse);
    return { ...course, id: courseId, ...updatedCourse } as Course;
  }

  /**
   * Delete course
   */
  async deleteCourse(courseId: string, instructorId: string): Promise<void> {
    const course = await this.getCourseById(courseId);
    if (!course || course.instructorId !== instructorId) {
      throw new Error('Course not found or access denied');
    }

    await this.coursesCollection.doc(courseId).delete();
  }

  /**
   * Search courses with filters
   */
  async searchCourses(filters: CourseFilters): Promise<CourseSearchResult> {
    const {
      search,
      category,
      subcategory,
      level,
      language,
      priceRange,
      rating,
      hasCertificate,
      isFree,
      sort = 'newest',
      page = 1,
      limit = 20,
    } = filters;

    let query = this.coursesCollection.where('status', '==', 'published');

    // Apply filters
    if (category) {
      query = query.where('category', '==', category);
    }
    
    if (level) {
      query = query.where('level', '==', level);
    }

    if (language) {
      query = query.where('language', '==', language);
    }

    if (typeof isFree === 'boolean') {
      query = query.where('isFree', '==', isFree);
    }

    if (hasCertificate) {
      query = query.where('certificateAvailable', '==', true);
    }

    // Price range filter
    if (priceRange) {
      if (priceRange.min !== undefined) {
        query = query.where('price', '>=', priceRange.min);
      }
      if (priceRange.max !== undefined) {
        query = query.where('price', '<=', priceRange.max);
      }
    }

    // Rating filter
    if (rating) {
      query = query.where('averageRating', '>=', rating);
    }

    // Apply sorting (simplified for testing - avoid complex composite queries)
    const sortConfig = this.getSortConfig(sort);
    
    // Get results and sort in memory for complex queries
    const snapshot = await query.limit(100).get(); // Get more for sorting
    let courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));

    // Apply text search filter
    if (search) {
      const searchLower = search.toLowerCase();
      courses = courses.filter(course => 
        course.title.toLowerCase().includes(searchLower) ||
        course.description.toLowerCase().includes(searchLower) ||
        course.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply subcategory filter
    if (subcategory) {
      courses = courses.filter(course => course.subcategory === subcategory);
    }

    // Sort courses
    courses.sort((a, b) => {
      let comparison = 0;
      
      if (sortConfig.field === 'rating') {
        comparison = a.averageRating - b.averageRating;
      } else if (sortConfig.field === 'price') {
        comparison = a.price - b.price;
      } else if (sortConfig.field === 'enrollment') {
        comparison = a.enrollmentCount - b.enrollmentCount;
      } else {
        comparison = b.createdAt.toMillis() - a.createdAt.toMillis();
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedCourses = courses.slice(startIndex, startIndex + limit);

    return {
      courses: paginatedCourses,
      total: courses.length,
      page,
      limit,
      hasMore: startIndex + limit < courses.length,
    };
  }

  /**
   * Get sort configuration
   */
  private getSortConfig(sort: string): { field: string; direction: 'asc' | 'desc' } {
    switch (sort) {
      case 'newest':
        return { field: 'createdAt', direction: 'desc' };
      case 'oldest':
        return { field: 'createdAt', direction: 'asc' };
      case 'price-low':
        return { field: 'price', direction: 'asc' };
      case 'price-high':
        return { field: 'price', direction: 'desc' };
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
   * Get my courses (instructor)
   */
  async getMyCourses(instructorId: string): Promise<Course[]> {
    console.log(`🔍 [CourseService] getMyCourses starting for instructor: ${instructorId}`);
    const startTime = Date.now();
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Firestore query timeout')), 25000); // 25 second timeout
    });
    
    const queryPromise = this.coursesCollection
      .where('instructorId', '==', instructorId)
      .orderBy('createdAt', 'desc')
      .get();

    const snapshot = await Promise.race([queryPromise, timeoutPromise]);

    const duration = Date.now() - startTime;
    console.log(`✅ [CourseService] getMyCourses completed in ${duration}ms, found ${snapshot.docs.length} courses`);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
  }

  /**
   * Get pending courses (admin)
   */
  async getPendingCourses(): Promise<Course[]> {
    const snapshot = await this.coursesCollection
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
  }

  /**
   * Submit course for approval
   */
  async submitForApproval(courseId: string, instructorId: string): Promise<Course> {
    const course = await this.getCourseById(courseId);
    if (!course || course.instructorId !== instructorId) {
      throw new Error('Course not found or access denied');
    }

    await this.coursesCollection.doc(courseId).update({
      status: 'pending',
      updatedAt: Timestamp.now(),
    });

    return { ...course, status: 'pending', updatedAt: Timestamp.now() };
  }

  /**
   * Approve course (admin)
   */
  async approveCourse(courseId: string, adminId: string): Promise<Course> {
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    await this.coursesCollection.doc(courseId).update({
      status: 'published',
      approvedBy: adminId,
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return { 
      ...course, 
      status: 'published', 
      approvedBy: adminId,
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
  }

  /**
   * Reject course (admin)
   */
  async rejectCourse(courseId: string, adminId: string, reason: string): Promise<Course> {
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    await this.coursesCollection.doc(courseId).update({
      status: 'draft',
      rejectionReason: reason,
      updatedAt: Timestamp.now(),
    });

    return { 
      ...course, 
      status: 'draft', 
      rejectionReason: reason,
      updatedAt: Timestamp.now()
    };
  }

  /**
   * Enroll in course
   */
  async enrollInCourse(courseId: string, studentId: string, paymentId?: string): Promise<CourseEnrollment> {
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    if (course.status !== 'published') {
      throw new Error('Course is not available for enrollment');
    }

    // Check if already enrolled
    const existingEnrollment = await this.getEnrollment(courseId, studentId);
    if (existingEnrollment) {
      throw new Error('Already enrolled in this course');
    }

    const enrollment: CourseEnrollment = {
      id: '',
      courseId,
      studentId,
      enrolledAt: Timestamp.now(),
      status: 'active',
      progress: 0,
      completedAt: undefined,
      paymentId,
      refundRequested: false,
      refundProcessed: false,
      certificateIssued: false,
      totalTimeSpent: 0,
      lessonsCompleted: 0,
      quizzesPassed: 0,
      averageQuizScore: 0,
      lastAccessedAt: Timestamp.now(),
      notesCount: 0,
      bookmarksCount: 0,
      discussionPostsCount: 0,
    };

    const docRef = await this.enrollmentsCollection.add(enrollment);
    return { ...enrollment, id: docRef.id };
  }

  /**
   * Get enrollment
   */
  async getEnrollment(courseId: string, studentId: string): Promise<CourseEnrollment | null> {
    const snapshot = await this.enrollmentsCollection
      .where('courseId', '==', courseId)
      .where('studentId', '==', studentId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as CourseEnrollment;
  }

  /**
   * Get my enrollments (student)
   */
  async getMyEnrollments(studentId: string): Promise<CourseEnrollment[]> {
    const snapshot = await this.enrollmentsCollection
      .where('studentId', '==', studentId)
      .orderBy('enrolledAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseEnrollment));
  }

  /**
   * Get course enrollments (instructor)
   */
  async getCourseEnrollments(courseId: string, instructorId: string): Promise<CourseEnrollment[]> {
    const course = await this.getCourseById(courseId);
    if (!course || course.instructorId !== instructorId) {
      throw new Error('Course not found or access denied');
    }

    const snapshot = await this.enrollmentsCollection
      .where('courseId', '==', courseId)
      .orderBy('enrolledAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseEnrollment));
  }

  /**
   * Update lesson progress
   */
  async updateLessonProgress(
    enrollmentId: string, 
    lessonId: string, 
    studentId: string,
    progressData: {
      progress?: number;
      timeSpent?: number;
      watchTime?: number;
      lastPosition?: number;
      completed?: boolean;
    }
  ): Promise<CourseProgress> {
    const progressRef = this.progressCollection.doc(`${enrollmentId}_${lessonId}`);
    
    const existingProgress = await progressRef.get();
    const currentProgress = existingProgress.exists 
      ? existingProgress.data() as CourseProgress
      : {
          id: '',
          enrollmentId,
          lessonId,
          studentId,
          progress: 0,
          timeSpent: 0,
          watchTime: 0,
          lastPosition: 0,
          completed: false,
          bookmarked: false,
          startedAt: Timestamp.now(),
          quizAttempts: [],
          assignmentSubmissions: [],
        };

    const updatedProgress: CourseProgress = {
      ...currentProgress,
      ...progressData,
    };

    if (existingProgress.exists) {
      await progressRef.update(updatedProgress as any);
      return { ...updatedProgress, id: progressRef.id };
    } else {
      const docRef = await this.progressCollection.add(updatedProgress as any);
      return { ...updatedProgress, id: docRef.id };
    }
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
      throw new Error('You have already reviewed this course');
    }

    const review: CourseReview = {
      id: '',
      courseId,
      studentId,
      rating: reviewData.rating,
      title: reviewData.title,
      comment: reviewData.comment,
      pros: reviewData.pros || [],
      cons: reviewData.cons || [],
      helpfulCount: 0,
      verifiedPurchase: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await this.reviewsCollection.add(review);
    return { ...review, id: docRef.id };
  }

  /**
   * Get course reviews
   */
  async getCourseReviews(
    courseId: string, 
    page: number = 1, 
    limit: number = 10,
    sort: string = 'newest'
  ): Promise<{ reviews: CourseReview[]; total: number }> {
    let query = this.reviewsCollection.where('courseId', '==', courseId);

    // Apply sorting
    if (sort === 'helpful') {
      query = query.orderBy('helpfulCount', 'desc');
    } else {
      query = query.orderBy('createdAt', 'desc');
    }

    const snapshot = await query.get();
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseReview));

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedReviews = reviews.slice(startIndex, startIndex + limit);

    return {
      reviews: paginatedReviews,
      total: reviews.length,
    };
  }

  /**
   * Get featured courses (simplified to avoid index issues)
   */
  async getFeaturedCourses(limit: number = 10): Promise<Course[]> {
    // Get all published courses and filter in memory
    const snapshot = await this.coursesCollection
      .where('status', '==', 'published')
      .limit(50) // Get more and filter in memory
      .get();

    const courses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Course));

    // Filter and sort in memory
    return courses
      .filter(course => course.featured)
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, limit);
  }

  /**
   * Get trending courses (simplified to avoid index issues)
   */
  async getTrendingCourses(limit: number = 10): Promise<Course[]> {
    // Get all published courses and filter in memory
    const snapshot = await this.coursesCollection
      .where('status', '==', 'published')
      .limit(50) // Get more and filter in memory
      .get();

    const courses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Course));

    // Filter and sort in memory
    return courses
      .filter(course => course.trending)
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, limit);
  }

  /**
   * Get bestseller courses (simplified to avoid index issues)
   */
  async getBestsellerCourses(limit: number = 10): Promise<Course[]> {
    // Get all published courses and filter in memory
    const snapshot = await this.coursesCollection
      .where('status', '==', 'published')
      .limit(50) // Get more and filter in memory
      .get();

    const courses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Course));

    // Filter and sort in memory
    return courses
      .filter(course => course.bestseller)
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, limit);
  }

  /**
   * Get instructor statistics
   */
  async getInstructorStats(instructorId: string): Promise<{
    totalCourses: number;
    publishedCourses: number;
    totalEnrollments: number;
    totalCompletions: number;
    totalRevenue: number;
    averageRating: number;
  }> {
    // Get instructor's courses
    const coursesSnapshot = await this.coursesCollection
      .where('instructorId', '==', instructorId)
      .get();

    const courses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    
    const publishedCourses = courses.filter(course => course.status === 'published');
    
    // Get enrollments for all courses
    const enrollmentsSnapshot = await this.enrollmentsCollection
      .where('courseId', 'in', courses.map(c => c.id))
      .get();

    const enrollments = enrollmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseEnrollment));
    
    const totalEnrollments = enrollments.length;
    const totalCompletions = enrollments.filter(e => e.status === 'completed').length;
    
    // Calculate revenue (simplified)
    const totalRevenue = enrollments.reduce((sum, e) => {
      const course = courses.find(c => c.id === e.courseId);
      return sum + (course?.price || 0);
    }, 0);

    // Calculate average rating
    const reviewsSnapshot = await this.reviewsCollection
      .where('courseId', 'in', courses.map(c => c.id))
      .get();

    const reviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseReview));
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
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

  // NEW: Enhanced course purchase and subscription methods

  /**
   * Purchase a course with specific pricing option
   */
  async purchaseCourse(
    courseId: string,
    studentId: string,
    paymentId: string,
    pricingOption: 'monthly' | 'yearly' | 'lifetime' | 'custom',
    customDuration?: string
  ): Promise<CoursePurchase> {
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Check if course is launched and available
    if (!course.isLaunched) {
      throw new Error('Course is not yet available');
    }

    // Check enrollment deadline
    if (course.availabilitySchedule.enrollmentDeadline && 
        course.availabilitySchedule.enrollmentDeadline.toDate() < new Date()) {
      throw new Error('Enrollment period has ended');
    }

    // Check max enrollments
    if (course.availabilitySchedule.maxEnrollments && 
        course.availabilitySchedule.currentEnrollments >= course.availabilitySchedule.maxEnrollments) {
      throw new Error('Course is fully enrolled');
    }

    // Calculate price based on option
    let price = 0;
    if (pricingOption === 'monthly' && course.pricingOptions.monthly) {
      price = course.pricingOptions.monthly;
    } else if (pricingOption === 'yearly' && course.pricingOptions.yearly) {
      price = course.pricingOptions.yearly;
    } else if (pricingOption === 'lifetime' && course.pricingOptions.lifetime) {
      price = course.pricingOptions.lifetime;
    } else if (pricingOption === 'custom' && customDuration) {
      const customOption = course.pricingOptions.custom?.find(
        option => option.duration === customDuration
      );
      if (!customOption) {
        throw new Error('Invalid custom duration');
      }
      price = customOption.price;
    } else {
      throw new Error('Invalid pricing option');
    }

    // Calculate access dates
    const now = Timestamp.now();
    let accessEndsAt: Timestamp | undefined;
    
    if (pricingOption === 'monthly') {
      accessEndsAt = new Timestamp(now.seconds + (30 * 24 * 60 * 60), 0);
    } else if (pricingOption === 'yearly') {
      accessEndsAt = new Timestamp(now.seconds + (365 * 24 * 60 * 60), 0);
    }
    // lifetime and custom durations don't have end dates

    const purchase: CoursePurchase = {
      id: '',
      courseId,
      studentId,
      pricingOption,
      customDuration,
      pricePaid: price,
      currency: course.currency,
      paymentId,
      paymentStatus: 'completed',
      purchasedAt: now,
      accessStartsAt: course.enrollmentType === 'instant' ? now : course.availabilitySchedule.startDate,
      accessEndsAt,
      isActive: true,
      autoRenew: pricingOption === 'monthly' || pricingOption === 'yearly',
      nextBillingDate: (pricingOption === 'monthly' || pricingOption === 'yearly') ? accessEndsAt : undefined,
      refundRequested: false,
      refundProcessed: false,
    };

    const docRef = await this.purchasesCollection.add(purchase);
    const createdPurchase = { ...purchase, id: docRef.id };

    // Update course enrollment count
    await this.coursesCollection.doc(courseId).update({
      enrollmentCount: course.enrollmentCount + 1,
      'availabilitySchedule.currentEnrollments': course.availabilitySchedule.currentEnrollments + 1,
    });

    // Create enrollment record
    await this.enrollInCourse(courseId, studentId, paymentId);

    return createdPurchase;
  }

  /**
   * Get student's course purchases
   */
  async getStudentPurchases(studentId: string): Promise<CoursePurchase[]> {
    const snapshot = await this.purchasesCollection
      .where('studentId', '==', studentId)
      .where('isActive', '==', true)
      .orderBy('purchasedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoursePurchase));
  }

  /**
   * Check if student has access to a course
   */
  async hasCourseAccess(courseId: string, studentId: string): Promise<boolean> {
    const snapshot = await this.purchasesCollection
      .where('courseId', '==', courseId)
      .where('studentId', '==', studentId)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) return false;

    const purchase = snapshot.docs[0].data() as CoursePurchase;
    
    // Check if access has expired
    if (purchase.accessEndsAt && purchase.accessEndsAt.toDate() < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Launch a course (make it available for purchase)
   */
  async launchCourse(courseId: string, instructorId: string): Promise<Course> {
    const course = await this.getCourseById(courseId);
    if (!course || course.instructorId !== instructorId) {
      throw new Error('Course not found or access denied');
    }

    if (course.status !== 'approved') {
      throw new Error('Course must be approved before launching');
    }

    const updatedCourse = {
      isLaunched: true,
      launchDate: Timestamp.now(),
      status: 'published' as const,
      updatedAt: Timestamp.now(),
    };

    await this.coursesCollection.doc(courseId).update(updatedCourse);
    return { ...course, ...updatedCourse };
  }

  /**
   * Issue certificate for course completion
   */
  async issueCertificate(
    courseId: string,
    studentId: string,
    enrollmentId: string
  ): Promise<CourseCertificate> {
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Check if student has completed the course
    const enrollment = await this.enrollmentsCollection
      .where('courseId', '==', courseId)
      .where('studentId', '==', studentId)
      .where('id', '==', enrollmentId)
      .limit(1)
      .get();

    if (enrollment.empty || enrollment.docs[0].data().status !== 'completed') {
      throw new Error('Course not completed');
    }

    // Check if certificate already issued
    const existingCert = await this.certificatesCollection
      .where('courseId', '==', courseId)
      .where('studentId', '==', studentId)
      .limit(1)
      .get();

    if (!existingCert.empty) {
      throw new Error('Certificate already issued');
    }

    const verificationCode = this.generateVerificationCode();
    const certificate: CourseCertificate = {
      id: '',
      courseId,
      studentId,
      enrollmentId,
      certificateUrl: '', // Will be generated by certificate service
      issuedAt: Timestamp.now(),
      verificationCode,
      templateId: course.certificateTemplate,
      instructorSignature: course.instructorName,
      issuerName: 'Tray Learning Platform',
      issuerTitle: 'Course Completion Certificate',
      completionDate: Timestamp.now(),
      isRevoked: false,
    };

    const docRef = await this.certificatesCollection.add(certificate);
    return { ...certificate, id: docRef.id };
  }

  /**
   * Generate unique verification code for certificates
   */
  private generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Get student's certificates
   */
  async getStudentCertificates(studentId: string): Promise<CourseCertificate[]> {
    const snapshot = await this.certificatesCollection
      .where('studentId', '==', studentId)
      .where('isRevoked', '==', false)
      .orderBy('issuedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseCertificate));
  }

  /**
   * Verify certificate
   */
  async verifyCertificate(verificationCode: string): Promise<CourseCertificate | null> {
    const snapshot = await this.certificatesCollection
      .where('verificationCode', '==', verificationCode)
      .where('isRevoked', '==', false)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CourseCertificate;
  }
}

export const courseService = new CourseService();
