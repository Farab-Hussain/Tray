import { Request, Response } from 'express';
import {
  createCourse,
  updateCourse,
  deleteCourse,
  submitForApproval,
  approveCourse,
  rejectCourse,
} from '../controllers/course.controller';
import { courseService } from '../services/course.service';

jest.mock('../services/course.service', () => ({
  courseService: {
    createCourse: jest.fn(),
    updateCourse: jest.fn(),
    deleteCourse: jest.fn(),
    submitForApproval: jest.fn(),
    approveCourse: jest.fn(),
    rejectCourse: jest.fn(),
  },
}));

const mockedCourseService = courseService as jest.Mocked<typeof courseService>;

type MockRes = Response & {
  status: jest.Mock;
  json: jest.Mock;
};

const mockRes = (): MockRes => {
  const res = {} as MockRes;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Course Lifecycle Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates course for consultant user', async () => {
    const req = {
      body: { title: 'Course' },
      user: { uid: 'consultant-1', role: 'consultant' },
      userRole: 'consultant',
    } as any as Request;
    const res = mockRes();
    mockedCourseService.createCourse.mockResolvedValue({ id: 'c1', status: 'draft' } as any);

    await createCourse(req, res);

    expect(mockedCourseService.createCourse).toHaveBeenCalledWith(req.body, 'consultant-1');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updates course with consultant ownership context', async () => {
    const req = {
      params: { id: 'c1' },
      body: { title: 'Updated' },
      user: { uid: 'consultant-1' },
    } as any as Request;
    const res = mockRes();
    mockedCourseService.updateCourse.mockResolvedValue({ id: 'c1', title: 'Updated' } as any);

    await updateCourse(req, res);

    expect(mockedCourseService.updateCourse).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deletes course with consultant ownership context', async () => {
    const req = {
      params: { id: 'c1' },
      user: { uid: 'consultant-1' },
    } as any as Request;
    const res = mockRes();
    mockedCourseService.deleteCourse.mockResolvedValue(undefined as any);

    await deleteCourse(req, res);

    expect(mockedCourseService.deleteCourse).toHaveBeenCalledWith('c1', 'consultant-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('submits course for approval', async () => {
    const req = {
      params: { id: 'c1' },
      user: { uid: 'consultant-1' },
    } as any as Request;
    const res = mockRes();
    mockedCourseService.submitForApproval.mockResolvedValue({ id: 'c1', status: 'pending' } as any);

    await submitForApproval(req, res);

    expect(mockedCourseService.submitForApproval).toHaveBeenCalledWith('c1', 'consultant-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('approves pending course', async () => {
    const req = {
      params: { id: 'c1' },
      user: { uid: 'admin-1' },
    } as any as Request;
    const res = mockRes();
    mockedCourseService.approveCourse.mockResolvedValue({ id: 'c1', status: 'published' } as any);

    await approveCourse(req, res);

    expect(mockedCourseService.approveCourse).toHaveBeenCalledWith('c1', 'admin-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects pending course with reason', async () => {
    const req = {
      params: { id: 'c1' },
      body: { reason: 'Needs better objectives' },
      user: { uid: 'admin-1' },
    } as any as Request;
    const res = mockRes();
    mockedCourseService.rejectCourse.mockResolvedValue({ id: 'c1', status: 'draft' } as any);

    await rejectCourse(req, res);

    expect(mockedCourseService.rejectCourse).toHaveBeenCalledWith(
      'c1',
      'admin-1',
      'Needs better objectives',
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
