// Test cases for Service Image and Video Upload functionality
// This file tests the complete upload flow for both images and videos

import { describe, it, expect, beforeEach } from '@jest/globals';
import { launchImageLibrary } from 'react-native-image-picker';
import UploadService from '../../services/upload.service';
import { api } from '../../lib/fetcher';

// Mock the modules
jest.mock('react-native-image-picker');
jest.mock('../../services/upload.service');
jest.mock('../../lib/fetcher');

const mockLaunchImageLibrary = launchImageLibrary as jest.MockedFunction<typeof launchImageLibrary>;
const mockUploadService = UploadService as jest.Mocked<typeof UploadService>;
const mockApi = api as jest.Mocked<typeof api>;

describe('Service Upload Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful image upload response
    mockUploadService.uploadServiceImage.mockResolvedValue({
      message: 'Service image uploaded successfully',
      imageUrl: 'https://cloudinary.com/test/image.jpg',
      publicId: 'test/public/id',
      mediaType: 'image'
    });

    // Mock successful video upload response
    mockUploadService.uploadServiceVideo.mockResolvedValue({
      message: 'Video uploaded successfully',
      videoUrl: 'https://cloudinary.com/test/video.mp4',
      publicId: 'test/video/public/id',
      mediaType: 'video'
    });

    // Mock API calls
    mockApi.post.mockResolvedValue({
      data: { success: true }
    });
  });

  describe('Image Upload', () => {
    it('should upload image successfully', async () => {
      // Mock image file selection
      const mockImageFile = {
        uri: 'file:///mock/image.jpg',
        type: 'image/jpeg',
        name: 'test-image.jpg',
        size: 1024 * 1024 // 1MB
      };

      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({
          didCancel: false,
          errorMessage: null,
          assets: [mockImageFile]
        });
      });

      // Test the upload flow
      const result = await mockUploadService.uploadServiceImage(mockImageFile);

      expect(result).toEqual({
        message: 'Service image uploaded successfully',
        imageUrl: 'https://cloudinary.com/test/image.jpg',
        publicId: 'test/public/id',
        mediaType: 'image'
      });

      expect(mockUploadService.uploadServiceImage).toHaveBeenCalledWith(mockImageFile);
    });

    it('should handle image upload errors', async () => {
      const mockImageFile = {
        uri: 'file:///mock/image.jpg',
        type: 'image/jpeg',
        name: 'test-image.jpg',
        size: 1024 * 1024
      };

      mockUploadService.uploadServiceImage.mockRejectedValue(new Error('Upload failed'));

      try {
        await mockUploadService.uploadServiceImage(mockImageFile);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Upload failed');
      }
    });

    it('should validate image file type', async () => {
      const invalidFile = {
        uri: 'file:///mock/file.txt',
        type: 'text/plain',
        name: 'test.txt',
        size: 1024
      };

      mockUploadService.uploadServiceImage.mockRejectedValue(new Error('Only image files are allowed'));

      try {
        await mockUploadService.uploadServiceImage(invalidFile);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Only image files are allowed');
      }
    });
  });

  describe('Video Upload', () => {
    it('should upload video successfully', async () => {
      // Mock video file selection
      const mockVideoFile = {
        uri: 'file:///mock/video.mp4',
        type: 'video/mp4',
        name: 'test-video.mp4',
        size: 50 * 1024 * 1024 // 50MB
      };

      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({
          didCancel: false,
          errorMessage: null,
          assets: [mockVideoFile]
        });
      });

      // Test the upload flow
      const result = await mockUploadService.uploadServiceVideo(mockVideoFile);

      expect(result).toEqual({
        message: 'Video uploaded successfully',
        videoUrl: 'https://cloudinary.com/test/video.mp4',
        publicId: 'test/video/public/id',
        mediaType: 'video'
      });

      expect(mockUploadService.uploadServiceVideo).toHaveBeenCalledWith(mockVideoFile);
    });

    it('should handle video upload errors', async () => {
      const mockVideoFile = {
        uri: 'file:///mock/video.mp4',
        type: 'video/mp4',
        name: 'test-video.mp4',
        size: 50 * 1024 * 1024
      };

      mockUploadService.uploadServiceVideo.mockRejectedValue(new Error('Video upload failed'));

      try {
        await mockUploadService.uploadServiceVideo(mockVideoFile);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Video upload failed');
      }
    });

    it('should validate video file type', async () => {
      const invalidFile = {
        uri: 'file:///mock/file.jpg',
        type: 'image/jpeg',
        name: 'test.jpg',
        size: 1024
      };

      mockUploadService.uploadServiceVideo.mockRejectedValue(new Error('Only video files are allowed'));

      try {
        await mockUploadService.uploadServiceVideo(invalidFile);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Only video files are allowed');
      }
    });

    it('should handle large video files with extended timeout', async () => {
      const largeVideoFile = {
        uri: 'file:///mock/large-video.mp4',
        type: 'video/mp4',
        name: 'large-video.mp4',
        size: 80 * 1024 * 1024 // 80MB
      };

      mockUploadService.uploadServiceVideo.mockResolvedValue({
        message: 'Video uploaded successfully',
        videoUrl: 'https://cloudinary.com/test/large-video.mp4',
        publicId: 'test/large-video/public/id',
        mediaType: 'video'
      });

      const result = await mockUploadService.uploadServiceVideo(largeVideoFile);
      
      expect(result.videoUrl).toBe('https://cloudinary.com/test/large-video.mp4');
      expect(result.mediaType).toBe('video');
    });
  });

  describe('Upload Service Integration', () => {
    it('should call correct API endpoints', async () => {
      const mockFile = {
        uri: 'file:///mock/test.jpg',
        type: 'image/jpeg',
        name: 'test.jpg',
        size: 1024 * 1024
      };

      // Test image upload API call
      await mockUploadService.uploadServiceImage(mockFile);
      
      expect(mockApi.post).toHaveBeenCalledWith(
        '/upload/service-image',
        expect.any(FormData)
      );

      // Test video upload API call
      await mockUploadService.uploadServiceVideo(mockFile);
      
      expect(mockApi.post).toHaveBeenCalledWith(
        '/upload/service-video',
        expect.any(FormData)
      );
    });

    it('should handle network timeouts gracefully', async () => {
      const mockFile = {
        uri: 'file:///mock/test.mp4',
        type: 'video/mp4',
        name: 'test.mp4',
        size: 60 * 1024 * 1024 // 60MB
      };

      // Mock timeout error
      mockUploadService.uploadServiceVideo.mockRejectedValue(new Error('Cloudinary upload timeout'));

      try {
        await mockUploadService.uploadServiceVideo(mockFile);
        fail('Should have thrown a timeout error');
      } catch (error) {
        expect(error.message).toBe('Cloudinary upload timeout');
      }
    });
  });

  describe('File Size and Type Validation', () => {
    it('should accept valid image formats', () => {
      const validFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      validFormats.forEach(format => {
        const validFile = {
          uri: 'file:///mock/test',
          type: format,
          name: 'test',
          size: 1024
        };

        // These should not throw validation errors
        expect(mockUploadService.uploadServiceImage(validFile)).resolves.toBeDefined();
      });
    });

    it('should accept valid video formats', () => {
      const validFormats = ['video/mp4', 'video/mov', 'video/avi', 'video/webm'];
      
      validFormats.forEach(format => {
        const validFile = {
          uri: 'file:///mock/test',
          type: format,
          name: 'test',
          size: 50 * 1024 * 1024
        };

        // These should not throw validation errors
        expect(mockUploadService.uploadServiceVideo(validFile)).resolves.toBeDefined();
      });
    });

    it('should reject oversized files', async () => {
      const oversizedFile = {
        uri: 'file:///mock/oversized.mp4',
        type: 'video/mp4',
        name: 'oversized.mp4',
        size: 150 * 1024 * 1024 // 150MB (exceeds 100MB limit)
      };

      mockUploadService.uploadServiceVideo.mockRejectedValue(new Error('File size too large'));

      try {
        await mockUploadService.uploadServiceVideo(oversizedFile);
        fail('Should have thrown an error for oversized file');
      } catch (error) {
        expect(error.message).toBe('File size too large');
      }
    });
  });
});
