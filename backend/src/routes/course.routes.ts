// src/routes/course.routes.ts
import { Router } from 'express';
import {
  createCourse,
  getCourseById,
  getCourseBySlug,
  updateCourse,
  deleteCourse,
  searchCourses,
  getMyCourses,
  submitForApproval,
  approveCourse,
  rejectCourse,
  getPendingCourses,
  enrollInCourse,
  getMyEnrollments,
  getCourseEnrollments,
  updateLessonProgress,
  addCourseReview,
  getCourseReviews,
  getFeaturedCourses,
  getTrendingCourses,
  getBestsellerCourses,
  getInstructorStats,
} from '../controllers/course.controller';
import { authenticateUser, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/search', searchCourses);
router.get('/featured', getFeaturedCourses);
router.get('/trending', getTrendingCourses);
router.get('/bestseller', getBestsellerCourses);
router.get('/slug/:slug', getCourseBySlug);
router.get('/:id', getCourseById);
router.get('/:id/reviews', getCourseReviews);

// Student routes (require authentication)
router.post('/:id/enroll', authenticateUser, enrollInCourse);
router.get('/enrollments/my', authenticateUser, getMyEnrollments);
router.post('/:id/reviews', authenticateUser, addCourseReview);
router.put('/progress/:enrollmentId/:lessonId', authenticateUser, updateLessonProgress);

// Consultant routes (require consultant role)
router.post('/', authenticateUser, authorizeRole(['consultant']), createCourse);
router.get('/instructor/my', authenticateUser, authorizeRole(['consultant']), getMyCourses);
router.put('/:id', authenticateUser, authorizeRole(['consultant']), updateCourse);
router.delete('/:id', authenticateUser, authorizeRole(['consultant']), deleteCourse);
router.post('/:id/submit-for-approval', authenticateUser, authorizeRole(['consultant']), submitForApproval);
router.get('/:id/enrollments', authenticateUser, authorizeRole(['consultant']), getCourseEnrollments);
router.get('/instructor/stats', authenticateUser, authorizeRole(['consultant']), getInstructorStats);

// Admin routes (require admin role)
router.get('/admin/pending', authenticateUser, authorizeRole(['admin']), getPendingCourses);
router.post('/:id/approve', authenticateUser, authorizeRole(['admin']), approveCourse);
router.post('/:id/reject', authenticateUser, authorizeRole(['admin']), rejectCourse);

export default router;
