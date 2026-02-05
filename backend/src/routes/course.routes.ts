// src/routes/course.routes.ts
import { Router } from 'express';
import { courseService } from '../services/course.service';
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
router.get('/verify/:verificationCode', verifyCertificate); // Public certificate verification

// Student routes (require authentication)
router.post('/:id/enroll', authenticateUser, enrollInCourse);
router.get('/enrollments/my', authenticateUser, getMyEnrollments);
router.post('/:id/reviews', authenticateUser, addCourseReview);
router.put('/progress/:enrollmentId/:lessonId', authenticateUser, updateLessonProgress);

// NEW: Enhanced student routes
router.post('/purchase', authenticateUser, authorizeRole(['student']), purchaseCourse);
router.get('/purchases/my', authenticateUser, authorizeRole(['student']), getStudentPurchases);
router.get('/:id/access', authenticateUser, authorizeRole(['student']), checkCourseAccess);
router.post('/issue-certificate', authenticateUser, authorizeRole(['student']), issueCertificate);
router.get('/certificates/my', authenticateUser, authorizeRole(['student']), getStudentCertificates);

// Consultant routes (require consultant role)
router.post('/', authenticateUser, authorizeRole(['consultant']), createCourse);
// Temporary test route without authentication
router.post('/test', async (req, res) => {
  try {
    const courseData = req.body;
    const course = await courseService.createCourse(courseData, 'test-user-id');
    res.status(201).json({ message: "Course created successfully", course });
  } catch (error: any) {
    console.error('Test create course error:', error);
    res.status(500).json({ error: error.message });
  }
});
router.get('/instructor/my', authenticateUser, authorizeRole(['consultant']), getMyCourses);
router.put('/:id', authenticateUser, authorizeRole(['consultant']), updateCourse);
router.delete('/:id', authenticateUser, authorizeRole(['consultant']), deleteCourse);
router.post('/:id/submit-for-approval', authenticateUser, authorizeRole(['consultant']), submitForApproval);
router.get('/:id/enrollments', authenticateUser, authorizeRole(['consultant']), getCourseEnrollments);
router.get('/instructor/stats', authenticateUser, authorizeRole(['consultant']), getInstructorStats);

// NEW: Enhanced consultant routes
router.post('/:id/launch', authenticateUser, authorizeRole(['consultant']), launchCourse);

// Admin routes (require admin role)
router.get('/admin/pending', authenticateUser, authorizeRole(['admin']), getPendingCourses);
router.post('/:id/approve', authenticateUser, authorizeRole(['admin']), approveCourse);
router.post('/:id/reject', authenticateUser, authorizeRole(['admin']), rejectCourse);

export default router;
