import React, { useState, useEffect } from 'react';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { authStyles } from '../../../constants/styles/authStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
// import AppButton from '../../../components/ui/AppButton';
import ImageUpload from '../../../components/ui/ImageUpload';
import { useAuth } from '../../../contexts/AuthContext';
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
          console.log(
            '⚠️ Backend profile API not available (404) - using Firebase photoURL',
          );
        } else {
          console.log(
            '⚠️ Failed to load backend profile:',
            error?.message || error,
          );
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

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) {
      return;
    }

    setLoading(true);
    try {
      console.log('📸 Updating profile image:', profileImage);

      let finalImageUrl = profileImage;

      if (profileImage && profileImage.startsWith('file://')) {
        try {
          console.log('☁️ Uploading image to backend...');
          const uploadResponse = await UserService.uploadAvatar(profileImage);
          console.log('✅ Backend upload response:', uploadResponse);

          finalImageUrl =
            uploadResponse?.avatarUrl || uploadResponse?.url || profileImage;
        } catch (uploadError) {
          console.log(
            '⚠️ Backend upload failed, using local image:',
            uploadError,
          );
        }
      }

      await updateProfile(auth.currentUser, {
        photoURL: finalImageUrl,
      });

      console.log('✅ Firebase Auth profile updated successfully');

      if (profileImage && profileImage.startsWith('file://')) {
        try {
          await UserService.updateProfile({
            avatarUrl: finalImageUrl,
          });
          console.log('✅ Backend profile updated successfully');
        } catch (backendError) {
          console.log('⚠️ Backend profile update failed:', backendError);
        }
      }

      await refreshUser();
      navigation.goBack();
    } catch (error: any) {
      console.error('❌ Update profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite}>
      <ScreenHeader
        title="Edit Profile Image"
        onBackPress={() => navigation.goBack()}
      />

      <View style={authStyles.formContainer}>
        <Text style={authStyles.authHeading}>Update Profile Image</Text>
        <Text style={authStyles.authPara}>
          Choose or take a new profile picture.
        </Text>

        {/* Profile Image Section */}
        <ImageUpload
          currentImageUrl={profileImage || undefined}
          onImageUploaded={(imageUrl, _publicId) => {
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
          style={styles.imageUploadSpacing}
        />

        {/* Update Button */}
        {/* <AppButton
          title={loading ? 'Updating...' : 'Update Profile Image'}
          onPress={handleUpdateProfile}
          disabled={loading}
          style={authStyles.signUpBtn}
          textStyle={authStyles.signUpText}
        /> */}

        {loading && <ActivityIndicator style={authStyles.loader} />}
      </View>
    </SafeAreaView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  imageUploadSpacing: {
    marginBottom: 20,
  },
});
