// @ts-nocheck
// src/__tests__/courseLibrary.test.ts
import { courseService } from '../services/course.service';
import { CourseInput, CourseFilters } from '../models/course.model';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';

describe.skip('Course Library System', () => {
  let testInstructorId: string;
  let testStudentId: string;
  let testAdminId: string;
  let createdCourseId: string;
  let createdEnrollmentId: string;

  beforeAll(async () => {
    // Create test users
    testInstructorId = 'test-instructor-' + Date.now();
    testStudentId = 'test-student-' + Date.now();
    testAdminId = 'test-admin-' + Date.now();

    // Add test users to Firestore
    await db.collection('users').doc(testInstructorId).set({
      uid: testInstructorId,
      email: 'instructor@test.com',
      firstName: 'Test',
      lastName: 'Instructor',
      role: 'consultant',
      displayName: 'Test Instructor',
      bio: 'Test instructor bio',
      photoURL: 'https://example.com/avatar.jpg',
      createdAt: Timestamp.now(),
    });

    await db.collection('users').doc(testStudentId).set({
      uid: testStudentId,
      email: 'student@test.com',
      firstName: 'Test',
      lastName: 'Student',
      role: 'student',
      displayName: 'Test Student',
      createdAt: Timestamp.now(),
    });

    await db.collection('users').doc(testAdminId).set({
      uid: testAdminId,
      email: 'admin@test.com',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'admin',
      displayName: 'Test Admin',
      createdAt: Timestamp.now(),
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (createdCourseId) {
      await db.collection('courses').doc(createdCourseId).delete();
    }
    if (createdEnrollmentId) {
      await db.collection('courseEnrollments').doc(createdEnrollmentId).delete();
    }
    
    // Clean up test users
    await db.collection('users').doc(testInstructorId).delete();
    await db.collection('users').doc(testStudentId).delete();
    await db.collection('users').doc(testAdminId).delete();
  });

  describe('Course Creation', () => {
    test('should create a new course successfully', async () => {
      const courseData: CourseInput = {
        title: 'Test Course: React Development',
        description: 'A comprehensive course on React development covering hooks, state management, and best practices.',
        shortDescription: 'Learn React from scratch with hands-on projects.',
        category: 'Technology',
        subcategory: 'Web Development',
        tags: ['react', 'javascript', 'web development', 'frontend'],
        level: 'intermediate',
        language: 'English',
        price: 4999, // $49.99
        currency: 'USD',
        isFree: false,
        duration: 1200, // 20 hours
        durationText: '20 hours',
        lessonsCount: 25,
        objectives: [
          'Understand React fundamentals',
          'Master React Hooks',
          'Build real-world applications',
          'Implement state management'
        ],
        prerequisites: [
          'Basic JavaScript knowledge',
          'HTML/CSS understanding',
          'ES6+ features familiarity'
        ],
        targetAudience: [
          'Web developers',
          'Frontend developers',
          'JavaScript developers'
        ],
        difficultyScore: 6,
        timeCommitment: '5 hours per week',
        certificateAvailable: true,
        slug: 'react-development-test-course'
      };

      const course = await courseService.create(courseData, testInstructorId);

      expect(course).toBeDefined();
      expect(course.id).toBeDefined();
      expect(course.title).toBe(courseData.title);
      expect(course.instructorId).toBe(testInstructorId);
      expect(course.status).toBe('draft');
      expect(course.price).toBe(courseData.price);
      expect(course.certificateAvailable).toBe(true);

      createdCourseId = course.id;
    });

    test('should reject course creation for non-consultant users', async () => {
      const courseData: CourseInput = {
        title: 'Invalid Course',
        description: 'This should not be created',
        shortDescription: 'Invalid',
        category: 'Test',
        tags: [],
        level: 'beginner',
        language: 'English',
        price: 0,
        currency: 'USD',
        isFree: true,
        duration: 60,
        durationText: '1 hour',
        lessonsCount: 5,
        objectives: [],
        prerequisites: [],
        targetAudience: [],
        difficultyScore: 1,
        timeCommitment: '1 hour',
        certificateAvailable: false,
        slug: 'invalid-course'
      };

      await expect(courseService.create(courseData, testStudentId))
        .rejects.toThrow('Consultant access required');
    });
  });

  describe('Course Management', () => {
    test('should update course successfully', async () => {
      const updates = {
        title: 'Updated Test Course: Advanced React Development',
        description: 'Updated description with more advanced topics',
        price: 6999, // $69.99
      };

      const updatedCourse = await courseService.update(createdCourseId, testInstructorId, updates);

      expect(updatedCourse.title).toBe(updates.title);
      expect(updatedCourse.description).toBe(updates.description);
      expect(updatedCourse.price).toBe(updates.price);
    });

    test('should reject course update from non-instructor', async () => {
      const updates = { title: 'Hacked Course' };

      await expect(courseService.update(createdCourseId, testStudentId, updates))
        .rejects.toThrow('Only course instructor can update course');
    });

    test('should submit course for approval', async () => {
      // First, add a lesson to make it eligible for approval
      await db.collection('courseLessons').add({
        courseId: createdCourseId,
        title: 'Introduction to React',
        description: 'Getting started with React',
        order: 1,
        duration: 30,
        durationText: '30 minutes',
        type: 'video',
        isPreview: true,
        isRequired: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        completionCount: 0,
      });

      const course = await courseService.submitForApproval(createdCourseId, testInstructorId);

      expect(course.status).toBe('pending');
    });

    test('should approve course (admin)', async () => {
      const course = await courseService.approveCourse(createdCourseId, testAdminId);

      expect(course.status).toBe('published');
      expect(course.approvedBy).toBe(testAdminId);
      expect(course.publishedAt).toBeDefined();
    });

    test('should get course by ID', async () => {
      const course = await courseService.getById(createdCourseId);

      expect(course).toBeDefined();
      expect(course.id).toBe(createdCourseId);
      expect(course.status).toBe('published');
    });

    test('should get course by slug', async () => {
      const course = await courseService.getBySlug('react-development-test-course');

      expect(course).toBeDefined();
      expect(course.id).toBe(createdCourseId);
      expect(course.slug).toBe('react-development-test-course');
    });
  });

  describe('Course Search and Discovery', () => {
    test('should search courses with filters', async () => {
      const filters: CourseFilters = {
        category: 'Technology',
        level: 'intermediate',
        isFree: false,
        page: 1,
        limit: 10,
      };

      const result = await courseService.search(filters);

      expect(result.courses).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.hasMore).toBeDefined();
    });

    test('should get featured courses', async () => {
      // Mark course as featured
      await db.collection('courses').doc(createdCourseId).update({
        featured: true,
      });

      const result = await courseService.getFeaturedCourses(5);

      expect(result.courses).toBeDefined();
      expect(result.courses.length).toBeGreaterThanOrEqual(0);
    });

    test('should get trending courses', async () => {
      // Mark course as trending
      await db.collection('courses').doc(createdCourseId).update({
        trending: true,
      });

      const result = await courseService.getTrendingCourses(5);

      expect(result.courses).toBeDefined();
      expect(result.courses.length).toBeGreaterThanOrEqual(0);
    });

    test('should get bestseller courses', async () => {
      // Mark course as bestseller
      await db.collection('courses').doc(createdCourseId).update({
        bestseller: true,
      });

      const result = await courseService.getBestsellerCourses(5);

      expect(result.courses).toBeDefined();
      expect(result.courses.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Course Enrollment', () => {
    test('should enroll student in course', async () => {
      const enrollment = await courseService.enrollStudent(createdCourseId, testStudentId, {
        paymentId: 'payment_test_' + Date.now(),
      });

      expect(enrollment).toBeDefined();
      expect(enrollment.id).toBeDefined();
      expect(enrollment.courseId).toBe(createdCourseId);
      expect(enrollment.studentId).toBe(testStudentId);
      expect(enrollment.status).toBe('active');
      expect(enrollment.progress).toBe(0);

      createdEnrollmentId = enrollment.id;
    });

    test('should prevent duplicate enrollment', async () => {
      await expect(courseService.enrollStudent(createdCourseId, testStudentId))
        .rejects.toThrow('Student already enrolled in this course');
    });

    test('should get student enrollments', async () => {
      const result = await courseService.getStudentEnrollments(testStudentId);

      expect(result.enrollments).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(1);
      
      const enrollment = result.enrollments.find(e => e.courseId === createdCourseId);
      expect(enrollment).toBeDefined();
      expect(enrollment?.studentId).toBe(testStudentId);
    });

    test('should get course enrollments (instructor)', async () => {
      const result = await courseService.getCourseEnrollments(createdCourseId, testInstructorId);

      expect(result.enrollments).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(1);
      
      const enrollment = result.enrollments.find(e => e.studentId === testStudentId);
      expect(enrollment).toBeDefined();
      expect(enrollment?.courseId).toBe(createdCourseId);
    });

    test('should prevent non-instructor from viewing course enrollments', async () => {
      await expect(courseService.getCourseEnrollments(createdCourseId, testStudentId))
        .rejects.toThrow('Only course instructor can view enrollments');
    });
  });

  describe('Course Progress Tracking', () => {
    test('should update lesson progress', async () => {
      // Create a lesson for progress tracking
      const lessonRef = await db.collection('courseLessons').add({
        courseId: createdCourseId,
        title: 'React Components',
        description: 'Understanding React components',
        order: 2,
        duration: 45,
        durationText: '45 minutes',
        type: 'video',
        isPreview: false,
        isRequired: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        completionCount: 0,
      });

      const lessonId = lessonRef.id;

      const progress = await courseService.updateLessonProgress(
        createdEnrollmentId,
        lessonId,
        {
          progress: 50,
          timeSpent: 25,
          watchTime: 1200, // 20 minutes in seconds
          lastPosition: 1200,
        }
      );

      expect(progress).toBeDefined();
      expect(progress.progress).toBe(50);
      expect(progress.timeSpent).toBe(25);
      expect(progress.watchTime).toBe(1200);
    });

    test('should update overall enrollment progress', async () => {
      // Get enrollment to check progress update
      const enrollmentDoc = await db.collection('courseEnrollments').doc(createdEnrollmentId).get();
      const enrollment = enrollmentDoc.data();

      expect(enrollment?.progress).toBeGreaterThan(0);
      expect(enrollment?.lastAccessedAt).toBeDefined();
    });
  });

  describe('Course Reviews', () => {
    test('should add course review', async () => {
      // Mark course as completed for review eligibility
      await db.collection('courseEnrollments').doc(createdEnrollmentId).update({
        status: 'completed',
        completedAt: Timestamp.now(),
        progress: 100,
      });

      const reviewData = {
        rating: 5,
        title: 'Excellent Course!',
        comment: 'This course was exactly what I needed to learn React. The instructor was clear and the projects were practical.',
        pros: ['Clear explanations', 'Practical projects', 'Good pacing'],
        cons: ['Could use more advanced topics'],
      };

      const review = await courseService.addReview(createdCourseId, testStudentId, reviewData);

      expect(review).toBeDefined();
      expect(review.id).toBeDefined();
      expect(review.courseId).toBe(createdCourseId);
      expect(review.studentId).toBe(testStudentId);
      expect(review.rating).toBe(5);
      expect(review.title).toBe(reviewData.title);
      expect(review.comment).toBe(reviewData.comment);
      expect(review.verifiedPurchase).toBe(true);
    });

    test('should prevent duplicate reviews', async () => {
      const reviewData = {
        rating: 4,
        comment: 'Another review',
      };

      await expect(courseService.addReview(createdCourseId, testStudentId, reviewData))
        .rejects.toThrow('Student has already reviewed this course');
    });

    test('should get course reviews', async () => {
      const result = await courseService.getCourseReviews(createdCourseId);

      expect(result.reviews).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(1);
      
      const review = result.reviews.find(r => r.studentId === testStudentId);
      expect(review).toBeDefined();
      expect(review?.rating).toBe(5);
    });

    test('should update course rating after review', async () => {
      const course = await courseService.getById(createdCourseId);

      expect(course.averageRating).toBeGreaterThan(0);
      expect(course.ratingCount).toBeGreaterThan(0);
      expect(course.reviewCount).toBeGreaterThan(0);
    });
  });

  describe('Instructor Statistics', () => {
    test('should get instructor statistics', async () => {
      const stats = await courseService.getInstructorStats(testInstructorId);

      expect(stats).toBeDefined();
      expect(stats.totalCourses).toBeGreaterThanOrEqual(1);
      expect(stats.publishedCourses).toBeGreaterThanOrEqual(1);
      expect(stats.totalEnrollments).toBeGreaterThanOrEqual(1);
      expect(stats.totalCompletions).toBeGreaterThanOrEqual(0);
      expect(stats.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(stats.averageRating).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Admin Functions', () => {
    test('should get pending courses', async () => {
      // Create another course in pending status
      const courseData: CourseInput = {
        title: 'Pending Course',
        description: 'This course is pending approval',
        shortDescription: 'Pending',
        category: 'Test',
        tags: [],
        level: 'beginner',
        language: 'English',
        price: 0,
        currency: 'USD',
        isFree: true,
        duration: 60,
        durationText: '1 hour',
        lessonsCount: 3,
        objectives: [],
        prerequisites: [],
        targetAudience: [],
        difficultyScore: 1,
        timeCommitment: '1 hour',
        certificateAvailable: false,
        slug: 'pending-course-' + Date.now()
      };

      const pendingCourse = await courseService.create(courseData, testInstructorId);
      await courseService.submitForApproval(pendingCourse.id, testInstructorId);

      const pendingCourses = await courseService.getPendingCourses();

      expect(pendingCourses.courses).toBeDefined();
      expect(pendingCourses.courses.length).toBeGreaterThanOrEqual(1);

      // Clean up pending course
      await db.collection('courses').doc(pendingCourse.id).delete();
    });

    test('should reject course with reason', async () => {
      const courseData: CourseInput = {
        title: 'Course to Reject',
        description: 'This course will be rejected',
        shortDescription: 'Reject me',
        category: 'Test',
        tags: [],
        level: 'beginner',
        language: 'English',
        price: 0,
        currency: 'USD',
        isFree: true,
        duration: 30,
        durationText: '30 minutes',
        lessonsCount: 2,
        objectives: [],
        prerequisites: [],
        targetAudience: [],
        difficultyScore: 1,
        timeCommitment: '30 minutes',
        certificateAvailable: false,
        slug: 'reject-course-' + Date.now()
      };

      const course = await courseService.create(courseData, testInstructorId);
      
      // Add a lesson to make it eligible for approval
      await db.collection('courseLessons').add({
        courseId: course.id,
        title: 'Test Lesson',
        description: 'Test',
        order: 1,
        duration: 30,
        durationText: '30 minutes',
        type: 'video',
        isPreview: true,
        isRequired: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        completionCount: 0,
      });

      await courseService.submitForApproval(course.id, testInstructorId);

      const rejectedCourse = await courseService.rejectCourse(course.id, testAdminId, 'Test rejection reason');

      expect(rejectedCourse.status).toBe('draft');
      expect(rejectedCourse.rejectionReason).toBe('Test rejection reason');

      // Clean up rejected course
      await db.collection('courses').doc(course.id).delete();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle non-existent course ID', async () => {
      await expect(courseService.getById('non-existent-id'))
        .rejects.toThrow('Course not found');
    });

    test('should handle non-existent course slug', async () => {
      await expect(courseService.getBySlug('non-existent-slug'))
        .rejects.toThrow('Course not found');
    });

    test('should prevent deleting course with enrollments', async () => {
      await expect(courseService.delete(createdCourseId, testInstructorId))
        .rejects.toThrow('Cannot delete course with active enrollments');
    });

    test('should handle invalid course data', async () => {
      const invalidData = {
        title: '', // Empty title should fail validation
        description: 'Test',
        shortDescription: 'Test',
        category: 'Test',
        tags: [],
        level: 'beginner' as const,
        language: 'English',
        price: -100, // Negative price
        currency: 'USD',
        isFree: false,
        duration: 0,
        durationText: '0 minutes',
        lessonsCount: 0,
        objectives: [],
        prerequisites: [],
        targetAudience: [],
        difficultyScore: 0,
        timeCommitment: '0 minutes',
        certificateAvailable: false,
        slug: 'invalid-course'
      };

      // This should be handled by validation in the service or controller
      // The exact error message depends on implementation
      await expect(courseService.create(invalidData, testInstructorId))
        .rejects.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large number of courses in search', async () => {
      const startTime = Date.now();
      
      const result = await courseService.search({
        page: 1,
        limit: 50,
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      expect(result.courses).toBeDefined();
      expect(result.courses.length).toBeLessThanOrEqual(50);
    });

    test('should handle complex filters efficiently', async () => {
      const startTime = Date.now();
      
      const complexFilters: CourseFilters = {
        category: 'Technology',
        level: 'intermediate',
        priceRange: { min: 1000, max: 10000 },
        rating: 4,
        hasCertificate: true,
        search: 'react',
        sort: 'rating',
        page: 1,
        limit: 20,
      };

      const result = await courseService.search(complexFilters);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(3000); // Complex queries should still be fast
      expect(result.courses).toBeDefined();
    });
  });
});

describe.skip('Course Library Integration Tests', () => {
  test('should handle complete course lifecycle', async () => {
    // This test verifies the complete workflow from creation to completion
    const instructorId = 'integration-instructor-' + Date.now();
    const studentId = 'integration-student-' + Date.now();
    const adminId = 'integration-admin-' + Date.now();

    // Create test users
    await db.collection('users').doc(instructorId).set({
      uid: instructorId,
      email: 'instructor@integration.test',
      firstName: 'Integration',
      lastName: 'Instructor',
      role: 'consultant',
      displayName: 'Integration Instructor',
      createdAt: Timestamp.now(),
    });

    await db.collection('users').doc(studentId).set({
      uid: studentId,
      email: 'student@integration.test',
      firstName: 'Integration',
      lastName: 'Student',
      role: 'student',
      displayName: 'Integration Student',
      createdAt: Timestamp.now(),
    });

    await db.collection('users').doc(adminId).set({
      uid: adminId,
      email: 'admin@integration.test',
      firstName: 'Integration',
      lastName: 'Admin',
      role: 'admin',
      displayName: 'Integration Admin',
      createdAt: Timestamp.now(),
    });

    try {
      // 1. Create course
      const courseData: CourseInput = {
        title: 'Integration Test Course',
        description: 'Complete course lifecycle test',
        shortDescription: 'Integration test',
        category: 'Test',
        tags: ['test', 'integration'],
        level: 'beginner',
        language: 'English',
        price: 1999,
        currency: 'USD',
        isFree: false,
        duration: 120,
        durationText: '2 hours',
        lessonsCount: 5,
        objectives: ['Test objective'],
        prerequisites: ['Test prerequisite'],
        targetAudience: ['Test audience'],
        difficultyScore: 3,
        timeCommitment: '2 hours',
        certificateAvailable: true,
        slug: 'integration-test-course-' + Date.now()
      };

      const course = await courseService.create(courseData, instructorId);
      expect(course.status).toBe('draft');

      // 2. Add lesson and submit for approval
      await db.collection('courseLessons').add({
        courseId: course.id,
        title: 'Test Lesson',
        description: 'Test lesson description',
        order: 1,
        duration: 30,
        durationText: '30 minutes',
        type: 'video',
        isPreview: true,
        isRequired: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        completionCount: 0,
      });

      await courseService.submitForApproval(course.id, instructorId);
      expect(course.status).toBe('pending');

      // 3. Approve course
      const approvedCourse = await courseService.approveCourse(course.id, adminId);
      expect(approvedCourse.status).toBe('published');

      // 4. Enroll student
      const enrollment = await courseService.enrollStudent(course.id, studentId);
      expect(enrollment.status).toBe('active');

      // 5. Update progress
      const lessonSnapshot = await db.collection('courseLessons')
        .where('courseId', '==', course.id)
        .limit(1)
        .get();
      
      if (!lessonSnapshot.empty) {
        const lessonId = lessonSnapshot.docs[0].id;
        await courseService.updateLessonProgress(enrollment.id, lessonId, {
          progress: 100,
          timeSpent: 30,
          completed: true,
        });
      }

      // 6. Complete course and add review
      await db.collection('courseEnrollments').doc(enrollment.id).update({
        status: 'completed',
        completedAt: Timestamp.now(),
        progress: 100,
      });

      const review = await courseService.addReview(course.id, studentId, {
        rating: 5,
        comment: 'Great integration test course!',
      });

      expect(review.rating).toBe(5);

      // 7. Verify final state
      const finalCourse = await courseService.getById(course.id);
      expect(finalCourse.enrollmentCount).toBe(1);
      expect(finalCourse.completionCount).toBe(1);
      expect(finalCourse.averageRating).toBe(5);
      expect(finalCourse.ratingCount).toBe(1);

      // 8. Check instructor stats
      const stats = await courseService.getInstructorStats(instructorId);
      expect(stats.totalCourses).toBe(1);
      expect(stats.publishedCourses).toBe(1);
      expect(stats.totalEnrollments).toBe(1);
      expect(stats.totalCompletions).toBe(1);
      expect(stats.totalRevenue).toBe(1999);

      console.log('✅ Complete course lifecycle test passed');

    } finally {
      // Cleanup
      const courseSnapshot = await db.collection('courses')
        .where('instructorId', '==', instructorId)
        .get();
      
      for (const doc of courseSnapshot.docs) {
        await doc.ref.delete();
      }

      const lessonSnapshot = await db.collection('courseLessons')
        .where('courseId', 'in', courseSnapshot.docs.map(doc => doc.id))
        .get();
      
      for (const doc of lessonSnapshot.docs) {
        await doc.ref.delete();
      }

      const enrollmentSnapshot = await db.collection('courseEnrollments')
        .where('studentId', '==', studentId)
        .get();
      
      for (const doc of enrollmentSnapshot.docs) {
        await doc.ref.delete();
      }

      const reviewSnapshot = await db.collection('courseReviews')
        .where('studentId', '==', studentId)
        .get();
      
      for (const doc of reviewSnapshot.docs) {
        await doc.ref.delete();
      }

      await db.collection('users').doc(instructorId).delete();
      await db.collection('users').doc(studentId).delete();
      await db.collection('users').doc(adminId).delete();
    }
  });
});
