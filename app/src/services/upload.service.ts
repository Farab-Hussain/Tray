import { api } from '../lib/fetcher';

export interface UploadResponse {
  message: string;
  imageUrl: string;
  publicId: string;
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
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.post<UploadResponse>('/upload/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      throw new Error(error.response?.data?.error || 'Failed to upload image');
    }
  },

  /**
   * Upload consultant image (React Native compatible)
   * @param imageFile - File object with uri, type, and name
   * @returns UploadResponse with imageUrl and publicId
   */
  async uploadConsultantImage(imageFile: any): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.post<UploadResponse>('/upload/consultant-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error uploading consultant image:', error);
      throw new Error(error.response?.data?.error || 'Failed to upload image');
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
