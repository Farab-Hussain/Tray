import { api } from '../lib/fetcher';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '@env';

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

class UploadService {
  /**
   * Upload profile image (React Native compatible)
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
      // Fallback to direct Cloudinary upload if backend route not found (404)
      if (error?.response?.status === 404) {
        // Prefer signed upload to avoid relying on client-side CLOUDINARY env vars
        return await this.directCloudinarySignedUpload(imageFile, 'tray/profile-images');
      }
      console.error('Error uploading profile image:', error);
      throw new Error(error.response?.data?.error || 'Failed to upload image');
    }
  }

  /**
   * Upload consultant image (React Native compatible)
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
      // Fallback to direct Cloudinary upload if backend route not found (404)
      if (error?.response?.status === 404) {
        // Prefer signed upload to avoid relying on client-side CLOUDINARY env vars
        return await this.directCloudinarySignedUpload(imageFile, 'tray/consultant-images');
      }
      console.error('Error uploading consultant image:', error);
      throw new Error(error.response?.data?.error || 'Failed to upload image');
    }
  }

  /**
   * Delete profile image using Cloudinary public ID
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
  }

  /**
   * Get Cloudinary upload signature for direct client upload
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
  }

  /**
   * Validate image file (React Native compatible)
   */
  validateImageFile(file: any): { isValid: boolean; error?: string } {
    // Check file type
    if (!file.type || !file.type.startsWith('image/')) {
      return { isValid: false, error: 'Only image files are allowed' };
    }

    // Check file size (5MB limit) - React Native files might not have size property
    if (file.size) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return { isValid: false, error: 'File size must be less than 5MB' };
      }
    }

    return { isValid: true };
  }

  /**
   * Compress image before upload (React Native version)
   * Note: For React Native, image compression should be handled by the image picker library
   */
  async compressImage(file: any, _maxWidth: number = 800, _quality: number = 0.8): Promise<any> {
    // In React Native, compression is typically handled by the image picker
    // Return the original file for now
    return file;
  }

  /**
   * Direct upload to Cloudinary using signed upload (preferred).
   * Falls back to unsigned only if signature route is unavailable.
   */
  private async directCloudinaryUpload(file: any, folder: string): Promise<UploadResponse> {
    try {
      // If signature endpoint is unavailable (as in your env), use unsigned preset
      // Ensure CLOUDINARY_UPLOAD_PRESET is configured in your .env
      const cloudName = CLOUDINARY_CLOUD_NAME;
      const uploadPreset = CLOUDINARY_UPLOAD_PRESET; // optional if you prefer unsigned uploads

      if (!cloudName) throw new Error('Missing CLOUDINARY_CLOUD_NAME');

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const form = new FormData();
      form.append('file', file as any);
      if (uploadPreset) form.append('upload_preset', uploadPreset);
      form.append('folder', folder);

      const res = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: form as any,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Cloudinary upload failed: ${errText}`);
      }

      const data = await res.json();
      return {
        message: 'Image uploaded successfully',
        imageUrl: data.secure_url,
        publicId: data.public_id,
      };
    } catch (err: any) {
      console.error('Direct Cloudinary upload error:', err);
      throw new Error(err?.message || 'Direct upload failed');
    }
  }

  /**
   * Direct upload to Cloudinary using server-provided signature (secure, recommended)
   */
  private async directCloudinarySignedUpload(file: any, folder: string): Promise<UploadResponse> {
    try {
      // Get signature and parameters from backend (also returns cloudName and apiKey)
      const { signature, timestamp, cloudName, apiKey } = await this.getUploadSignature(folder);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const form = new FormData();
      form.append('file', file as any);
      form.append('folder', folder);
      form.append('timestamp', String(timestamp));
      form.append('signature', signature);
      form.append('api_key', apiKey);

      const res = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: form as any,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Cloudinary signed upload failed: ${errText}`);
      }

      const data = await res.json();
      return {
        message: 'Image uploaded successfully',
        imageUrl: data.secure_url,
        publicId: data.public_id,
      };
    } catch (err: any) {
      console.error('Direct Cloudinary signed upload error:', err);
      // As a last resort, try unsigned upload if env is configured
      try {
        return await this.directCloudinaryUpload(file, folder);
      } catch (fallbackErr: any) {
        throw new Error(fallbackErr?.message || err?.message || 'Direct signed upload failed');
      }
    }
  }
}

export default new UploadService();
