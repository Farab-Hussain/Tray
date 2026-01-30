// Final working payment tests - focus on core functionality
import request from 'supertest';
import app from '../app';

// Mock authentication middleware to bypass auth for tests
jest.mock('../middleware/authMiddleware', () => ({
  authenticateUser: () => (req: any, res: any, next: any) => {
    // Mock authenticated user
    req.user = {
      uid: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
    };
    next();
  },
  authorizeRole: (roles: string[]) => (req: any, res: any, next: any) => {
    next();
  },
}));

// Mock Stripe
jest.mock('../utils/stripeClient', () => ({
  getStripeClient: jest.fn(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 100,
        currency: 'usd',
        status: 'succeeded',
        metadata: {
          type: 'job-posting',
          userId: 'test-user-123',
        },
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 100,
        metadata: {
          type: 'job-posting',
          userId: 'test-user-123',
        },
      }),
    },
  })),
}));

// Mock Firebase
jest.mock('../config/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn().mockResolvedValue({}),
        get: jest.fn().mockResolvedValue({ exists: false }),
        id: 'test-doc-id',
      })),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({ empty: true })),
          })),
        })),
      })),
    })),
  },
}));

describe('Job Posting Payment Final Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('✅ Payment Intent Creation', () => {
    it('should create payment intent successfully', async () => {
      const response = await request(app)
        .post('/payment/job-posting/create-intent')
        .expect(200);

      expect(response.body).toHaveProperty('clientSecret', 'pi_test_123_secret');
      expect(response.body).toHaveProperty('paymentIntentId', 'pi_test_123');
      expect(response.body).toHaveProperty('amount', 100);
      expect(response.body).toHaveProperty('currency', 'usd');
      expect(response.body).toHaveProperty('description', 'Job posting fee - $1.00');
    });
  });

  describe('✅ Payment Confirmation', () => {
    it('should confirm payment successfully', async () => {
      const response = await request(app)
        .post('/payment/job-posting/confirm')
        .send({ paymentIntentId: 'pi_test_123' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Job posting payment confirmed and recorded');
      expect(response.body).toHaveProperty('paymentIntentId', 'pi_test_123');
      expect(response.body).toHaveProperty('amount', 100);
      expect(response.body).toHaveProperty('status', 'paid');
    });

    it('should require payment intent ID', async () => {
      const response = await request(app)
        .post('/payment/job-posting/confirm')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Payment intent ID is required');
    });
  });

  describe('✅ Job Creation with Payment Enforcement', () => {
    it('should block job creation when payment required but not paid', async () => {
      // Mock payment check - payment required but not paid
      const mockJobService = require('../services/job.service').jobServices;
      mockJobService.checkJobPostingPayment = jest.fn().mockResolvedValue({
        required: true,
        paid: false,
        amount: 100,
        paymentUrl: '/payment/job-posting',
      });

      const jobData = {
        title: 'Test Job',
        description: 'Test Description',
        company: 'Test Company',
        location: 'Test Location',
        jobType: 'full-time',
        requiredSkills: ['JavaScript'],
      };

      const response = await request(app)
        .post('/jobs')
        .send(jobData)
        .expect(402);

      expect(response.body).toHaveProperty('error', 'Payment required for job posting');
      expect(response.body).toHaveProperty('paymentAmount', 100);
      expect(response.body).toHaveProperty('paymentUrl', '/payment/job-posting');
    });

    it('should allow job creation when payment not required', async () => {
      // Mock payment check - payment not required
      const mockJobService = require('../services/job.service').jobServices;
      mockJobService.checkJobPostingPayment = jest.fn().mockResolvedValue({
        required: false,
        paid: true,
      });
      mockJobService.create = jest.fn().mockResolvedValue({
        id: 'job-123',
        title: 'Test Job',
        status: 'active',
      });

      const jobData = {
        title: 'Test Job',
        description: 'Test Description',
        company: 'Test Company',
        location: 'Test Location',
        jobType: 'full-time',
        requiredSkills: ['JavaScript'],
      };

      const response = await request(app)
        .post('/jobs')
        .send(jobData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Job posted successfully');
      expect(response.body).toHaveProperty('job');
    });

    it('should allow job creation when payment is required and already paid', async () => {
      // Mock payment check - payment required and already paid
      const mockJobService = require('../services/job.service').jobServices;
      mockJobService.checkJobPostingPayment = jest.fn().mockResolvedValue({
        required: true,
        paid: true,
      });
      mockJobService.create = jest.fn().mockResolvedValue({
        id: 'job-456',
        title: 'Paid Job',
        status: 'active',
      });

      const jobData = {
        title: 'Paid Job',
        description: 'Job with valid payment',
        company: 'Paid Company',
        location: 'Paid Location',
        jobType: 'contract',
        requiredSkills: ['Python'],
      };

      const response = await request(app)
        .post('/jobs')
        .send(jobData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Job posted successfully');
      expect(response.body).toHaveProperty('job');
    });
  });

  describe('✅ Payment Recording', () => {
    it('should record payment with correct data', async () => {
      const response = await request(app)
        .post('/payment/job-posting/confirm')
        .send({ paymentIntentId: 'pi_test_123' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Job posting payment confirmed and recorded');
      expect(response.body).toHaveProperty('paymentIntentId', 'pi_test_123');
      expect(response.body).toHaveProperty('amount', 100);
      expect(response.body).toHaveProperty('status', 'paid');
    });
  });

  describe('✅ Complete Payment Flow Integration', () => {
    it('should complete the full payment flow', async () => {
      // Step 1: Create payment intent
      const createResponse = await request(app)
        .post('/payment/job-posting/create-intent')
        .expect(200);

      expect(createResponse.body).toHaveProperty('clientSecret');
      expect(createResponse.body).toHaveProperty('paymentIntentId');

      // Step 2: Confirm payment
      const confirmResponse = await request(app)
        .post('/payment/job-posting/confirm')
        .send({ paymentIntentId: createResponse.body.paymentIntentId })
        .expect(200);

      expect(confirmResponse.body).toHaveProperty('message', 'Job posting payment confirmed and recorded');
      expect(confirmResponse.body).toHaveProperty('status', 'paid');

      // Step 3: Create job after payment
      const mockJobService = require('../services/job.service').jobServices;
      mockJobService.checkJobPostingPayment = jest.fn().mockResolvedValue({
        required: true,
        paid: true,
      });
      mockJobService.create = jest.fn().mockResolvedValue({
        id: 'job-integration',
        title: 'Integration Test Job',
        status: 'active',
      });

      const jobData = {
        title: 'Integration Test Job',
        description: 'Complete flow test',
        company: 'Test Company',
        location: 'Test Location',
        jobType: 'full-time',
        requiredSkills: ['JavaScript', 'React'],
      };

      const jobResponse = await request(app)
        .post('/jobs')
        .send(jobData)
        .expect(201);

      expect(jobResponse.body).toHaveProperty('message', 'Job posted successfully');
      expect(jobResponse.body).toHaveProperty('job');
    });
  });
});
