import request from 'supertest';
import app from '../app';

describe('Health Check', () => {
  it('should return 200 and healthy status', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('firebase');
  });
});

describe('Root Endpoint', () => {
  it('should return 200 and welcome message', async () => {
    const response = await request(app).get('/');
    
    expect(response.status).toBe(200);
    expect(response.text).toContain('Backend running');
  });
});

