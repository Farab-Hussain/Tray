import request from 'supertest';
import app from '../app';

jest.mock('../config/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ exists: false }),
      })),
    })),
  },
  auth: { createCustomToken: jest.fn() },
  firebaseApp: { options: { projectId: 'test' } },
  admin: {},
}));

jest.mock('../utils/firebaseTokenVerification', () => ({
  verifyFirebaseIdToken: jest.fn(),
}));

describe('GET /auth/users/:uid', () => {
  it('returns 401 without authentication', async () => {
    const res = await request(app).get('/auth/users/some-user-id');
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid uid format', async () => {
    const { verifyFirebaseIdToken } = require('../utils/firebaseTokenVerification');
    verifyFirebaseIdToken.mockResolvedValue({ uid: 'viewer-uid', email: 'v@test.com' });

    const res = await request(app)
      .get('/auth/users/not valid!')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(400);
  });
});
