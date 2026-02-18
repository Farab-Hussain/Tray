import { Router } from 'express';
import { courseService } from '../services/course.service';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route POST /api/courses
 * @desc Create a new course
 * @access Private (Instructors only)
 */
router.post('/', async (req, res) => {
  try {
    console.log('🎯 [POST /courses] - Request received at', new Date().toISOString());
    console.log('📦 [POST /courses] - Body:', JSON.stringify(req.body, null, 2));
    
    const courseData = req.body;
    const instructorId = req.user?.id;
    
    console.log('👤 [POST /courses] - Instructor ID:', instructorId);
    
    if (!instructorId) {
      console.log('❌ [POST /courses] - No instructor ID found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🔧 [POST /courses] - Calling courseService.createCourse...');
    const course = await courseService.createCourse(courseData, instructorId);
    
    console.log('✅ [POST /courses] - Course created successfully:', course.id);
    console.log('⏰ [POST /courses] - Response sent at:', new Date().toISOString());
    
    res.status(201).json(course);
  } catch (error) {
    console.error('❌ [POST /courses] - Error creating course:', error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('❌ [POST /courses] - Error stack:', errorStack);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

/**
 * @route GET /api/courses
 * @desc Search and filter courses
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      query: req.query.search as string,
      category: req.query.category as string,
      level: req.query.level as string,
      status: req.query.status as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
    };

    const result = await courseService.searchCourses(filters);
    res.json(result);
  } catch (error) {
    console.error('Error searching courses:', error);
    res.status(500).json({ error: 'Failed to search courses' });
  }
});

/**
 * @route GET /api/courses/:id
 * @desc Get course by ID
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error('Error getting course:', error);
    res.status(500).json({ error: 'Failed to get course' });
  }
});

/**
 * @route PUT /api/courses/:id
 * @desc Update course
 * @access Private (Course owner only)
 */
router.put('/:id', async (req, res) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.instructorId !== req.user?.id) {
      return res.status(403).json({ error: 'Not authorized to update this course' });
    }

    const updatedCourse = await courseService.updateCourse(req.params.id, req.body);
    res.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

/**
 * @route DELETE /api/courses/:id
 * @desc Delete course
 * @access Private (Course owner only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.instructorId !== req.user?.id) {
      return res.status(403).json({ error: 'Not authorized to delete this course' });
    }

    await courseService.deleteCourse(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

/**
 * @route GET /api/courses/instructor/:instructorId
 * @desc Get instructor's courses
 * @access Public
 */
router.get('/instructor/:instructorId', async (req, res) => {
  try {
    const courses = await courseService.getInstructorCourses(req.params.instructorId);
    res.json(courses);
  } catch (error) {
    console.error('Error getting instructor courses:', error);
    res.status(500).json({ error: 'Failed to get instructor courses' });
  }
});

/**
 * @route GET /api/courses/instructor/:instructorId/stats
 * @desc Get instructor statistics
 * @access Private (Instructor only)
 */
router.get('/instructor/:instructorId/stats', async (req, res) => {
  try {
    if (req.params.instructorId !== req.user?.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const stats = await courseService.getInstructorStats(req.params.instructorId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting instructor stats:', error);
    res.status(500).json({ error: 'Failed to get instructor stats' });
  }
});

/**
 * @route POST /api/courses/:id/enroll
 * @desc Enroll in a course
 * @access Private (Students only)
 */
router.post('/:id/enroll', async (req, res) => {
  try {
    const studentId = req.user?.id;
    
    if (!studentId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await courseService.enrollInCourse(req.params.id, studentId);
    res.json({ message: 'Successfully enrolled in course' });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
});

/**
 * @route GET /api/courses/student/:studentId/enrollments
 * @desc Get student's course enrollments
 * @access Private (Student only)
 */
router.get('/student/:studentId/enrollments', async (req, res) => {
  try {
    if (req.params.studentId !== req.user?.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const enrollments = await courseService.getStudentEnrollments(req.params.studentId);
    res.json(enrollments);
  } catch (error) {
    console.error('Error getting student enrollments:', error);
    res.status(500).json({ error: 'Failed to get student enrollments' });
  }
});

export default router;
