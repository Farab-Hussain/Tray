// src/__tests__/phase1Integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app';

describe('🎯 Phase 1 Complete Integration Tests', () => {
  let employerToken: string;
  let studentToken: string;
  let consultantToken: string;
  let adminToken: string;
  let companyId: string;
  let jobId: string;
  let applicationId: string;

  beforeAll(async () => {
    console.log('🚀 Setting up Phase 1 Integration Test Environment...');

    // Create test users
    const employerResponse = await request(app)
      .post('/auth/register')
      .send({
        email: 'integration-employer@test.com',
        password: 'password123',
        name: 'Integration Test Employer',
        role: 'employer',
      });

    employerToken = employerResponse.body.token;

    const studentResponse = await request(app)
      .post('/auth/register')
      .send({
        email: 'integration-student@test.com',
        password: 'password123',
        name: 'Integration Test Student',
        role: 'student',
      });

    studentToken = studentResponse.body.token;

    const consultantResponse = await request(app)
      .post('/auth/register')
      .send({
        email: 'integration-consultant@test.com',
        password: 'password123',
        name: 'Integration Test Consultant',
        role: 'consultant',
      });

    consultantToken = consultantResponse.body.token;

    const adminResponse = await request(app)
      .post('/auth/register')
      .send({
        email: 'integration-admin@test.com',
        password: 'password123',
        name: 'Integration Test Admin',
        role: 'admin',
      });

    adminToken = adminResponse.body.token;

    console.log('✅ Test users created');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up Phase 1 Integration Test Environment...');
    // Cleanup would go here in a real implementation
  });

  describe('🏢 Company Profile Management', () => {
    it('should create a company profile with fair-chance hiring settings', async () => {
      const companyData = {
        name: 'Integration Test Company',
        industry: 'Technology',
        size: '51-200',
        locations: [{
          id: 'hq',
          name: 'Headquarters',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          country: 'USA',
          postalCode: '12345',
          isHeadquarters: true,
          shiftTypes: ['full-time'],
          locationType: 'office',
        }],
        headquarters: {
          id: 'hq',
          name: 'Headquarters',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          country: 'USA',
          postalCode: '12345',
          isHeadquarters: true,
          shiftTypes: ['full-time'],
          locationType: 'office',
        },
        contactInfo: {
          email: 'hr@integrationtest.com',
          phone: '+1-555-0123',
        },
        socialLinks: {},
        fairChanceHiring: {
          enabled: true,
          banTheBoxCompliant: true,
          felonyFriendly: false,
          caseByCaseReview: true,
          noBackgroundCheck: false,
          secondChancePolicy: 'We review each case individually',
          backgroundCheckPolicy: 'Standard background check required',
          rehabilitationSupport: false,
          reentryProgramPartnership: false,
        },
      };

      const response = await request(app)
        .post('/companies')
        .set('Authorization', `Bearer ${employerToken}`)
        .send(companyData)
        .expect(200);

      expect(response.body.company.name).toBe('Integration Test Company');
      expect(response.body.company.industry).toBe('Technology');
      expect(response.body.company.fairChanceHiring.enabled).toBe(true);
      expect(response.body.company.fairChanceHiring.banTheBoxCompliant).toBe(true);
      expect(response.body.company.fairChanceHiring.caseByCaseReview).toBe(true);

      companyId = response.body.company.id;
      console.log('✅ Company profile created successfully');
    });

    it('should get employer companies', async () => {
      const response = await request(app)
        .get('/companies/my')
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      expect(response.body.companies).toHaveLength(1);
      expect(response.body.companies[0].name).toBe('Integration Test Company');
    });

    it('should submit company for verification', async () => {
      const verificationData = {
        businessRegistrationDocument: 'test-doc-1.pdf',
        taxDocument: 'test-doc-2.pdf',
        proofOfAddress: 'test-doc-3.pdf',
        additionalDocuments: ['test-doc-4.pdf'],
      };

      const response = await request(app)
        .post(`/companies/${companyId}/verification`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send(verificationData)
        .expect(200);

      expect(response.body.verification.status).toBe('pending');
      console.log('✅ Company submitted for verification');
    });
  });

  describe('💳 Job Posting with Payment', () => {
    it('should create a job posting', async () => {
      const jobData = {
        title: 'Integration Test React Developer',
        company: 'Integration Test Company',
        description: 'Test job for integration testing',
        location: 'Test City, TS',
        jobType: 'full-time',
        shiftType: 'day',
        requiredSkills: ['JavaScript', 'React', 'Node.js'],
        preferredSkills: ['TypeScript'],
        salaryRange: {
          min: 60000,
          max: 90000,
          currency: 'USD',
        },
        experienceLevel: 'mid',
        educationLevel: 'bachelor',
        workAuthorization: ['us-citizen'],
        backgroundCheckRequired: true,
        fairChanceHiring: {
          banTheBoxCompliant: true,
          felonyFriendly: false,
          caseByCaseReview: true,
          noBackgroundCheck: false,
        },
        isActive: true,
        companyId: companyId,
      };

      const response = await request(app)
        .post('/jobs')
        .set('Authorization', `Bearer ${employerToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.job.title).toBe('Integration Test React Developer');
      expect(response.body.job.company).toBe('Integration Test Company');
      expect(response.body.job.requiredSkills).toContain('JavaScript');
      expect(response.body.job.fairChanceHiring.banTheBoxCompliant).toBe(true);

      jobId = response.body.job.id;
      console.log('✅ Job posted successfully');
    });

    it('should handle job posting payment requirement', async () => {
      // Test payment requirement for job posting
      const response = await request(app)
        .post('/jobs')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          title: 'Second Test Job',
          company: 'Integration Test Company',
          description: 'Another test job',
          location: 'Test City, TS',
          jobType: 'part-time',
          requiredSkills: ['Python'],
          salaryRange: { min: 40000, max: 60000, currency: 'USD' },
          experienceLevel: 'entry',
          educationLevel: 'high-school',
          workAuthorization: ['us-citizen'],
          backgroundCheckRequired: false,
          fairChanceHiring: {
            banTheBoxCompliant: true,
            felonyFriendly: false,
            caseByCaseReview: false,
            noBackgroundCheck: true,
          },
          isActive: true,
          companyId: companyId,
        });

      // Should either succeed (if payment not required) or return 402 (payment required)
      expect([200, 201, 402]).toContain(response.status);
      
      if (response.status === 402) {
        expect(response.body.error).toBe('Payment required for job posting');
        expect(response.body.paymentAmount).toBeDefined();
        console.log('✅ Job posting payment requirement working');
      } else {
        console.log('✅ Job posted without payment requirement');
      }
    });
  });

  describe('👥 Student Application Process', () => {
    it('should create student resume', async () => {
      const resumeData = {
        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python'],
        experience: [{
          title: 'Software Developer',
          company: 'Previous Company',
          duration: '3 years',
          description: 'Developed web applications',
          achievements: ['Built 5 major features'],
          references: ['John Doe - john@example.com'],
        }],
        education: [{
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          institution: 'Test University',
          graduationYear: 2020,
          gpa: 3.8,
          achievements: ['Dean\'s List'],
        }],
        workRestrictions: ['No heavy lifting'],
        transportation: 'Car',
        workAuthorization: 'US Citizen',
        resumeFileUrl: 'https://example.com/resume.pdf',
      };

      const response = await request(app)
        .post('/resumes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(resumeData)
        .expect(200);

      expect(response.body.resume.skills).toContain('JavaScript');
      expect(response.body.resume.experience).toHaveLength(1);
      expect(response.body.resume.education).toHaveLength(1);

      console.log('✅ Student resume created');
    });

    it('should apply for job with fit score calculation', async () => {
      const applicationData = {
        resumeId: 'test-resume-id',
        coverLetter: 'Integration test cover letter',
      };

      const response = await request(app)
        .post(`/jobs/${jobId}/apply`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(applicationData)
        .expect(201);

      expect(response.body.application.jobId).toBe(jobId);
      expect(response.body.application.status).toBe('pending');
      expect(response.body.fitScoreDetails).toBeDefined();
      expect(response.body.fitScoreDetails.matchPercentage).toBeGreaterThan(0);
      expect(response.body.fitScoreDetails.matchRating).toBeDefined();

      applicationId = response.body.application.id;
      console.log('✅ Student applied for job with fit score');
    });

    it('should get student applications', async () => {
      const response = await request(app)
        .get('/jobs/applications/my')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.applications).toHaveLength(1);
      expect(response.body.applications[0].id).toBe(applicationId);
      console.log('✅ Student applications retrieved');
    });
  });

  describe('🔒 Security-Protected Applicant Review', () => {
    it('should allow employers to view applications with security filtering', async () => {
      const response = await request(app)
        .get(`/jobs/${jobId}/applications`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      expect(response.body.applications).toHaveLength(1);
      expect(response.body.securityNotice).toContain('filtered');

      const application = response.body.applications[0];
      
      // Should see match scores and skills for hiring decisions
      expect(application.matchScore).toBeDefined();
      expect(application.matchRating).toBeDefined();
      expect(application.resume.skills).toBeDefined();
      expect(application.resume.skills).toContain('JavaScript');

      // Should NOT see private information
      expect(application.user.email).toBeUndefined();
      expect(application.user.phone).toBeUndefined();
      expect(application.resume.resumeFileUrl).toBeUndefined();

      console.log('✅ Employer can see match scores but not private data');
    });

    it('should block employer access to private data', async () => {
      const response = await request(app)
        .get(`/jobs/${jobId}/applications`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      const application = response.body.applications[0];

      // Verify private data is blocked
      expect(application.user.email).toBeUndefined();
      expect(application.user.phone).toBeUndefined();
      expect(application.resume.resumeFileUrl).toBeUndefined();
      expect(application.resume.experience[0].description).toBeUndefined();
      expect(application.resume.experience[0].achievements).toBeUndefined();
      expect(application.resume.experience[0].references).toBeUndefined();
      expect(application.resume.education[0].graduationYear).toBeUndefined();
      expect(application.resume.education[0].gpa).toBeUndefined();

      console.log('✅ Private data properly blocked from employers');
    });

    it('should allow admin full access to application data', async () => {
      const response = await request(app)
        .get(`/jobs/${jobId}/applications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const application = response.body.applications[0];

      // Admin should see everything (no security filtering)
      expect(application.matchScore).toBeDefined();
      expect(application.user.email).toBeDefined();
      expect(application.resume.resumeFileUrl).toBeDefined();
      expect(application.resume.experience[0].description).toBeDefined();

      console.log('✅ Admin has full access to application data');
    });

    it('should run security test endpoint successfully', async () => {
      const response = await request(app)
        .post('/jobs/security/test-employer-access')
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      expect(response.body.testResult).toBe('SECURITY_PASSED');
      expect(response.body.securityStatus).toContain('✅ Security working correctly');
      expect(response.body.recommendation).toContain('Employers are properly blocked');

      const test = response.body.test;
      expect(test.employerAccess.canSeeUserEmail).toBe(false);
      expect(test.employerAccess.canSeeResumeFileUrl).toBe(false);
      expect(test.employerAccess.canSeeSkills).toBe(true);
      expect(test.employerAccess.canSeeMatchScores).toBe(true);

      console.log('✅ Security test endpoint passed');
    });
  });

  describe('💰 Payment Processing', () => {
    it('should calculate correct payment splits', async () => {
      const response = await request(app)
        .post('/payment/calculate-split')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 100 })
        .expect(200);

      expect(response.body.consultantAmount).toBe(90);
      expect(response.body.platformFee).toBe(10);
      expect(response.body.consultantPayoutPercentage).toBe(90);
      expect(response.body.platformFeePercentage).toBe(10);

      console.log('✅ Payment split calculation correct');
    });

    it('should handle edge cases in payment calculation', async () => {
      const testAmounts = [1, 50, 99.99, 1000];

      for (const amount of testAmounts) {
        const response = await request(app)
          .post('/payment/calculate-split')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ amount })
          .expect(200);

        expect(response.body.consultantAmount).toBeGreaterThanOrEqual(0);
        expect(response.body.platformFee).toBeGreaterThanOrEqual(0);
        expect(response.body.consultantAmount + response.body.platformFee).toBeLessThanOrEqual(amount);
      }

      console.log('✅ Payment calculation edge cases handled');
    });
  });

  describe('📊 Analytics and Reporting', () => {
    it('should get company statistics', async () => {
      const response = await request(app)
        .get(`/companies/${companyId}/stats`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalJobsPosted).toBeGreaterThanOrEqual(1);
      expect(response.body.stats.activeJobs).toBeGreaterThanOrEqual(1);

      console.log('✅ Company statistics retrieved');
    });

    it('should get industries list', async () => {
      const response = await request(app)
        .get('/companies/industries')
        .expect(200);

      expect(response.body.industries).toContain('Technology');
      expect(response.body.industries).toContain('Healthcare');
      expect(response.body.industries).toContain('Finance');

      console.log('✅ Industries list retrieved');
    });
  });

  describe('🔄 End-to-End Workflow Test', () => {
    it('should complete full Phase 1 workflow', async () => {
      console.log('🎭 Running complete Phase 1 workflow test...');

      // 1. Employer creates company profile
      expect(companyId).toBeDefined();
      console.log('✅ Step 1: Company profile created');

      // 2. Employer posts job
      expect(jobId).toBeDefined();
      console.log('✅ Step 2: Job posted');

      // 3. Student applies for job
      expect(applicationId).toBeDefined();
      console.log('✅ Step 3: Student applied');

      // 4. Employer reviews applications securely
      const employerResponse = await request(app)
        .get(`/jobs/${jobId}/applications`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      expect(employerResponse.body.securityNotice).toContain('filtered');
      expect(employerResponse.body.applications[0].matchScore).toBeDefined();
      expect(employerResponse.body.applications[0].user.email).toBeUndefined();
      console.log('✅ Step 4: Employer reviews applications securely');

      // 5. Security test passes
      const securityResponse = await request(app)
        .post('/jobs/security/test-employer-access')
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      expect(securityResponse.body.testResult).toBe('SECURITY_PASSED');
      console.log('✅ Step 5: Security test passed');

      // 6. Admin has full access
      const adminResponse = await request(app)
        .get(`/jobs/${jobId}/applications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminResponse.body.applications[0].user.email).toBeDefined();
      console.log('✅ Step 6: Admin has full access');

      // 7. Payment calculation works
      const paymentResponse = await request(app)
        .post('/payment/calculate-split')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 100 })
        .expect(200);

      expect(paymentResponse.body.consultantAmount).toBe(90);
      console.log('✅ Step 7: Payment calculation works');

      console.log('🎉 Complete Phase 1 workflow test PASSED');
    });
  });

  describe('🚨 Error Handling and Edge Cases', () => {
    it('should handle unauthorized access attempts', async () => {
      // Try to access applications without token
      await request(app)
        .get(`/jobs/${jobId}/applications`)
        .expect(401);

      // Try to access with wrong role
      await request(app)
        .get(`/jobs/${jobId}/applications`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      console.log('✅ Unauthorized access properly blocked');
    });

    it('should handle invalid data submissions', async () => {
      // Try to create job with invalid data
      await request(app)
        .post('/jobs')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          title: '', // Missing required field
          company: 'Test Company',
          description: 'Test description',
        })
        .expect(400);

      console.log('✅ Invalid data properly rejected');
    });

    it('should handle non-existent resources', async () => {
      // Try to access non-existent application
      await request(app)
        .get('/jobs/applications/non-existent')
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(404);

      // Try to access non-existent company
      await request(app)
        .get('/companies/non-existent')
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(404);

      console.log('✅ Non-existent resources properly handled');
    });
  });

  describe('📱 Performance and Load Testing', () => {
    it('should handle concurrent requests', async () => {
      const promises = [];

      // Simulate multiple concurrent requests
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .get(`/jobs/${jobId}/applications`)
            .set('Authorization', `Bearer ${employerToken}`)
        );
      }

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      console.log('✅ Concurrent requests handled successfully');
    });

    it('should maintain security under load', async () => {
      const promises = [];

      // Multiple security test requests
      for (let i = 0; i < 3; i++) {
        promises.push(
          request(app)
            .post('/jobs/security/test-employer-access')
            .set('Authorization', `Bearer ${employerToken}`)
        );
      }

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.testResult).toBe('SECURITY_PASSED');
      });

      console.log('✅ Security maintained under load');
    });
  });
});
