import { Request, Response } from 'express';
import {
  getCourseById,
  getCourseBySlug,
  searchCourses,
  enrollInCourse,
} from '../controllers/course.controller';
import { courseService } from '../services/course.service';

jest.mock('../services/course.service', () => ({
  courseService: {
    getCourseById: jest.fn(),
    getCourseBySlug: jest.fn(),
    searchCourses: jest.fn(),
    enrollInCourse: jest.fn(),
  },
}));

const mockedCourseService = courseService as jest.Mocked<typeof courseService>;

type MockRes = Response & {
  status: jest.Mock;
  json: jest.Mock;
};

const createMockResponse = (): MockRes => {
  const res = {} as MockRes;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockRequest = (partial: Partial<Request>): Request => partial as Request;

describe('Course Visibility And Access Rules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCourseById', () => {
    it('returns published course to unauthenticated requests', async () => {
      const req = createMockRequest({ params: { id: 'course-1' } as any });
      const res = createMockResponse();
      const course = { id: 'course-1', status: 'published', instructorId: 'consultant-1' } as any;
      mockedCourseService.getCourseById.mockResolvedValue(course);

      await getCourseById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ course });
    });

    it('hides unpublished course from unauthenticated requests', async () => {
      const req = createMockRequest({ params: { id: 'course-2' } as any });
      const res = createMockResponse();
      mockedCourseService.getCourseById.mockResolvedValue({
        id: 'course-2',
        status: 'draft',
        instructorId: 'consultant-1',
      } as any);

      await getCourseById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Course not found' });
    });

    it('allows owner to view unpublished course', async () => {
      const req = createMockRequest({
        params: { id: 'course-3' } as any,
        user: { uid: 'consultant-1', role: 'consultant' } as any,
      });
      const res = createMockResponse();
      const course = { id: 'course-3', status: 'draft', instructorId: 'consultant-1' } as any;
      mockedCourseService.getCourseById.mockResolvedValue(course);

      await getCourseById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ course });
    });
  });

  describe('getCourseBySlug', () => {
    it('hides unpublished slug course from non-owner', async () => {
      const req = createMockRequest({ params: { slug: 'draft-course' } as any });
      const res = createMockResponse();
      mockedCourseService.getCourseBySlug.mockResolvedValue({
        id: 'course-4',
        status: 'pending',
        instructorId: 'consultant-2',
      } as any);

      await getCourseBySlug(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Course not found' });
    });
  });

  describe('searchCourses', () => {
    it('forces status filter to published', async () => {
      const req = createMockRequest({
        query: { category: 'Technology', page: '1', limit: '10' } as any,
      });
      const res = createMockResponse();
      mockedCourseService.searchCourses.mockResolvedValue({
        courses: [],
        total: 0,
        hasMore: false,
      } as any);

      await searchCourses(req, res);

      expect(mockedCourseService.searchCourses).toHaveBeenCalled();
      const callArg = mockedCourseService.searchCourses.mock.calls[0][0] as any;
      expect(callArg.status).toBe('published');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('enrollInCourse', () => {
    it('returns 403 when enrollment is blocked for unpublished course', async () => {
      const req = createMockRequest({
        params: { id: 'course-5' } as any,
        body: {},
        user: { uid: 'student-1' } as any,
      });
      const res = createMockResponse();
      const error = Object.assign(new Error('Only published courses can be enrolled'), {
        statusCode: 403,
      });
      mockedCourseService.enrollInCourse.mockRejectedValue(error);

      await enrollInCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Only published courses can be enrolled' });
    });
  });
});
