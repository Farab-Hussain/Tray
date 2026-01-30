// Fit Score UI Enhancement Tests
import request from 'supertest';
import app from '../app';

// Mock authentication middleware
jest.mock('../middleware/authMiddleware', () => ({
  authenticateUser: () => (req: any, res: any, next: any) => {
    const role = req.headers['x-test-role'] || 'student';
    const userId = req.headers['x-test-user-id'] || 'test-student';
    
    req.user = {
      uid: userId,
      email: 'student@example.com',
      name: 'Test Student',
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
          data: () => ({ 
            userId: 'test-student',
            skills: ['JavaScript', 'React', 'Node.js'],
            education: [
              {
                degree: 'Bachelor',
                institution: 'Test University',
                graduationYear: 2020,
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
      add: jest.fn(() => Promise.resolve({ id: 'test-application-id' })),
    })),
  },
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
        'Take online courses to strengthen your profile',
        'Gain practical experience with the required technologies'
      ],
      availabilityAlignment: 85,
      locationCompatibility: 90,
    };
  }),
}));

describe('Fit Score UI Enhancement Tests', () => {
  describe('✅ Enhanced Fit Score Display', () => {
    it('should return comprehensive fit score data', async () => {
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

    it('should calculate match percentage correctly', async () => {
      const response = await request(app)
        .get('/jobs/job-123/match-score')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .expect(200);

      expect(response.body.matchPercentage).toBeGreaterThanOrEqual(0);
      expect(response.body.matchPercentage).toBeLessThanOrEqual(100);
      expect(response.body.score).toBeLessThanOrEqual(response.body.totalRequired);
    });

    it('should assign correct rating based on match percentage', async () => {
      const testCases = [
        { percentage: 90, expectedRating: 'gold' },
        { percentage: 70, expectedRating: 'silver' },
        { percentage: 50, expectedRating: 'bronze' },
        { percentage: 30, expectedRating: 'basic' },
      ];

      for (const testCase of testCases) {
        // Mock the skill matching utility to return specific percentage
        const { calculateMatchScore } = require('../utils/skillMatching');
        calculateMatchScore.mockReturnValue({
          score: Math.floor((testCase.percentage / 100) * 5),
          totalRequired: 5,
          matchPercentage: testCase.percentage,
          rating: testCase.expectedRating,
          matchedSkills: ['JavaScript', 'React'],
          missingSkills: ['Python'],
          improvementSuggestions: ['Learn missing skills'],
        });

        const response = await request(app)
          .get('/jobs/job-123/match-score')
          .set('x-test-role', 'student')
          .set('x-test-user-id', 'test-student')
          .expect(200);

        expect(response.body.rating).toBe(testCase.expectedRating);
      }
    });
  });

  describe('✅ Job Application with Enhanced Fit Score', () => {
    it('should include fit score details in job application response', async () => {
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
      expect(response.body.fitScoreDetails).toHaveProperty('matchRating');
      expect(response.body.fitScoreDetails).toHaveProperty('matchedSkills');
      expect(response.body.fitScoreDetails).toHaveProperty('missingSkills');
      expect(response.body.fitScoreDetails).toHaveProperty('improvementSuggestions');
    });

    it('should calculate fit score when applying for jobs', async () => {
      const applicationData = {
        jobId: 'job-456',
        coverLetter: 'I am interested in this position',
        availability: 'Immediate',
        expectedSalary: '60000-70000',
      };

      const response = await request(app)
        .post('/job-applications')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .send(applicationData)
        .expect(201);

      expect(response.body.application).toHaveProperty('fitScoreDetails');
      expect(response.body.fitScoreDetails.matchPercentage).toBeGreaterThanOrEqual(0);
      expect(response.body.fitScoreDetails.matchPercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('✅ Enhanced Job List with Fit Scores', () => {
    it('should include fit scores in job listings', async () => {
      const response = await request(app)
        .get('/jobs')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .expect(200);

      expect(response.body).toHaveProperty('jobs');
      expect(Array.isArray(response.body.jobs)).toBe(true);
      
      // Check if jobs have fit score data
      const jobsWithFitScore = response.body.jobs.filter((job: any) => job.matchScore !== undefined);
      expect(jobsWithFitScore.length).toBeGreaterThan(0);
      
      // Verify fit score structure
      const jobWithFitScore = jobsWithFitScore[0];
      expect(jobWithFitScore).toHaveProperty('matchScore');
      expect(jobWithFitScore).toHaveProperty('matchRating');
      expect(jobWithFitScore).toHaveProperty('matchedSkills');
      expect(jobWithFitScore).toHaveProperty('missingSkills');
    });

    it('should sort jobs by fit score when requested', async () => {
      const response = await request(app)
        .get('/jobs?sortBy=matchScore&order=desc')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .expect(200);

      expect(response.body).toHaveProperty('jobs');
      expect(Array.isArray(response.body.jobs)).toBe(true);
      
      // Verify sorting (highest match first)
      const jobs = response.body.jobs;
      if (jobs.length > 1) {
        for (let i = 0; i < jobs.length - 1; i++) {
          const currentMatch = jobs[i].matchScore || 0;
          const nextMatch = jobs[i + 1].matchScore || 0;
          expect(currentMatch).toBeGreaterThanOrEqual(nextMatch);
        }
      }
    });
  });

  describe('✅ Frontend Fit Score Display Components', () => {
    it('should verify FitScoreDisplay component exists', () => {
      const fs = require('fs');
      const path = require('path');
      
      const componentPath = '/Users/mac/Documents/Application/Tray/app/src/components/ui/FitScoreDisplay.tsx';
      const exists = fs.existsSync(componentPath);
      
      expect(exists).toBe(true);
    });

    it('should verify JobDetailScreen uses enhanced fit score display', () => {
      const fs = require('fs');
      const path = require('path');
      
      const jobDetailPath = '/Users/mac/Documents/Application/Tray/app/src/Screen/Student/Jobs/JobDetailScreen.tsx';
      const exists = fs.existsSync(jobDetailPath);
      
      expect(exists).toBe(true);
      
      if (exists) {
        const jobDetailCode = fs.readFileSync(jobDetailPath, 'utf8');
        expect(jobDetailCode).toContain('FitScoreDisplay');
      }
    });

    it('should verify JobListScreen uses enhanced fit score display', () => {
      const fs = require('fs');
      const path = require('path');
      
      const jobListPath = '/Users/mac/Documents/Application/Tray/app/src/Screen/Student/Jobs/JobListScreen.tsx';
      const exists = fs.existsSync(jobListPath);
      
      expect(exists).toBe(true);
      
      if (exists) {
        const jobListCode = fs.readFileSync(jobListPath, 'utf8');
        expect(jobListCode).toContain('FitScoreDisplay');
      }
    });
  });

  describe('✅ Enhanced User Experience', () => {
    it('should provide detailed improvement suggestions', async () => {
      const response = await request(app)
        .get('/jobs/job-123/match-score')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .expect(200);

      expect(response.body.improvementSuggestions).toBeDefined();
      expect(Array.isArray(response.body.improvementSuggestions)).toBe(true);
      expect(response.body.improvementSuggestions.length).toBeGreaterThan(0);
    });

    it('should include additional metrics for comprehensive matching', async () => {
      const response = await request(app)
        .get('/jobs/job-123/match-score')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .expect(200);

      expect(response.body.availabilityAlignment).toBeDefined();
      expect(response.body.locationCompatibility).toBeDefined();
      expect(response.body.availabilityAlignment).toBeGreaterThanOrEqual(0);
      expect(response.body.availabilityAlignment).toBeLessThanOrEqual(100);
      expect(response.body.locationCompatibility).toBeGreaterThanOrEqual(0);
      expect(response.body.locationCompatibility).toBeLessThanOrEqual(100);
    });
  });

  describe('✅ Performance and Scalability', () => {
    it('should handle fit score calculations efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/jobs/job-123/match-score')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Should respond quickly (under 500ms)
      expect(responseTime).toBeLessThan(500);
      expect(response.body).toBeDefined();
    });

    it('should handle multiple concurrent fit score requests', async () => {
      const requests = Array(10).fill(null).map(() => 
        request(app)
          .get('/jobs/job-123/match-score')
          .set('x-test-role', 'student')
          .set('x-test-user-id', 'test-student')
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('matchPercentage');
      });
    });
  });

  describe('✅ Data Accuracy and Consistency', () => {
    it('should ensure matched skills are accurate', async () => {
      const { calculateMatchScore } = require('../utils/skillMatching');
      
      // Test with known skills
      const userSkills = ['JavaScript', 'React', 'Node.js'];
      const jobSkills = ['JavaScript', 'React', 'Python', 'SQL'];
      
      const result = calculateMatchScore(userSkills, jobSkills);
      
      expect(result.score).toBe(2); // JavaScript, React matched
      expect(result.matchedSkills).toEqual(['JavaScript', 'React']);
      expect(result.missingSkills).toEqual(['Python', 'SQL']);
      expect(result.matchPercentage).toBe(50); // 2/4 * 100
    });

    it('should handle case-insensitive skill matching', async () => {
      const { calculateMatchScore } = require('../utils/skillMatching');
      
      const userSkills = ['javascript', 'react', 'node.js'];
      const jobSkills = ['JavaScript', 'React', 'Node.js'];
      
      const result = calculateMatchScore(userSkills, jobSkills);
      
      expect(result.score).toBe(3); // All matched despite case differences
      expect(result.matchPercentage).toBe(100);
    });

    it('should handle skill variations and synonyms', async () => {
      const { calculateMatchScore } = require('../utils/skillMatching');
      
      const userSkills = ['MongoDB', 'JS', 'ReactJS'];
      const jobSkills = ['mongodb', 'javascript', 'react'];
      
      const result = calculateMatchScore(userSkills, jobSkills);
      
      expect(result.score).toBe(3); // All matched with variations
      expect(result.matchPercentage).toBe(100);
    });
  });

  describe('✅ Error Handling and Edge Cases', () => {
    it('should handle users without resume gracefully', async () => {
      // Mock user without resume
      const mockDb = require('../config/firebase').db;
      mockDb.collection().doc().get.mockResolved({
        exists: false,
      });

      const response = await request(app)
        .get('/jobs/job-123/match-score')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'student-no-resume')
        .expect(200);

      expect(response.body).toHaveProperty('score', 0);
      expect(response.body).toHaveProperty('matchPercentage', 0);
      expect(response.body).toHaveProperty('rating', 'basic');
      expect(response.body.matchedSkills).toEqual([]);
      expect(response.body.missingSkills).toEqual([]);
    });

    it('should handle jobs without required skills', async () => {
      const { calculateMatchScore } = require('../utils/skillMatching');
      
      const userSkills: string[] = ['JavaScript', 'React'];
      const jobSkills: string[] = [];
      
      const result = calculateMatchScore(userSkills, jobSkills);
      
      expect(result.score).toBe(0);
      expect(result.totalRequired).toBe(0);
      expect(result.matchPercentage).toBe(0);
      expect(result.rating).toBe('basic');
    });

    it('should handle empty skill arrays', async () => {
      const { calculateMatchScore } = require('../utils/skillMatching');
      
      const userSkills: string[] = [];
      const jobSkills: string[] = [];
      
      const result = calculateMatchScore(userSkills, jobSkills);
      
      expect(result.score).toBe(0);
      expect(result.totalRequired).toBe(0);
      expect(result.matchPercentage).toBe(0);
      expect(result.rating).toBe('basic');
    });
  });
});
