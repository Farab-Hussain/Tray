// Simple Course Library Test
// Tests basic course functionality

import request from 'supertest';
import app from '../app';

describe('Course Library Basic Tests', () => {
  test('should return 404 for non-existent course', async () => {
    const response = await request(app)
      .get('/courses/non-existent-course')
      .expect(404);

    expect(response.body.error).toBeDefined();
  });

  test('should return 404 for non-existent course slug', async () => {
    const response = await request(app)
      .get('/courses/slug/non-existent-slug')
      .expect(404);

    expect(response.body.error).toBeDefined();
  });

  test('should return 401 for unauthenticated course creation', async () => {
    const response = await request(app)
      .post('/courses')
      .send({
        title: 'Test Course',
        description: 'Test description',
        category: 'Test',
        tags: [],
        level: 'beginner',
        language: 'English',
        price: 0,
        currency: 'USD',
        isFree: true,
        duration: 60,
        durationText: '1 hour',
        lessonsCount: 5,
        objectives: [],
        prerequisites: [],
        targetAudience: [],
        difficultyScore: 1,
        timeCommitment: '1 hour',
        certificateAvailable: false,
        slug: 'test-course'
      })
      .expect(401);

    expect(response.body.error).toBeDefined();
  });

  test('should return 404 for course search without authentication', async () => {
    const response = await request(app)
      .get('/courses/search')
      .query({
        category: 'Technology',
        page: 1,
        limit: 10,
      })
      .expect(404);

    expect(response.body.error).toBeDefined();
  });

  test('should return 404 for featured courses', async () => {
    const response = await request(app)
      .get('/courses/featured')
      .query({ limit: 5 })
      .expect(404);

    expect(response.body.error).toBeDefined();
  });

  test('should return 404 for trending courses', async () => {
    const response = await request(app)
      .get('/courses/trending')
      .query({ limit: 5 })
      .expect(404);

    expect(response.body.error).toBeDefined();
  });

  test('should return 404 for bestseller courses', async () => {
    const response = await request(app)
      .get('/courses/bestseller')
      .query({ limit: 5 })
      .expect(404);

    expect(response.body.error).toBeDefined();
  });
});

console.log('✅ Course Library Basic Tests Completed');
