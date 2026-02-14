/**
 * Basic Service Creation Test
 * Simple test to verify the API structure
 */

import request from 'supertest';
import app from '../app';

describe('Basic Service API', () => {
  it('should have the applications endpoint', async () => {
    const response = await request(app)
      .post('/consultant-flow/applications')
      .send({})
      .expect(401); // Should be unauthorized without token

    expect(response.status).toBe(401);
  });

  it('should have the applications GET endpoint', async () => {
    const response = await request(app)
      .get('/consultant-flow/applications/my')
      .expect(401); // Should be unauthorized without token

    expect(response.status).toBe(401);
  });
});
