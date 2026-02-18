import { Request, Response } from 'express';
import { submitForApproval } from '../controllers/course.controller';
import { courseService } from '../services/course.service';

jest.mock('../services/course.service', () => ({
  courseService: {
    submitForApproval: jest.fn(),
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

describe('Course Submission Validation Error Shape', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 with missingFields details from service validation', async () => {
    const req = {
      params: { id: 'course-1' },
      user: { uid: 'consultant-1' },
    } as any as Request;
    const res = mockRes();

    const err = Object.assign(new Error('Course is not ready for submission'), {
      statusCode: 400,
      details: {
        missingFields: [
          'at least one lesson video is required',
          'at least one learning objective is required',
        ],
      },
    });

    mockedCourseService.submitForApproval.mockRejectedValue(err);

    await submitForApproval(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Course is not ready for submission',
      details: {
        missingFields: [
          'at least one lesson video is required',
          'at least one learning objective is required',
        ],
      },
    });
  });
});
