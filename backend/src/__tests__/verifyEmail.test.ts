import { Request, Response } from 'express';
import { createHash } from 'crypto';

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

jest.mock('../config/firebase', () => ({
  db: {
    collection: jest.fn(),
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

const { verifyEmail } = require('../controllers/auth.Controller');
const { db, auth } = require('../config/firebase');

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('verifyEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects requests without token and uid', async () => {
    const req = { body: { uid: 'user-1' } } as Request;
    const res = mockResponse();

    await verifyEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        code: 'INVALID_TOKEN',
      }),
    );
  });

  it('rejects uid-only legacy verification attempts', async () => {
    const req = {
      body: { uid: 'victim-uid', email: 'victim@test.com' },
      user: { uid: 'victim-uid', email: 'victim@test.com' },
    } as Request;
    const res = mockResponse();

    await verifyEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it('rejects when token document is missing and email is not verified', async () => {
    const tokenDoc = {
      exists: false,
      data: jest.fn(),
    };
    (db.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(tokenDoc),
        delete: jest.fn(),
      }),
    });
    auth.getUser.mockResolvedValue({
      uid: 'user-1',
      email: 'user@test.com',
      emailVerified: false,
    });

    const req = {
      body: { token: 'abc123', uid: 'user-1' },
    } as Request;
    const res = mockResponse();

    await verifyEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        code: 'INVALID_TOKEN',
      }),
    );
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it('rejects when token hash does not match', async () => {
    const tokenDoc = {
      exists: true,
      data: jest.fn().mockReturnValue({
        tokenHash: 'expected-hash',
        expiresAt: { toDate: () => new Date(Date.now() + 60_000) },
      }),
    };
    (db.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(tokenDoc),
        delete: jest.fn(),
      }),
    });

    const req = {
      body: { token: 'wrong-token', uid: 'user-1' },
    } as Request;
    const res = mockResponse();

    await verifyEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it('verifies email when token is valid', async () => {
    const rawToken = 'valid-token';
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const deleteMock = jest.fn().mockResolvedValue(undefined);

    const tokenDoc = {
      exists: true,
      data: jest.fn().mockReturnValue({
        tokenHash,
        expiresAt: { toDate: () => new Date(Date.now() + 60_000) },
      }),
    };
    (db.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(tokenDoc),
        delete: deleteMock,
      }),
    });
    auth.getUser.mockResolvedValue({
      uid: 'user-1',
      email: 'user@test.com',
      emailVerified: false,
    });
    auth.updateUser.mockResolvedValue(undefined);

    const req = {
      body: { token: rawToken, uid: 'user-1' },
    } as Request;
    const res = mockResponse();

    await verifyEmail(req, res);

    expect(deleteMock).toHaveBeenCalled();
    expect(auth.updateUser).toHaveBeenCalledWith('user-1', { emailVerified: true });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        emailVerified: true,
      }),
    );
  });
});
