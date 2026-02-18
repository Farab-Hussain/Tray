// Video Management Controller
// REST API endpoints for video upload and management

import { Request, Response } from 'express';
import { videoManagementService } from '../services/video-management.service';
import { 
  VideoUploadRequest, 
  ResourceUpload,
  CourseVideo 
} from '../models/enhanced-course.model';

export class VideoManagementController {
  /**
   * Upload a new video
   */
  async uploadVideo(req: Request, res: Response): Promise<void> {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const { courseId } = req.params;
      const {
        title,
        description,
        isPreview = false,
        order = 0,
      } = req.body;

      if (!files || !files.video?.[0]) {
        res.status(400).json({ error: 'Video file is required' });
        return;
      }

      const videoFile = files.video[0];
      const thumbnailFile = files.thumbnail?.[0];

      const uploadRequest: VideoUploadRequest = {
        courseId,
        title,
        description,
        file: videoFile.buffer,
        thumbnail: thumbnailFile?.buffer,
        isPreview: Boolean(isPreview),
        order: Number(order),
      };

      const result = await videoManagementService.uploadVideo(uploadRequest);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Video upload started successfully',
      });
    } catch (error) {
      console.error('Video upload error:', error);
      res.status(500).json({ 
        error: 'Failed to upload video',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get videos for a course
   */
  async getCourseVideos(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const videos = await videoManagementService.getCourseVideos(courseId);

      res.json({
        success: true,
        data: videos,
      });
    } catch (error) {
      console.error('Get videos error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch videos',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update video details
   */
  async updateVideo(req: Request, res: Response): Promise<void> {
    try {
      const { videoId } = req.params;
      const updates = req.body;

      const updatedVideo = await videoManagementService.updateVideo(videoId, updates);

      res.json({
        success: true,
        data: updatedVideo,
        message: 'Video updated successfully',
      });
    } catch (error) {
      console.error('Update video error:', error);
      res.status(500).json({ 
        error: 'Failed to update video',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete a video
   */
  async deleteVideo(req: Request, res: Response): Promise<void> {
    try {
      const { videoId } = req.params;
      await videoManagementService.deleteVideo(videoId);

      res.json({
        success: true,
        message: 'Video deleted successfully',
      });
    } catch (error) {
      console.error('Delete video error:', error);
      res.status(500).json({ 
        error: 'Failed to delete video',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Upload resources for a video
   */
  async uploadResources(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, videoId } = req.params;
      const resources = req.body.resources || [];

      if (!Array.isArray(resources)) {
        res.status(400).json({ error: 'Resources must be an array' });
        return;
      }

      const uploadedResources = await videoManagementService.uploadResources(
        courseId,
        videoId,
        resources
      );

      res.status(201).json({
        success: true,
        data: uploadedResources,
        message: 'Resources uploaded successfully',
      });
    } catch (error) {
      console.error('Upload resources error:', error);
      res.status(500).json({ 
        error: 'Failed to upload resources',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get processing job status
   */
  async getProcessingJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const job = await videoManagementService.getProcessingJob(jobId);

      if (!job) {
        res.status(404).json({ error: 'Processing job not found' });
        return;
      }

      res.json({
        success: true,
        data: job,
      });
    } catch (error) {
      console.error('Get processing job error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch processing job',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get processing jobs for a course
   */
  async getCourseProcessingJobs(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const jobs = await videoManagementService.getCourseProcessingJobs(courseId);

      res.json({
        success: true,
        data: jobs,
      });
    } catch (error) {
      console.error('Get processing jobs error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch processing jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Reorder videos in a course
   */
  async reorderVideos(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { videoOrders } = req.body;

      if (!Array.isArray(videoOrders)) {
        res.status(400).json({ error: 'videoOrders must be an array' });
        return;
      }

      await videoManagementService.reorderVideos(courseId, videoOrders);

      res.json({
        success: true,
        message: 'Videos reordered successfully',
      });
    } catch (error) {
      console.error('Reorder videos error:', error);
      res.status(500).json({ 
        error: 'Failed to reorder videos',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate signed URL for direct upload
   */
  async generateUploadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, videoId } = req.params;
      const { fileName, contentType } = req.body;

      if (!fileName || !contentType) {
        res.status(400).json({ error: 'fileName and contentType are required' });
        return;
      }

      const uploadUrl = await videoManagementService.generateUploadUrl(
        courseId,
        videoId,
        fileName,
        contentType
      );

      res.json({
        success: true,
        data: uploadUrl,
      });
    } catch (error) {
      console.error('Generate upload URL error:', error);
      res.status(500).json({ 
        error: 'Failed to generate upload URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Webhook for video processing notifications
   */
  async videoProcessingWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { public_id, resource_type, eager, error } = req.body;

      if (error) {
        console.error('Cloudinary processing error:', error);
        res.status(400).json({ error: 'Processing failed' });
        return;
      }

      if (resource_type === 'video') {
        // Extract video ID from public_id
        const videoId = public_id.split('/').pop();
        
        if (videoId) {
          // Update processing job status
          const jobs = await videoManagementService.getCourseProcessingJobs('');
          const job = jobs.find(j => j.videoId === videoId);
          
          if (job) {
            await videoManagementService.updateProcessingJobStatus(
              job.id,
              'completed',
              100
            );
          }
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
}

export const videoManagementController = new VideoManagementController();
