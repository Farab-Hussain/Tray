// Integration Test for Service Upload Functionality
// Tests the actual upload service methods

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the fetcher API
jest.mock('../../lib/fetcher', () => ({
  api: {
    post: jest.fn(),
    defaults: {
      baseURL: 'https://test-api.com'
    }
  }
}));

import UploadService from '../../services/upload.service';

describe('Service Upload Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UploadService Methods', () => {
    it('should have uploadServiceImage method', () => {
      expect(typeof UploadService.uploadServiceImage).toBe('function');
    });

    it('should have uploadServiceVideo method', () => {
      expect(typeof UploadService.uploadServiceVideo).toBe('function');
    });

    it('should upload service image to correct endpoint', async () => {
      const mockFile = {
        uri: 'file:///test/image.jpg',
        type: 'image/jpeg',
        name: 'test.jpg',
        size: 1024 * 1024
      };

      const mockResponse = {
        message: 'Service image uploaded successfully',
        imageUrl: 'https://cloudinary.com/test/image.jpg',
        publicId: 'test/public/id',
        mediaType: 'image'
      };

      const { api } = require('../../lib/fetcher');
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await UploadService.uploadServiceImage(mockFile);

      expect(api.post).toHaveBeenCalledWith(
        '/upload/service-image',
        expect.any(FormData)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should upload service video to correct endpoint', async () => {
      const mockFile = {
        uri: 'file:///test/video.mp4',
        type: 'video/mp4',
        name: 'test.mp4',
        size: 50 * 1024 * 1024
      };

      const mockResponse = {
        message: 'Video uploaded successfully',
        videoUrl: 'https://cloudinary.com/test/video.mp4',
        publicId: 'test/video/public/id',
        mediaType: 'video'
      };

      const { api } = require('../../lib/fetcher');
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await UploadService.uploadServiceVideo(mockFile);

      expect(api.post).toHaveBeenCalledWith(
        '/upload/service-video',
        expect.any(FormData)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle upload errors gracefully', async () => {
      const mockFile = {
        uri: 'file:///test/image.jpg',
        type: 'image/jpeg',
        name: 'test.jpg',
        size: 1024 * 1024
      };

      const { api } = require('../../lib/fetcher');
      api.post.mockRejectedValue(new Error('Network error'));

      try {
        await UploadService.uploadServiceImage(mockFile);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('File Validation', () => {
    it('should validate image file types', () => {
      const validImageFile = {
        uri: 'file:///test/image.jpg',
        type: 'image/jpeg',
        name: 'test.jpg',
        size: 1024 * 1024
      };

      expect(UploadService.validateImageFile(validImageFile)).toEqual({
        isValid: true
      });
    });

    it('should reject invalid file types', () => {
      const invalidFile = {
        uri: 'file:///test/file.txt',
        type: 'text/plain',
        name: 'test.txt',
        size: 1024
      };

      expect(UploadService.validateImageFile(invalidFile)).toEqual({
        isValid: false,
        error: 'Only image files are allowed'
      });
    });

    it('should reject files without URI', () => {
      const noUriFile = {
        type: 'image/jpeg',
        name: 'test.jpg',
        size: 1024
      };

      expect(UploadService.validateImageFile(noUriFile)).toEqual({
        isValid: false,
        error: 'File URI is required'
      });
    });
  });

  describe('Response Format', () => {
    it('should return correct response format for images', async () => {
      const mockFile = {
        uri: 'file:///test/image.jpg',
        type: 'image/jpeg',
        name: 'test.jpg',
        size: 1024 * 1024
      };

      const mockResponse = {
        message: 'Service image uploaded successfully',
        imageUrl: 'https://cloudinary.com/test/image.jpg',
        publicId: 'test/public/id',
        mediaType: 'image'
      };

      const { api } = require('../../lib/fetcher');
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await UploadService.uploadServiceImage(mockFile);

      // Verify response structure
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('imageUrl');
      expect(result).toHaveProperty('publicId');
      expect(result).toHaveProperty('mediaType');
      expect(result.mediaType).toBe('image');
    });

    it('should return correct response format for videos', async () => {
      const mockFile = {
        uri: 'file:///test/video.mp4',
        type: 'video/mp4',
        name: 'test.mp4',
        size: 50 * 1024 * 1024
      };

      const mockResponse = {
        message: 'Video uploaded successfully',
        videoUrl: 'https://cloudinary.com/test/video.mp4',
        publicId: 'test/video/public/id',
        mediaType: 'video'
      };

      const { api } = require('../../lib/fetcher');
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await UploadService.uploadServiceVideo(mockFile);

      // Verify response structure
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('videoUrl');
      expect(result).toHaveProperty('publicId');
      expect(result).toHaveProperty('mediaType');
      expect(result.mediaType).toBe('video');
    });
  });
});
