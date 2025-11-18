import { api } from '../lib/fetcher';

export interface UploadResponse {
  message: string;
  imageUrl?: string;
  // VIDEO UPLOAD CODE - COMMENTED OUT
  // videoUrl?: string;
  publicId: string;
  // mediaType?: 'image' | 'video'; // VIDEO UPLOAD CODE - COMMENTED OUT
  mediaType?: 'image';
}

export interface UploadSignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

const UploadService = {
  /**
   * Upload profile image (React Native compatible)
   * @param imageFile - File object with uri, type, and name
   * @returns UploadResponse with imageUrl and publicId
   */
  async uploadProfileImage(imageFile: any): Promise<UploadResponse> {
    try {
      // Ensure the file object has the correct format for React Native FormData
      const fileToUpload = {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || 'image.jpg',
      };

      if (__DEV__) {
        console.log('📤 [UploadService] Uploading profile image:', {
          uri: fileToUpload.uri,
          type: fileToUpload.type,
          name: fileToUpload.name,
        });
      }

      const formData = new FormData();
      formData.append('image', fileToUpload as any);

      if (__DEV__) {
        console.log('📦 [UploadService] FormData created:', {
          hasImage: true,
          fileUri: fileToUpload.uri,
          fileType: fileToUpload.type,
          fileName: fileToUpload.name,
        });
      }

      // Don't set Content-Type manually - axios will set it automatically with the correct boundary
      const startTime = Date.now();
      const response = await api.post<UploadResponse>('/upload/profile-image', formData, {
        timeout: 60000, // Increase to 60 seconds for large files or slow connections
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      const duration = Date.now() - startTime;
      
      if (__DEV__) {
        console.log(`⏱️ [UploadService] Upload completed in ${duration}ms`);
      }

      if (__DEV__) {
        console.log('✅ [UploadService] Profile image uploaded successfully:', response.data);
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ [UploadService] Error uploading profile image:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        },
      });
      throw new Error(error.response?.data?.error || error.message || 'Failed to upload image');
    }
  },

  /**
   * Upload consultant image (React Native compatible)
   * @param imageFile - File object with uri, type, and name
   * @returns UploadResponse with imageUrl and publicId
   */
  async uploadConsultantImage(imageFile: any): Promise<UploadResponse> {
    try {
      // Ensure the file object has the correct format for React Native FormData
      const fileToUpload = {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || 'image.jpg',
      };

      if (__DEV__) {
        console.log('📤 [UploadService] Uploading consultant image:', {
          uri: fileToUpload.uri,
          type: fileToUpload.type,
          name: fileToUpload.name,
        });
      }

      const formData = new FormData();
      formData.append('image', fileToUpload as any);

      // Don't set Content-Type manually - axios will set it automatically with the correct boundary
      const response = await api.post<UploadResponse>('/upload/consultant-image', formData, {
        timeout: 60000, // Increase to 60 seconds for large files or slow connections
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      if (__DEV__) {
        console.log('✅ [UploadService] Consultant image uploaded successfully:', response.data);
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ [UploadService] Error uploading consultant image:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw new Error(error.response?.data?.error || error.message || 'Failed to upload image');
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
      console.error('Error deleting profile image:', error);
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
      console.error('Error deleting consultant image:', error);
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
      // Ensure the file object has the correct format for React Native FormData
      const fileToUpload = {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || 'image.jpg',
      };

      if (__DEV__) {
        console.log('📤 [UploadService] Uploading service image:', {
          uri: fileToUpload.uri,
          type: fileToUpload.type,
          name: fileToUpload.name,
        });
      }

      const formData = new FormData();
      // VIDEO UPLOAD CODE - COMMENTED OUT
      // // Use 'image' field for images, 'video' field for videos
      // const fieldName = fileToUpload.type?.startsWith('video/') ? 'video' : 'image';
      // formData.append(fieldName, fileToUpload as any);
      formData.append('image', fileToUpload as any);

      // Don't set Content-Type manually - axios will set it automatically with the correct boundary
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
      
      // console.log(`📤 [UploadService] Upload timeout set to: ${timeout / 1000} seconds for ${fileSizeMB.toFixed(2)}MB ${isVideo ? 'video' : 'image'}`);
      
      const response = await api.post<UploadResponse>('/upload/service-image', formData, {
        timeout: timeout,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      if (__DEV__) {
        console.log('✅ [UploadService] Service image uploaded successfully:', response.data);
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ [UploadService] Error uploading service image:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw new Error(error.response?.data?.error || error.message || 'Failed to upload image');
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
      console.error('Error getting upload signature:', error);
      throw new Error(error.response?.data?.error || 'Failed to get upload signature');
    }
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
      // Ensure the file object has the correct format for React Native FormData
      const fileToUpload = {
        uri: file.uri,
        type: file.type || 'application/pdf',
        name: file.fileName || file.name || 'resume.pdf',
      };

      if (__DEV__) {
        console.log('📤 [UploadService] Uploading file:', {
          uri: fileToUpload.uri,
          type: fileToUpload.type,
          name: fileToUpload.name,
          fileType,
        });
      }

      const formData = new FormData();
      formData.append('file', fileToUpload as any);
      formData.append('fileType', fileType);

      // Use longer timeout for file uploads (PDFs/DOCs can be larger)
      const response = await api.post<UploadResponse>('/upload/file', formData, {
        timeout: 120000, // 2 minutes for file uploads
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      if (__DEV__) {
        console.log('✅ [UploadService] File uploaded successfully:', response.data);
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ [UploadService] Error uploading file:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw new Error(error.response?.data?.error || error.message || 'Failed to upload file');
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
