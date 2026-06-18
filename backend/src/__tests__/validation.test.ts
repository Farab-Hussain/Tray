import { validateLogin, validateCreateBooking } from '../middleware/validation';
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

