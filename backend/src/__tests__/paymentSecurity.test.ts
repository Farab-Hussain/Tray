import { Request, Response } from 'express';
import { createPaymentIntent, transferToConsultant } from '../controllers/payment.controller';
import { createJob } from '../controllers/job.controller';

jest.mock('../utils/stripeClient', () => ({
  getStripeClient: jest.fn(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
      }),
    },
  })),
}));

const mockBookingGet = jest.fn();
const mockUserGet = jest.fn();
const mockTransfer = jest.fn();

jest.mock('../config/firebase', () => ({
  db: {
    collection: jest.fn((name: string) => {
      if (name === 'bookings') {
        return {
          doc: jest.fn(() => ({
            get: mockBookingGet,
          })),
        };
      }
      if (name === 'users') {
        return {
          doc: jest.fn(() => ({
            get: mockUserGet,
          })),
        };
      }
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    }),
  },
}));

jest.mock('../services/job.service', () => ({
  jobServices: {
    checkJobPostingPayment: jest.fn(),
    create: jest.fn().mockResolvedValue({ id: 'job-1', title: 'Test Job' }),
  },
}));

jest.mock('../services/payment.service', () => ({
  transferPaymentToConsultant: (...args: unknown[]) => mockTransfer(...args),
}));

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('payment security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('rejects unauthenticated requests', async () => {
      const req = {
        body: { amount: 50, bookingId: 'b1', studentId: 's1', consultantId: 'c1' },
      } as Request;
      const res = mockResponse();

      await createPaymentIntent(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('rejects when studentId does not match authenticated user', async () => {
      const req = {
        user: { uid: 'student-1' },
        body: { amount: 50, bookingId: 'b1', studentId: 'other-student', consultantId: 'c1' },
      } as Request;
      const res = mockResponse();

      await createPaymentIntent(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('rejects when booking belongs to another student', async () => {
      mockBookingGet.mockResolvedValue({
        exists: true,
        data: () => ({
          studentId: 'other-student',
          consultantId: 'c1',
          amount: 50,
          paymentStatus: 'unpaid',
        }),
      });

      const req = {
        user: { uid: 'student-1' },
        body: { amount: 50, bookingId: 'b1', studentId: 'student-1', consultantId: 'c1' },
      } as Request;
      const res = mockResponse();

      await createPaymentIntent(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('transferToConsultant', () => {
    it('rejects users who are not the consultant or admin', async () => {
      mockBookingGet.mockResolvedValue({
        exists: true,
        data: () => ({ consultantId: 'consultant-1', studentId: 'student-1' }),
      });
      mockUserGet.mockResolvedValue({
        data: () => ({ role: 'student', roles: ['student'] }),
      });

      const req = {
        user: { uid: 'attacker-1' },
        body: { bookingId: 'b1' },
      } as Request;
      const res = mockResponse();

      await transferToConsultant(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockTransfer).not.toHaveBeenCalled();
    });
  });

  describe('createJob payment bypass', () => {
    it('blocks recruiters without paid access fee even with x-payment-confirmed header', async () => {
      const { jobServices } = require('../services/job.service');
      jobServices.checkJobPostingPayment.mockResolvedValue({
        required: true,
        paid: false,
        amount: 2500,
        fee: 25,
        role: 'recruiter',
        roleLabel: 'Hiring Manager',
        paymentUrl: '/payment/access-fee',
      });

      mockUserGet.mockResolvedValue({
        data: () => ({ role: 'recruiter', roles: ['recruiter'], activeRole: 'recruiter' }),
      });

      const req = {
        user: { uid: 'recruiter-1', email: 'rec@test.com' },
        body: { title: 'Job', paymentConfirmed: true },
        headers: { 'x-payment-confirmed': 'true' },
      } as unknown as Request;
      const res = mockResponse();

      await createJob(req, res);

      expect(res.status).toHaveBeenCalledWith(402);
      expect(jobServices.create).not.toHaveBeenCalled();
    });
  });
});
