import { Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/zodValidation';
import { registerSchema } from '../schemas/register.schema';

const mockRequest = (body: unknown) => ({ body } as Request);

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('registerSchema / validateBody', () => {
  const validateRegisterBody = validateBody(registerSchema);
  let next: NextFunction;

  beforeEach(() => {
    next = jest.fn() as NextFunction;
  });

  it('should pass validation with valid data', () => {
    const req = mockRequest({
      email: 'test@example.com',
      accountType: 'student',
      name: 'Test User',
    });
    const res = mockResponse();

    validateRegisterBody(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.body).toEqual({
      email: 'test@example.com',
      accountType: 'student',
      name: 'Test User',
    });
  });

  it('should fail validation with invalid email', () => {
    const req = mockRequest({
      email: 'invalid-email',
      accountType: 'student',
    });
    const res = mockResponse();

    validateRegisterBody(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail validation when accountType is admin', () => {
    const req = mockRequest({
      email: 'test@example.com',
      accountType: 'admin',
    });
    const res = mockResponse();

    validateRegisterBody(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should pass validation with hiring_manager accountType', () => {
    const req = mockRequest({
      email: 'hm@example.com',
      accountType: 'hiring_manager',
    });
    const res = mockResponse();

    validateRegisterBody(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should reject extra fields such as role and isAdmin', () => {
    const req = mockRequest({
      email: 'x@test.com',
      accountType: 'student',
      role: 'admin',
      isAdmin: true,
      uid: 'attacker-uid',
    });
    const res = mockResponse();

    validateRegisterBody(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Unknown fields are not allowed',
      }),
    );
  });
});
