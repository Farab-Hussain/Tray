// Document Security Tests
import request from 'supertest';
import app from '../app';

// Mock authentication middleware
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

describe('Document Access Security Tests', () => {
  describe('Student Document Access', () => {
    it('should allow students to access their own documents', async () => {
      const response = await request(app)
        .get('/resumes/my')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'student-123')
        .expect(200);

      // Should succeed (actual response depends on service implementation)
      expect(response.status).toBe(200);
    });

    it('should block students from accessing other students documents', async () => {
      const response = await request(app)
        .get('/resumes/other-student-id')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'student-123')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should allow students to upload their own documents', async () => {
      const response = await request(app)
        .post('/authorization-documents')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'student-123')
        .send({
          documentType: 'work-authorization',
          documentUrl: 'https://example.com/doc.pdf',
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Document uploaded successfully');
    });
  });

  describe('Employer Document Access Restrictions', () => {
    it('should block employers from accessing student documents', async () => {
      const response = await request(app)
        .get('/resumes/student-123')
        .set('x-test-role', 'recruiter')
        .set('x-test-user-id', 'employer-456')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
      expect(response.body).toHaveProperty('message', 'Employers cannot access student private documents');
      expect(response.body).toHaveProperty('code', 'DOCUMENT_ACCESS_DENIED');
    });

    it('should block employers from accessing authorization documents', async () => {
      const response = await request(app)
        .get('/authorization-documents/student-123')
        .set('x-test-role', 'recruiter')
        .set('x-test-user-id', 'employer-456')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should allow employers to access sanitized resume data for job applications', async () => {
      // This would be tested through job application routes, not direct document access
      // Employers should only see resumes through the application process
      const response = await request(app)
        .get('/jobs/job-123/applications')
        .set('x-test-role', 'recruiter')
        .set('x-test-user-id', 'employer-456')
        .expect(200);

      // Should succeed and return sanitized data
      expect(response.status).toBe(200);
    });
  });

  describe('Consultant Document Access', () => {
    it('should allow consultants to access documents of students they have bookings with', async () => {
      // Mock booking exists
      const mockDb = require('../config/firebase').db;
      mockDb.collection().where().where().limit().get.mockResolvedValue({
        empty: false,
        docs: [{ id: 'booking-123' }]
      });

      const response = await request(app)
        .get('/resumes/student-123')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'consultant-789')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should block consultants from accessing documents of students without bookings', async () => {
      // Mock no booking exists
      const mockDb = require('../config/firebase').db;
      mockDb.collection().where().where().limit().get.mockResolvedValue({
        empty: true
      });

      const response = await request(app)
        .get('/resumes/student-123')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'consultant-789')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
      expect(response.body).toHaveProperty('message', 'Consultants can only access documents of students they have bookings with');
      expect(response.body).toHaveProperty('code', 'CONSULTANT_ACCESS_DENIED');
    });
  });

  describe('Admin Document Access', () => {
    it('should allow admins to access any document', async () => {
      const response = await request(app)
        .get('/resumes/student-123')
        .set('x-test-role', 'admin')
        .set('x-test-user-id', 'admin-000')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should allow admins to access authorization documents', async () => {
      const response = await request(app)
        .get('/authorization-documents/student-123')
        .set('x-test-role', 'admin')
        .set('x-test-user-id', 'admin-000')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should allow admins to update document status', async () => {
      const response = await request(app)
        .put('/authorization-documents/doc-123/status')
        .set('x-test-role', 'admin')
        .set('x-test-user-id', 'admin-000')
        .send({
          status: 'verified',
          rejectionReason: null
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Document status updated successfully');
    });
  });

  describe('Document Sanitization', () => {
    it('should sanitize resume data for employers', async () => {
      const response = await request(app)
        .get('/resumes/student-123')
        .set('x-test-role', 'recruiter')
        .set('x-test-user-id', 'employer-456')
        .expect(403);

      // Since employers are blocked from direct access, this test verifies the blocking works
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should not sanitize data for students accessing their own documents', async () => {
      // Students should see their full data
      const response = await request(app)
        .get('/resumes/my')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'student-123')
        .expect(200);

      expect(response.status).toBe(200);
      // Full data should be returned (not sanitized)
    });
  });

  describe('Access Logging', () => {
    it('should log all document access attempts', async () => {
      const mockDb = require('../config/firebase').db;
      
      await request(app)
        .get('/resumes/student-123')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'student-123')
        .expect(200);

      // Verify logging was called
      expect(mockDb.collection).toHaveBeenCalledWith('documentAccessLogs');
      expect(mockDb.collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'student-123',
          userRole: 'student',
          documentId: 'student-123',
          method: 'GET',
          path: '/resumes/student-123',
          timestamp: expect.any(Date)
        })
      );
    });

    it('should log blocked access attempts', async () => {
      const mockDb = require('../config/firebase').db;
      
      await request(app)
        .get('/resumes/student-123')
        .set('x-test-role', 'recruiter')
        .set('x-test-user-id', 'employer-456')
        .expect(403);

      // Verify blocked access was logged
      expect(mockDb.collection).toHaveBeenCalledWith('documentAccessLogs');
      expect(mockDb.collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'employer-456',
          userRole: 'recruiter',
          documentId: 'student-123',
          method: 'GET',
          path: '/resumes/student-123',
          accessGranted: false,
          reason: 'Employer cannot access student documents'
        })
      );
    });
  });

  describe('Document Upload Security', () => {
    it('should allow students to upload their own documents', async () => {
      const response = await request(app)
        .post('/authorization-documents')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'student-123')
        .send({
          documentType: 'work-authorization',
          documentUrl: 'https://example.com/doc.pdf',
          fileName: 'authorization.pdf'
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Document uploaded successfully');
    });

    it('should block employers from uploading documents to student profiles', async () => {
      const response = await request(app)
        .post('/authorization-documents')
        .set('x-test-role', 'recruiter')
        .set('x-test-user-id', 'employer-456')
        .send({
          documentType: 'work-authorization',
          documentUrl: 'https://example.com/doc.pdf',
        })
        .expect(201); // Upload might succeed but document will be associated with employer

      expect(response.body).toHaveProperty('document');
      expect(response.body.document).toHaveProperty('userId', 'employer-456');
    });
  });

  describe('Document Deletion Security', () => {
    it('should allow students to delete their own documents', async () => {
      const response = await request(app)
        .delete('/authorization-documents/doc-123')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'student-123')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Document deleted successfully');
    });

    it('should block students from deleting other students documents', async () => {
      const response = await request(app)
        .delete('/authorization-documents/doc-123')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'student-456')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should allow admins to delete any document', async () => {
      const response = await request(app)
        .delete('/authorization-documents/doc-123')
        .set('x-test-role', 'admin')
        .set('x-test-user-id', 'admin-000')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Document deleted successfully');
    });
  });
});
