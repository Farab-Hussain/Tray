import { validateRegister, validateLogin, validateCreateBooking } from '../middleware/validation';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

// Mock request, response, and next
const mockRequest = (body: any) => ({
  body,
} as Request);

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('Validation Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRegister', () => {
    it('should pass validation with valid data', async () => {
      const req = mockRequest({
        uid: 'test-uid',
        email: 'test@example.com',
        role: 'student',
        name: 'Test User',
      });
      const res = mockResponse();
      const next = mockNext;

      // Run all validators
      for (const validator of validateRegister) {
        await validator(req, res, next);
      }

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should fail validation with missing uid', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        role: 'student',
      });
      const res = mockResponse();
      const next = mockNext;

      for (const validator of validateRegister) {
        await validator(req, res, next);
      }

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array()[0].msg).toContain('UID is required');
    });

    it('should fail validation with invalid email', async () => {
      const req = mockRequest({
        uid: 'test-uid',
        email: 'invalid-email',
        role: 'student',
      });
      const res = mockResponse();
      const next = mockNext;

      for (const validator of validateRegister) {
        await validator(req, res, next);
      }

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array()[0].msg).toContain('Valid email');
    });
  });

  describe('validateLogin', () => {
    it('should pass validation with valid idToken', async () => {
      const req = mockRequest({
        idToken: 'valid-token',
      });
      const res = mockResponse();
      const next = mockNext;

      for (const validator of validateLogin) {
        await validator(req, res, next);
      }

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should fail validation with missing idToken', async () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = mockNext;

      for (const validator of validateLogin) {
        await validator(req, res, next);
      }

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
    });
  });
});

