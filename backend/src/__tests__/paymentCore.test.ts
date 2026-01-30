// Core payment functionality tests
import request from 'supertest';
import app from '../app';

// Mock all external dependencies
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
          userId: 'test-user',
        },
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 100,
        metadata: {
          type: 'job-posting',
          userId: 'test-user',
        },
      }),
    },
  })),
}));

jest.mock('../config/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(),
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

describe('Job Posting Payment Core Tests', () => {
  const authToken = 'Bearer test-token';
  const userId = 'test-user';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Payment Intent Creation', () => {
    it('should create payment intent successfully', async () => {
      const response = await request(app)
        .post('/payment/job-posting/create-intent')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('clientSecret', 'pi_test_123_secret');
      expect(response.body).toHaveProperty('paymentIntentId', 'pi_test_123');
      expect(response.body).toHaveProperty('amount', 100);
      expect(response.body).toHaveProperty('currency', 'usd');
      expect(response.body).toHaveProperty('description', 'Job posting fee - $1.00');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/payment/job-posting/create-intent')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication required');
    });
  });

  describe('Payment Confirmation', () => {
    it('should confirm payment successfully', async () => {
      const response = await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
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
        .set('Authorization', authToken)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Payment intent ID is required');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/payment/job-posting/confirm')
        .send({ paymentIntentId: 'pi_test_123' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication required');
    });
  });

  describe('Job Creation with Payment Enforcement', () => {
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
        .set('Authorization', authToken)
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
        .set('Authorization', authToken)
        .send(jobData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Job posted successfully');
      expect(response.body).toHaveProperty('job');
    });
  });

  describe('Payment Recording', () => {
    it('should record payment with correct data', async () => {
      const mockSet = jest.fn();
      const mockCollection = jest.fn(() => ({
        doc: jest.fn(() => ({
          set: mockSet,
        })),
      }));
      
      // Override the mock for this test
      jest.doMock('../config/firebase', () => ({
        db: {
          collection: mockCollection,
        },
      }));

      await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
        .send({ paymentIntentId: 'pi_test_123' })
        .expect(200);

      expect(mockCollection).toHaveBeenCalledWith('jobPostingPayments');
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(String),
          paymentIntentId: 'pi_test_123',
          amount: 100,
          status: 'paid',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe errors gracefully', async () => {
      const { getStripeClient } = require('../utils/stripeClient');
      getStripeClient().paymentIntents.create.mockRejectedValue(
        new Error('Stripe API error')
      );

      const response = await request(app)
        .post('/payment/job-posting/create-intent')
        .set('Authorization', authToken)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Stripe API error');
      expect(response.body).toHaveProperty('code', 'PAYMENT_INTENT_ERROR');
    });

    it('should handle database errors during payment recording', async () => {
      // Mock successful payment intent creation
      const { getStripeClient } = require('../utils/stripeClient');
      getStripeClient().paymentIntents.create.mockResolvedValue({
        id: 'pi_db_error',
        client_secret: 'pi_db_error_secret',
        amount: 100,
        currency: 'usd',
      });

      // Mock database error during recording
      const mockCollection = jest.fn(() => ({
        doc: jest.fn(() => ({
          set: jest.fn().mockRejectedValue(new Error('Database connection failed')),
        })),
      }));
      
      jest.doMock('../config/firebase', () => ({
        db: {
          collection: mockCollection,
        },
      }));

      const response = await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
        .send({ paymentIntentId: 'pi_db_error' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Database connection failed');
      expect(response.body).toHaveProperty('code', 'PAYMENT_CONFIRMATION_ERROR');
    });
  });
});
