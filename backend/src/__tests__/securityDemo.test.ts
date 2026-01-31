// src/__tests__/securityDemo.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import { db } from '../config/firebase';

describe('🔒 Phase 1 Security Demo Tests', () => {
  let employerToken: string;
  let studentToken: string;
  let adminToken: string;
  let testJobId: string;
  let testApplicationId: string;

  beforeAll(async () => {
    console.log('🎭 Setting up Security Demo Test Environment...');

    // Create test users and get tokens
    const employerResponse = await request(app)
      .post('/auth/register')
      .send({
        email: 'demo-employer@test.com',
        password: 'password123',
        name: 'Demo Employer',
        role: 'employer',
      });

    employerToken = employerResponse.body.token;

    const studentResponse = await request(app)
      .post('/auth/register')
      .send({
        email: 'demo-student@test.com',
        password: 'password123',
        name: 'Demo Student',
        role: 'student',
      });

    studentToken = studentResponse.body.token;

    const adminResponse = await request(app)
      .post('/auth/register')
      .send({
        email: 'demo-admin@test.com',
        password: 'password123',
        name: 'Demo Admin',
        role: 'admin',
      });

    adminToken = adminResponse.body.token;

    // Create test company for employer
    const companyResponse = await request(app)
      .post('/companies')
      .set('Authorization', `Bearer ${employerToken}`)
      .send({
        name: 'Demo Security Company',
        industry: 'Technology',
        size: '51-200',
        locations: [{
          id: 'demo-loc',
          name: 'Headquarters',
          address: '123 Demo St',
          city: 'Demo City',
          state: 'DC',
          country: 'USA',
          postalCode: '12345',
          isHeadquarters: true,
          shiftTypes: ['full-time'],
          locationType: 'office',
        }],
        headquarters: {
          id: 'demo-loc',
          name: 'Headquarters',
          address: '123 Demo St',
          city: 'Demo City',
          state: 'DC',
          country: 'USA',
          postalCode: '12345',
          isHeadquarters: true,
          shiftTypes: ['full-time'],
          locationType: 'office',
        },
        contactInfo: {
          email: 'hr@democompany.com',
        },
        fairChanceHiring: {
          enabled: true,
          banTheBoxCompliant: true,
          felonyFriendly: false,
          caseByCaseReview: true,
          noBackgroundCheck: false,
          secondChancePolicy: 'Case by case review',
          backgroundCheckPolicy: 'Standard background check',
          rehabilitationSupport: false,
          reentryProgramPartnership: false,
        },
      });

    const companyId = companyResponse.body.company.id;

    // Create test job
    const jobResponse = await request(app)
      .post('/jobs')
      .set('Authorization', `Bearer ${employerToken}`)
      .send({
        title: 'Demo Security Test Position',
        company: 'Demo Security Company',
        description: 'Test position for security demo',
        location: 'Demo City, DC',
        jobType: 'full-time',
        requiredSkills: ['JavaScript', 'React', 'Node.js'],
        preferredSkills: ['TypeScript'],
        salaryRange: { min: 60000, max: 90000, currency: 'USD' },
        companyId,
      });

    testJobId = jobResponse.body.job.id;

    // Create student resume
    const resumeResponse = await request(app)
      .post('/resumes')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        experience: [{
          title: 'Software Developer',
          company: 'Previous Company',
          duration: '2 years',
          description: 'Developed web applications',
          achievements: ['Built 5 major features'],
          references: ['John Doe - john@example.com'],
        }],
        education: [{
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          institution: 'Demo University',
          graduationYear: 2020,
          gpa: 3.8,
          achievements: ['Dean\'s List'],
        }],
        workRestrictions: ['No heavy lifting'],
        transportation: 'Car',
        workAuthorization: 'US Citizen',
        resumeFileUrl: 'https://example.com/demo-resume.pdf',
      });

    const resumeId = resumeResponse.body.resume.id;

    // Student applies for job
    const applicationResponse = await request(app)
      .post(`/jobs/${testJobId}/apply`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        resumeId,
        coverLetter: 'Demo cover letter for security testing',
      });

    testApplicationId = applicationResponse.body.application.id;

    console.log('✅ Security Demo test environment ready');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up Security Demo Test Environment...');
    
    // Clean up test data
    const collections = ['users', 'companies', 'jobs', 'resumes', 'jobApplications'];
    
    for (const collection of collections) {
      const snapshot = await db.collection(collection)
        .where('email', 'in', [
          'demo-employer@test.com', 'demo-student@test.com', 'demo-admin@test.com'
        ])
        .get();

      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
  });

  describe('🎯 Phase 1 Demo Scenario Tests', () => {
    it('should demonstrate employer security blocking', async () => {
      console.log('🔍 Testing employer access to applicant data...');

      // Employer tries to access applications
      const response = await request(app)
        .get(`/jobs/${testJobId}/applications`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      const applications = response.body.applications;
      expect(applications).toHaveLength(1);

      const application = applications[0];

      // ✅ Employer should see match scores for ranking
      expect(application.matchScore).toBeDefined();
      expect(application.matchRating).toBeDefined();
      expect(['gold', 'silver', 'bronze', 'basic']).toContain(application.matchRating);

      // ✅ Employer should see skills for matching
      expect(application.resume.skills).toBeDefined();
      expect(application.resume.skills).toContain('JavaScript');

      // 🚨 Employer should NOT see private information
      expect(application.user.email).toBeUndefined();
      expect(application.user.phone).toBeUndefined();
      expect(application.user.address).toBeUndefined();
      expect(application.resume.resumeFileUrl).toBeUndefined();
      expect(application.resume.experience[0].description).toBeUndefined();
      expect(application.resume.experience[0].achievements).toBeUndefined();
      expect(application.resume.experience[0].references).toBeUndefined();
      expect(application.resume.education[0].graduationYear).toBeUndefined();
      expect(application.resume.education[0].gpa).toBeUndefined();

      console.log('✅ Employer security test passed - private data blocked');
    });

    it('should run the security test endpoint', async () => {
      console.log('🧪 Running official security test endpoint...');

      const response = await request(app)
        .post('/jobs/security/test-employer-access')
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      const testResult = response.body;

      // Should pass security test
      expect(testResult.testResult).toBe('SECURITY_PASSED');
      expect(testResult.securityStatus).toContain('✅ Security working correctly');

      // Should verify security measures
      expect(testResult.test.employerAccess.canSeeUserEmail).toBe(false);
      expect(testResult.test.employerAccess.canSeeUserPhone).toBe(false);
      expect(testResult.test.employerAccess.canSeeResumeFileUrl).toBe(false);
      expect(testResult.test.employerAccess.canSeeSkills).toBe(true);
      expect(testResult.test.employerAccess.canSeeMatchScores).toBe(true);

      console.log('✅ Security test endpoint passed');
    });

    it('should demonstrate file access control', async () => {
      console.log('📁 Testing file access control...');

      // Create a test file for the student
      const fileResponse = await request(app)
        .post('/files/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          fileName: 'demo-test-file.pdf',
          mimeType: 'application/pdf',
          size: 1024000,
          visibility: 'private',
          associatedEntityType: 'resume',
          associatedEntityId: testApplicationId,
        });

      const fileId = fileResponse.body.file.id;

      // Student should access their own file
      await request(app)
        .get(`/files/${fileId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      // Employer should be blocked from accessing student file
      await request(app)
        .get(`/files/${fileId}`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(403);

      // Admin should access any file
      await request(app)
        .get(`/files/${fileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      console.log('✅ File access control test passed');
    });

    it('should demonstrate payment split calculation', async () => {
      console.log('💰 Testing payment split calculation...');

      // Test the payment calculation endpoint (if exists)
      const response = await request(app)
        .post('/payment/calculate-split')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 100,
        })
        .expect(200);

      const split = response.body;

      // Should be 90/10 split
      expect(split.consultantAmount).toBe(90);
      expect(split.platformFee).toBe(10);
      expect(split.consultantPayoutPercentage).toBe(90);
      expect(split.platformFeePercentage).toBe(10);

      console.log('✅ Payment split calculation test passed');
    });

    it('should demonstrate company profile management', async () => {
      console.log('🏢 Testing company profile management...');

      // Employer should access their company
      const response = await request(app)
        .get('/companies/my')
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      const companies = response.body.companies;
      expect(companies).toHaveLength(1);

      const company = companies[0];
      expect(company.name).toBe('Demo Security Company');
      expect(company.fairChanceHiring.enabled).toBe(true);
      expect(company.fairChanceHiring.banTheBoxCompliant).toBe(true);

      // Student should not access company data
      await request(app)
        .get('/companies/my')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const studentCompanies = response.body.companies;
      expect(studentCompanies).toHaveLength(0);

      console.log('✅ Company profile management test passed');
    });
  });

  describe('🚨 Security Breach Attempts', () => {
    it('should block employer from accessing another employer\'s jobs', async () => {
      // Create another employer
      const otherEmployerResponse = await request(app)
        .post('/auth/register')
        .send({
          email: 'other-employer@test.com',
          password: 'password123',
          name: 'Other Employer',
          role: 'employer',
        });

      const otherEmployerToken = otherEmployerResponse.body.token;

      // Other employer should not access first employer's job applications
      await request(app)
        .get(`/jobs/${testJobId}/applications`)
        .set('Authorization', `Bearer ${otherEmployerToken}`)
        .expect(403);
    });

    it('should block unauthorized file access attempts', async () => {
      // Try to access non-existent file
      await request(app)
        .get('/files/non-existent-file-id')
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(404);

      // Try to access file without authentication
      await request(app)
        .get('/files/some-file-id')
        .expect(401);
    });

    it('should validate input data and prevent injection', async () => {
      // Try malicious input in job creation
      const maliciousJob = {
        title: '<script>alert("xss")</script>',
        company: 'Test Company',
        description: 'DROP TABLE users;',
        location: 'Test City',
        jobType: 'full-time',
        requiredSkills: ['<script>alert("xss")</script>'],
      };

      const response = await request(app)
        .post('/jobs')
        .set('Authorization', `Bearer ${employerToken}`)
        .send(maliciousJob)
        .expect(400); // Should be rejected by validation
    });
  });

  describe('📊 Security Audit Logging', () => {
    it('should log security events', async () => {
      // Trigger a security event
      await request(app)
        .get('/files/non-existent-file-id')
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(404);

      // Check if audit logs exist (admin endpoint)
      const response = await request(app)
        .get('/files/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const logs = response.body.logs;
      expect(Array.isArray(logs)).toBe(true);

      // Should find our security event
      const securityEvents = logs.filter(log => 
        log.action === 'read' && log.success === false
      );
      expect(securityEvents.length).toBeGreaterThan(0);
    });
  });

  describe('🎯 Complete Phase 1 Demo Flow', () => {
    it('should run complete Phase 1 demo scenario', async () => {
      console.log('🎭 Running complete Phase 1 demo flow...');

      // 1. Student creates profile and applies for job
      const studentApplications = await request(app)
        .get('/jobs/applications/my')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(studentApplications.body.applications).toHaveLength(1);

      // 2. Employer reviews applications securely
      const employerApplications = await request(app)
        .get(`/jobs/${testJobId}/applications`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      expect(employerApplications.body.applications).toHaveLength(1);
      expect(employerApplications.body.securityNotice).toContain('filtered');

      // 3. Run security test
      const securityTest = await request(app)
        .post('/jobs/security/test-employer-access')
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      expect(securityTest.body.testResult).toBe('SECURITY_PASSED');

      // 4. Admin verifies everything
      const adminApplications = await request(app)
        .get(`/jobs/${testJobId}/applications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminApplications.body.applications).toHaveLength(1);

      console.log('✅ Complete Phase 1 demo flow successful');
      console.log('🎯 Phase 1 Security Requirements: FULLY IMPLEMENTED');
    });
  });
});
