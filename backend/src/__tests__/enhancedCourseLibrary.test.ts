// @ts-nocheck
// backend/src/__tests__/enhancedCourseLibrary.test.ts
// Comprehensive test suite for Enhanced Course Library functionality

import request from 'supertest';
import express from 'express';
import { Timestamp } from 'firebase-admin/firestore';
import { courseService } from '../services/course.service';
import { courseController } from '../controllers/course.controller';
import { courseRoutes } from '../routes/course.routes';

// Mock Firebase
jest.mock('firebase-admin/firestore', () => ({
  Timestamp: {
    fromDate: jest.fn((date) => ({ toDate: () => date })),
    now: jest.fn(() => ({ toDate: () => new Date() })),
  },
}));

// Mock course service
jest.mock('../services/course.service');
const mockedCourseService = courseService as jest.Mocked<typeof courseService>;

// Mock authentication middleware
jest.mock('../middleware/auth', () => ({
  authenticateUser: (req: any, res: any, next: any) => {
    req.user = {
      uid: 'test-user-123',
      role: 'student',
      email: 'test@example.com',
    };
    next();
  },
  authorizeRole: (roles: string[]) => (req: any, res: any, next: any) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied' });
    }
  },
}));

const app = express();
app.use(express.json());
app.use('/courses', courseRoutes);

describe.skip('Enhanced Course Library Backend Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Course Creation with Enhanced Features', () => {
    it('should create a course with time-based pricing', async () => {
      const courseData = {
        title: 'Advanced React Development',
        description: 'Master React with advanced concepts',
        shortDescription: 'Advanced React course',
        category: 'Technology',
        level: 'advanced',
        price: 9999, // $99.99 in cents
        currency: 'USD',
        language: 'English',
        slug: 'advanced-react-development',
        duration: 7200, // 2 hours
        durationText: '2 hours',
        lessonsCount: 12,
        objectives: ['Master React hooks', 'Build scalable applications'],
        prerequisites: ['Basic React knowledge'],
        targetAudience: ['React developers'],
        difficultyScore: 8,
        timeCommitment: '10 hours per week',
        certificateAvailable: true,
        tags: ['react', 'javascript', 'frontend'],
        pricingOptions: {
          monthly: 1999, // $19.99
          yearly: 19999, // $199.99
          lifetime: 49999, // $499.99
        },
        enrollmentType: 'instant',
        availabilitySchedule: {
          startDate: new Date().toISOString(),
          endDate: null,
          enrollmentDeadline: null,
          maxEnrollments: 100,
          currentEnrollments: 0,
        },
        accessDuration: {
          type: 'lifetime',
        },
        isLaunched: false,
        launchDate: null,
      };

      const createdCourse = {
        id: 'course-123',
        ...courseData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft',
        enrollmentCount: 0,
        completionCount: 0,
        averageRating: 0,
        ratingCount: 0,
      };

      mockedCourseService.createCourse.mockResolvedValue(createdCourse);

      const response = await request(app)
        .post('/courses')
        .send(courseData)
        .expect(201);

      expect(response.body.message).toBe('Course created successfully');
      expect(response.body.course).toEqual(createdCourse);
      expect(mockedCourseService.createCourse).toHaveBeenCalledWith(courseData);
    });

    it('should validate required fields for course creation', async () => {
      const invalidCourseData = {
        description: 'Missing title and other required fields',
      };

      mockedCourseService.createCourse.mockRejectedValue(
        new Error('Title and description are required')
      );

      const response = await request(app)
        .post('/courses')
        .send(invalidCourseData)
        .expect(400);

      expect(response.body.error).toBe('Title and description are required');
    });
  });

  describe('Course Purchase Flow', () => {
    it('should allow student to purchase course with monthly pricing', async () => {
      const purchaseData = {
        courseId: 'course-123',
        pricingOption: 'monthly' as const,
        paymentId: 'payment-123',
      };

      const purchase = {
        id: 'purchase-123',
        courseId: 'course-123',
        studentId: 'test-user-123',
        pricingOption: 'monthly',
        pricePaid: 1999,
        currency: 'USD',
        paymentId: 'payment-123',
        paymentStatus: 'completed',
        purchasedAt: new Date(),
        accessStartsAt: new Date(),
        accessEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
        autoRenew: true,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        refundRequested: false,
        refundProcessed: false,
      };

      mockedCourseService.purchaseCourse.mockResolvedValue(purchase);

      const response = await request(app)
        .post('/courses/purchase')
        .send(purchaseData)
        .expect(201);

      expect(response.body.message).toBe('Course purchased successfully');
      expect(response.body.purchase).toEqual(purchase);
      expect(mockedCourseService.purchaseCourse).toHaveBeenCalledWith(
        'course-123',
        'test-user-123',
        'payment-123',
        'monthly',
        undefined
      );
    });

    it('should prevent purchase of unlaunched course', async () => {
      const purchaseData = {
        courseId: 'unlaunched-course',
        pricingOption: 'lifetime' as const,
        paymentId: 'payment-123',
      };

      mockedCourseService.purchaseCourse.mockRejectedValue(
        new Error('Course is not yet launched')
      );

      const response = await request(app)
        .post('/courses/purchase')
        .send(purchaseData)
        .expect(400);

      expect(response.body.error).toBe('Course is not yet launched');
    });
  });

  describe('Course Access Management', () => {
    it('should check student access to purchased course', async () => {
      const accessInfo = {
        hasAccess: true,
        accessType: 'purchased',
        accessStartsAt: new Date(),
        accessEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        remainingDays: 25,
      };

      mockedCourseService.hasCourseAccess.mockResolvedValue(accessInfo);

      const response = await request(app)
        .get('/courses/course-123/access')
        .expect(200);

      expect(response.body.hasAccess).toBe(true);
      expect(response.body.accessType).toBe('purchased');
      expect(mockedCourseService.hasCourseAccess).toHaveBeenCalledWith(
        'course-123',
        'test-user-123'
      );
    });

    it('should deny access to non-purchased course', async () => {
      const accessInfo = {
        hasAccess: false,
        accessType: null,
        accessStartsAt: null,
        accessEndsAt: null,
        isActive: false,
        remainingDays: 0,
      };

      mockedCourseService.hasCourseAccess.mockResolvedValue(accessInfo);

      const response = await request(app)
        .get('/courses/course-456/access')
        .expect(200);

      expect(response.body.hasAccess).toBe(false);
    });
  });

  describe('Course Launch Management', () => {
    it('should allow consultant to launch course', async () => {
      const launchedCourse = {
        id: 'course-123',
        isLaunched: true,
        launchDate: new Date(),
        status: 'published',
      };

      mockedCourseService.launchCourse.mockResolvedValue(launchedCourse);

      const response = await request(app)
        .post('/courses/course-123/launch')
        .expect(200);

      expect(response.body.message).toBe('Course launched successfully');
      expect(response.body.course.isLaunched).toBe(true);
      expect(mockedCourseService.launchCourse).toHaveBeenCalledWith('course-123');
    });

    it('should prevent non-consultant from launching course', async () => {
      // Mock non-consultant user
      const mockAuth = require('../middleware/auth');
      mockAuth.authorizeRole = (roles: string[]) => (req: any, res: any, next: any) => {
        if (!roles.includes(req.user.role)) {
          return res.status(403).json({ error: 'Access denied' });
        }
        next();
      };

      const response = await request(app)
        .post('/courses/course-123/launch')
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('Certificate Management', () => {
    it('should issue certificate for completed course', async () => {
      const certificateData = {
        courseId: 'course-123',
        studentId: 'test-user-123',
        completionDate: new Date(),
      };

      const certificate = {
        id: 'certificate-123',
        courseId: 'course-123',
        studentId: 'test-user-123',
        issuedAt: new Date(),
        verificationCode: 'ABC123DEF456',
        certificateUrl: 'https://storage.googleapis.com/certificates/certificate-123.pdf',
        isValid: true,
        revokedAt: null,
      };

      mockedCourseService.issueCertificate.mockResolvedValue(certificate);

      const response = await request(app)
        .post('/courses/issue-certificate')
        .send(certificateData)
        .expect(201);

      expect(response.body.message).toBe('Certificate issued successfully');
      expect(response.body.certificate.verificationCode).toBe('ABC123DEF456');
      expect(mockedCourseService.issueCertificate).toHaveBeenCalledWith(
        'course-123',
        'test-user-123',
        expect.any(Date)
      );
    });

    it('should verify certificate with valid code', async () => {
      const verificationResult = {
        isValid: true,
        certificate: {
          id: 'certificate-123',
          courseId: 'course-123',
          studentId: 'test-user-123',
          issuedAt: new Date(),
          verificationCode: 'ABC123DEF456',
        },
        course: {
          title: 'Advanced React Development',
          instructorName: 'John Doe',
        },
        student: {
          name: 'Jane Smith',
          email: 'jane@example.com',
        },
      };

      mockedCourseService.verifyCertificate.mockResolvedValue(verificationResult);

      const response = await request(app)
        .get('/courses/verify/ABC123DEF456')
        .expect(200);

      expect(response.body.isValid).toBe(true);
      expect(response.body.certificate.verificationCode).toBe('ABC123DEF456');
      expect(mockedCourseService.verifyCertificate).toHaveBeenCalledWith('ABC123DEF456');
    });

    it('should reject invalid certificate code', async () => {
      mockedCourseService.verifyCertificate.mockResolvedValue({
        isValid: false,
        error: 'Certificate not found or invalid',
      });

      const response = await request(app)
        .get('/courses/verify/INVALID123')
        .expect(404);

      expect(response.body.isValid).toBe(false);
      expect(response.body.error).toBe('Certificate not found or invalid');
    });
  });

  describe('Student Purchase History', () => {
    it('should get student purchase history', async () => {
      const purchases = [
        {
          id: 'purchase-1',
          courseId: 'course-123',
          title: 'Advanced React Development',
          pricingOption: 'monthly',
          pricePaid: 1999,
          purchasedAt: new Date(),
          isActive: true,
          accessEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'purchase-2',
          courseId: 'course-456',
          title: 'Node.js Fundamentals',
          pricingOption: 'lifetime',
          pricePaid: 9999,
          purchasedAt: new Date(),
          isActive: true,
          accessEndsAt: null,
        },
      ];

      mockedCourseService.getStudentPurchases.mockResolvedValue(purchases);

      const response = await request(app)
        .get('/courses/purchases/my')
        .expect(200);

      expect(response.body.purchases).toHaveLength(2);
      expect(response.body.purchases[0].title).toBe('Advanced React Development');
      expect(mockedCourseService.getStudentPurchases).toHaveBeenCalledWith('test-user-123');
    });
  });

  describe('Student Certificates', () => {
    it('should get student certificates', async () => {
      const certificates = [
        {
          id: 'certificate-1',
          courseId: 'course-123',
          title: 'Advanced React Development',
          issuedAt: new Date(),
          verificationCode: 'ABC123DEF456',
          isValid: true,
        },
        {
          id: 'certificate-2',
          courseId: 'course-456',
          title: 'Node.js Fundamentals',
          issuedAt: new Date(),
          verificationCode: 'GHI789JKL012',
          isValid: true,
        },
      ];

      mockedCourseService.getStudentCertificates.mockResolvedValue(certificates);

      const response = await request(app)
        .get('/courses/certificates/my')
        .expect(200);

      expect(response.body.certificates).toHaveLength(2);
      expect(response.body.certificates[0].title).toBe('Advanced React Development');
      expect(mockedCourseService.getStudentCertificates).toHaveBeenCalledWith('test-user-123');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockedCourseService.createCourse.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/courses')
        .send({
          title: 'Test Course',
          description: 'Test Description',
        })
        .expect(400);

      expect(response.body.error).toBe('Database connection failed');
    });

    it('should validate request parameters', async () => {
      const response = await request(app)
        .post('/courses/purchase')
        .send({
          // Missing required courseId
          pricingOption: 'monthly',
          paymentId: 'payment-123',
        })
        .expect(400);

      expect(response.body.error).toContain('required');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow students to purchase courses', async () => {
      const purchaseData = {
        courseId: 'course-123',
        pricingOption: 'monthly',
        paymentId: 'payment-123',
      };

      mockedCourseService.purchaseCourse.mockResolvedValue({
        id: 'purchase-123',
        ...purchaseData,
        studentId: 'test-user-123',
      });

      const response = await request(app)
        .post('/courses/purchase')
        .send(purchaseData)
        .expect(201);

      expect(response.body.message).toBe('Course purchased successfully');
    });

    it('should allow consultants to launch courses', async () => {
      // Mock consultant user
      const mockAuth = require('../middleware/auth');
      const originalAuthenticate = mockAuth.authenticateUser;
      mockAuth.authenticateUser = (req: any, res: any, next: any) => {
        req.user = {
          uid: 'consultant-123',
          role: 'consultant',
          email: 'consultant@example.com',
        };
        next();
      };

      mockedCourseService.launchCourse.mockResolvedValue({
        id: 'course-123',
        isLaunched: true,
        launchDate: new Date(),
      });

      const response = await request(app)
        .post('/courses/course-123/launch')
        .expect(200);

      expect(response.body.message).toBe('Course launched successfully');

      // Restore original mock
      mockAuth.authenticateUser = originalAuthenticate;
    });
  });
});
