import { api } from '../lib/fetcher';
import { API_URL } from '@env';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { auth } from '../lib/firebase';
import { logger } from '../utils/logger';

export interface UploadResponse {
  message: string;
  imageUrl?: string;
  videoUrl?: string;
  publicId: string;
  mediaType?: 'image' | 'video';
}

export interface UploadSignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

/**
 * Helper function to prepare file for upload (Android-specific fix)
 * On Android, file:// URIs cannot be accessed by the network layer
 * We need to use the file path without the file:// prefix
 * @param file - File object with uri, type, and name
 * @param defaultMimeType - Default MIME type if not provided (default: 'image/jpeg')
 * @param defaultName - Default file name if not provided (default: 'image.jpg')
 */
const prepareFileForUpload = async (file: any, defaultMimeType: string = 'image/jpeg', defaultName: string = 'image.jpg'): Promise<any> => {
  let fileUri = file.uri;
  let fileToUpload: any;

  if (Platform.OS === 'android') {
    // On Android, use the original URI from react-native-image-picker
    // It should already be in the correct format (file:///path/to/file)
    // React Native FormData will handle the conversion internally
    
    // Get file path for verification
    let filePath = fileUri;
    if (filePath.startsWith('file://')) {
      filePath = filePath.replace('file://', '');
    }
    if (filePath.startsWith('file:///')) {
      filePath = filePath.replace('file:///', '/');
    }
    
    if (__DEV__) {
      logger.debug('📤 [UploadService] Android detected - using original URI format');
      logger.debug('📤 [UploadService] Original URI:', fileUri);
      logger.debug('📤 [UploadService] File path for verification:', filePath);
    }

    // Verify file exists
    const fileExists = await RNFS.exists(filePath);
    if (!fileExists) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Determine MIME type from file extension if not provided
    let mimeType = file.type || defaultMimeType;
    if (!file.type && file.name) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'gif') mimeType = 'image/gif';
      else if (ext === 'webp') mimeType = 'image/webp';
      else if (ext === 'pdf') mimeType = 'application/pdf';
      else if (ext === 'doc') mimeType = 'application/msword';
      else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // Use the original URI as-is - react-native-image-picker provides correct format
    // React Native FormData on Android will handle file:// URIs correctly
    fileToUpload = {
      uri: fileUri, // Use original URI - React Native FormData handles it
      type: mimeType, // Ensure correct MIME type
      name: file.name || file.fileName || defaultName,
    };

    if (__DEV__) {
      logger.debug('📤 [UploadService] Android file object prepared:', {
        uri: fileToUpload.uri,
        type: fileToUpload.type,
        name: fileToUpload.name,
        fileExists: true,
      });
    }
  } else {
    // iOS - use the original approach (works fine on iOS)
    // Ensure URI is properly formatted for React Native
    if (fileUri && !fileUri.startsWith('file://') && !fileUri.startsWith('content://') && !fileUri.startsWith('http://') && !fileUri.startsWith('https://')) {
      // If it's a relative path, try to make it absolute
      fileUri = fileUri.startsWith('/') ? `file://${fileUri}` : `file:///${fileUri}`;
    }
    
    fileToUpload = {
      uri: fileUri,
      type: file.type || defaultMimeType,
      name: file.name || file.fileName || defaultName,
    };
  }

  return fileToUpload;
};

/**
 * Helper function to upload file using fetch API (Android) or axios (iOS)
 * Root cause fix: fetch API handles FormData correctly on Android, axios has issues
 */
const uploadWithPlatformSpecificMethod = async (
  endpoint: string,
  formData: FormData,
  timeout: number = 60000
): Promise<any> => {
  if (Platform.OS === 'android') {
    // Android: Use fetch API (handles FormData correctly)
    if (__DEV__) {
      logger.debug('📤 [UploadService] Using fetch API for Android upload');
    }

    // Get Firebase token for authentication
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();
    if (!token) {
      throw new Error('Failed to get authentication token');
    }

    // Get base URL from api instance
    const baseURL = API_URL || api.defaults.baseURL;
    const uploadUrl = `${baseURL}${endpoint}`;

    if (__DEV__) {
      logger.debug('📤 [UploadService] Using API_URL:', API_URL);
      logger.debug('📤 [UploadService] Using baseURL:', baseURL);
      logger.debug('📤 [UploadService] Upload URL:', uploadUrl);
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Use fetch API which handles FormData correctly on Android
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - fetch will set it automatically with boundary
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Upload timeout - request took too long');
      }
      throw error;
    }
  } else {
    // iOS: Use axios (works fine on iOS)
    const response = await api.post(endpoint, formData, {
      timeout: timeout,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return response.data;
  }
};

const UploadService = {
  /**
   * Upload profile image (React Native compatible)
   * @param imageFile - File object with uri, type, and name
   * @returns UploadResponse with imageUrl and publicId
   */
  async uploadProfileImage(imageFile: any): Promise<UploadResponse> {
    try {
      const fileToUpload = await prepareFileForUpload(imageFile);

      if (__DEV__) {
        logger.debug('📤 [UploadService] Uploading profile image:', {
          uri: fileToUpload.uri,
          type: fileToUpload.type,
          name: fileToUpload.name,
          originalUri: imageFile.uri,
          platform: Platform.OS,
        });
      }

      const formData = new FormData();
      // For React Native, FormData expects { uri, type, name } format
      formData.append('image', fileToUpload as any);

      if (__DEV__) {
        logger.debug('📦 [UploadService] FormData created:', {
          hasImage: true,
          fileUri: fileToUpload.uri,
          fileType: fileToUpload.type,
          fileName: fileToUpload.name,
          platform: Platform.OS,
        });
      }

      const startTime = Date.now();
      
      // Root cause fix: Use fetch API for Android (handles FormData correctly)
      // Axios has known issues with FormData and file:// URIs on Android
      const data = await uploadWithPlatformSpecificMethod('/upload/profile-image', formData, 60000);
      const duration = Date.now() - startTime;
      
      if (__DEV__) {
        logger.debug(`⏱️ [UploadService] Upload completed in ${duration}ms`);
        logger.debug('✅ [UploadService] Profile image uploaded successfully:', data);
      }

      return data;
    } catch (error: any) {
      logger.error('❌ [UploadService] Error uploading profile image:', {
        message: error.message,
        code: error.code,
        status: error.status || error.response?.status,
        statusText: error.statusText || error.response?.statusText,
        data: error.data || error.response?.data,
        platform: Platform.OS,
      });
      throw new Error(error.data?.error || error.response?.data?.error || error.message || 'Failed to upload image');
    }
  },

  /**
   * Upload consultant image (React Native compatible)
   * @param imageFile - File object with uri, type, and name
   * @returns UploadResponse with imageUrl and publicId
   */
  async uploadConsultantImage(imageFile: any): Promise<UploadResponse> {
    try {
      const fileToUpload = await prepareFileForUpload(imageFile);

      if (__DEV__) {
        logger.debug('📤 [UploadService] Uploading consultant image:', {
          uri: fileToUpload.uri,
          type: fileToUpload.type,
          name: fileToUpload.name,
          originalUri: imageFile.uri,
          platform: Platform.OS,
        });
      }

      const formData = new FormData();
      // For React Native, FormData expects { uri, type, name } format
      formData.append('image', fileToUpload as any);

      const startTime = Date.now();
      const data = await uploadWithPlatformSpecificMethod('/upload/consultant-image', formData, 60000);
      const duration = Date.now() - startTime;

      if (__DEV__) {
        logger.debug(`⏱️ [UploadService] Upload completed in ${duration}ms`);
        logger.debug('✅ [UploadService] Consultant image uploaded successfully:', data);
      }

      return data;
    } catch (error: any) {
      logger.error('❌ [UploadService] Error uploading consultant image:', {
        message: error.message,
        code: error.code,
        status: error.status || error.response?.status,
        statusText: error.statusText || error.response?.statusText,
        data: error.data || error.response?.data,
        platform: Platform.OS,
      });
      throw new Error(error.data?.error || error.response?.data?.error || error.message || 'Failed to upload image');
    }
  },

  /**
   * Delete profile image using Cloudinary public ID
   * @param publicId - Cloudinary public ID of the image to delete
   * @returns Success message
   */
  async deleteProfileImage(publicId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete('/upload/profile-image', {
        data: { publicId },
      });

      return response.data;
    } catch (error: any) {
            if (__DEV__) {
        logger.error('Error deleting profile image:', error)
      };
      throw new Error(error.response?.data?.error || 'Failed to delete image');
    }
  },

  async deleteConsultantImage(publicId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete('/upload/consultant-image', {
        data: { publicId },
      });

      return response.data;
    } catch (error: any) {
            if (__DEV__) {
        logger.error('Error deleting consultant image:', error)
      };
      throw new Error(error.response?.data?.error || 'Failed to delete image');
    }
  },

  /**
   * Upload service image (React Native compatible)
   * @param imageFile - File object with uri, type, and name
   * @returns UploadResponse with imageUrl and publicId
   */
  async uploadServiceImage(imageFile: any): Promise<UploadResponse> {
    try {
      const fileToUpload = await prepareFileForUpload(imageFile);

      if (__DEV__) {
        logger.debug('📤 [UploadService] Uploading service image:', {
          uri: fileToUpload.uri,
          type: fileToUpload.type,
          name: fileToUpload.name,
          originalUri: imageFile.uri,
          platform: Platform.OS,
        });
      }

      const formData = new FormData();
      // VIDEO UPLOAD CODE - COMMENTED OUT
      // // Use 'image' field for images, 'video' field for videos
      // const fieldName = fileToUpload.type?.startsWith('video/') ? 'video' : 'image';
      // formData.append(fieldName, fileToUpload as any);
      // For React Native, FormData expects { uri, type, name } format
      formData.append('image', fileToUpload as any);

      // VIDEO UPLOAD CODE - COMMENTED OUT
      // // For videos, use much longer timeout due to large file sizes and Cloudinary processing
      // // Estimate: ~1 minute per 10MB for slow connections, minimum 20 minutes for videos
      // const isVideo = fileToUpload.type?.startsWith('video/');
      // // Get file size if available to calculate timeout
      // const fileSizeMB = (fileToUpload as any).size ? (fileToUpload as any).size / (1024 * 1024) : 0;
      // const timeout = isVideo 
      //   ? Math.max(1200000, Math.ceil(fileSizeMB / 10) * 60000) // At least 20 min, or 1 min per 10MB
      //   : 120000; // 2 minutes for images
      const timeout = 120000; // 2 minutes for images
      
      const startTime = Date.now();
      const data = await uploadWithPlatformSpecificMethod('/upload/service-image', formData, timeout);
      const duration = Date.now() - startTime;

      if (__DEV__) {
        logger.debug(`⏱️ [UploadService] Upload completed in ${duration}ms`);
        logger.debug('✅ [UploadService] Service image uploaded successfully:', data);
      }

      return data;
    } catch (error: any) {
      logger.error('❌ [UploadService] Error uploading service image:', {
        message: error.message,
        code: error.code,
        status: error.status || error.response?.status,
        statusText: error.statusText || error.response?.statusText,
        data: error.data || error.response?.data,
        platform: Platform.OS,
      });
      throw new Error(error.data?.error || error.response?.data?.error || error.message || 'Failed to upload image');
    }
  },

  /**
   * Upload service video (React Native compatible)
   * @param videoFile - File object with uri, type, and name
   * @returns UploadResponse with videoUrl and publicId
   */
  async uploadServiceVideo(videoFile: any): Promise<UploadResponse> {
    try {
      // Validate video file before upload
      const validation = this.validateVideoFile(videoFile);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const fileToUpload = await prepareFileForUpload(videoFile, 'video/mp4', 'video.mp4');

      if (__DEV__) {
        logger.debug('📤 [UploadService] Uploading service video:', {
          uri: fileToUpload.uri,
          type: fileToUpload.type,
          name: fileToUpload.name,
          originalUri: videoFile.uri,
          platform: Platform.OS,
        });
      }

      const formData = new FormData();
      formData.append('video', fileToUpload as any);

      // For videos, use optimized timeout for 100MB Cloudinary limit
      // With chunked uploads and 100MB limit, calculate appropriate timeout
      const isVideo = fileToUpload.type?.startsWith('video/');
      const fileSizeMB = (videoFile as any).size ? (videoFile as any).size / (1024 * 1024) : 0;
      const timeout = isVideo 
        ? Math.max(900000, Math.ceil(fileSizeMB / 50) * 300000) // At least 15 min, or ~5min per 50MB
        : 120000; // 2 minutes for images
      
      const startTime = Date.now();
      const data = await uploadWithPlatformSpecificMethod('/upload/service-video', formData, timeout);
      const duration = Date.now() - startTime;

      if (__DEV__) {
        logger.debug(`⏱️ [UploadService] Upload completed in ${duration}ms`);
        logger.debug('✅ [UploadService] Service video uploaded successfully:', data);
      }

      return data;
    } catch (error: any) {
      logger.error('❌ [UploadService] Error uploading service video:', {
        message: error.message,
        code: error.code,
        status: error.status || error.response?.status,
        statusText: error.statusText || error.response?.statusText,
        data: error.data || error.response?.data,
        platform: Platform.OS,
      });
      throw new Error(error.data?.error || error.response?.data?.error || error.message || 'Failed to upload video');
    }
  },

  /**
   * Get upload signature for direct Cloudinary upload (optional - for advanced use cases)
   * @param folder - Cloudinary folder path (default: 'tray/profile-images')
   * @returns UploadSignatureResponse with signature and upload parameters
   */
  async getUploadSignature(folder: string = 'tray/profile-images'): Promise<UploadSignatureResponse> {
    try {
      const response = await api.post<UploadSignatureResponse>('/upload/upload-signature', {
        folder,
      });

      return response.data;
    } catch (error: any) {
            if (__DEV__) {
        logger.error('Error getting upload signature:', error)
      };
      throw new Error(error.response?.data?.error || 'Failed to get upload signature');
    }
  },

  /**
   * Validate video file (React Native compatible)
   * @param file - File object to validate
   * @returns Validation result with isValid flag and optional error message
   */
  validateVideoFile(file: any): { isValid: boolean; error?: string } {
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    if (!file.uri) {
      return { isValid: false, error: 'File URI is required' };
    }

    if (!file.type || !file.type.startsWith('video/')) {
      return { isValid: false, error: 'Only video files are allowed' };
    }

    // Check Cloudinary free tier limit (100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size && file.size > maxSize) {
      const fileSizeMB = Math.round(file.size / (1024 * 1024));
      return { 
        isValid: false, 
        error: `Video file is too large for current plan. Maximum allowed size is 100MB. Current size: ${fileSizeMB}MB. Please compress your video or upgrade your Cloudinary account for larger file support.` 
      };
    }

    return { isValid: true };
  },

  /**
   * Validate image file (React Native compatible)
   * @param file - File object to validate
   * @returns Validation result with isValid flag and optional error message
   */
  validateImageFile(file: any): { isValid: boolean; error?: string } {
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    if (!file.uri) {
      return { isValid: false, error: 'File URI is required' };
    }

    if (!file.type || !file.type.startsWith('image/')) {
      return { isValid: false, error: 'Only image files are allowed' };
    }

    // Check file size (100MB limit for images)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size && file.size > maxSize) {
      return { 
        isValid: false, 
        error: `Image file is too large. Maximum allowed size is 100MB. Current size: ${Math.round(file.size / (1024 * 1024))}MB` 
      };
    }

    return { isValid: true };
  },

  /**
   * Upload file (PDF/DOC) for resumes (React Native compatible)
   * @param file - File object with uri, type, and name
   * @param fileType - Type of file ('resume' for resume files)
   * @returns UploadResponse with imageUrl (fileUrl) and publicId
   */
  async uploadFile(file: any, fileType: 'resume' = 'resume'): Promise<UploadResponse> {
    try {
      const fileToUpload = await prepareFileForUpload(file, 'application/pdf', 'resume.pdf');

      if (__DEV__) {
        logger.debug('📤 [UploadService] Uploading file:', {
          uri: fileToUpload.uri,
          type: fileToUpload.type,
          name: fileToUpload.name,
          fileType,
          originalUri: file.uri,
          platform: Platform.OS,
        });
      }

      const formData = new FormData();
      // For React Native, FormData expects { uri, type, name } format
      formData.append('file', fileToUpload as any);
      formData.append('fileType', fileType);

      // Use longer timeout for file uploads (PDFs/DOCs can be larger)
      const startTime = Date.now();
      const data = await uploadWithPlatformSpecificMethod('/upload/file', formData, 120000);
      const duration = Date.now() - startTime;

      if (__DEV__) {
        logger.debug(`⏱️ [UploadService] Upload completed in ${duration}ms`);
        logger.debug('✅ [UploadService] File uploaded successfully:', data);
      }

      return data;
    } catch (error: any) {
      logger.error('❌ [UploadService] Error uploading file:', {
        message: error.message,
        code: error.code,
        status: error.status || error.response?.status,
        statusText: error.statusText || error.response?.statusText,
        data: error.data || error.response?.data,
        platform: Platform.OS,
      });
      throw new Error(error.data?.error || error.response?.data?.error || error.message || 'Failed to upload file');
    }
  },

  /**
   * Compress image before upload (React Native version)
   * Note: For React Native, image compression should be handled by the image picker library
   * @param file - File object
   * @param maxWidth - Maximum width (default: 800)
   * @param quality - Image quality (default: 0.8)
   * @returns Compressed file object
   */
  async compressImage(file: any, _maxWidth: number = 800, _quality: number = 0.8): Promise<any> {
    // In React Native, compression is typically handled by the image picker
    // This method is a placeholder for future compression logic if needed
    return file;
  },
};

export default UploadService;
