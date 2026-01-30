// Document Security Live Demo Test
// This test demonstrates the security system working with real scenarios

import request from 'supertest';
import app from '../app';

// Mock authentication middleware for demo
jest.mock('../middleware/authMiddleware', () => ({
  authenticateUser: () => (req: any, res: any, next: any) => {
    // Mock authenticated user based on role header
    const role = req.headers['x-demo-role'] || 'student';
    const userId = req.headers['x-demo-user-id'] || 'demo-student';
    
    req.user = {
      uid: userId,
      email: 'demo@example.com',
      name: 'Demo User',
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

// Mock Firebase for demo
jest.mock('../config/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn((docId: string) => {
        // Mock document ownership based on document ID
        const mockDoc = {
          get: jest.fn(() => Promise.resolve({
            exists: true,
            data: () => {
              // If document ID matches user ID, it belongs to them
              if (docId.includes('demo-student')) {
                return {
                  userId: 'demo-student',
                  documentType: 'work-authorization',
                  fileName: 'authorization.pdf',
                  status: 'pending'
                };
              }
              if (docId.includes('demo-employer')) {
                return {
                  userId: 'demo-employer',
                  documentType: 'company-doc',
                  fileName: 'company.pdf',
                  status: 'verified'
                };
              }
              // Default: belongs to someone else
              return {
                userId: 'other-user',
                documentType: 'work-authorization',
                fileName: 'authorization.pdf',
                status: 'pending'
              };
            }
          })),
          set: jest.fn(),
          delete: jest.fn(),
        };
        return mockDoc;
      }),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({ 
              empty: false,
              docs: [{ id: 'booking-123' }]
            }))
          })),
        })),
      })),
      add: jest.fn(() => Promise.resolve({ id: 'demo-log-id' })),
    })),
  },
}));

describe('Document Security Live Demo', () => {
  describe('🔒 Scenario 1: Student Accessing Own Documents', () => {
    it('✅ should ALLOW student to access their own documents', async () => {
      console.log('\n🔒 DEMO: Student accessing own documents...');
      
      const response = await request(app)
        .get('/authorization-documents/demo-student-doc-123')
        .set('x-demo-role', 'student')
        .set('x-demo-user-id', 'demo-student')
        .expect(200);

      console.log('✅ SUCCESS: Student can access own documents');
      console.log('📄 Response:', response.body);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('document');
      expect(response.body.document).toHaveProperty('userId', 'demo-student');
    });
  });

  describe('🚫 Scenario 2: Student Accessing Other Student Documents', () => {
    it('❌ should BLOCK student from accessing other student documents', async () => {
      console.log('\n🚫 DEMO: Student trying to access other student documents...');
      
      const response = await request(app)
        .get('/authorization-documents/other-student-doc-456')
        .set('x-demo-role', 'student')
        .set('x-demo-user-id', 'demo-student')
        .expect(403);

      console.log('✅ SUCCESS: Student blocked from accessing other documents');
      console.log('🚫 Error Response:', response.body);
      
      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('🚫 Scenario 3: Employer Accessing Student Documents', () => {
    it('❌ should BLOCK employer from accessing student documents', async () => {
      console.log('\n🚫 DEMO: Employer trying to access student documents...');
      
      const response = await request(app)
        .get('/authorization-documents/demo-student-doc-123')
        .set('x-demo-role', 'recruiter')
        .set('x-demo-user-id', 'demo-employer')
        .expect(403);

      console.log('✅ SUCCESS: Employer blocked from accessing student documents');
      console.log('🚫 Error Response:', response.body);
      
      expect(response.body).toHaveProperty('error', 'Access denied');
      expect(response.body).toHaveProperty('message', 'Employers cannot access student private documents');
      expect(response.body).toHaveProperty('code', 'DOCUMENT_ACCESS_DENIED');
    });
  });

  describe('✅ Scenario 4: Admin Accessing Any Document', () => {
    it('✅ should ALLOW admin to access any document', async () => {
      console.log('\n✅ DEMO: Admin accessing any document...');
      
      const response = await request(app)
        .get('/authorization-documents/demo-student-doc-123')
        .set('x-demo-role', 'admin')
        .set('x-demo-user-id', 'demo-admin')
        .expect(200);

      console.log('✅ SUCCESS: Admin can access any document');
      console.log('📄 Response:', response.body);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('document');
    });
  });

  describe('✅ Scenario 5: Consultant Accessing Client Documents', () => {
    it('✅ should ALLOW consultant to access client documents (with booking)', async () => {
      console.log('\n✅ DEMO: Consultant accessing client documents with active booking...');
      
      const response = await request(app)
        .get('/resumes/demo-student')
        .set('x-demo-role', 'consultant')
        .set('x-demo-user-id', 'demo-consultant')
        .expect(200);

      console.log('✅ SUCCESS: Consultant can access client documents');
      console.log('📄 Response status:', response.status);
      
      expect(response.status).toBe(200);
    });
  });

  describe('🚫 Scenario 6: Consultant Accessing Non-Client Documents', () => {
    it('❌ should BLOCK consultant from accessing non-client documents', async () => {
      console.log('\n🚫 DEMO: Consultant trying to access non-client documents...');
      
      // Mock no booking exists
      const mockDb = require('../config/firebase').db;
      mockDb.collection().where().where().limit().get.mockResolvedValue({
        empty: true
      });

      const response = await request(app)
        .get('/resumes/other-student')
        .set('x-demo-role', 'consultant')
        .set('x-demo-user-id', 'demo-consultant')
        .expect(403);

      console.log('✅ SUCCESS: Consultant blocked from accessing non-client documents');
      console.log('🚫 Error Response:', response.body);
      
      expect(response.body).toHaveProperty('error', 'Access denied');
      expect(response.body).toHaveProperty('message', 'Consultants can only access documents of students they have bookings with');
    });
  });

  describe('📝 Scenario 7: Document Upload Security', () => {
    it('✅ should ALLOW students to upload their own documents', async () => {
      console.log('\n📝 DEMO: Student uploading document...');
      
      const response = await request(app)
        .post('/authorization-documents')
        .set('x-demo-role', 'student')
        .set('x-demo-user-id', 'demo-student')
        .send({
          documentType: 'work-authorization',
          documentUrl: 'https://example.com/authorization.pdf',
          fileName: 'authorization.pdf'
        })
        .expect(201);

      console.log('✅ SUCCESS: Student can upload documents');
      console.log('📄 Response:', response.body);
      
      expect(response.body).toHaveProperty('message', 'Document uploaded successfully');
      expect(response.body).toHaveProperty('document');
      expect(response.body.document).toHaveProperty('userId', 'demo-student');
    });
  });

  describe('🗑️ Scenario 8: Document Deletion Security', () => {
    it('✅ should ALLOW students to delete their own documents', async () => {
      console.log('\n🗑️ DEMO: Student deleting own document...');
      
      const response = await request(app)
        .delete('/authorization-documents/demo-student-doc-123')
        .set('x-demo-role', 'student')
        .set('x-demo-user-id', 'demo-student')
        .expect(200);

      console.log('✅ SUCCESS: Student can delete own documents');
      console.log('📄 Response:', response.body);
      
      expect(response.body).toHaveProperty('message', 'Document deleted successfully');
    });

    it('❌ should BLOCK students from deleting other documents', async () => {
      console.log('\n🗑️ DEMO: Student trying to delete other document...');
      
      const response = await request(app)
        .delete('/authorization-documents/other-student-doc-456')
        .set('x-demo-role', 'student')
        .set('x-demo-user-id', 'demo-student')
        .expect(403);

      console.log('✅ SUCCESS: Student blocked from deleting other documents');
      console.log('🚫 Error Response:', response.body);
      
      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('📊 Scenario 9: Access Logging Verification', () => {
    it('📝 should log all document access attempts', async () => {
      console.log('\n📝 DEMO: Verifying access logging...');
      
      const mockDb = require('../config/firebase').db;
      
      // Perform an access that should be logged
      await request(app)
        .get('/authorization-documents/demo-student-doc-123')
        .set('x-demo-role', 'student')
        .set('x-demo-user-id', 'demo-student')
        .expect(200);

      // Verify logging was called
      expect(mockDb.collection).toHaveBeenCalledWith('documentAccessLogs');
      expect(mockDb.collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'demo-student',
          userRole: 'student',
          documentId: 'demo-student-doc-123',
          method: 'GET',
          path: '/authorization-documents/demo-student-doc-123',
          timestamp: expect.any(Date)
        })
      );

      console.log('✅ SUCCESS: Access logging verified');
    });
  });

  describe('🔍 Scenario 10: Complete Security Matrix Test', () => {
    it('🔍 should demonstrate complete security matrix', async () => {
      console.log('\n🔍 DEMO: Complete Security Matrix Test');
      console.log('='.repeat(50));

      const testCases = [
        {
          role: 'student',
          userId: 'demo-student',
          targetDoc: 'demo-student-doc-123',
          expectedStatus: 200,
          description: 'Student accessing own document'
        },
        {
          role: 'student',
          userId: 'demo-student',
          targetDoc: 'other-student-doc-456',
          expectedStatus: 403,
          description: 'Student accessing other document'
        },
        {
          role: 'recruiter',
          userId: 'demo-employer',
          targetDoc: 'demo-student-doc-123',
          expectedStatus: 403,
          description: 'Employer accessing student document'
        },
        {
          role: 'admin',
          userId: 'demo-admin',
          targetDoc: 'demo-student-doc-123',
          expectedStatus: 200,
          description: 'Admin accessing any document'
        }
      ];

      for (const testCase of testCases) {
        console.log(`\n🧪 Testing: ${testCase.description}`);
        console.log(`   Role: ${testCase.role}, Target: ${testCase.targetDoc}`);
        
        const response = await request(app)
          .get(`/authorization-documents/${testCase.targetDoc}`)
          .set('x-demo-role', testCase.role)
          .set('x-demo-user-id', testCase.userId);

        if (response.status === testCase.expectedStatus) {
          console.log(`   ✅ PASS: Status ${response.status} (expected ${testCase.expectedStatus})`);
        } else {
          console.log(`   ❌ FAIL: Status ${response.status} (expected ${testCase.expectedStatus})`);
        }
        
        expect(response.status).toBe(testCase.expectedStatus);
      }

      console.log('\n✅ SUCCESS: Security matrix test completed');
    });
  });
});
