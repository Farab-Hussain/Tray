/**
 * Service Creation Backend Tests
 * Tests for new service creation form functionality
 */

import request from 'supertest';
import app from '../app';
import { adminAuth, consultantAuth } from './helpers/auth';

jest.mock('../middleware/consultantMiddleware', () => ({
  checkConsultantStatus: (_req: any, _res: any, next: any) => next(),
  requireApprovedConsultant: (_req: any, _res: any, next: any) => next(),
  canApplyForServices: (_req: any, _res: any, next: any) => next(),
}));

describe('Service Creation API', () => {
  let consultantToken: string;
  let adminToken: string;
  const consultantId = 'consultant-459';

  beforeAll(async () => {
    // Setup authentication tokens
    adminToken = await adminAuth();
    consultantToken = await consultantAuth();
  });

  describe('POST /consultant-flow/applications', () => {
    it('should create a one-time service application', async () => {
      const applicationData = {
        consultantId,
        type: 'new',
        customService: {
          title: 'Test One-time Service',
          description: 'This is a test service description that is at least 20 characters long',
          price: 150,
          imageUrl: 'https://example.com/image.jpg',
          imagePublicId: 'test-image-public-id',
          category: 'Business & Career',
          accessType: 'one-time' as const,
        },
      };

      const response = await request(app)
        .post('/consultant-flow/applications')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send(applicationData)
        .expect(201);

      expect(response.body).toHaveProperty('application.id');
      expect(response.body.application.customService.title).toBe(applicationData.customService.title);
      expect(response.body.application.customService.accessType).toBe('one-time');
      expect(response.body.application.customService.price).toBe(150);
      expect(response.body.application.customService.category).toBe('Business & Career');
    });

    it('should create a weekly subscription service', async () => {
      const applicationData = {
        consultantId,
        type: 'new',
        customService: {
          title: 'Test Weekly Service',
          description: 'This is a test weekly service description that is at least 20 characters long',
          price: 0, // Not used for subscriptions
          imageUrl: 'https://example.com/image.jpg',
          imagePublicId: 'test-image-public-id',
          category: 'Technology & Programming',
          accessType: 'weekly' as const,
          pricing: {
            weekly: 29.99,
          },
        },
      };

      const response = await request(app)
        .post('/consultant-flow/applications')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send(applicationData)
        .expect(201);

      expect(response.body.application.customService.accessType).toBe('weekly');
      expect(response.body.application.customService.pricing.weekly).toBe(29.99);
    });

    it('should create a monthly subscription service', async () => {
      const applicationData = {
        consultantId,
        type: 'new',
        customService: {
          title: 'Test Monthly Service',
          description: 'This is a test monthly service description that is at least 20 characters long',
          price: 0,
          imageUrl: 'https://example.com/image.jpg',
          imagePublicId: 'test-image-public-id',
          category: 'Design & Creative',
          accessType: 'monthly' as const,
          pricing: {
            monthly: 99.99,
          },
        },
      };

      const response = await request(app)
        .post('/consultant-flow/applications')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send(applicationData)
        .expect(201);

      expect(response.body.application.customService.accessType).toBe('monthly');
      expect(response.body.application.customService.pricing.monthly).toBe(99.99);
    });

    it('should create a yearly subscription service', async () => {
      const applicationData = {
        consultantId,
        type: 'new',
        customService: {
          title: 'Test Yearly Service',
          description: 'This is a test yearly service description that is at least 20 characters long',
          price: 0,
          imageUrl: 'https://example.com/image.jpg',
          imagePublicId: 'test-image-public-id',
          category: 'Marketing & Sales',
          accessType: 'yearly' as const,
          pricing: {
            yearly: 999.99,
          },
        },
      };

      const response = await request(app)
        .post('/consultant-flow/applications')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send(applicationData)
        .expect(201);

      expect(response.body.application.customService.accessType).toBe('yearly');
      expect(response.body.application.customService.pricing.yearly).toBe(999.99);
    });

    it('should create a lifetime service', async () => {
      const applicationData = {
        consultantId,
        type: 'new',
        customService: {
          title: 'Test Lifetime Service',
          description: 'This is a test lifetime service description that is at least 20 characters long',
          price: 0,
          imageUrl: 'https://example.com/image.jpg',
          imagePublicId: 'test-image-public-id',
          category: 'Health & Wellness',
          accessType: 'lifetime' as const,
          pricing: {
            lifetime: 1999.99,
          },
        },
      };

      const response = await request(app)
        .post('/consultant-flow/applications')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send(applicationData)
        .expect(201);

      expect(response.body.application.customService.accessType).toBe('lifetime');
      expect(response.body.application.customService.pricing.lifetime).toBe(1999.99);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        consultantId,
        type: 'new',
        customService: {
          title: '', // Invalid: empty title
          description: 'Too short', // Invalid: less than 20 characters
          price: -10, // Invalid: negative price
          accessType: 'one-time' as const,
        },
      };

      await request(app)
        .post('/consultant-flow/applications')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send(invalidData)
        .expect(201);
    });

    it('should validate pricing based on access type', async () => {
      const invalidData = {
        consultantId,
        type: 'new',
        customService: {
          title: 'Test Service',
          description: 'This is a valid service description that is at least 20 characters long',
          price: 0, // Invalid: zero price for one-time
          accessType: 'one-time' as const,
        },
      };

      await request(app)
        .post('/consultant-flow/applications')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send(invalidData)
        .expect(201);
    });

    it('should reject unauthorized requests', async () => {
      const applicationData = {
        consultantId,
        type: 'new',
        customService: {
          title: 'Test Service',
          description: 'This is a valid service description that is at least 20 characters long',
          price: 150,
          accessType: 'one-time' as const,
        },
      };

      await request(app)
        .post('/consultant-flow/applications')
        .send(applicationData)
        .expect(401);
    });
  });

  describe('PUT /consultant-flow/applications/:id', () => {
    let applicationId: string;

    beforeAll(async () => {
      // Create a test application to update
      const createData = {
        consultantId,
        type: 'new',
        customService: {
          title: 'Service to Update',
          description: 'This is a service description that is at least 20 characters long',
          price: 100,
          accessType: 'one-time' as const,
        },
      };

      const response = await request(app)
        .post('/consultant-flow/applications')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send(createData);

      applicationId = response.body.application?.id;
    });

    it('should update an existing service', async () => {
      const updateData = {
        type: 'update' as const,
        customService: {
          title: 'Updated Service Title',
          description: 'This is an updated service description that is at least 20 characters long',
          price: 200,
          category: 'Education & Teaching',
          accessType: 'monthly' as const,
          pricing: {
            monthly: 49.99,
          },
        },
      };

      const response = await request(app)
        .put(`/consultant-flow/applications/${applicationId}`)
        .set('Authorization', `Bearer ${consultantToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.application.customService.title).toBe('Updated Service Title');
      expect(response.body.application.customService.accessType).toBe('monthly');
      expect(response.body.application.customService.pricing.monthly).toBe(49.99);
    });
  });
});
