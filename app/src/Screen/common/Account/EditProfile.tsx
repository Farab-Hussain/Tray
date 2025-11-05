import React, { useState, useEffect } from 'react';
import { Text, View, Alert, ActivityIndicator, TouchableOpacity, Image, PermissionsAndroid, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { authStyles } from '../../../constants/styles/authStyles';
import { Profile } from '../../../constants/styles/profile';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import AppButton from '../../../components/ui/AppButton';
import ImageUpload from '../../../components/ui/ImageUpload';
import { useAuth } from '../../../contexts/AuthContext';
import { Camera, Trash2 } from 'lucide-react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { UserService } from '../../../services/user.service';

const EditProfile = ({ navigation }: any) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiChecked, setApiChecked] = useState(false);
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    // Only load profile image once when component mounts or user changes significantly
    if (apiChecked || !user) return;
    
    const userPhotoURL = user.photoURL;
    
    // Fetch profile image from backend first, then fallback to Firebase
    const loadProfileImage = async () => {
      try {
        console.log('📸 Loading profile image from backend...');
        const backendProfile = await UserService.getUserProfile();
        console.log('✅ Backend profile loaded:', backendProfile);
        
        // Prefer backend avatarUrl over Firebase photoURL
        if (backendProfile?.avatarUrl) {
          console.log('✅ Using backend avatar:', backendProfile.avatarUrl);
          setProfileImage(backendProfile.avatarUrl);
        } else if (userPhotoURL) {
          console.log('✅ Using Firebase photoURL:', userPhotoURL);
          setProfileImage(userPhotoURL);
        }
      } catch (error: any) {
        if (error?.response?.status === 404) {
          console.log('⚠️ Backend profile API not available (404) - using Firebase photoURL');
        } else {
          console.log('⚠️ Failed to load backend profile:', error?.message || error);
        }
        // Fallback to Firebase Auth photoURL if backend fails
        if (userPhotoURL) {
          setProfileImage(userPhotoURL);
        }
      } finally {
        setApiChecked(true);
      }
    };
    
    loadProfileImage();
  }, [user?.uid, user?.photoURL, apiChecked, user]); // Include user to satisfy linter

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to camera to take photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS permissions are handled automatically
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to select your profile image',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Photo Library', onPress: () => openImageLibrary() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openCamera = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
        return;
      }

      const options = {
        mediaType: 'photo' as MediaType,
        quality: 0.8 as const,
        includeBase64: false,
      };

      launchCamera(options, (response: ImagePickerResponse) => {
        if (response.assets && response.assets[0]) {
          setProfileImage(response.assets[0].uri || null);
        }
      });
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Camera is not available. Please try again after restarting the app.');
    }
  };

  const openImageLibrary = () => {
    try {
      const options = {
        mediaType: 'photo' as MediaType,
        quality: 0.8 as const,
        includeBase64: false,
      };

      launchImageLibrary(options, (response: ImagePickerResponse) => {
        if (response.assets && response.assets[0]) {
          setProfileImage(response.assets[0].uri || null);
        }
      });
    } catch (error) {
      console.error('Image library error:', error);
      Alert.alert('Error', 'Photo library is not available. Please try again after restarting the app.');
    }
  };

  const handleRemoveImage = async () => {
    Alert.alert(
      'Remove Profile Image',
      'Are you sure you want to remove your profile image?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: async () => {
            setLoading(true);
            try {
              // Update Firebase Auth to remove photoURL
              if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                  photoURL: null
                });
                
                // Update backend profile to remove avatar
                try {
                  await UserService.updateProfile({
                    avatarUrl: null
                  });
                  console.log('✅ Backend profile avatar removed successfully');
                } catch (backendError) {
                  console.log('⚠️ Backend avatar removal failed:', backendError);
                  // Continue even if backend update fails
                }
                
                await refreshUser();
              }
              setProfileImage(null);
              Alert.alert('Success', 'Profile image removed successfully');
            } catch (error) {
              console.error('❌ Error removing image:', error);
              Alert.alert('Error', 'Failed to remove profile image');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'No user is currently signed in.');
      return;
    }

    setLoading(true);
    try {
      console.log('📸 Updating profile image:', profileImage);
      
      let finalImageUrl = profileImage;
      
      // Upload to backend if image is selected and it's a local URI
      if (profileImage && profileImage.startsWith('file://')) {
        try {
          console.log('☁️ Uploading image to backend...');
          const uploadResponse = await UserService.uploadAvatar(profileImage);
          console.log('✅ Backend upload response:', uploadResponse);
          
          // Get the uploaded image URL from backend response
          finalImageUrl = uploadResponse?.avatarUrl || uploadResponse?.url || profileImage;
        } catch (uploadError) {
          console.log('⚠️ Backend upload failed, using local image:', uploadError);
          // Continue with local image if backend upload fails
        }
      }
      
      // Update Firebase Auth profile with final image URL
      await updateProfile(auth.currentUser, {
        photoURL: finalImageUrl
      });
      
      console.log('✅ Firebase Auth profile updated successfully');
      
      // Update backend profile if backend upload was successful
      if (profileImage && profileImage.startsWith('file://')) {
        try {
          await UserService.updateProfile({
            avatarUrl: finalImageUrl
          });
          console.log('✅ Backend profile updated successfully');
        } catch (backendError) {
          console.log('⚠️ Backend profile update failed:', backendError);
          // Continue even if backend update fails
        }
      }
      
      // Refresh user data to get updated info in context
      await refreshUser();

      Alert.alert('Success', 'Profile image updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('❌ Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite}>
      <ScreenHeader title="Edit Profile Image" onBackPress={() => navigation.goBack()} />
      
      <View style={authStyles.formContainer}>
        <Text style={authStyles.authHeading}>Update Profile Image</Text>
        <Text style={authStyles.authPara}>Choose or take a new profile picture.</Text>

        {/* Profile Image Section */}
        <ImageUpload
          currentImageUrl={profileImage || undefined}
          onImageUploaded={(imageUrl, publicId) => {
            setProfileImage(imageUrl);
            // Auto-save when image is uploaded
            handleUpdateProfile();
          }}
          onImageDeleted={() => {
            setProfileImage(null);
            // Auto-save when image is deleted
            handleUpdateProfile();
          }}
          placeholder="Tap to upload profile image"
          style={{ marginBottom: 20 }}
        />

        {/* Update Button */}
        <AppButton
          title={loading ? 'Updating...' : 'Update Profile Image'}
          onPress={handleUpdateProfile}
          disabled={loading}
          style={authStyles.signUpBtn}
          textStyle={authStyles.signUpText}
        />
        
        {loading && (
          <ActivityIndicator style={authStyles.loader} />
        )}
      </View>
    </SafeAreaView>
  );
};

export default EditProfile;
