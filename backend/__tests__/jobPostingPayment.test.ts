// backend/__tests__/jobPostingPayment.test.ts
import request from 'supertest';
import { app } from '../app';
import { db } from '../src/config/firebase';
import { getStripeClient } from '../src/utils/stripeClient';

// Mock Stripe
jest.mock('../src/utils/stripeClient', () => ({
  getStripeClient: jest.fn(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  })),
}));

// Mock Firebase
jest.mock('../src/config/firebase', () => ({
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
      add: jest.fn(),
    })),
  },
}));

describe('Job Posting Payment System', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Mock authentication token
    authToken = 'Bearer mock-jwt-token';
    userId = 'test-user-id';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /payment/job-posting/create-intent', () => {
    it('should create a payment intent for job posting', async () => {
      // Mock Stripe payment intent creation
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_test',
        amount: 100,
        currency: 'usd',
      };

      (getStripeClient().paymentIntents.create as jest.Mock).mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/payment/job-posting/create-intent')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('clientSecret', 'pi_test_123_secret_test');
      expect(response.body).toHaveProperty('paymentIntentId', 'pi_test_123');
      expect(response.body).toHaveProperty('amount', 100);
      expect(response.body).toHaveProperty('currency', 'usd');
      expect(response.body).toHaveProperty('description', 'Job posting fee - $1.00');

      expect(getStripeClient().paymentIntents.create).toHaveBeenCalledWith({
        amount: 100,
        currency: 'usd',
        metadata: {
          type: 'job-posting',
          userId: expect.any(String),
          description: 'Job posting fee',
        },
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/payment/job-posting/create-intent')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication required');
    });

    it('should handle Stripe errors gracefully', async () => {
      (getStripeClient().paymentIntents.create as jest.Mock).mockRejectedValue(
        new Error('Stripe API error')
      );

      const response = await request(app)
        .post('/payment/job-posting/create-intent')
        .set('Authorization', authToken)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'PAYMENT_INTENT_ERROR');
    });
  });

  describe('POST /payment/job-posting/confirm', () => {
    it('should confirm successful payment and record it', async () => {
      // Mock successful payment intent retrieval
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 100,
        metadata: {
          type: 'job-posting',
          userId: userId,
        },
      };

      (getStripeClient().paymentIntents.retrieve as jest.Mock).mockResolvedValue(mockPaymentIntent);

      // Mock Firestore payment recording
      const mockSet = jest.fn();
      (db.collection as jest.Mock).mockReturnValue({
        doc: jest.fn(() => ({
          set: mockSet,
        })),
      });

      const response = await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
        .send({ paymentIntentId: 'pi_test_123' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Job posting payment confirmed and recorded');
      expect(response.body).toHaveProperty('paymentIntentId', 'pi_test_123');
      expect(response.body).toHaveProperty('amount', 100);
      expect(response.body).toHaveProperty('status', 'paid');

      expect(getStripeClient().paymentIntents.retrieve).toHaveBeenCalledWith('pi_test_123');
      expect(mockSet).toHaveBeenCalled();
    });

    it('should return 400 for missing payment intent ID', async () => {
      const response = await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Payment intent ID is required');
    });

    it('should return 400 for unsuccessful payment', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'requires_payment_method',
        metadata: {
          type: 'job-posting',
          userId: userId,
        },
      };

      (getStripeClient().paymentIntents.retrieve as jest.Mock).mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
        .send({ paymentIntentId: 'pi_test_123' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Payment not successful');
      expect(response.body).toHaveProperty('status', 'requires_payment_method');
    });

    it('should return 400 for invalid payment intent type', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        metadata: {
          type: 'consultation-booking', // Wrong type
          userId: userId,
        },
      };

      (getStripeClient().paymentIntents.retrieve as jest.Mock).mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
        .send({ paymentIntentId: 'pi_test_123' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid payment intent');
    });

    it('should return 400 for payment intent belonging to different user', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        metadata: {
          type: 'job-posting',
          userId: 'different-user-id', // Different user
        },
      };

      (getStripeClient().paymentIntents.retrieve as jest.Mock).mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
        .send({ paymentIntentId: 'pi_test_123' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid payment intent');
    });
  });

  describe('Job Creation with Payment Enforcement', () => {
    it('should allow job creation when payment is not required', async () => {
      // Mock user with active subscription (Phase 2 feature)
      const mockJobService = require('../src/services/job.service').jobServices;
      mockJobService.checkJobPostingPayment = jest.fn().mockResolvedValue({
        required: false,
        paid: true,
      });
      mockJobService.create = jest.fn().mockResolvedValue({
        id: 'job-123',
        title: 'Test Job',
      });

      const jobData = {
        title: 'Software Developer',
        description: 'Test job description',
        company: 'Test Company',
        location: 'Test Location',
        jobType: 'full-time',
        requiredSkills: ['JavaScript', 'React'],
      };

      const response = await request(app)
        .post('/jobs')
        .set('Authorization', authToken)
        .send(jobData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Job posted successfully');
      expect(response.body).toHaveProperty('job');
      expect(mockJobService.checkJobPostingPayment).toHaveBeenCalled();
      expect(mockJobService.create).toHaveBeenCalled();
    });

    it('should block job creation when payment is required but not paid', async () => {
      // Mock user without payment
      const mockJobService = require('../src/services/job.service').jobServices;
      mockJobService.checkJobPostingPayment = jest.fn().mockResolvedValue({
        required: true,
        paid: false,
        amount: 100,
        paymentUrl: '/payment/job-posting',
      });

      const jobData = {
        title: 'Software Developer',
        description: 'Test job description',
        company: 'Test Company',
        location: 'Test Location',
        jobType: 'full-time',
        requiredSkills: ['JavaScript', 'React'],
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
    });

    it('should allow job creation when payment is required and already paid', async () => {
      // Mock user with valid payment
      const mockJobService = require('../src/services/job.service').jobServices;
      mockJobService.checkJobPostingPayment = jest.fn().mockResolvedValue({
        required: true,
        paid: true,
      });
      mockJobService.create = jest.fn().mockResolvedValue({
        id: 'job-123',
        title: 'Test Job',
      });

      const jobData = {
        title: 'Software Developer',
        description: 'Test job description',
        company: 'Test Company',
        location: 'Test Location',
        jobType: 'full-time',
        requiredSkills: ['JavaScript', 'React'],
      };

      const response = await request(app)
        .post('/jobs')
        .set('Authorization', authToken)
        .send(jobData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Job posted successfully');
      expect(mockJobService.create).toHaveBeenCalled();
    });
  });

  describe('Payment Recording', () => {
    it('should record payment with correct expiration date', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 100,
        metadata: {
          type: 'job-posting',
          userId: userId,
        },
      };

      (getStripeClient().paymentIntents.retrieve as jest.Mock).mockResolvedValue(mockPaymentIntent);

      const mockSet = jest.fn();
      const mockDoc = jest.fn(() => ({
        set: mockSet,
      }));
      
      (db.collection as jest.Mock).mockReturnValue({
        doc: mockDoc,
      });

      await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
        .send({ paymentIntentId: 'pi_test_123' })
        .expect(200);

      expect(db.collection).toHaveBeenCalledWith('jobPostingPayments');
      expect(mockDoc).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(String),
          paymentIntentId: 'pi_test_123',
          amount: 100,
          status: 'paid',
          expiresAt: expect.any(Object), // Firestore Timestamp
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors during payment recording', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        metadata: {
          type: 'job-posting',
          userId: userId,
        },
      };

      (getStripeClient().paymentIntents.retrieve as jest.Mock).mockResolvedValue(mockPaymentIntent);

      // Mock database error
      (db.collection as jest.Mock).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
        .send({ paymentIntentId: 'pi_test_123' })
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'PAYMENT_CONFIRMATION_ERROR');
    });

    it('should handle Stripe API errors during payment intent creation', async () => {
      (getStripeClient().paymentIntents.create as jest.Mock).mockRejectedValue(
        new Error('Stripe API key invalid')
      );

      const response = await request(app)
        .post('/payment/job-posting/create-intent')
        .set('Authorization', authToken)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Stripe API key invalid');
      expect(response.body).toHaveProperty('code', 'PAYMENT_INTENT_ERROR');
    });
  });

  describe('Security', () => {
    it('should validate payment intent ownership', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        metadata: {
          type: 'job-posting',
          userId: 'malicious-user-id', // Different from authenticated user
        },
      };

      (getStripeClient().paymentIntents.retrieve as jest.Mock).mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/payment/job-posting/confirm')
        .set('Authorization', authToken)
        .send({ paymentIntentId: 'pi_test_123' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid payment intent');
    });

    it('should require authentication for all payment endpoints', async () => {
      // Test create intent endpoint
      await request(app)
        .post('/payment/job-posting/create-intent')
        .expect(401);

      // Test confirm payment endpoint
      await request(app)
        .post('/payment/job-posting/confirm')
        .send({ paymentIntentId: 'pi_test_123' })
        .expect(401);
    });
  });
});
