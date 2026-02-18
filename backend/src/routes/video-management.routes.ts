// Video Management Routes
// REST API endpoints for video upload and management

import { Router } from 'express';
import { videoManagementController } from '../controllers/video-management.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { validateInstructor } from '../middleware/role.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route POST /api/videos/courses/:courseId/upload
 * @desc Upload a new video to a course
 * @access Private (Instructor only)
 */
router.post(
  '/courses/:courseId/upload',
  validateInstructor,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  videoManagementController.uploadVideo
);

/**
 * @route GET /api/videos/courses/:courseId
 * @desc Get all videos for a course
 * @access Private
 */
router.get(
  '/courses/:courseId',
  videoManagementController.getCourseVideos
);

/**
 * @route PUT /api/videos/:videoId
 * @desc Update video details
 * @access Private (Instructor only)
 */
router.put(
  '/:videoId',
  validateInstructor,
  videoManagementController.updateVideo
);

/**
 * @route DELETE /api/videos/:videoId
 * @desc Delete a video
 * @access Private (Instructor only)
 */
router.delete(
  '/:videoId',
  validateInstructor,
  videoManagementController.deleteVideo
);

/**
 * @route POST /api/videos/:videoId/resources
 * @desc Upload resources for a video
 * @access Private (Instructor only)
 */
router.post(
  '/:videoId/resources',
  validateInstructor,
  upload.array('resources', 10),
  videoManagementController.uploadResources
);

/**
 * @route GET /api/videos/processing/:jobId
 * @desc Get processing job status
 * @access Private
 */
router.get(
  '/processing/:jobId',
  videoManagementController.getProcessingJob
);

/**
 * @route GET /api/videos/processing/courses/:courseId
 * @desc Get processing jobs for a course
 * @access Private (Instructor only)
 */
router.get(
  '/processing/courses/:courseId',
  validateInstructor,
  videoManagementController.getCourseProcessingJobs
);

/**
 * @route PUT /api/videos/courses/:courseId/reorder
 * @desc Reorder videos in a course
 * @access Private (Instructor only)
 */
router.put(
  '/courses/:courseId/reorder',
  validateInstructor,
  videoManagementController.reorderVideos
);

/**
 * @route POST /api/videos/courses/:courseId/:videoId/upload-url
 * @desc Generate signed URL for direct upload
 * @access Private (Instructor only)
 */
router.post(
  '/courses/:courseId/:videoId/upload-url',
  validateInstructor,
  videoManagementController.generateUploadUrl
);

/**
 * @route POST /api/videos/webhook/processing
 * @desc Webhook for video processing notifications
 * @access Public (Cloudinary webhook)
 */
router.post(
  '/webhook/processing',
  videoManagementController.videoProcessingWebhook
);

export default router;
