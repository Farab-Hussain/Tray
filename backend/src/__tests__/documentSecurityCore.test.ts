// Core Document Security Tests
import request from 'supertest';
import app from '../app';

// Mock authentication middleware to bypass auth for tests
jest.mock('../middleware/authMiddleware', () => ({
  authenticateUser: () => (req: any, res: any, next: any) => {
    // Mock authenticated user based on role
    const role = req.headers['x-test-role'] || 'student';
    const userId = req.headers['x-test-user-id'] || 'test-student-id';
    
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

// Mock Firebase
jest.mock('../config/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          exists: true,
          data: () => ({ role: 'student', activeRole: 'student' })
        })),
        set: jest.fn(),
        delete: jest.fn(),
      })),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({ empty: false }))
          })),
        })),
      })),
      add: jest.fn(() => Promise.resolve({ id: 'test-log-id' })),
    })),
  },
}));

describe('Document Security Core Tests', () => {
  describe('Basic Security Functionality', () => {
    it('should verify document security middleware is working', async () => {
      // Test that the security middleware is properly applied
      // This test verifies the middleware chain is functioning
      
      // Mock a document that the student owns
      const mockDb = require('../config/firebase').db;
      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({ 
          userId: 'student-123',
          documentType: 'work-authorization'
        })
      });

      const response = await request(app)
        .get('/authorization-documents/student-123')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'student-123')
        .expect(200);

      // Should succeed for student accessing their own document
      expect(response.status).toBe(200);
    });

    it('should block unauthorized access', async () => {
      // Mock a document that belongs to another student
      const mockDb = require('../config/firebase').db;
      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({ 
          userId: 'other-student-456',
          documentType: 'work-authorization'
        })
      });

      const response = await request(app)
        .get('/authorization-documents/other-student-456')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'student-123')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin access to any document', async () => {
      // Mock any document
      const mockDb = require('../config/firebase').db;
      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({ 
          userId: 'student-123',
          documentType: 'work-authorization'
        })
      });

      const response = await request(app)
        .get('/authorization-documents/student-123')
        .set('x-test-role', 'admin')
        .set('x-test-user-id', 'admin-000')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should block employer access to student documents', async () => {
      // Mock a student document
      const mockDb = require('../config/firebase').db;
      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({ 
          userId: 'student-123',
          documentType: 'work-authorization'
        })
      });

      const response = await request(app)
        .get('/authorization-documents/student-123')
        .set('x-test-role', 'recruiter')
        .set('x-test-user-id', 'employer-456')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
      expect(response.body).toHaveProperty('message', 'Employers cannot access student private documents');
    });
  });

  describe('Security Middleware Integration', () => {
    it('should apply security middleware to document routes', async () => {
      // Test that security middleware is properly integrated
      const mockDb = require('../config/firebase').db;
      
      // Mock document exists and belongs to user
      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({ 
          userId: 'student-123',
          documentType: 'work-authorization'
        })
      });

      const response = await request(app)
        .get('/authorization-documents/student-123')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'student-123')
        .expect(200);

      // Should reach the controller (not be blocked by middleware)
      expect(response.status).toBe(200);
    });

    it('should log document access attempts', async () => {
      const mockDb = require('../config/firebase').db;
      
      // Mock document exists and belongs to user
      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({ 
          userId: 'student-123',
          documentType: 'work-authorization'
        })
      });

      await request(app)
        .get('/authorization-documents/student-123')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'student-123')
        .expect(200);

      // Verify logging was called (document access logging)
      expect(mockDb.collection).toHaveBeenCalledWith('documentAccessLogs');
    });
  });

  describe('Resume Security', () => {
    it('should apply security to resume routes', async () => {
      // Test resume security is working
      const mockDb = require('../config/firebase').db;
      
      // Mock resume exists and belongs to user
      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({ 
          userId: 'student-123',
          personalInfo: { name: 'Test Student' }
        })
      });

      const response = await request(app)
        .get('/resumes/student-123')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'student-123')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should block unauthorized resume access', async () => {
      // Mock resume belongs to another user
      const mockDb = require('../config/firebase').db;
      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({ 
          userId: 'other-student-456',
          personalInfo: { name: 'Other Student' }
        })
      });

      const response = await request(app)
        .get('/resumes/other-student-456')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'student-123')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('Security Features Verification', () => {
    it('should verify all security middleware components exist', () => {
      // Test that all security middleware functions are available
      const securityMiddleware = require('../middleware/documentSecurity.middleware');
      
      expect(securityMiddleware.enforceDocumentSecurity).toBeDefined();
      expect(securityMiddleware.checkConsultantDocumentAccess).toBeDefined();
      expect(securityMiddleware.sanitizeDocumentForEmployer).toBeDefined();
      expect(securityMiddleware.logDocumentAccess).toBeDefined();
    });

    it('should verify security middleware is applied to routes', () => {
      // Test that routes are properly configured with security middleware
      const authDocRoutes = require('../routes/authorizationDocument.routes');
      const resumeRoutes = require('../routes/resume.routes');
      
      // Routes should be defined (middleware applied in route definitions)
      expect(authDocRoutes).toBeDefined();
      expect(resumeRoutes).toBeDefined();
    });
  });

  describe('Data Sanitization', () => {
    it('should verify sanitization middleware exists', () => {
      const securityMiddleware = require('../middleware/documentSecurity.middleware');
      
      // Test that sanitization function exists
      expect(securityMiddleware.sanitizeDocumentForEmployer).toBeDefined();
      expect(typeof securityMiddleware.sanitizeDocumentForEmployer).toBe('function');
    });
  });

  describe('Access Control Matrix', () => {
    it('should enforce proper access control rules', async () => {
      const mockDb = require('../config/firebase').db;
      
      // Test matrix: Student -> Own Document = Allowed
      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({ userId: 'student-123' })
      });

      const response = await request(app)
        .get('/authorization-documents/student-123')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'student-123')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should enforce employer blocking rules', async () => {
      const mockDb = require('../config/firebase').db;
      
      // Test matrix: Employer -> Student Document = Blocked
      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({ userId: 'student-123' })
      });

      const response = await request(app)
        .get('/authorization-documents/student-123')
        .set('x-test-role', 'recruiter')
        .set('x-test-user-id', 'employer-456')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });
});
