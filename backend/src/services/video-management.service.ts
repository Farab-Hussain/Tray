// Video Management Service
// Handles video upload, processing, storage, and management for courses

import { 
  CourseVideo, 
  VideoUploadRequest, 
  VideoProcessingJob,
  CourseResource,
  ResourceUpload
} from '../models/enhanced-course.model';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { 
  Storage, 
  GetSignedUrlConfig 
} from '@google-cloud/storage';
import { 
  v2 as cloudinaryV2, 
  UploadApiResponse,
  TransformationOptions
} from 'cloudinary';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

type UploadLikeFile = Buffer | { arrayBuffer: () => Promise<ArrayBuffer>; type?: string };

export class VideoManagementService {
  private storage: Storage;
  private bucketName: string;
  private videosCollection = db.collection('courseVideos');
  private processingJobsCollection = db.collection('videoProcessingJobs');
  private resourcesCollection = db.collection('courseResources');

  constructor() {
    this.storage = new Storage();
    this.bucketName = process.env.GCS_BUCKET_NAME || 'tray-course-videos';
    
    // Initialize Cloudinary for video processing
    cloudinaryV2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Upload and process a new video
   */
  async uploadVideo(request: VideoUploadRequest): Promise<{
    video: CourseVideo;
    processingJob: VideoProcessingJob;
  }> {
    // Create video record
    const video: Partial<CourseVideo> = {
      id: '', // Will be set by Firestore
      courseId: request.courseId,
      title: request.title,
      description: request.description,
      videoUrl: '', // Will be set after processing
      thumbnailUrl: '', // Will be generated
      duration: 0, // Will be extracted from video
      order: request.order,
      isPreview: request.isPreview,
      isPublished: false,
      resources: [], // Will be added separately
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const videoDoc = await this.videosCollection.add(video);
    const videoId = videoDoc.id;

    // Upload original video to cloud storage
    const originalUrl = await this.uploadOriginalVideo(
      request.file, 
      request.courseId, 
      videoId
    );

    // Upload thumbnail if provided
    let thumbnailUrl = '';
    if (request.thumbnail) {
      thumbnailUrl = await this.uploadThumbnail(
        request.thumbnail, 
        request.courseId, 
        videoId
      );
    }

    // Create processing job
    const processingJob: Partial<VideoProcessingJob> = {
      id: '', // Will be set by Firestore
      courseId: request.courseId,
      videoId,
      status: 'uploading',
      progress: 0,
      originalUrl,
      processedUrls: {},
      thumbnailUrl,
      createdAt: new Date(),
    };

    const jobDoc = await this.processingJobsCollection.add(processingJob);
    const jobId = jobDoc.id;

    // Start video processing
    this.processVideo(jobId, videoId, originalUrl, thumbnailUrl)
      .catch(error => {
        console.error(`Video processing failed for job ${jobId}:`, error);
        this.updateProcessingJobStatus(jobId, 'failed', error.message);
      });

    // Update video with job reference
    await this.videosCollection.doc(videoId).update({
      id: videoId,
      processingJobId: jobId,
    });

    return {
      video: { ...video, id: videoId } as CourseVideo,
      processingJob: { ...processingJob, id: jobId } as VideoProcessingJob,
    };
  }

  /**
   * Upload original video file to Google Cloud Storage
   */
  private async uploadOriginalVideo(
    file: UploadLikeFile,
    courseId: string,
    videoId: string
  ): Promise<string> {
    const fileName = `courses/${courseId}/videos/${videoId}/original.mp4`;
    const bucket = this.storage.bucket(this.bucketName);
    const fileRef = bucket.file(fileName);

    if (Buffer.isBuffer(file)) {
      await fileRef.save(file, {
        metadata: {
          contentType: 'video/mp4',
        },
      });
    } else {
      const buffer = await file.arrayBuffer();
      await fileRef.save(Buffer.from(buffer), {
        metadata: {
          contentType: file.type || 'video/mp4',
        },
      });
    }

    // Make file publicly accessible
    await fileRef.makePublic();

    return `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
  }

  /**
   * Upload thumbnail image
   */
  private async uploadThumbnail(
    file: UploadLikeFile,
    courseId: string,
    videoId: string
  ): Promise<string> {
    const fileName = `courses/${courseId}/videos/${videoId}/thumbnail.jpg`;
    const bucket = this.storage.bucket(this.bucketName);
    const fileRef = bucket.file(fileName);

    if (Buffer.isBuffer(file)) {
      await fileRef.save(file, {
        metadata: {
          contentType: 'image/jpeg',
        },
      });
    } else {
      const buffer = await file.arrayBuffer();
      await fileRef.save(Buffer.from(buffer), {
        metadata: {
          contentType: file.type || 'image/jpeg',
        },
      });
    }

    await fileRef.makePublic();

    return `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
  }

  /**
   * Process video using Cloudinary
   */
  private async processVideo(
    jobId: string,
    videoId: string,
    originalUrl: string,
    thumbnailUrl: string
  ): Promise<void> {
    try {
      // Update status to processing
      await this.updateProcessingJobStatus(jobId, 'processing', 10);

      // Upload to Cloudinary for processing
      const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
        cloudinaryV2.uploader.upload(
          originalUrl,
          {
            resource_type: 'video',
            folder: `course-videos/${videoId}`,
            public_id: videoId,
            eager: [
              {
                format: 'mp4',
                transformation: [
                  { quality: 'auto' },
                  { fetch_format: 'mp4' },
                ],
              },
              {
                format: 'hls',
                transformation: [
                  { quality: 'auto' },
                  { streaming_profile: 'full_hd' },
                ],
              },
            ],
            eager_async: true,
            notification_url: `${process.env.API_BASE_URL}/webhooks/video-processing`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!);
          }
        );
      });

      await this.updateProcessingJobStatus(jobId, 'processing', 30);

      // Generate thumbnail if not provided
      let finalThumbnailUrl = thumbnailUrl;
      if (!thumbnailUrl) {
        finalThumbnailUrl = await this.generateVideoThumbnail(uploadResult.secure_url);
        await this.updateProcessingJobStatus(jobId, 'processing', 50);
      }

      // Extract video duration
      const duration = await this.extractVideoDuration(uploadResult.secure_url);
      await this.updateProcessingJobStatus(jobId, 'processing', 70);

      // Update video record with processed data
      await this.videosCollection.doc(videoId).update({
        videoUrl: uploadResult.secure_url,
        thumbnailUrl: finalThumbnailUrl,
        duration,
        isPublished: true,
        updatedAt: new Date(),
      });

      // Update processing job with results
      await this.processingJobsCollection.doc(jobId).update({
        status: 'completed',
        progress: 100,
        processedUrls: {
          mp4: uploadResult.secure_url,
          hls: uploadResult.eager?.[0]?.secure_url || '',
        },
        thumbnailUrl: finalThumbnailUrl,
        completedAt: new Date(),
      });

      // Update course video counts
      await this.updateCourseVideoCounts(uploadResult.public_id.split('/')[0]);

    } catch (error) {
      console.error(`Video processing failed for job ${jobId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      await this.updateProcessingJobStatus(jobId, 'failed', undefined, errorMessage);
      throw error;
    }
  }

  /**
   * Generate video thumbnail using Cloudinary
   */
  private async generateVideoThumbnail(videoUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinaryV2.uploader.upload(
        videoUrl,
        {
          resource_type: 'video',
          format: 'jpg',
          transformation: [
            { width: 640, height: 360, crop: 'fill' },
            { quality: 'auto' },
            { start_offset: '5' }, // Take thumbnail at 5 seconds
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      );
    });
  }

  /**
   * Extract video duration using ffprobe
   */
  private async extractVideoDuration(videoUrl: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoUrl, (err: any, metadata: any) => {
        if (err) {
          reject(err);
        } else {
          const duration = metadata.format.duration || 0;
          resolve(Math.round(duration));
        }
      });
    });
  }

  /**
   * Update processing job status
   */
  async updateProcessingJobStatus(
    jobId: string,
    status: VideoProcessingJob['status'],
    progress?: number,
    error?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (progress !== undefined) {
      updateData.progress = progress;
    }

    if (error) {
      updateData.error = error;
    }

    await this.processingJobsCollection.doc(jobId).update(updateData);
  }

  /**
   * Update course video counts
   */
  private async updateCourseVideoCounts(courseId: string): Promise<void> {
    const videosSnapshot = await this.videosCollection
      .where('courseId', '==', courseId)
      .where('isPublished', '==', true)
      .get();

    const videos = videosSnapshot.docs.map(doc => doc.data() as CourseVideo);
    
    const totalVideos = videos.length;
    const totalDuration = videos.reduce((sum, video) => sum + video.duration, 0);
    const previewVideos = videos.filter(video => video.isPreview).length;

    await db.collection('courses').doc(courseId).update({
      totalVideos,
      totalDuration,
      previewVideos,
      publishedVideos: totalVideos,
      updatedAt: new Date(),
    });
  }

  /**
   * Get videos for a course
   */
  async getCourseVideos(courseId: string): Promise<CourseVideo[]> {
    const snapshot = await this.videosCollection
      .where('courseId', '==', courseId)
      .orderBy('order', 'asc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseVideo));
  }

  /**
   * Update video details
   */
  async updateVideo(
    videoId: string,
    updates: Partial<CourseVideo>
  ): Promise<CourseVideo> {
    await this.videosCollection.doc(videoId).update({
      ...updates,
      updatedAt: new Date(),
    });

    const videoDoc = await this.videosCollection.doc(videoId).get();
    return { id: videoDoc.id, ...videoDoc.data() } as CourseVideo;
  }

  /**
   * Delete video
   */
  async deleteVideo(videoId: string): Promise<void> {
    const videoDoc = await this.videosCollection.doc(videoId).get();
    if (!videoDoc.exists) {
      throw new Error('Video not found');
    }

    const video = videoDoc.data() as CourseVideo;
    const courseId = video.courseId;

    // Delete from Firestore
    await this.videosCollection.doc(videoId).delete();

    // Delete from Cloudinary
    await cloudinaryV2.uploader.destroy(`course-videos/${videoId}`, {
      resource_type: 'video',
    });

    // Delete thumbnail
    await cloudinaryV2.uploader.destroy(`course-videos/${videoId}_thumb`, {
      resource_type: 'image',
    });

    // Update course counts
    await this.updateCourseVideoCounts(courseId);
  }

  /**
   * Upload course resources
   */
  async uploadResources(
    courseId: string,
    videoId: string,
    resources: ResourceUpload[]
  ): Promise<CourseResource[]> {
    const uploadedResources: CourseResource[] = [];

    for (const resource of resources) {
      const resourceData = await this.uploadSingleResource(
        courseId,
        videoId,
        resource
      );
      uploadedResources.push(resourceData);
    }

    // Update video with resources
    await this.videosCollection.doc(videoId).update({
      resources: uploadedResources,
      updatedAt: new Date(),
    });

    return uploadedResources;
  }

  /**
   * Upload a single resource
   */
  private async uploadSingleResource(
    courseId: string,
    videoId: string,
    resource: ResourceUpload
  ): Promise<CourseResource> {
    const resourceId = crypto.randomUUID();
    const fileName = `courses/${courseId}/videos/${videoId}/resources/${resourceId}`;
    
    // Upload to Cloud Storage
    const bucket = this.storage.bucket(this.bucketName);
    const fileRef = bucket.file(fileName);

    let fileUrl = '';
    let fileSize = 0;

    if (Buffer.isBuffer(resource.file)) {
      await fileRef.save(resource.file, {
        metadata: {
          contentType: this.getContentType(resource.type),
        },
      });
      fileSize = resource.file.length;
    } else {
      const buffer = await resource.file.arrayBuffer();
      await fileRef.save(Buffer.from(buffer), {
        metadata: {
          contentType: resource.file.type || this.getContentType(resource.type),
        },
      });
      fileSize = buffer.byteLength;
    }

    await fileRef.makePublic();
    fileUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;

    const resourceData: CourseResource = {
      id: resourceId,
      title: resource.title,
      type: resource.type,
      url: resource.type === 'link' ? resource.file.toString() : fileUrl,
      fileUrl: resource.type !== 'link' ? fileUrl : undefined,
      fileSize: resource.type !== 'link' ? fileSize : undefined,
      order: 0, // Will be set by caller
      isRequired: resource.isRequired,
      description: resource.description,
    };

    // Save to Firestore
    await this.resourcesCollection.add(resourceData);

    return resourceData;
  }

  /**
   * Get content type for resource type
   */
  private getContentType(type: CourseResource['type']): string {
    const typeMap: Record<CourseResource['type'], string> = {
      pdf: 'application/pdf',
      link: 'text/html',
      document: 'application/msword',
      presentation: 'application/vnd.ms-powerpoint',
      code: 'text/plain',
      download: 'application/octet-stream',
    };
    return typeMap[type] || 'application/octet-stream';
  }

  /**
   * Get processing job status
   */
  async getProcessingJob(jobId: string): Promise<VideoProcessingJob | null> {
    const doc = await this.processingJobsCollection.doc(jobId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as VideoProcessingJob : null;
  }

  /**
   * Get processing jobs for a course
   */
  async getCourseProcessingJobs(courseId: string): Promise<VideoProcessingJob[]> {
    const snapshot = await this.processingJobsCollection
      .where('courseId', '==', courseId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoProcessingJob));
  }

  /**
   * Reorder videos in a course
   */
  async reorderVideos(courseId: string, videoOrders: { videoId: string; order: number }[]): Promise<void> {
    const batch = db.batch();

    for (const { videoId, order } of videoOrders) {
      const videoRef = this.videosCollection.doc(videoId);
      batch.update(videoRef, { order, updatedAt: new Date() });
    }

    await batch.commit();
  }

  /**
   * Generate signed URL for video upload (for direct client uploads)
   */
  async generateUploadUrl(
    courseId: string,
    videoId: string,
    fileName: string,
    contentType: string
  ): Promise<{ url: string; fields: any }> {
    const filePath = `courses/${courseId}/videos/${videoId}/${fileName}`;
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);

    const options: GetSignedUrlConfig = {
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
    };

    const [url] = await file.getSignedUrl(options);

    return {
      url,
      fields: {}, // For GCS signed URLs, fields are not needed
    };
  }
}

export const videoManagementService = new VideoManagementService();
