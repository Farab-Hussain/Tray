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
  // NEW: Enhanced course purchase and management endpoints
  purchaseCourse,
  getStudentPurchases,
  checkCourseAccess,
  launchCourse,
  issueCertificate,
  getStudentCertificates,
  verifyCertificate,
} from '../controllers/course.controller';
import { authenticateUser, authenticateUserOptional, authorizeRole } from '../middleware/authMiddleware';

const router = Router();
const optionalAuthMiddleware =
  typeof authenticateUserOptional === 'function'
    ? authenticateUserOptional()
    : (_req: any, _res: any, next: any) => next();

// Public routes
router.get('/search', searchCourses);
router.get('/public', searchCourses);
router.get('/featured', getFeaturedCourses);
router.get('/trending', getTrendingCourses);
router.get('/bestseller', getBestsellerCourses);
router.get('/slug/:slug', optionalAuthMiddleware, getCourseBySlug);
router.get('/verify/:verificationCode', verifyCertificate); // Public certificate verification
router.get('/:id/reviews', getCourseReviews);

// Student routes (require authentication)
router.post('/:id/enroll', authenticateUser(), enrollInCourse);
router.get('/enrollments/my', authenticateUser(), getMyEnrollments);
router.post('/:id/reviews', authenticateUser(), addCourseReview);
router.put('/progress/:enrollmentId/:lessonId', authenticateUser(), updateLessonProgress);

// NEW: Enhanced student routes
router.post('/purchase', authenticateUser(), authorizeRole(['student']), purchaseCourse);
router.get('/purchases/my', authenticateUser(), authorizeRole(['student']), getStudentPurchases);
router.get('/:id/access', authenticateUser(), authorizeRole(['student']), checkCourseAccess);
router.post('/issue-certificate', authenticateUser(), authorizeRole(['student']), issueCertificate);
router.get('/certificates/my', authenticateUser(), authorizeRole(['student']), getStudentCertificates);

// Consultant routes (require consultant role)
router.post('/', authenticateUser(), authorizeRole(['consultant']), createCourse);
router.get('/instructor/my', authenticateUser(), authorizeRole(['consultant']), getMyCourses);
router.get('/instructor/stats', authenticateUser(), authorizeRole(['consultant']), getInstructorStats);
router.put('/:id', authenticateUser(), authorizeRole(['consultant']), updateCourse);
router.delete('/:id', authenticateUser(), authorizeRole(['consultant']), deleteCourse);
router.post('/:id/submit-for-approval', authenticateUser(), authorizeRole(['consultant']), submitForApproval);
router.get('/:id/enrollments', authenticateUser(), authorizeRole(['consultant']), getCourseEnrollments);

// NEW: Enhanced consultant routes
router.post('/:id/launch', authenticateUser(), authorizeRole(['consultant']), launchCourse);

// Admin routes (require admin role)
router.get('/admin/pending', authenticateUser(), authorizeRole(['admin']), getPendingCourses);
router.post('/:id/approve', authenticateUser(), authorizeRole(['admin']), approveCourse);
router.post('/:id/reject', authenticateUser(), authorizeRole(['admin']), rejectCourse);

// Keep generic parameterized route last to avoid shadowing specific paths like /instructor/my.
router.get('/:id', optionalAuthMiddleware, getCourseById);

export default router;
