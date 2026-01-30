// Complete Phase 1 Implementation Test Suite
// Tests all Phase 1 critical items: Enhanced Profiles, Job Payments, Document Security, Consultant Content, Fit Score UI

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
            skills: ['JavaScript', 'React', 'Node.js'],
            education: [
              {
                degree: 'Bachelor',
                institution: 'Test University',
                graduationYear: 2020,
                field: 'Computer Science'
              }
            ],
            workPreferences: {
              jobTypes: ['full-time', 'remote'],
              locations: ['New York', 'San Francisco'],
              salaryRange: { min: 80000, max: 120000 }
            },
            careerGoals: {
              shortTerm: 'Become a senior developer',
              longTerm: 'Lead a development team'
            },
            externalProfiles: [
              {
                platform: 'LinkedIn',
                url: 'https://linkedin.com/in/testuser'
              }
            ]
          })
        })),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({ 
              empty: false,
              docs: [
                { id: 'job-123', data: { title: 'Test Job' } },
                { id: 'job-456', data: { title: 'Test Job 2' } }
              ]
            }))
          })),
        })),
      })),
      add: jest.fn(() => Promise.resolve({ id: 'test-id' })),
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({
            docs: [
              { id: 'content-1', data: { title: 'Test Content 1' } },
              { id: 'content-2', data: { title: 'Test Content 2' } }
            ]
          }))
        }))
      })),
    })),
  },
}));

// Mock Stripe for payment testing
jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    paymentIntents: {
      create: jest.fn(() => Promise.resolve({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 100,
        currency: 'usd',
      })),
    },
  })),
}));

// Mock skill matching utility
jest.mock('../utils/skillMatching', () => ({
  calculateMatchScore: jest.fn((userSkills: string[], jobSkills: string[]) => {
    const matched = userSkills.filter(skill => 
      jobSkills.some(jobSkill => 
        skill.toLowerCase().trim() === jobSkill.toLowerCase().trim()
      )
    );
    
    const matchPercentage = (matched.length / jobSkills.length) * 100;
    
    let rating = 'basic';
    if (matchPercentage >= 80) rating = 'gold';
    else if (matchPercentage >= 60) rating = 'silver';
    else if (matchPercentage >= 40) rating = 'bronze';
    
    return {
      score: matched.length,
      totalRequired: jobSkills.length,
      matchPercentage,
      rating,
      matchedSkills: matched,
      missingSkills: jobSkills.filter(skill => 
        !matched.some(userSkill => 
          userSkill.toLowerCase().trim() === skill.toLowerCase().trim()
        )
      ),
      improvementSuggestions: [
        'Consider learning the missing skills to improve your match rate',
        'Take online courses to strengthen your profile'
      ],
      availabilityAlignment: 85,
      locationCompatibility: 90,
    };
  }),
}));

describe('🎯 Complete Phase 1 Implementation Test Suite', () => {
  
  describe('✅ Enhanced Profile Fields - COMPLETED', () => {
    it('should support complete student profile data', async () => {
      const profileData = {
        skills: ['JavaScript', 'React', 'Node.js'],
        education: [
          {
            degree: 'Bachelor',
            institution: 'Test University',
            graduationYear: 2020,
            field: 'Computer Science'
          }
        ],
        workPreferences: {
          jobTypes: ['full-time', 'remote'],
          locations: ['New York', 'San Francisco'],
          salaryRange: { min: 80000, max: 120000 }
        },
        careerGoals: {
          shortTerm: 'Become a senior developer',
          longTerm: 'Lead a development team'
        },
        externalProfiles: [
          {
            platform: 'LinkedIn',
            url: 'https://linkedin.com/in/testuser'
          }
        ]
      };

      const response = await request(app)
        .put('/resumes')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .send(profileData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Resume updated successfully');
      expect(response.body).toHaveProperty('resume');
      expect(response.body.resume).toHaveProperty('skills');
      expect(response.body.resume).toHaveProperty('education');
      expect(response.body.resume).toHaveProperty('workPreferences');
      expect(response.body.resume).toHaveProperty('careerGoals');
      expect(response.body.resume).toHaveProperty('externalProfiles');
    });

    it('should retrieve complete profile data', async () => {
      const response = await request(app)
        .get('/resumes/my')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .expect(200);

      expect(response.body).toHaveProperty('resume');
      expect(response.body.resume).toHaveProperty('skills');
      expect(response.body.resume).toHaveProperty('education');
      expect(response.body.resume).toHaveProperty('workPreferences');
      expect(response.body.resume).toHaveProperty('careerGoals');
      expect(response.body.resume).toHaveProperty('externalProfiles');
    });
  });

  describe('✅ Job Posting Payment Enforcement - COMPLETED', () => {
    it('should enforce payment for job posting', async () => {
      const jobData = {
        title: 'Test Job',
        company: 'Test Company',
        location: 'New York',
        jobType: 'full-time',
        requiredSkills: ['JavaScript', 'React'],
        description: 'Test job description',
      };

      const response = await request(app)
        .post('/jobs')
        .set('x-test-role', 'recruiter')
        .set('x-test-user-id', 'test-recruiter')
        .send(jobData)
        .expect(402); // Payment Required

      expect(response.body).toHaveProperty('error', 'Payment required for job posting');
      expect(response.body).toHaveProperty('paymentAmount', 100); // $1.00 in cents
      expect(response.body).toHaveProperty('paymentUrl');
    });

    it('should create payment intent for job posting', async () => {
      const response = await request(app)
        .post('/payment/job-posting/create-intent')
        .set('x-test-role', 'recruiter')
        .set('x-test-user-id', 'test-recruiter')
        .send({ amount: 100 })
        .expect(200);

      expect(response.body).toHaveProperty('client_secret');
      expect(response.body).toHaveProperty('amount', 100);
    });

    it('should confirm job posting payment', async () => {
      const response = await request(app)
        .post('/payment/job-posting/confirm')
        .set('x-test-role', 'recruiter')
        .set('x-test-user-id', 'test-recruiter')
        .send({ paymentIntentId: 'pi_test_123' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Payment confirmed successfully');
    });
  });

  describe('✅ Document Access Security - COMPLETED', () => {
    it('should allow students to access their own documents', async () => {
      const response = await request(app)
        .get('/authorization-documents/student-doc-123')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'student-123')
        .expect(200);

      expect(response.body).toHaveProperty('document');
      expect(response.body.document).toHaveProperty('userId', 'student-123');
    });

    it('should block students from accessing other students documents', async () => {
      const response = await request(app)
        .get('/authorization-documents/other-student-doc-456')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'student-123')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should block employers from accessing student documents', async () => {
      const response = await request(app)
        .get('/authorization-documents/student-doc-123')
        .set('x-test-role', 'recruiter')
        .set('x-test-user-id', 'employer-456')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
      expect(response.body).toHaveProperty('message', 'Employers cannot access student private documents');
    });

    it('should allow admins to access any document', async () => {
      const response = await request(app)
        .get('/authorization-documents/student-doc-123')
        .set('x-test-role', 'admin')
        .set('x-test-user-id', 'admin-000')
        .expect(200);

      expect(response.body).toHaveProperty('document');
    });
  });

  describe('✅ Free Content Posting for Consultants - COMPLETED', () => {
    it('should allow consultants to create free content', async () => {
      const contentData = {
        title: 'Career Development Tips',
        description: 'A comprehensive guide to career development',
        contentType: 'article',
        tags: ['career', 'development', 'tips'],
        category: 'Career Development',
        isFree: true,
      };

      const response = await request(app)
        .post('/consultant-content')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-consultant')
        .send(contentData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Content created successfully and submitted for approval');
      expect(response.body).toHaveProperty('content');
      expect(response.body.content).toHaveProperty('isFree', true);
      expect(response.body.content).toHaveProperty('status', 'pending');
    });

    it('should allow consultants to create paid content', async () => {
      const contentData = {
        title: 'Premium Career Coaching',
        description: 'Advanced career coaching content',
        contentType: 'video',
        tags: ['career', 'coaching', 'premium'],
        category: 'Career Development',
        isFree: false,
        price: 1999, // $19.99 in cents
      };

      const response = await request(app)
        .post('/consultant-content')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-consultant')
        .send(contentData)
        .expect(201);

      expect(response.body).toHaveProperty('content');
      expect(response.body.content).toHaveProperty('isFree', false);
      expect(response.body.content).toHaveProperty('price', 1999);
    });

    it('should block non-consultants from creating content', async () => {
      const contentData = {
        title: 'Unauthorized Content',
        description: 'This should not be allowed',
        contentType: 'article',
        tags: ['test'],
        category: 'Test',
        isFree: true,
      };

      const response = await request(app)
        .post('/consultant-content')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .send(contentData)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Consultant access required');
    });

    it('should allow public access to published content', async () => {
      const response = await request(app)
        .get('/consultant-content/published')
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.content)).toBe(true);
    });
  });

  describe('✅ Fit Score UI Enhancement - COMPLETED', () => {
    it('should calculate and return comprehensive fit score', async () => {
      const response = await request(app)
        .get('/jobs/job-123/match-score')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .expect(200);

      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('totalRequired');
      expect(response.body).toHaveProperty('matchPercentage');
      expect(response.body).toHaveProperty('rating');
      expect(response.body).toHaveProperty('matchedSkills');
      expect(response.body).toHaveProperty('missingSkills');
      expect(response.body).toHaveProperty('improvementSuggestions');
      expect(response.body).toHaveProperty('availabilityAlignment');
      expect(response.body).toHaveProperty('locationCompatibility');
    });

    it('should include fit score in job application response', async () => {
      const applicationData = {
        jobId: 'job-123',
        coverLetter: 'I am very interested in this position',
        availability: 'Immediate',
        expectedSalary: '75000-85000',
      };

      const response = await request(app)
        .post('/job-applications')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .send(applicationData)
        .expect(201);

      expect(response.body).toHaveProperty('application');
      expect(response.body.application).toHaveProperty('fitScoreDetails');
      expect(response.body.fitScoreDetails).toHaveProperty('matchPercentage');
      expect(response.body.fitScoreDetails).toHaveProperty('rating');
    });

    it('should include fit scores in job listings', async () => {
      const response = await request(app)
        .get('/jobs')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .expect(200);

      expect(response.body).toHaveProperty('jobs');
      expect(Array.isArray(response.body.jobs)).toBe(true);
    });
  });

  describe('✅ Integration Tests - Complete Phase 1 Workflow', () => {
    it('should demonstrate complete student workflow', async () => {
      // 1. Student creates complete profile
      const profileData = {
        skills: ['JavaScript', 'React', 'Node.js'],
        education: [
          {
            degree: 'Bachelor',
            institution: 'Test University',
            graduationYear: 2020,
            field: 'Computer Science'
          }
        ],
        workPreferences: {
          jobTypes: ['full-time', 'remote'],
          locations: ['New York'],
          salaryRange: { min: 80000, max: 120000 }
        },
        careerGoals: {
          shortTerm: 'Become a senior developer',
          longTerm: 'Lead a development team'
        },
        externalProfiles: [
          {
            platform: 'LinkedIn',
            url: 'https://linkedin.com/in/testuser'
          }
        ]
      };

      const profileResponse = await request(app)
        .put('/resumes')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .send(profileData)
        .expect(200);

      expect(profileResponse.body).toHaveProperty('message', 'Resume updated successfully');

      // 2. Student views jobs with fit scores
      const jobsResponse = await request(app)
        .get('/jobs')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .expect(200);

      expect(jobsResponse.body).toHaveProperty('jobs');

      // 3. Student gets fit score for specific job
      const fitScoreResponse = await request(app)
        .get('/jobs/job-123/match-score')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .expect(200);

      expect(fitScoreResponse.body).toHaveProperty('matchPercentage');

      // 4. Student applies for job
      const applicationData = {
        jobId: 'job-123',
        coverLetter: 'I am very interested in this position',
        availability: 'Immediate',
        expectedSalary: '75000-85000',
      };

      const applicationResponse = await request(app)
        .post('/job-applications')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .send(applicationData)
        .expect(201);

      expect(applicationResponse.body).toHaveProperty('application');
      expect(applicationResponse.body.application).toHaveProperty('fitScoreDetails');
    });

    it('should demonstrate complete recruiter workflow', async () => {
      // 1. Recruiter tries to post job without payment
      const jobData = {
        title: 'Senior Developer',
        company: 'Tech Company',
        location: 'San Francisco',
        jobType: 'full-time',
        requiredSkills: ['JavaScript', 'React', 'Node.js'],
        description: 'Senior developer position',
      };

      const jobResponse = await request(app)
        .post('/jobs')
        .set('x-test-role', 'recruiter')
        .set('x-test-user-id', 'test-recruiter')
        .send(jobData)
        .expect(402);

      expect(jobResponse.body).toHaveProperty('error', 'Payment required for job posting');

      // 2. Recruiter creates payment intent
      const paymentIntentResponse = await request(app)
        .post('/payment/job-posting/create-intent')
        .set('x-test-role', 'recruiter')
        .set('x-test-user-id', 'test-recruiter')
        .send({ amount: 100 })
        .expect(200);

      expect(paymentIntentResponse.body).toHaveProperty('client_secret');

      // 3. Recruiter confirms payment
      const confirmResponse = await request(app)
        .post('/payment/job-posting/confirm')
        .set('x-test-role', 'recruiter')
        .set('x-test-user-id', 'test-recruiter')
        .send({ paymentIntentId: 'pi_test_123' })
        .expect(200);

      expect(confirmResponse.body).toHaveProperty('message', 'Payment confirmed successfully');

      // 4. Recruiter posts job after payment
      const paidJobResponse = await request(app)
        .post('/jobs')
        .set('x-test-role', 'recruiter')
        .set('x-test-user-id', 'test-recruiter')
        .send(jobData)
        .expect(201);

      expect(paidJobResponse.body).toHaveProperty('message', 'Job posted successfully');
    });

    it('should demonstrate complete consultant workflow', async () => {
      // 1. Consultant creates free content
      const freeContentData = {
        title: 'Career Development Guide',
        description: 'Comprehensive career development guide',
        contentType: 'guide',
        tags: ['career', 'development', 'guide'],
        category: 'Career Development',
        isFree: true,
      };

      const freeContentResponse = await request(app)
        .post('/consultant-content')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-consultant')
        .send(freeContentData)
        .expect(201);

      expect(freeContentResponse.body).toHaveProperty('message', 'Content created successfully and submitted for approval');

      // 2. Consultant creates paid content
      const paidContentData = {
        title: 'Premium Career Coaching',
        description: 'Advanced career coaching program',
        contentType: 'video',
        tags: ['career', 'coaching', 'premium'],
        category: 'Career Development',
        isFree: false,
        price: 4999, // $49.99
      };

      const paidContentResponse = await request(app)
        .post('/consultant-content')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-consultant')
        .send(paidContentData)
        .expect(201);

      expect(paidContentResponse.body).toHaveProperty('content');
      expect(paidContentResponse.body.content).toHaveProperty('price', 4999);

      // 3. Consultant gets their content statistics
      const statsResponse = await request(app)
        .get('/consultant-content/my/stats')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-consultant')
        .expect(200);

      expect(statsResponse.body).toHaveProperty('totalContent');
      expect(statsResponse.body).toHaveProperty('totalRevenue');
    });
  });

  describe('✅ Security Tests - Complete Phase 1 Security', () => {
    it('should enforce proper access control across all features', async () => {
      // Test document security
      const docResponse = await request(app)
        .get('/authorization-documents/student-doc-123')
        .set('x-test-role', 'recruiter')
        .set('x-test-user-id', 'employer-456')
        .expect(403);

      expect(docResponse.body).toHaveProperty('error', 'Access denied');

      // Test content posting security
      const contentResponse = await request(app)
        .post('/consultant-content')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .send({
          title: 'Unauthorized Content',
          description: 'Should not work',
          contentType: 'article',
          tags: ['test'],
          category: 'Test',
          isFree: true,
        })
        .expect(403);

      expect(contentResponse.body).toHaveProperty('error', 'Consultant access required');

      // Test payment enforcement
      const jobResponse = await request(app)
        .post('/jobs')
        .set('x-test-role', 'recruiter')
        .set('x-test-user-id', 'test-recruiter')
        .send({
          title: 'Test Job',
          company: 'Test Company',
          location: 'New York',
          jobType: 'full-time',
          requiredSkills: ['JavaScript'],
          description: 'Test job',
        })
        .expect(402);

      expect(jobResponse.body).toHaveProperty('error', 'Payment required for job posting');
    });
  });

  describe('✅ Performance Tests - Complete Phase 1 Performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      const requests = Array(10).fill(null).map(() => 
        request(app)
          .get('/jobs')
          .set('x-test-role', 'student')
          .set('x-test-user-id', 'test-student')
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('jobs');
      });
    });

    it('should handle fit score calculations efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/jobs/job-123/match-score')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(500); // Should respond quickly
      expect(response.body).toHaveProperty('matchPercentage');
    });
  });
});
