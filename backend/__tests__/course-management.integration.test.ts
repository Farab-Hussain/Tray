// Course Management Integration Tests
// Comprehensive testing for the new course management system

import { 
  ServiceToCourseMigrationService 
} from '../src/scripts/migration/service-to-course-migration';
import { courseService } from '../src/services/course.service';
import { videoManagementService } from '../src/services/video-management.service';
import { progressTrackingService } from '../src/services/progress-tracking.service';
import { certificateService } from '../src/services/certificate.service';
import { db } from '../src/config/firebase';
import { Timestamp } from 'firebase-admin/firestore';

describe('Course Management System Integration', () => {
  let migrationService: ServiceToCourseMigrationService;
  let testInstructorId: string;
  let testStudentId: string;
  let testCourseId: string;
  let testEnrollmentId: string;

  beforeAll(async () => {
    migrationService = new ServiceToCourseMigrationService();
    
    // Create test users
    testInstructorId = await createTestUser('instructor');
    testStudentId = await createTestUser('student');
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
  });

  describe('Service to Course Migration', () => {
    test('should migrate services to courses successfully', async () => {
      // Create test service
      const serviceId = await createTestService(testInstructorId);
      
      // Run migration
      const result = await migrationService.migrateService({
        id: serviceId,
        title: 'Test Service',
        description: 'Test service description',
        category: 'tech-interview',
        consultantId: testInstructorId,
        price: 100,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        status: 'approved',
        createdAt: new Date(),
      });

      expect(result).toBeDefined();
      expect(result.title).toBe('Test Service');
      expect(result.instructorId).toBe(testInstructorId);
      expect(result.contentStatus).toBe('setup');
      expect(result.videos).toHaveLength(0);
      
      testCourseId = result.id;
    });

    test('should migrate bookings to enrollments', async () => {
      // Create test booking
      const bookingId = await createTestBooking(testCourseId, testStudentId, testInstructorId);
      
      // Run migration
      const result = await migrationService.migrateBookingToEnrollment({
        id: bookingId,
        serviceId: testCourseId,
        studentId: testStudentId,
        consultantId: testInstructorId,
        createdAt: new Date(),
        status: 'completed',
      });

      expect(result).toBeDefined();
      expect(result.courseId).toBe(testCourseId);
      expect(result.studentId).toBe(testStudentId);
      expect(result.status).toBe('active');
      
      testEnrollmentId = result.id;
    });

    test('should validate migration data integrity', async () => {
      const validation = await migrationService.validateMigration();
      
      expect(validation.validServices).toBeGreaterThan(0);
      expect(validation.validEnrollments).toBeGreaterThan(0);
      expect(validation.orphanedEnrollments).toBe(0);
      expect(validation.issues).toHaveLength(0);
    });
  });

  describe('Enhanced Course Service', () => {
    test('should create enhanced course with video support', async () => {
      const courseData = {
        title: 'Enhanced Test Course',
        description: 'Comprehensive course description',
        shortDescription: 'Short description',
        category: 'Technology',
        level: 'intermediate' as const,
        language: 'en',
        price: 199,
        currency: 'USD',
        isFree: false,
        objectives: ['Learn advanced concepts'],
        prerequisites: ['Basic knowledge'],
        targetAudience: ['Developers'],
        certificateAvailable: true,
        tags: ['programming', 'advanced'],
        duration: 3600,
        durationText: '1 hour',
        lessonsCount: 10,
        difficultyScore: 7,
        timeCommitment: '2 hours per week',
      };

      const course = await courseService.createEnhancedCourse(courseData, testInstructorId);
      
      expect(course).toBeDefined();
      expect(course.title).toBe(courseData.title);
      expect(course.contentStatus).toBe('setup');
      expect(course.totalVideos).toBe(0);
      expect(course.certificateAvailable).toBe(true);
    });

    test('should get enhanced course with videos', async () => {
      const course = await courseService.getEnhancedCourseById(testCourseId);
      
      expect(course).toBeDefined();
      expect(course!.videos).toBeDefined();
      expect(Array.isArray(course!.videos)).toBe(true);
    });

    test('should update video progress', async () => {
      const videoId = 'test-video-id';
      const progressData = {
        watchedDuration: 300,
        totalDuration: 600,
        lastPosition: 300,
        completed: false,
      };

      const progress = await courseService.updateVideoProgress(
        testEnrollmentId,
        videoId,
        testStudentId,
        progressData
      );

      expect(progress).toBeDefined();
      expect(progress.videoId).toBe(videoId);
      expect(progress.watchedDuration).toBe(300);
      expect(progress.completed).toBe(false);
    });

    test('should calculate course progress', async () => {
      const progress = await courseService.calculateCourseProgress(testEnrollmentId);
      
      expect(typeof progress).toBe('number');
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });
  });

  describe('Video Management Service', () => {
    test('should upload and process video', async () => {
      const uploadRequest = {
        courseId: testCourseId,
        title: 'Test Video',
        description: 'Test video description',
        file: Buffer.from('fake video content'),
        thumbnail: Buffer.from('fake thumbnail content'),
        isPreview: false,
        order: 0,
      };

      const result = await videoManagementService.uploadVideo(uploadRequest);
      
      expect(result).toBeDefined();
      expect(result.video).toBeDefined();
      expect(result.processingJob).toBeDefined();
      expect(result.video.title).toBe('Test Video');
      expect(result.processingJob.status).toBe('uploading');
    });

    test('should get course videos', async () => {
      const videos = await videoManagementService.getCourseVideos(testCourseId);
      
      expect(Array.isArray(videos)).toBe(true);
      expect(videos.length).toBeGreaterThanOrEqual(0);
    });

    test('should update video details', async () => {
      const videos = await videoManagementService.getCourseVideos(testCourseId);
      if (videos.length > 0) {
        const videoId = videos[0].id;
        const updates = {
          title: 'Updated Video Title',
          description: 'Updated description',
        };

        const updatedVideo = await videoManagementService.updateVideo(videoId, updates);
        
        expect(updatedVideo.title).toBe('Updated Video Title');
        expect(updatedVideo.description).toBe('Updated description');
      }
    });

    test('should get processing job status', async () => {
      const jobs = await videoManagementService.getCourseProcessingJobs(testCourseId);
      
      expect(Array.isArray(jobs)).toBe(true);
      if (jobs.length > 0) {
        const job = await videoManagementService.getProcessingJob(jobs[0].id);
        expect(job).toBeDefined();
        expect(job!.courseId).toBe(testCourseId);
      }
    });
  });

  describe('Progress Tracking Service', () => {
    test('should update video progress with session tracking', async () => {
      const videoId = 'test-video-2';
      const progressData = {
        watchedDuration: 450,
        totalDuration: 600,
        lastPosition: 450,
        completed: true,
        sessionDuration: 150,
      };

      const progress = await progressTrackingService.updateVideoProgress(
        testEnrollmentId,
        videoId,
        testStudentId,
        progressData
      );

      expect(progress).toBeDefined();
      expect(progress.completed).toBe(true);
      expect(progress.watchSessions.length).toBeGreaterThan(0);
    });

    test('should get learning analytics', async () => {
      const analytics = await progressTrackingService.getLearningAnalytics(testStudentId);
      
      expect(analytics).toBeDefined();
      expect(typeof analytics.totalWatchTime).toBe('number');
      expect(typeof analytics.completionRate).toBe('number');
      expect(typeof analytics.engagementScore).toBe('number');
      expect(Array.isArray(analytics.weeklyProgress)).toBe(true);
      expect(Array.isArray(analytics.monthlyProgress)).toBe(true);
    });

    test('should issue certificate on course completion', async () => {
      // Mark course as completed
      await courseService.updateVideoProgress(testEnrollmentId, 'video-1', testStudentId, {
        watchedDuration: 600,
        totalDuration: 600,
        lastPosition: 600,
        completed: true,
      });

      const certificateId = await progressTrackingService.issueCertificate(
        testEnrollmentId,
        testCourseId,
        testStudentId
      );

      expect(certificateId).toBeDefined();
      expect(typeof certificateId).toBe('string');
    });

    test('should get student certificates', async () => {
      const certificates = await progressTrackingService.getStudentCertificates(testStudentId);
      
      expect(Array.isArray(certificates)).toBe(true);
      if (certificates.length > 0) {
        expect(certificates[0].studentId).toBe(testStudentId);
        expect(certificates[0].isRevoked).toBe(false);
      }
    });

    test('should verify certificate', async () => {
      const certificates = await progressTrackingService.getStudentCertificates(testStudentId);
      if (certificates.length > 0) {
        const verificationCode = certificates[0].verificationCode;
        const verified = await progressTrackingService.verifyCertificate(verificationCode);
        
        expect(verified).toBeDefined();
        expect(verified!.studentId).toBe(testStudentId);
        expect(verified!.isRevoked).toBe(false);
      }
    });
  });

  describe('Certificate Service', () => {
    test('should create certificate template', async () => {
      const templateData = {
        name: 'Test Template',
        description: 'Test certificate template',
        templateUrl: 'https://example.com/template.pdf',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      };

      const template = await certificateService.createTemplate(templateData, testInstructorId);
      
      expect(template).toBeDefined();
      expect(template.name).toBe('Test Template');
      expect(template.isActive).toBe(true);
      expect(template.fields.length).toBeGreaterThan(0);
    });

    test('should get active certificate templates', async () => {
      const templates = await certificateService.getActiveTemplates();
      
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].isActive).toBe(true);
    });

    test('should generate certificate PDF', async () => {
      const templates = await certificateService.getActiveTemplates();
      const templateId = templates[0].id;
      
      const certificateData = {
        studentName: 'Test Student',
        courseTitle: 'Test Course',
        instructorName: 'Test Instructor',
        completionDate: new Date(),
        totalDuration: '2 hours',
        videosCompleted: 10,
        totalVideos: 10,
        verificationCode: 'TEST123456',
        issuerName: 'Test Platform',
        issuerTitle: 'Certificate of Completion',
      };

      const pdfBuffer = await certificateService.generateCertificate(templateId, certificateData);
      
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    test('should get certificate statistics', async () => {
      const stats = await certificateService.getCertificateStats(testInstructorId);
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalIssued).toBe('number');
      expect(typeof stats.totalRevoked).toBe('number');
      expect(typeof stats.issuedThisMonth).toBe('number');
      expect(typeof stats.issuedThisYear).toBe('number');
      expect(Array.isArray(stats.byCourse)).toBe(true);
    });
  });

  describe('End-to-End Course Flow', () => {
    test('should handle complete course lifecycle', async () => {
      // 1. Create course
      const courseData = {
        title: 'E2E Test Course',
        description: 'End-to-end test course',
        shortDescription: 'E2E test',
        category: 'Testing',
        level: 'beginner' as const,
        language: 'en',
        price: 0,
        currency: 'USD',
        isFree: true,
        objectives: ['Test objectives'],
        prerequisites: [],
        targetAudience: ['Testers'],
        certificateAvailable: true,
        tags: ['test'],
        duration: 1800,
        durationText: '30 minutes',
        lessonsCount: 5,
        difficultyScore: 3,
        timeCommitment: '1 hour',
      };

      const course = await courseService.createEnhancedCourse(courseData, testInstructorId);
      expect(course).toBeDefined();

      // 2. Upload video
      const uploadRequest = {
        courseId: course.id,
        title: 'E2E Test Video',
        description: 'Test video for E2E flow',
        file: Buffer.from('test video content'),
        isPreview: true,
        order: 0,
      };

      const videoResult = await videoManagementService.uploadVideo(uploadRequest);
      expect(videoResult).toBeDefined();

      // 3. Enroll student
      const enrollment = await courseService.enrollInCourse(course.id, testStudentId);
      expect(enrollment).toBeDefined();

      // 4. Update progress
      await progressTrackingService.updateVideoProgress(
        enrollment.id,
        videoResult.video.id,
        testStudentId,
        {
          watchedDuration: 900,
          totalDuration: 1800,
          lastPosition: 900,
          completed: false,
          sessionDuration: 300,
        }
      );

      // 5. Complete video
      await progressTrackingService.updateVideoProgress(
        enrollment.id,
        videoResult.video.id,
        testStudentId,
        {
          watchedDuration: 1800,
          totalDuration: 1800,
          lastPosition: 1800,
          completed: true,
          sessionDuration: 900,
        }
      );

      // 6. Check analytics
      const analytics = await progressTrackingService.getLearningAnalytics(testStudentId, course.id);
      expect(analytics.totalWatchTime).toBeGreaterThan(0);

      // 7. Generate certificate
      const certificateId = await progressTrackingService.issueCertificate(
        enrollment.id,
        course.id,
        testStudentId
      );
      expect(certificateId).toBeDefined();

      // 8. Verify certificate
      const certificates = await progressTrackingService.getStudentCertificates(testStudentId);
      const latestCert = certificates.find(c => c.enrollmentId === enrollment.id);
      expect(latestCert).toBeDefined();

      const verified = await progressTrackingService.verifyCertificate(latestCert!.verificationCode);
      expect(verified).toBeDefined();
      expect(verified!.studentId).toBe(testStudentId);
    });
  });

  // Helper functions
  async function createTestUser(role: string): Promise<string> {
    const userRef = await db.collection('users').add({
      email: `test-${role}-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: role.charAt(0).toUpperCase() + role.slice(1),
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return userRef.id;
  }

  async function createTestService(instructorId: string): Promise<string> {
    const serviceRef = await db.collection('services').add({
      title: 'Test Service',
      description: 'Test service for migration',
      category: 'tech-interview',
      consultantId: instructorId,
      price: 100,
      status: 'approved',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return serviceRef.id;
  }

  async function createTestBooking(courseId: string, studentId: string, instructorId: string): Promise<string> {
    const bookingRef = await db.collection('bookings').add({
      serviceId: courseId,
      studentId,
      consultantId: instructorId,
      createdAt: new Date(),
      status: 'completed',
    });
    return bookingRef.id;
  }

  async function cleanupTestData(): Promise<void> {
    const collections = [
      'courses',
      'courseEnrollments',
      'courseVideos',
      'videoProgress',
      'learningGoals',
      'courseCertificates',
      'certificateTemplates',
      'services',
      'bookings',
    ];

    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      const batch = db.batch();
      
      snapshot.docs.forEach(doc => {
        if (doc.id.includes('test') || doc.id.includes('Test')) {
          batch.delete(doc.ref);
        }
      });
      
      if (snapshot.docs.length > 0) {
        await batch.commit();
      }
    }
  }
});
