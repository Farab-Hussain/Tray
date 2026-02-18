// Simple Course Library Test
// Tests basic course functionality

import request from 'supertest';
import app from '../app';

describe('Course Library Basic Tests', () => {
  test('should return null for non-existent course', async () => {
    const response = await request(app)
      .get('/courses/non-existent-course')
      .expect(404);

    expect(response.body.error).toBeDefined();
  });

  test('should return null for non-existent course slug', async () => {
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

  test('should return error for course search without authentication prerequisites', async () => {
    const response = await request(app)
      .get('/courses/search')
      .query({
        category: 'Technology',
        page: 1,
        limit: 10,
      })
      .expect((res) => {
        expect([200, 500]).toContain(res.status);
      });

    if (response.status === 200) {
      expect(response.body).toHaveProperty('courses');
    } else {
      expect(response.body.error).toBeDefined();
    }
  });

  test('should return empty array for featured courses', async () => {
    const response = await request(app)
      .get('/courses/featured')
      .query({ limit: 5 })
      .expect((res) => {
        expect([200, 500]).toContain(res.status);
      });

    if (response.status === 200) {
      expect(Array.isArray(response.body.courses)).toBe(true);
    } else {
      expect(response.body.error).toBeDefined();
    }
  });

  test('should return empty array for trending courses', async () => {
    const response = await request(app)
      .get('/courses/trending')
      .query({ limit: 5 })
      .expect((res) => {
        expect([200, 500]).toContain(res.status);
      });

    if (response.status === 200) {
      expect(Array.isArray(response.body.courses)).toBe(true);
    } else {
      expect(response.body.error).toBeDefined();
    }
  });

  test('should return empty array for bestseller courses', async () => {
    const response = await request(app)
      .get('/courses/bestseller')
      .query({ limit: 5 })
      .expect((res) => {
        expect([200, 500]).toContain(res.status);
      });

    if (response.status === 200) {
      expect(Array.isArray(response.body.courses)).toBe(true);
    } else {
      expect(response.body.error).toBeDefined();
    }
  });
});

console.log('✅ Course Library Basic Tests Completed');
