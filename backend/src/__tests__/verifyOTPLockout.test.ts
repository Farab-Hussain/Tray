import { Request, Response } from 'express';

jest.mock('../utils/jwtUtils', () => ({
  JWTUtils: { validateSecret: jest.fn() },
}));

jest.mock('../services/consultantFlow.service', () => ({
  consultantFlowService: {},
}));

jest.mock('../utils/cache', () => ({
  cache: { set: jest.fn(), get: jest.fn() },
}));

jest.mock('../utils/email', () => ({
  sendEmail: jest.fn(),
}));

const updateMock = jest.fn().mockResolvedValue(undefined);

jest.mock('../config/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        update: updateMock,
      })),
    })),
  },
  auth: {
    getUser: jest.fn(),
    updateUser: jest.fn(),
  },
}));

jest.mock('../utils/logger', () => ({
  Logger: {
    info: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
    warn: jest.fn(),
  },
}));

const { verifyOTP } = require('../controllers/auth.Controller');
const { db } = require('../config/firebase');

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('verifyOTP lockout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('locks the session after 5 failed attempts', async () => {
    const getMock = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        otp: '123456',
        verified: false,
        expiresAt: Date.now() + 60_000,
        attemptCount: 4,
        locked: false,
      }),
    });

    (db.collection as jest.Mock).mockReturnValue({
      doc: jest.fn(() => ({
        get: getMock,
        update: updateMock,
      })),
    });

    const req = {
      body: { resetSessionId: 'session-1', otp: '000000' },
    } as Request;
    const res = mockResponse();

    await verifyOTP(req, res);

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptCount: 5,
        locked: true,
      }),
    );
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'OTP_LOCKED' }),
    );
  });

  it('rejects verification when session is already locked', async () => {
    const getMock = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        otp: '123456',
        verified: false,
        expiresAt: Date.now() + 60_000,
        attemptCount: 5,
        locked: true,
      }),
    });

    (db.collection as jest.Mock).mockReturnValue({
      doc: jest.fn(() => ({
        get: getMock,
        update: updateMock,
      })),
    });

    const req = {
      body: { resetSessionId: 'session-1', otp: '123456' },
    } as Request;
    const res = mockResponse();

    await verifyOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'OTP_LOCKED' }),
    );
  });
});
