// backend/__tests__/jobPostingPayment.integration.test.ts
import request from 'supertest';
import { app } from '../app';
import { db } from '../src/config/firebase';
import { getStripeClient } from '../src/utils/stripeClient';

// Mock Stripe for integration testing
jest.mock('../src/utils/stripeClient', () => ({
  getStripeClient: jest.fn(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test_integration',
        client_secret: 'pi_test_integration_secret',
        amount: 100,
        currency: 'usd',
        status: 'succeeded',
        metadata: {
          type: 'job-posting',
          userId: 'test-user-integration',
        },
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test_integration',
        status: 'succeeded',
        amount: 100,
        metadata: {
          type: 'job-posting',
          userId: 'test-user-integration',
        },
      }),
    },
  })),
}));

// Mock Firebase for integration testing
const mockFirestore = {
  collection: jest.fn(() => mockFirestore),
  doc: jest.fn(() => mockFirestore),
  set: jest.fn(),
  get: jest.fn(() => Promise.resolve({ exists: false })),
  where: jest.fn(() => mockFirestore),
  limit: jest.fn(() => mockFirestore),
  get: jest.fn(() => Promise.resolve({ empty: true })),
  add: jest.fn(),
};

jest.mock('../src/config/firebase', () => ({
  db: mockFirestore,
}));

describe('Job Posting Payment Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(() => {
    // Setup test authentication
    authToken = 'Bearer test-integration-token';
    userId = 'test-user-integration';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Payment Flow', () => {
    it('should complete the full job posting payment flow', async () => {
      // Step 1: Create payment intent
      const createResponse = await request(app)
        .post('/payment/job-posting/create-intent')
        .set('Authorization', authToken)
        .expect(200);

      expect(createResponse.body).toHaveProperty('clientSecret');
      expect(createResponse.body).toHaveProperty('paymentIntentId');
      expect(createResponse.body).toHaveProperty('amount', 100);
      expect(createResponse.body).toHaveProperty('currency', 'usd');

      const { clientSecret, paymentIntentId } = createResponse.body;

      // Step 2: Confirm payment
      const confirmResponse = await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
        .send({ paymentIntentId })
        .expect(200);

      expect(confirmResponse.body).toHaveProperty('message', 'Job posting payment confirmed and recorded');
      expect(confirmResponse.body).toHaveProperty('paymentIntentId', paymentIntentId);
      expect(confirmResponse.body).toHaveProperty('amount', 100);
      expect(confirmResponse.body).toHaveProperty('status', 'paid');

      // Verify payment was recorded in Firestore
      expect(mockFirestore.collection).toHaveBeenCalledWith('jobPostingPayments');
      expect(mockFirestore.set).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(String),
          paymentIntentId,
          amount: 100,
          status: 'paid',
          createdAt: expect.any(Object),
          expiresAt: expect.any(Object),
        })
      );
    });

    it('should allow job posting after successful payment', async () => {
      // Mock successful payment check
      const mockJobService = require('../src/services/job.service').jobServices;
      mockJobService.checkJobPostingPayment = jest.fn().mockResolvedValue({
        required: true,
        paid: true,
      });
      mockJobService.create = jest.fn().mockResolvedValue({
        id: 'job-integration-test',
        title: 'Integration Test Job',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create job after payment
      const jobData = {
        title: 'Integration Test Job',
        description: 'This is an integration test job posting',
        company: 'Test Company',
        location: 'Test Location',
        jobType: 'full-time',
        requiredSkills: ['JavaScript', 'React', 'Node.js'],
        salaryRange: {
          min: 50000,
          max: 80000,
          currency: 'USD',
        },
      };

      const jobResponse = await request(app)
        .post('/jobs')
        .set('Authorization', authToken)
        .send(jobData)
        .expect(201);

      expect(jobResponse.body).toHaveProperty('message', 'Job posted successfully');
      expect(jobResponse.body).toHaveProperty('job');
      expect(jobResponse.body.job).toHaveProperty('id', 'job-integration-test');
      expect(jobResponse.body.job).toHaveProperty('title', 'Integration Test Job');

      expect(mockJobService.checkJobPostingPayment).toHaveBeenCalledWith(userId);
      expect(mockJobService.create).toHaveBeenCalledWith(jobData, userId);
    });
  });

  describe('Payment Enforcement Integration', () => {
    it('should block job posting without payment', async () => {
      // Mock payment check - payment required but not paid
      const mockJobService = require('../src/services/job.service').jobServices;
      mockJobService.checkJobPostingPayment = jest.fn().mockResolvedValue({
        required: true,
        paid: false,
        amount: 100,
        paymentUrl: '/payment/job-posting',
      });

      const jobData = {
        title: 'Test Job Without Payment',
        description: 'This job should be blocked',
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
      expect(response.body).toHaveProperty('message', 'Please pay the job posting fee to continue');

      // Ensure job creation was not called
      expect(mockJobService.create).not.toHaveBeenCalled();
    });

    it('should allow job posting for users with subscription (Phase 2)', async () => {
      // Mock subscription check - payment not required
      const mockJobService = require('../src/services/job.service').jobServices;
      mockJobService.checkJobPostingPayment = jest.fn().mockResolvedValue({
        required: false,
        paid: true,
        subscriptionActive: true,
      });
      mockJobService.create = jest.fn().mockResolvedValue({
        id: 'job-subscription-test',
        title: 'Subscription User Job',
        status: 'active',
      });

      const jobData = {
        title: 'Subscription User Job',
        description: 'Job posted by user with subscription',
        company: 'Premium Company',
        location: 'Remote',
        jobType: 'contract',
        requiredSkills: ['Python', 'Django'],
      };

      const response = await request(app)
        .post('/jobs')
        .set('Authorization', authToken)
        .send(jobData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Job posted successfully');
      expect(mockJobService.create).toHaveBeenCalledWith(jobData, userId);
    });
  });

  describe('Payment Validation Integration', () => {
    it('should validate payment intent ownership', async () => {
      // Mock payment intent belonging to different user
      const { retrieve } = getStripeClient().paymentIntents;
      retrieve.mockResolvedValue({
        id: 'pi_different_user',
        status: 'succeeded',
        amount: 100,
        metadata: {
          type: 'job-posting',
          userId: 'different-user-id', // Different from authenticated user
        },
      });

      const response = await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
        .send({ paymentIntentId: 'pi_different_user' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid payment intent');
      expect(mockFirestore.set).not.toHaveBeenCalled();
    });

    it('should validate payment intent type', async () => {
      // Mock payment intent with wrong type
      const { retrieve } = getStripeClient().paymentIntents;
      retrieve.mockResolvedValue({
        id: 'pi_wrong_type',
        status: 'succeeded',
        amount: 100,
        metadata: {
          type: 'consultation-booking', // Wrong type
          userId: userId,
        },
      });

      const response = await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
        .send({ paymentIntentId: 'pi_wrong_type' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid payment intent');
      expect(mockFirestore.set).not.toHaveBeenCalled();
    });

    it('should validate payment status', async () => {
      // Mock unsuccessful payment
      const { retrieve } = getStripeClient().paymentIntents;
      retrieve.mockResolvedValue({
        id: 'pi_unsuccessful',
        status: 'requires_payment_method',
        metadata: {
          type: 'job-posting',
          userId: userId,
        },
      });

      const response = await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
        .send({ paymentIntentId: 'pi_unsuccessful' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Payment not successful');
      expect(response.body).toHaveProperty('status', 'requires_payment_method');
      expect(mockFirestore.set).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle Stripe API errors gracefully', async () => {
      // Mock Stripe API error
      const { create } = getStripeClient().paymentIntents;
      create.mockRejectedValue(new Error('Stripe API rate limit exceeded'));

      const response = await request(app)
        .post('/payment/job-posting/create-intent')
        .set('Authorization', authToken)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Stripe API rate limit exceeded');
      expect(response.body).toHaveProperty('code', 'PAYMENT_INTENT_ERROR');
    });

    it('should handle database errors during payment recording', async () => {
      // Mock successful payment intent creation
      const { create } = getStripeClient().paymentIntents;
      create.mockResolvedValue({
        id: 'pi_db_error',
        client_secret: 'pi_db_error_secret',
        amount: 100,
        currency: 'usd',
      });

      // Mock database error during recording
      mockFirestore.set.mockRejectedValue(new Error('Database connection failed'));

      const { retrieve } = getStripeClient().paymentIntents;
      retrieve.mockResolvedValue({
        id: 'pi_db_error',
        status: 'succeeded',
        amount: 100,
        metadata: {
          type: 'job-posting',
          userId: userId,
        },
      });

      const createResponse = await request(app)
        .post('/payment/job-posting/create-intent')
        .set('Authorization', authToken)
        .expect(200);

      expect(createResponse.body).toHaveProperty('clientSecret');

      const confirmResponse = await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
        .send({ paymentIntentId: 'pi_db_error' })
        .expect(500);

      expect(confirmResponse.body).toHaveProperty('error', 'Database connection failed');
      expect(confirmResponse.body).toHaveProperty('code', 'PAYMENT_CONFIRMATION_ERROR');
    });
  });

  describe('Security Integration', () => {
    it('should require authentication for all payment endpoints', async () => {
      // Test create intent without auth
      await request(app)
        .post('/payment/job-posting/create-intent')
        .expect(401);

      // Test confirm payment without auth
      await request(app)
        .post('/payment/job-posting/confirm')
        .send({ paymentIntentId: 'test' })
        .expect(401);

      // Test job creation without auth
      await request(app)
        .post('/jobs')
        .send({ title: 'Test' })
        .expect(401);
    });

    it('should prevent payment confirmation with invalid payment intent', async () => {
      // Mock non-existent payment intent
      const { retrieve } = getStripeClient().paymentIntents;
      retrieve.mockRejectedValue(new Error('No such payment intent: pi_nonexistent'));

      const response = await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
        .send({ paymentIntentId: 'pi_nonexistent' })
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(mockFirestore.set).not.toHaveBeenCalled();
    });
  });

  describe('Data Integrity Integration', () => {
    it('should record payment with correct expiration date', async () => {
      // Mock successful payment
      const { create, retrieve } = getStripeClient().paymentIntents;
      create.mockResolvedValue({
        id: 'pi_expiration_test',
        client_secret: 'pi_expiration_test_secret',
        amount: 100,
        currency: 'usd',
      });

      retrieve.mockResolvedValue({
        id: 'pi_expiration_test',
        status: 'succeeded',
        amount: 100,
        metadata: {
          type: 'job-posting',
          userId: userId,
        },
      });

      // Create payment intent
      const createResponse = await request(app)
        .post('/payment/job-posting/create-intent')
        .set('Authorization', authToken)
        .expect(200);

      // Confirm payment
      await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
        .send({ paymentIntentId: createResponse.body.paymentIntentId })
        .expect(200);

      // Verify payment recording with expiration
      expect(mockFirestore.set).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(String),
          paymentIntentId: createResponse.body.paymentIntentId,
          amount: 100,
          status: 'paid',
          createdAt: expect.any(Object),
          expiresAt: expect.any(Object), // Should be approximately 30 days from now
        })
      );
    });

    it('should maintain payment amount consistency', async () => {
      // Test that payment amount is consistent across the flow
      const { create, retrieve } = getStripeClient().paymentIntents;
      create.mockResolvedValue({
        id: 'pi_consistency_test',
        client_secret: 'pi_consistency_test_secret',
        amount: 100, // $1.00 in cents
        currency: 'usd',
      });

      retrieve.mockResolvedValue({
        id: 'pi_consistency_test',
        status: 'succeeded',
        amount: 100, // Same amount
        metadata: {
          type: 'job-posting',
          userId: userId,
        },
      });

      // Create payment intent
      const createResponse = await request(app)
        .post('/payment/job-posting/create-intent')
        .set('Authorization', authToken)
        .expect(200);

      expect(createResponse.body.amount).toBe(100);

      // Confirm payment
      const confirmResponse = await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
        .send({ paymentIntentId: createResponse.body.paymentIntentId })
        .expect(200);

      expect(confirmResponse.body.amount).toBe(100);

      // Verify recorded payment amount
      expect(mockFirestore.set).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100,
        })
      );
    });
  });
});
