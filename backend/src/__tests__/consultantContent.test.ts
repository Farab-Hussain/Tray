// Consultant Content Posting System Tests
import request from 'supertest';
import app from '../app';

// Mock authentication middleware
jest.mock('../middleware/authMiddleware', () => ({
  authenticateUser: () => (req: any, res: any, next: any) => {
    const role = req.headers['x-test-role'] || 'consultant';
    const userId = req.headers['x-test-user-id'] || 'test-consultant';
    
    req.user = {
      uid: userId,
      email: 'consultant@example.com',
      name: 'Test Consultant',
      role: role,
    };
    next();
  },
  authorizeRole: (roles: string[]) => (req: any, res: any, next: any) => {
    const userRole = req.user?.role;
    if (roles.includes(userRole)) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied' });
    }
  },
}));

// Mock Firebase
jest.mock('../config/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          exists: true,
          data: () => ({ consultantId: 'test-consultant' })
        })),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({ 
              empty: false,
              docs: [{ id: 'content-123' }]
            }))
          })),
        })),
      })),
      add: jest.fn(() => Promise.resolve({ id: 'test-content-id' })),
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({
            docs: [
              { id: 'content-1', data: { title: 'Test Content 1' } },
              { id: 'content-2', data: { title: 'Test Content 2' } }
            ]
          }))
        }))
      })),
    })),
  },
}));

describe('Consultant Content Posting System', () => {
  describe('Content Creation', () => {
    it('should allow consultants to create free content', async () => {
      const contentData = {
        title: 'Career Development Tips',
        description: 'A comprehensive guide to career development',
        contentType: 'article',
        tags: ['career', 'development', 'tips'],
        category: 'Career Development',
        isFree: true,
      };

      const response = await request(app)
        .post('/consultant-content')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-consultant')
        .send(contentData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Content created successfully and submitted for approval');
      expect(response.body).toHaveProperty('content');
      expect(response.body.content).toHaveProperty('title', contentData.title);
      expect(response.body.content).toHaveProperty('isFree', true);
      expect(response.body.content).toHaveProperty('status', 'pending');
    });

    it('should allow consultants to create paid content', async () => {
      const contentData = {
        title: 'Advanced Interview Techniques',
        description: 'Master the art of interviewing',
        contentType: 'video',
        contentUrl: 'https://example.com/video.mp4',
        tags: ['interview', 'techniques', 'advanced'],
        category: 'Interview Tips',
        isFree: false,
        price: 999, // $9.99 in cents
      };

      const response = await request(app)
        .post('/consultant-content')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-consultant')
        .send(contentData)
        .expect(201);

      expect(response.body).toHaveProperty('content');
      expect(response.body.content).toHaveProperty('isFree', false);
      expect(response.body.content).toHaveProperty('price', 999);
      expect(response.body.content).toHaveProperty('status', 'pending');
    });

    it('should block non-consultants from creating content', async () => {
      const contentData = {
        title: 'Unauthorized Content',
        description: 'This should not be allowed',
        contentType: 'article',
        tags: ['test'],
        category: 'Test',
        isFree: true,
      };

      const response = await request(app)
        .post('/consultant-content')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .send(contentData)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Consultant access required');
    });

    it('should require authentication for content creation', async () => {
      const contentData = {
        title: 'Unauthenticated Content',
        description: 'This should not be allowed',
        contentType: 'article',
        tags: ['test'],
        category: 'Test',
        isFree: true,
      };

      const response = await request(app)
        .post('/consultant-content')
        .send(contentData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication required');
    });
  });

  describe('Content Management', () => {
    it('should allow consultants to get their content', async () => {
      const response = await request(app)
        .get('/consultant-content/my')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-consultant')
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.content)).toBe(true);
    });

    it('should allow consultants to update their content', async () => {
      const updates = {
        title: 'Updated Content Title',
        description: 'Updated description',
      };

      const response = await request(app)
        .put('/consultant-content/content-123')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-consultant')
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body.content).toHaveProperty('title', updates.title);
    });

    it('should allow consultants to delete their content', async () => {
      const response = await request(app)
        .delete('/consultant-content/content-123')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-consultant')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Content deleted successfully');
    });
  });

  describe('Content Access Control', () => {
    it('should allow public access to published content', async () => {
      const response = await request(app)
        .get('/consultant-content/published')
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.content)).toBe(true);
    });

    it('should allow public access to specific published content', async () => {
      const response = await request(app)
        .get('/consultant-content/published/content-123')
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body.content).toHaveProperty('status', 'published');
    });

    it('should track content views', async () => {
      const response = await request(app)
        .get('/consultant-content/published/content-123')
        .expect(200);

      expect(response.body).toHaveProperty('content');
      // View count should be incremented (mock implementation)
    });
  });

  describe('Content Rating System', () => {
    it('should allow users to rate content', async () => {
      const ratingData = {
        rating: 5,
        comment: 'Excellent content!',
      };

      const response = await request(app)
        .post('/consultant-content/content-123/rating')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .send(ratingData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Rating added successfully');
    });

    it('should track download counts', async () => {
      const response = await request(app)
        .post('/consultant-content/content-123/download')
        .set('x-test-role', 'student')
        .set('x-test-user-id', 'test-student')
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
    });
  });

  describe('Admin Content Management', () => {
    it('should allow admins to get pending content', async () => {
      const response = await request(app)
        .get('/consultant-content/admin/pending')
        .set('x-test-role', 'admin')
        .set('x-test-user-id', 'test-admin')
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(Array.isArray(response.body.content)).toBe(true);
    });

    it('should allow admins to approve content', async () => {
      const response = await request(app)
        .put('/consultant-content/content-123/approve')
        .set('x-test-role', 'admin')
        .set('x-test-user-id', 'test-admin')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Content approved successfully');
      expect(response.body).toHaveProperty('content');
      expect(response.body.content).toHaveProperty('status', 'approved');
    });

    it('should allow admins to reject content', async () => {
      const rejectData = {
        rejectionReason: 'Content does not meet quality standards',
      };

      const response = await request(app)
        .put('/consultant-content/content-123/reject')
        .set('x-test-role', 'admin')
        .set('x-test-user-id', 'test-admin')
        .send(rejectData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Content rejected successfully');
      expect(response.body).toHaveProperty('content');
      expect(response.body.content).toHaveProperty('status', 'rejected');
      expect(response.body.content).toHaveProperty('rejectionReason', rejectData.rejectionReason);
    });
  });

  describe('Consultant Statistics', () => {
    it('should provide consultant content statistics', async () => {
      const response = await request(app)
        .get('/consultant-content/my/stats')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-consultant')
        .expect(200);

      expect(response.body).toHaveProperty('totalContent');
      expect(response.body).toHaveProperty('publishedContent');
      expect(response.body).toHaveProperty('totalViews');
      expect(response.body).toHaveProperty('totalDownloads');
      expect(response.body).toHaveProperty('totalLikes');
      expect(response.body).toHaveProperty('averageRating');
      expect(response.body).toHaveProperty('totalRevenue');
    });
  });

  describe('Content Type Support', () => {
    const contentTypes = [
      { type: 'article', description: 'Text-based content' },
      { type: 'video', description: 'Video content with duration' },
      { type: 'pdf', description: 'PDF documents with page count' },
      { type: 'tip', description: 'Quick tips and advice' },
      { type: 'guide', description: 'Comprehensive guides' },
      { type: 'resource', description: 'Downloadable resources' },
    ];

    contentTypes.forEach(({ type, description }) => {
      it(`should support ${type} content type (${description})`, async () => {
        const contentData = {
          title: `Test ${type} Content`,
          description: `Test ${description}`,
          contentType: type,
          tags: ['test', type],
          category: 'Test',
          isFree: true,
        };

        const response = await request(app)
          .post('/consultant-content')
          .set('x-test-role', 'consultant')
          .set('x-test-user-id', 'test-consultant')
          .send(contentData)
          .expect(201);

        expect(response.body).toHaveProperty('content');
        expect(response.body.content).toHaveProperty('contentType', type);
      });
    });
  });

  describe('Free vs Paid Content', () => {
    it('should handle free content correctly', async () => {
      const contentData = {
        title: 'Free Career Guide',
        description: 'A comprehensive free guide',
        contentType: 'guide',
        tags: ['career', 'guide', 'free'],
        category: 'Career Development',
        isFree: true,
      };

      const response = await request(app)
        .post('/consultant-content')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-consultant')
        .send(contentData)
        .expect(201);

      expect(response.body.content).toHaveProperty('isFree', true);
      expect(response.body.content).toHaveProperty('price', undefined);
    });

    it('should handle paid content correctly', async () => {
      const contentData = {
        title: 'Premium Career Coaching',
        description: 'Premium coaching content',
        contentType: 'video',
        tags: ['career', 'coaching', 'premium'],
        category: 'Career Development',
        isFree: false,
        price: 1999, // $19.99 in cents
      };

      const response = await request(app)
        .post('/consultant-content')
        .set('x-test-role', 'consultant')
        .set('x-test-user-id', 'test-consultant')
        .send(contentData)
        .expect(201);

      expect(response.body.content).toHaveProperty('isFree', false);
      expect(response.body.content).toHaveProperty('price', 1999);
    });
  });

  describe('Content Filtering and Search', () => {
    it('should filter content by category', async () => {
      const response = await request(app)
        .get('/consultant-content/published?category=Career Development')
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(Array.isArray(response.body.content)).toBe(true);
    });

    it('should filter content by content type', async () => {
      const response = await request(app)
        .get('/consultant-content/published?contentType=article')
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(Array.isArray(response.body.content)).toBe(true);
    });

    it('should search content by tags', async () => {
      const response = await request(app)
        .get('/consultant-content/published?tags=career,development')
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(Array.isArray(response.body.content)).toBe(true);
    });

    it('should search content by text', async () => {
      const response = await request(app)
        .get('/consultant-content/published?search=career')
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(Array.isArray(response.body.content)).toBe(true);
    });
  });
});
