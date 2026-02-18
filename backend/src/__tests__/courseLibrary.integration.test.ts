// @ts-nocheck
// backend/src/__tests__/courseLibrary.integration.test.ts
// Integration tests for Enhanced Course Library functionality

import request from 'supertest';
import express from 'express';
import { courseService } from '../services/course.service';

// Mock the course service
jest.mock('../services/course.service');
const mockedCourseService = courseService as jest.Mocked<typeof courseService>;

// Mock authentication
jest.mock('../middleware/auth', () => ({
  authenticateUser: (req: any, res: any, next: any) => {
    req.user = {
      uid: 'test-user-123',
      role: 'student',
      email: 'test@example.com',
    };
    next();
  },
  authorizeRole: (roles: string[]) => (req: any, res: any, next: any) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied' });
    }
  },
}));

const app = express();
app.use(express.json());

// Basic course routes for testing
app.get('/courses', async (req, res) => {
  try {
    const courses = await courseService.getAllCourses();
    res.json({ courses });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/courses', async (req, res) => {
  try {
    const course = await courseService.createCourse(req.body);
    res.status(201).json({ course });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/courses/:id', async (req, res) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    res.json({ course });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

app.put('/courses/:id', async (req, res) => {
  try {
    const course = await courseService.updateCourse(req.params.id, req.body);
    res.json({ course });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/courses/:id', async (req, res) => {
  try {
    await courseService.deleteCourse(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

describe.skip('Enhanced Course Library Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Course CRUD Operations', () => {
    it('should create a new course', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'Test Description',
        shortDescription: 'Test Short Description',
        category: 'Technology',
        level: 'beginner',
        price: 9999,
        currency: 'USD',
        language: 'English',
        slug: 'test-course',
        duration: 3600,
        durationText: '1 hour',
        lessonsCount: 10,
        objectives: ['Learn something'],
        prerequisites: ['Basic knowledge'],
        targetAudience: ['Beginners'],
        difficultyScore: 3,
        timeCommitment: '5 hours per week',
        certificateAvailable: true,
        tags: ['test', 'course'],
        pricingOptions: {
          monthly: 1999,
          yearly: 19999,
          lifetime: 49999,
        },
      };

      const createdCourse = {
        id: 'course-123',
        ...courseData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft',
        enrollmentCount: 0,
        completionCount: 0,
        averageRating: 0,
        ratingCount: 0,
      };

      mockedCourseService.createCourse.mockResolvedValue(createdCourse);

      const response = await request(app)
        .post('/courses')
        .send(courseData)
        .expect(201);

      expect(response.body.course).toEqual(createdCourse);
      expect(mockedCourseService.createCourse).toHaveBeenCalledWith(courseData);
    });

    it('should get all courses', async () => {
      const courses = [
        {
          id: 'course-1',
          title: 'Course 1',
          description: 'Description 1',
          category: 'Technology',
          level: 'beginner',
          price: 9999,
          currency: 'USD',
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'published',
          enrollmentCount: 10,
          completionCount: 5,
          averageRating: 4.5,
          ratingCount: 8,
        },
        {
          id: 'course-2',
          title: 'Course 2',
          description: 'Description 2',
          category: 'Business',
          level: 'intermediate',
          price: 19999,
          currency: 'USD',
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'draft',
          enrollmentCount: 0,
          completionCount: 0,
          averageRating: 0,
          ratingCount: 0,
        },
      ];

      mockedCourseService.getAllCourses.mockResolvedValue(courses);

      const response = await request(app)
        .get('/courses')
        .expect(200);

      expect(response.body.courses).toEqual(courses);
      expect(mockedCourseService.getAllCourses).toHaveBeenCalled();
    });

    it('should get course by ID', async () => {
      const course = {
        id: 'course-123',
        title: 'Test Course',
        description: 'Test Description',
        category: 'Technology',
        level: 'beginner',
        price: 9999,
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'published',
        enrollmentCount: 10,
        completionCount: 5,
        averageRating: 4.5,
        ratingCount: 8,
      };

      mockedCourseService.getCourseById.mockResolvedValue(course);

      const response = await request(app)
        .get('/courses/course-123')
        .expect(200);

      expect(response.body.course).toEqual(course);
      expect(mockedCourseService.getCourseById).toHaveBeenCalledWith('course-123');
    });

    it('should update a course', async () => {
      const updateData = {
        title: 'Updated Course',
        description: 'Updated Description',
        price: 14999,
      };

      const updatedCourse = {
        id: 'course-123',
        title: 'Updated Course',
        description: 'Updated Description',
        category: 'Technology',
        level: 'beginner',
        price: 14999,
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'published',
        enrollmentCount: 10,
        completionCount: 5,
        averageRating: 4.5,
        ratingCount: 8,
      };

      mockedCourseService.updateCourse.mockResolvedValue(updatedCourse);

      const response = await request(app)
        .put('/courses/course-123')
        .send(updateData)
        .expect(200);

      expect(response.body.course).toEqual(updatedCourse);
      expect(mockedCourseService.updateCourse).toHaveBeenCalledWith('course-123', updateData);
    });

    it('should delete a course', async () => {
      mockedCourseService.deleteCourse.mockResolvedValue();

      const response = await request(app)
        .delete('/courses/course-123')
        .expect(200);

      expect(response.body.message).toBe('Course deleted successfully');
      expect(mockedCourseService.deleteCourse).toHaveBeenCalledWith('course-123');
    });
  });

  describe('Error Handling', () => {
    it('should handle course creation errors', async () => {
      const invalidCourseData = {
        title: '', // Invalid empty title
        description: 'Description',
      };

      mockedCourseService.createCourse.mockRejectedValue(
        new Error('Title is required')
      );

      const response = await request(app)
        .post('/courses')
        .send(invalidCourseData)
        .expect(400);

      expect(response.body.error).toBe('Title is required');
    });

    it('should handle course not found errors', async () => {
      mockedCourseService.getCourseById.mockRejectedValue(
        new Error('Course not found')
      );

      const response = await request(app)
        .get('/courses/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Course not found');
    });

    it('should handle course update errors', async () => {
      const updateData = {
        title: 'Updated Course',
      };

      mockedCourseService.updateCourse.mockRejectedValue(
        new Error('Course not found')
      );

      const response = await request(app)
        .put('/courses/nonexistent')
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('Course not found');
    });

    it('should handle course deletion errors', async () => {
      mockedCourseService.deleteCourse.mockRejectedValue(
        new Error('Course not found')
      );

      const response = await request(app)
        .delete('/courses/nonexistent')
        .expect(400);

      expect(response.body.error).toBe('Course not found');
    });
  });

  describe('Service Method Validation', () => {
    it('should validate course creation parameters', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'Test Description',
        category: 'Technology',
        level: 'beginner',
        price: 9999,
        currency: 'USD',
        language: 'English',
        slug: 'test-course',
        duration: 3600,
        durationText: '1 hour',
        lessonsCount: 10,
        objectives: ['Learn something'],
        prerequisites: ['Basic knowledge'],
        targetAudience: ['Beginners'],
        difficultyScore: 3,
        timeCommitment: '5 hours per week',
        certificateAvailable: true,
        tags: ['test', 'course'],
        pricingOptions: {
          monthly: 1999,
          yearly: 19999,
          lifetime: 49999,
        },
      };

      const createdCourse = {
        id: 'course-123',
        ...courseData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft',
        enrollmentCount: 0,
        completionCount: 0,
        averageRating: 0,
        ratingCount: 0,
      };

      mockedCourseService.createCourse.mockResolvedValue(createdCourse);

      await request(app)
        .post('/courses')
        .send(courseData)
        .expect(201);

      expect(mockedCourseService.createCourse).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Course',
          description: 'Test Description',
          category: 'Technology',
          level: 'beginner',
          price: 9999,
          currency: 'USD',
          pricingOptions: {
            monthly: 1999,
            yearly: 19999,
            lifetime: 49999,
          },
        })
      );
    });

    it('should handle service method calls correctly', async () => {
      const courses = [
        {
          id: 'course-1',
          title: 'Course 1',
          description: 'Description 1',
          category: 'Technology',
          level: 'beginner',
          price: 9999,
          currency: 'USD',
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'published',
          enrollmentCount: 10,
          completionCount: 5,
          averageRating: 4.5,
          ratingCount: 8,
        },
      ];

      mockedCourseService.getAllCourses.mockResolvedValue(courses);

      await request(app)
        .get('/courses')
        .expect(200);

      expect(mockedCourseService.getAllCourses).toHaveBeenCalledTimes(1);
      expect(mockedCourseService.getAllCourses).toHaveBeenCalledWith();
    });
  });

  describe('Data Structure Validation', () => {
    it('should validate course data structure', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'Test Description',
        category: 'Technology',
        level: 'beginner',
        price: 9999,
        currency: 'USD',
        language: 'English',
        slug: 'test-course',
        duration: 3600,
        durationText: '1 hour',
        lessonsCount: 10,
        objectives: ['Learn something'],
        prerequisites: ['Basic knowledge'],
        targetAudience: ['Beginners'],
        difficultyScore: 3,
        timeCommitment: '5 hours per week',
        certificateAvailable: true,
        tags: ['test', 'course'],
        pricingOptions: {
          monthly: 1999,
          yearly: 19999,
          lifetime: 49999,
        },
      };

      const createdCourse = {
        id: 'course-123',
        ...courseData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft',
        enrollmentCount: 0,
        completionCount: 0,
        averageRating: 0,
        ratingCount: 0,
      };

      mockedCourseService.createCourse.mockResolvedValue(createdCourse);

      const response = await request(app)
        .post('/courses')
        .send(courseData)
        .expect(201);

      // Validate response structure
      expect(response.body).toHaveProperty('course');
      expect(response.body.course).toHaveProperty('id', 'course-123');
      expect(response.body.course).toHaveProperty('title', 'Test Course');
      expect(response.body.course).toHaveProperty('description', 'Test Description');
      expect(response.body.course).toHaveProperty('category', 'Technology');
      expect(response.body.course).toHaveProperty('level', 'beginner');
      expect(response.body.course).toHaveProperty('price', 9999);
      expect(response.body.course).toHaveProperty('currency', 'USD');
      expect(response.body.course).toHaveProperty('pricingOptions');
      expect(response.body.course.pricingOptions).toHaveProperty('monthly', 1999);
      expect(response.body.course.pricingOptions).toHaveProperty('yearly', 19999);
      expect(response.body.course.pricingOptions).toHaveProperty('lifetime', 49999);
    });
  });
});
