import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/core/colors';
import UploadService from '../../services/upload.service';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import CustomAlert from './CustomAlert';

interface ImageUploadProps {
  currentImageUrl?: string;
  currentPublicId?: string;
  onImageUploaded: (imageUrl: string, publicId: string) => void;
  onImageDeleted?: () => void;
  placeholder?: string;
  style?: any;
  uploadType?: 'user' | 'consultant';
  required?: boolean;
  error?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  currentPublicId,
  onImageUploaded,
  onImageDeleted,
  placeholder = "Tap to upload image",
  style,
  uploadType = 'user',
  required = false,
  error,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning'>('success');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
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

  const openCamera = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as any,
      maxWidth: 800,
      maxHeight: 800,
    };

    launchCamera(options, handleImageResponse);
  };

  const openGallery = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as any,
      maxWidth: 800,
      maxHeight: 800,
    };

    launchImageLibrary(options, handleImageResponse);
  };

  const handleImageResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      return;
    }

    const asset = response.assets?.[0];
    if (!asset?.uri) return;

    setIsUploading(true);

    try {
      // Create a File object from the asset
      const file = {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'image.jpg',
      } as any;

      // Upload image
      const result = uploadType === 'consultant'
        ? await UploadService.uploadConsultantImage(file)
        : await UploadService.uploadProfileImage(file);
      
      onImageUploaded(result.imageUrl, result.publicId);
      showAlert('success', 'Success', 'Image uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      showAlert('error', 'Upload Failed', error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!currentPublicId) return;

    setIsDeleting(true);
    try {
      await UploadService.deleteProfileImage(currentPublicId);
      onImageDeleted?.();
      showAlert('success', 'Success', 'Image deleted successfully!');
    } catch (error: any) {
      console.error('Delete error:', error);
      showAlert('error', 'Delete Failed', error.message || 'Failed to delete image');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      {/* Image display */}
      <View style={{
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.gray,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: error ? 2 : 0,
        borderColor: error ? COLORS.red : 'transparent',
      }}>
        {currentImageUrl ? (
          <Image
            source={{ uri: currentImageUrl }}
            style={{
              width: '100%',
              height: '100%',
            }}
            resizeMode="cover"
          />
        ) : (
          <Text style={{
            color: COLORS.gray,
            fontSize: 12,
            textAlign: 'center',
            paddingHorizontal: 8,
          }}>
            {placeholder}
          </Text>
        )}
      </View>

      {/* Upload button */}
      <TouchableOpacity
        onPress={handleImageSelect}
        disabled={isUploading}
        style={{
          backgroundColor: isUploading ? COLORS.gray : COLORS.green,
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 8,
          marginBottom: 8,
          minWidth: 120,
          alignItems: 'center',
        }}
      >
        {isUploading ? (
          <ActivityIndicator color={COLORS.white} size="small" />
        ) : (
          <Text style={{
            color: COLORS.white,
            fontWeight: 'bold',
            fontSize: 14,
          }}>
            {currentImageUrl ? 'Change Image' : 'Upload Image'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Delete button */}
      {currentImageUrl && (
        <TouchableOpacity
          onPress={handleDeleteImage}
          disabled={isDeleting}
          style={{
            backgroundColor: isDeleting ? COLORS.gray : '#ef4444',
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 8,
            minWidth: 120,
            alignItems: 'center',
          }}
        >
          {isDeleting ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={{
              color: COLORS.white,
              fontWeight: 'bold',
              fontSize: 12,
            }}>
              Delete Image
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Error Message */}
      {error && (
        <Text style={{
          color: COLORS.red,
          fontSize: 12,
          marginTop: 8,
          textAlign: 'center',
        }}>
          {error}
        </Text>
      )}

      {/* Custom Alert */}
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

export default ImageUpload;
