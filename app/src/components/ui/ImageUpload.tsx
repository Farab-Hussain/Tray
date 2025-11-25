import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../constants/core/colors';
import UploadService from '../../services/upload.service';
import {
  launchImageLibrary,
  ImagePickerResponse,
  MediaType,
} from 'react-native-image-picker';
import CustomAlert from './CustomAlert';
import { imageUploadStyles } from '../../constants/styles/imageUploadStyles';

interface ImageUploadProps {
  currentImageUrl?: string;
  // VIDEO UPLOAD CODE - COMMENTED OUT
  // currentVideoUrl?: string;
  currentPublicId?: string;
  // currentVideoPublicId?: string;
  onImageUploaded: (imageUrl: string, publicId: string) => void;
  // onVideoUploaded?: (videoUrl: string, publicId: string) => void;
  onImageDeleted?: () => void;
  // onVideoDeleted?: () => void;
  placeholder?: string;
  style?: any;
  uploadType?: 'user' | 'consultant' | 'service';
  required?: boolean;
  error?: string;
  showDeleteButton?: boolean; // Option to hide delete button
  // allowVideo?: boolean; // Allow video uploads (for services) - COMMENTED OUT
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  // VIDEO UPLOAD CODE - COMMENTED OUT
  // currentVideoUrl,
  currentPublicId,
  // currentVideoPublicId,
  onImageUploaded,
  // onVideoUploaded,
  onImageDeleted,
  // onVideoDeleted,
  placeholder = 'Tap to upload image',
  style,
  uploadType = 'user',
  required: _required = false,
  error,
  showDeleteButton = true, // Default to showing delete button for backward compatibility
  // allowVideo = false, // Default to false for backward compatibility - COMMENTED OUT
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning'>(
    'success',
  );
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (
    type: 'success' | 'error' | 'warning',
    title: string,
    message: string,
  ) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleImageSelect = async () => {
    // For now, let's use a simple approach - directly open gallery
    // You can add back the camera/gallery selection later if needed
    openGallery();
  };

  // Camera functionality can be added back later if needed
  // const openCamera = () => {
  //   const options = {
  //     mediaType: 'photo' as MediaType,
  //     quality: 0.8 as any,
  //     maxWidth: 800,
  //     maxHeight: 800,
  //   };
  //   launchCamera(options, handleImageResponse);
  // };

  const openGallery = () => {
    const options = {
      // VIDEO UPLOAD CODE - COMMENTED OUT
      // mediaType: allowVideo ? 'mixed' as MediaType : 'photo' as MediaType,
      mediaType: 'photo' as MediaType,
      quality: 0.8 as any,
      maxWidth: 800,
      maxHeight: 800,
      // videoQuality: 'high' as any, // VIDEO UPLOAD CODE - COMMENTED OUT
    };

    launchImageLibrary(options, handleImageResponse);
  };

  const handleImageResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
            if (__DEV__) {
        console.log('📸 Media selection cancelled or error:', response.errorMessage)
      };
      return;
    }

    const asset = response.assets?.[0];
    if (!asset?.uri) {
            if (__DEV__) {
        console.log('📸 No asset URI found in response')
      };
      return;
    }

    // VIDEO UPLOAD CODE - COMMENTED OUT
    // const isVideo = asset.type?.startsWith('video/') || false;
    const isVideo = false; // Video uploads disabled
        if (__DEV__) {
      console.log(`📸 Selected image URI:`, asset.uri)
    };
        if (__DEV__) {
      console.log(`📸 Current image URL:`, currentImageUrl)
    };
        if (__DEV__) {
      console.log('📸 Upload type:', uploadType)
    };

    setIsUploading(true);

    // Add a safety timeout to prevent infinite loading
    // VIDEO UPLOAD CODE - COMMENTED OUT
    // // For videos, allow up to 20 minutes for large files (59MB+)
    // const fileSizeMB = asset.fileSize ? asset.fileSize / (1024 * 1024) : 0;
    // const timeoutDuration = isVideo 
    //   ? Math.max(1200000, Math.ceil(fileSizeMB / 10) * 60000) // At least 20 min, or 1 min per 10MB
    //   : 120000; // 2 minutes for images
    const timeoutDuration = 120000; // 2 minutes for images
    const uploadTimeout = setTimeout(() => {
      if (__DEV__) {
        console.warn('⚠️ Upload timeout - request is taking too long');
      }
      setIsUploading(false);
      showAlert(
        'error',
        'Upload Timeout',
        `The ${isVideo ? 'video' : 'image'} upload is taking too long. Please check your connection and try again.`,
      );
    }, timeoutDuration);

    try {
      // Create a File object from the asset
      const file = {
        uri: asset.uri,
        // VIDEO UPLOAD CODE - COMMENTED OUT
        // type: asset.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        // name: asset.fileName || (isVideo ? 'video.mp4' : 'image.jpg'),
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'image.jpg',
      } as any;

      if (__DEV__) {
        console.log(`📸 [ImageUpload] Uploading image file:`, { 
          uri: file.uri, 
          type: file.type, 
          name: file.name,
          uploadType,
        });
      }

      // Upload media - let the retry logic in fetcher.ts handle retries and timeouts
      // Don't add manual timeout here as it interferes with retry logic
      // The retry logic will automatically retry once if the first attempt fails
      let result;
      if (uploadType === 'consultant') {
        result = await UploadService.uploadConsultantImage(file);
      } else if (uploadType === 'service') {
        result = await UploadService.uploadServiceImage(file);
      } else {
        result = await UploadService.uploadProfileImage(file);
      }

      // Clear the safety timeout since upload succeeded
      clearTimeout(uploadTimeout);

      if (__DEV__) {
        console.log(`✅ [ImageUpload] Upload result:`, result);
      }
      
      // Call appropriate callback based on media type
      // VIDEO UPLOAD CODE - COMMENTED OUT
      // // Backend returns either videoUrl or imageUrl based on media type
      // if (isVideo && onVideoUploaded) {
      //   const videoUrl = (result as any).videoUrl;
      //   if (videoUrl) {
      //     onVideoUploaded(videoUrl, result.publicId);
      //   } else {
      //     console.warn('⚠️ [ImageUpload] Video uploaded but no videoUrl in response:', result);
      //   }
      // } else if (!isVideo) {
        const imageUrl = (result as any).imageUrl;
        if (imageUrl) {
          onImageUploaded(imageUrl, result.publicId);
        } else {
                    if (__DEV__) {
            console.warn('⚠️ [ImageUpload] Image uploaded but no imageUrl in response:', result)
          };
        }
      // }
      // Success alert removed - parent component handles navigation/feedback
    } catch (err: any) {
      // Clear the safety timeout since we're handling the error
      clearTimeout(uploadTimeout);
      
            if (__DEV__) {
        console.error(`❌ [ImageUpload] Upload error:`, {
        message: err?.message,
        code: err?.code,
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        isBackendUnavailable: err?.isBackendUnavailable,
        isNgrokError: err?.isNgrokError,
      })
      };
      
      // Check if backend is unavailable
      const isBackendUnavailable = 
        err?.isBackendUnavailable || 
        err?.isNgrokError || 
        err?.backendUnavailable ||
        err?.response?.status === 503 ||
        err?.response?.status === 502 ||
        err?.code === 'ECONNREFUSED' ||
        err?.code === 'ERR_CONNECTION_REFUSED' ||
        err?.code === 'ETIMEDOUT' ||
        err?.code === 'ECONNABORTED';
      
      // VIDEO UPLOAD CODE - COMMENTED OUT
      // let errorMessage = `Failed to upload ${isVideo ? 'video' : 'image'}. Please try again.`;
      let errorMessage = `Failed to upload image. Please try again.`;
      
      if (isBackendUnavailable) {
        errorMessage = 'Backend server is unavailable. Please check your connection and try again later.';
      } else if (err?.code === 'ETIMEDOUT' || err?.code === 'ECONNABORTED') {
        errorMessage = 'Upload timed out. Please check your connection and try again.';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      showAlert(
        'error',
        'Upload Failed',
        errorMessage,
      );
    } finally {
      // Ensure loading state is always cleared
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    // If we have a publicId, try to delete from Cloudinary first
    // Otherwise, just call onImageDeleted to clear from backend
    // VIDEO UPLOAD CODE - COMMENTED OUT
    // if (!currentImageUrl && !currentVideoUrl) return;
    if (!currentImageUrl) return;

    setIsDeleting(true);
    try {
      // Try to delete from Cloudinary if we have the publicId
      // VIDEO UPLOAD CODE - COMMENTED OUT
      // const publicIdToDelete = currentVideoUrl ? currentVideoPublicId : currentPublicId;
      const publicIdToDelete = currentPublicId;
      if (publicIdToDelete) {
        try {
          if (uploadType === 'consultant') {
            await UploadService.deleteConsultantImage(publicIdToDelete);
          } else if (uploadType === 'service') {
          } else {
            await UploadService.deleteProfileImage(publicIdToDelete);
          }
        } catch (cloudinaryError: any) {
          // If Cloudinary deletion fails, still proceed to clear from backend
                    if (__DEV__) {
            console.warn('Cloudinary deletion failed, clearing from backend only:', cloudinaryError)
          };
        }
      }
      
      // Always call onImageDeleted to clear the media from backend/profile
      // VIDEO UPLOAD CODE - COMMENTED OUT
      // // This works even if we don't have publicId (for older media)
      // if (currentVideoUrl && onVideoDeleted) {
      //   await Promise.resolve(onVideoDeleted());
      // } else if (onImageDeleted) {
        if (onImageDeleted) {
          await Promise.resolve(onImageDeleted());
        }
      // }
      // Success alert removed - parent component handles navigation/feedback
    } catch (err: any) {
            if (__DEV__) {
        console.error('Delete error:', err)
      };
      showAlert(
        'error',
        'Delete Failed',
        err.message || 'Failed to delete image',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Image/Video display */}
      <View
        style={[styles.imageContainer, error && styles.imageContainerError]}
      >
        {/* VIDEO UPLOAD CODE - COMMENTED OUT */}
        {/* {currentVideoUrl ? (
          <View style={styles.videoContainer}>
            ... video thumbnail display code ...
          </View>
        ) : */ currentImageUrl ? (
          <Image
            source={{ uri: currentImageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.placeholderText}>{placeholder}</Text>
        )}
      </View>

      {/* Upload button */}
      <TouchableOpacity
        onPress={handleImageSelect}
        disabled={isUploading}
        style={[
          styles.uploadButton,
          isUploading && styles.uploadButtonDisabled,
        ]}
      >
        {isUploading ? (
          <ActivityIndicator color={COLORS.white} size="small" />
        ) : (
          <Text style={styles.uploadButtonText}>
            {/* VIDEO UPLOAD CODE - COMMENTED OUT */}
            {/* {currentImageUrl || currentVideoUrl 
              ? (allowVideo ? 'Change Media' : 'Change Image') 
              : (allowVideo ? 'Upload Image/Video' : 'Upload Image')} */}
            {currentImageUrl ? 'Change Image' : 'Upload Image'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Delete button - only show if showDeleteButton is true */}
      {/* VIDEO UPLOAD CODE - COMMENTED OUT */}
      {/* {(currentImageUrl || currentVideoUrl) && showDeleteButton && ( */}
      {currentImageUrl && showDeleteButton && (
        <TouchableOpacity
          onPress={handleDeleteImage}
          disabled={isDeleting}
          style={[
            styles.deleteButton,
            isDeleting && styles.deleteButtonDisabled,
          ]}
        >
          {isDeleting ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.deleteButtonText}>
              {/* VIDEO UPLOAD CODE - COMMENTED OUT */}
              {/* {currentVideoUrl ? 'Delete Video' : 'Delete Image'} */}
              Delete Image
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

const styles = imageUploadStyles;

export default ImageUpload;
