// @ts-nocheck
// Course Library Implementation Test Suite
// Tests all course library functionality: Creation, Search, Enrollment, Progress, Reviews

import request from 'supertest';
import app from '../app';

// Mock authentication middleware for comprehensive testing
jest.mock('../middleware/authMiddleware', () => ({
  authenticateUser: () => (req: any, res: any, next: any) => {
    const role = req.headers['x-test-role'] || 'student';
    const userId = req.headers['x-test-user-id'] || 'test-user';
    
    req.user = {
      uid: userId,
      email: 'test@example.com',
      name: 'Test User',
      role: role,
    };
    next();
  },
  authorizeRole: (roles: string[]) => (req: any, res: any, next: any) => {
    const userRole = req.user?.role;
    if (roles.includes(userRole)) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied' });
    }
  },
}));

// Mock Firebase for comprehensive testing
jest.mock('../config/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          exists: true,
          data: () => ({ 
            userId: 'test-user',
            role: 'student',
            displayName: 'Test User',
            firstName: 'Test',
            lastName: 'User',
            bio: 'Test user bio',
            photoURL: 'https://example.com/avatar.jpg'
          })
        })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve()),
      })),
      add: jest.fn(() => Promise.resolve({
        id: 'test-course-id'
      })),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          empty: false,
          docs: [{
            id: 'test-course-id',
            data: () => ({
              id: 'test-course-id',
              title: 'Test Course',
              description: 'Test course description',
              instructorId: 'test-instructor',
              instructorName: 'Test Instructor',
              category: 'Technology',
              level: 'intermediate',
              price: 4999,
              isFree: false,
              status: 'published',
              enrollmentCount: 10,
              completionCount: 5,
              averageRating: 4.5,
              ratingCount: 20,
              featured: false,
              trending: false,
              bestseller: false,
              certificateAvailable: true,
              duration: 1200,
              durationText: '20 hours',
              lessonsCount: 25,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          }]
        })),
        limit: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({
            empty: false,
            docs: [{
              id: 'test-course-id',
              data: () => ({
                id: 'test-course-id',
                title: 'Test Course',
                description: 'Test course description',
                instructorId: 'test-instructor',
                instructorName: 'Test Instructor',
                category: 'Technology',
                level: 'intermediate',
                price: 4999,
                isFree: false,
                status: 'published',
                enrollmentCount: 10,
                completionCount: 5,
                averageRating: 4.5,
                ratingCount: 20,
                featured: false,
                trending: false,
                bestseller: false,
                certificateAvailable: true,
                duration: 1200,
                durationText: '20 hours',
                lessonsCount: 25,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
            }]
          }))
        })),
        orderBy: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({
            empty: false,
            docs: [{
              id: 'test-course-id',
              data: () => ({
                id: 'test-course-id',
                title: 'Test Course',
                description: 'Test course description',
                instructorId: 'test-instructor',
                instructorName: 'Test Instructor',
                category: 'Technology',
                level: 'intermediate',
                price: 4999,
                isFree: false,
                status: 'published',
                enrollmentCount: 10,
                completionCount: 5,
                averageRating: 4.5,
                ratingCount: 20,
                featured: false,
                trending: false,
                bestseller: false,
                certificateAvailable: true,
                duration: 1200,
                durationText: '20 hours',
                lessonsCount: 25,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
            }]
          }))
        })),
        offset: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({
            empty: false,
            docs: [{
              id: 'test-course-id',
              data: () => ({
                id: 'test-course-id',
                title: 'Test Course',
                description: 'Test course description',
                instructorId: 'test-instructor',
                instructorName: 'Test Instructor',
                category: 'Technology',
                level: 'intermediate',
                price: 4999,
                isFree: false,
                status: 'published',
                enrollmentCount: 10,
                completionCount: 5,
                averageRating: 4.5,
                ratingCount: 20,
                featured: false,
                trending: false,
                bestseller: false,
                certificateAvailable: true,
                duration: 1200,
                durationText: '20 hours',
                lessonsCount: 25,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
            }]
          }))
        })),
      })),
    })),
  },
}));

describe.skip('Course Library System Tests', () => {
  describe('Course Creation', () => {
    test('should create a new course successfully', async () => {
      const courseData = {
        title: 'Test Course: React Development',
        description: 'A comprehensive course on React development covering hooks, state management, and best practices.',
        shortDescription: 'Learn React from scratch with hands-on projects.',
        category: 'Technology',
        subcategory: 'Web Development',
        tags: ['react', 'javascript', 'web development', 'frontend'],
        level: 'intermediate',
        language: 'English',
        price: 4999,
        currency: 'USD',
        isFree: false,
        duration: 1200,
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

      const response = await request(app)
        .post('/api/courses')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-instructor')
        .send(courseData)
        .expect(201);

      expect(response.body.message).toBe('Course created successfully');
      expect(response.body.course).toBeDefined();
      expect(response.body.course.title).toBe(courseData.title);
      expect(response.body.course.instructorId).toBe('test-instructor');
      expect(response.body.course.status).toBe('draft');
      expect(response.body.course.price).toBe(courseData.price);
      expect(response.body.course.certificateAvailable).toBe(true);
    });

    test('should reject course creation for non-consultant users', async () => {
      const courseData = {
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

      const response = await request(app)
        .post('/api/courses')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .send(courseData)
        .expect(403);

      expect(response.body.error).toBe('Consultant access required');
    });
  });

  describe('Course Search and Discovery', () => {
    test('should search courses with filters', async () => {
      const response = await request(app)
        .get('/api/courses/search')
        .query({
          category: 'Technology',
          level: 'intermediate',
          isFree: false,
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body.courses).toBeDefined();
      expect(response.body.total).toBeGreaterThanOrEqual(0);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
      expect(response.body.hasMore).toBeDefined();
    });

    test('should get featured courses', async () => {
      const response = await request(app)
        .get('/api/courses/featured')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.courses).toBeDefined();
      expect(response.body.courses.length).toBeGreaterThanOrEqual(0);
    });

    test('should get trending courses', async () => {
      const response = await request(app)
        .get('/api/courses/trending')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.courses).toBeDefined();
      expect(response.body.courses.length).toBeGreaterThanOrEqual(0);
    });

    test('should get bestseller courses', async () => {
      const response = await request(app)
        .get('/api/courses/bestseller')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.courses).toBeDefined();
      expect(response.body.courses.length).toBeGreaterThanOrEqual(0);
    });

    test('should get course by ID', async () => {
      const response = await request(app)
        .get('/api/courses/test-course-id')
        .expect(200);

      expect(response.body.course).toBeDefined();
      expect(response.body.course.id).toBe('test-course-id');
      expect(response.body.course.title).toBe('Test Course');
      expect(response.body.course.status).toBe('published');
    });

    test('should get course by slug', async () => {
      const response = await request(app)
        .get('/api/courses/slug/react-development-test-course')
        .expect(200);

      expect(response.body.course).toBeDefined();
      expect(response.body.course.id).toBe('test-course-id');
      expect(response.body.course.slug).toBe('react-development-test-course');
    });
  });

  describe('Course Enrollment', () => {
    test('should enroll student in course', async () => {
      const response = await request(app)
        .post('/api/courses/test-course-id/enroll')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .send({
          paymentId: 'payment_test_' + Date.now(),
        })
        .expect(201);

      expect(response.body.message).toBe('Successfully enrolled in course');
      expect(response.body.enrollment).toBeDefined();
      expect(response.body.enrollment.courseId).toBe('test-course-id');
      expect(response.body.enrollment.studentId).toBe('test-student');
      expect(response.body.enrollment.status).toBe('active');
      expect(response.body.enrollment.progress).toBe(0);
    });

    test('should get student enrollments', async () => {
      const response = await request(app)
        .get('/api/courses/enrollments/my')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .expect(200);

      expect(response.body.enrollments).toBeDefined();
      expect(response.body.total).toBeGreaterThanOrEqual(0);
    });

    test('should get course enrollments (instructor)', async () => {
      const response = await request(app)
        .get('/api/courses/test-course-id/enrollments')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-instructor')
        .expect(200);

      expect(response.body.enrollments).toBeDefined();
      expect(response.body.total).toBeGreaterThanOrEqual(0);
    });

    test('should prevent non-instructor from viewing course enrollments', async () => {
      const response = await request(app)
        .get('/api/courses/test-course-id/enrollments')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .expect(403);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Course Management', () => {
    test('should update course successfully', async () => {
      const updates = {
        title: 'Updated Test Course: Advanced React Development',
        description: 'Updated description with more advanced topics',
        price: 6999,
      };

      const response = await request(app)
        .put('/api/courses/test-course-id')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-instructor')
        .send(updates)
        .expect(200);

      expect(response.body.message).toBe('Course updated successfully');
      expect(response.body.course.title).toBe(updates.title);
      expect(response.body.course.description).toBe(updates.description);
      expect(response.body.course.price).toBe(updates.price);
    });

    test('should reject course update from non-instructor', async () => {
      const updates = { title: 'Hacked Course' };

      const response = await request(app)
        .put('/api/courses/test-course-id')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .send(updates)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    test('should submit course for approval', async () => {
      const response = await request(app)
        .post('/api/courses/test-course-id/submit-for-approval')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-instructor')
        .expect(200);

      expect(response.body.message).toBe('Course submitted for approval');
      expect(response.body.course.status).toBe('pending');
    });

    test('should approve course (admin)', async () => {
      const response = await request(app)
        .post('/api/courses/test-course-id/approve')
        .set('x-test-role', 'admin')
        .set('x-test-user-id', 'test-admin')
        .expect(200);

      expect(response.body.message).toBe('Course approved and published');
      expect(response.body.course.status).toBe('published');
      expect(response.body.course.approvedBy).toBe('test-admin');
    });

    test('should reject course with reason (admin)', async () => {
      const response = await request(app)
        .post('/api/courses/test-course-id/reject')
        .set('x-test-role', 'admin')
        .set('x-test-user-id', 'test-admin')
        .send({ reason: 'Test rejection reason' })
        .expect(200);

      expect(response.body.message).toBe('Course rejected');
      expect(response.body.course.status).toBe('draft');
      expect(response.body.course.rejectionReason).toBe('Test rejection reason');
    });

    test('should get pending courses (admin)', async () => {
      const response = await request(app)
        .get('/api/courses/admin/pending')
        .set('x-test-role', 'admin')
        .set('x-test-user-id', 'test-admin')
        .expect(200);

      expect(response.body.courses).toBeDefined();
      expect(response.body.courses.length).toBeGreaterThanOrEqual(0);
    });

    test('should get instructor courses', async () => {
      const response = await request(app)
        .get('/api/courses/instructor/my')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-instructor')
        .expect(200);

      expect(response.body.courses).toBeDefined();
      expect(response.body.total).toBeGreaterThanOrEqual(0);
    });

    test('should get instructor statistics', async () => {
      const response = await request(app)
        .get('/api/courses/instructor/stats')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-instructor')
        .expect(200);

      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalCourses).toBeGreaterThanOrEqual(0);
      expect(response.body.stats.publishedCourses).toBeGreaterThanOrEqual(0);
      expect(response.body.stats.totalEnrollments).toBeGreaterThanOrEqual(0);
      expect(response.body.stats.totalCompletions).toBeGreaterThanOrEqual(0);
      expect(response.body.stats.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(response.body.stats.averageRating).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Course Progress and Reviews', () => {
    test('should update lesson progress', async () => {
      const progressData = {
        progress: 50,
        timeSpent: 25,
        watchTime: 1200,
        lastPosition: 1200,
      };

      const response = await request(app)
        .put('/api/courses/progress/test-enrollment-id/test-lesson-id')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .send(progressData)
        .expect(200);

      expect(response.body.message).toBe('Progress updated successfully');
      expect(response.body.progress).toBeDefined();
      expect(response.body.progress.progress).toBe(50);
      expect(response.body.progress.timeSpent).toBe(25);
      expect(response.body.progress.watchTime).toBe(1200);
    });

    test('should add course review', async () => {
      const reviewData = {
        rating: 5,
        title: 'Excellent Course!',
        comment: 'This course was exactly what I needed to learn React. The instructor was clear and the projects were practical.',
        pros: ['Clear explanations', 'Practical projects', 'Good pacing'],
        cons: ['Could use more advanced topics'],
      };

      const response = await request(app)
        .post('/api/courses/test-course-id/reviews')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .send(reviewData)
        .expect(201);

      expect(response.body.message).toBe('Review added successfully');
      expect(response.body.review).toBeDefined();
      expect(response.body.review.courseId).toBe('test-course-id');
      expect(response.body.review.studentId).toBe('test-student');
      expect(response.body.review.rating).toBe(5);
      expect(response.body.review.title).toBe(reviewData.title);
      expect(response.body.review.comment).toBe(reviewData.comment);
      expect(response.body.review.verifiedPurchase).toBe(true);
    });

    test('should get course reviews', async () => {
      const response = await request(app)
        .get('/api/courses/test-course-id/reviews')
        .query({
          page: 1,
          limit: 10,
          sort: 'newest'
        })
        .expect(200);

      expect(response.body.reviews).toBeDefined();
      expect(response.body.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent course ID', async () => {
      const response = await request(app)
        .get('/api/courses/non-existent-id')
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    test('should handle non-existent course slug', async () => {
      const response = await request(app)
        .get('/api/courses/slug/non-existent-slug')
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    test('should require authentication for protected routes', async () => {
      const response = await request(app)
        .post('/api/courses')
        .send({
          title: 'Test Course',
          description: 'Test description',
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
          slug: 'test-course'
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large search requests efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/courses/search')
        .query({
          page: 1,
          limit: 50,
        })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      expect(response.body.courses).toBeDefined();
      expect(response.body.courses.length).toBeLessThanOrEqual(50);
    });

    test('should handle complex filters efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/courses/search')
        .query({
          category: 'Technology',
          level: 'intermediate',
          priceRange: { min: 1000, max: 10000 },
          rating: 4,
          hasCertificate: true,
          search: 'react',
          sort: 'rating',
          page: 1,
          limit: 20,
        })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(3000); // Complex queries should still be fast
      expect(response.body.courses).toBeDefined();
    });
  });
});

describe.skip('Course Library Integration Tests', () => {
  test('should handle complete course lifecycle workflow', async () => {
    // 1. Create course
    const courseData = {
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

    const createResponse = await request(app)
      .post('/api/courses')
      .set('x-test-role', 'consultant')
      .set('x-test-user-id', 'integration-instructor')
      .send(courseData)
      .expect(201);

    expect(createResponse.body.course.status).toBe('draft');

    // 2. Submit for approval
    await request(app)
      .post('/api/courses/test-course-id/submit-for-approval')
      .set('x-test-role', 'consultant')
      .set('x-test-user-id', 'integration-instructor')
      .expect(200);

    // 3. Approve course
    await request(app)
      .post('/api/courses/test-course-id/approve')
      .set('x-test-role', 'admin')
      .set('x-test-user-id', 'integration-admin')
      .expect(200);

    // 4. Enroll student
    const enrollResponse = await request(app)
      .post('/api/courses/test-course-id/enroll')
      .set('x-test-role', 'student')
      .set('x-test-user-id', 'integration-student')
      .send({
        paymentId: 'payment_integration_' + Date.now(),
      })
      .expect(201);

    expect(enrollResponse.body.enrollment.status).toBe('active');

    // 5. Update progress
    await request(app)
      .put('/api/courses/progress/test-enrollment-id/test-lesson-id')
      .set('x-test-role', 'student')
      .set('x-test-user-id', 'integration-student')
      .send({
        progress: 100,
        timeSpent: 30,
        completed: true,
      })
      .expect(200);

    // 6. Add review
    await request(app)
      .post('/api/courses/test-course-id/reviews')
      .set('x-test-role', 'student')
      .set('x-test-user-id', 'integration-student')
      .send({
        rating: 5,
        comment: 'Great integration test course!',
      })
      .expect(201);

    // 7. Verify final state
    const finalCourseResponse = await request(app)
      .get('/api/courses/test-course-id')
      .expect(200);

    expect(finalCourseResponse.body.course.enrollmentCount).toBeGreaterThanOrEqual(1);
    expect(finalCourseResponse.body.course.completionCount).toBeGreaterThanOrEqual(0);
    expect(finalCourseResponse.body.course.averageRating).toBeGreaterThanOrEqual(0);
    expect(finalCourseResponse.body.course.ratingCount).toBeGreaterThanOrEqual(0);

    // 8. Check instructor stats
    const statsResponse = await request(app)
      .get('/api/courses/instructor/stats')
      .set('x-test-role', 'consultant')
      .set('x-test-user-id', 'integration-instructor')
      .expect(200);

    expect(statsResponse.body.stats.totalCourses).toBeGreaterThanOrEqual(0);
    expect(statsResponse.body.stats.publishedCourses).toBeGreaterThanOrEqual(0);
    expect(statsResponse.body.stats.totalEnrollments).toBeGreaterThanOrEqual(0);
    expect(statsResponse.body.stats.totalCompletions).toBeGreaterThanOrEqual(0);
    expect(statsResponse.body.stats.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(statsResponse.body.stats.averageRating).toBeGreaterThanOrEqual(0);

    console.log('✅ Complete course lifecycle integration test passed');
  });
});
