import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
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
  const [profileImagePublicId, setProfileImagePublicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiChecked, setApiChecked] = useState(false);
  const { user, refreshUser } = useAuth();

  const loadProfileImage = useCallback(async () => {
    if (!user) return;

    const userPhotoURL = user.photoURL;

    // Use Firebase photoURL immediately for faster loading
    // Then fetch from backend in background (non-blocking)
    if (userPhotoURL) {
      setProfileImage(userPhotoURL);
    }

    // Fetch profile image from backend in background (non-blocking)
    // This allows the UI to show immediately with Firebase data
    UserService.getUserProfile()
      .then(backendProfile => {
        // Prefer backend profileImage over Firebase photoURL
        const backendImageUrl = backendProfile?.profileImage || backendProfile?.avatarUrl;
        if (backendImageUrl) {
          console.log('✅ Using backend profile image:', backendImageUrl);
          setProfileImage(backendImageUrl);
        }
      })
      .catch(error => {
        // Silently fail - we already have Firebase photoURL as fallback
        if (__DEV__ && error?.response?.status !== 404) {
          console.log('⚠️ Failed to load backend profile:', error?.message || error);
        }
      });
  }, [user]);

  // Load profile image when component mounts
  useEffect(() => {
    if (!apiChecked && user) {
      loadProfileImage();
      setApiChecked(true);
    }
  }, [user?.uid, apiChecked, user, loadProfileImage]);

  // Reload profile image when user.photoURL changes (from AuthContext refreshUser)
  useEffect(() => {
    if (user?.photoURL && apiChecked) {
      console.log('🔄 [EditProfile] user.photoURL changed, reloading image');
      loadProfileImage();
    }
  }, [user?.photoURL, apiChecked, loadProfileImage]);

  // Reload profile image when screen comes into focus (e.g., after navigating back)
  useFocusEffect(
    useCallback(() => {
      loadProfileImage();
    }, [loadProfileImage])
  );

  const handleUpdateProfile = async (newImageUrl?: string | null) => {
    if (!auth.currentUser) {
      return;
    }

    setLoading(true);
    try {
      // Use the provided newImageUrl if available, otherwise use state
      // This fixes the race condition where state hasn't updated yet
      const imageUrlToUse = newImageUrl !== undefined ? newImageUrl : profileImage;
      const isDeleting = imageUrlToUse === null;
      console.log('📸 Updating profile image:', imageUrlToUse, isDeleting ? '(DELETING)' : '');
      console.log('📸 Using imageUrlToUse:', imageUrlToUse);
      console.log('📸 State profileImage:', profileImage);
      console.log('📸 Provided newImageUrl:', newImageUrl);

      // ImageUpload component already uploads the image and returns the Cloudinary URL
      // So imageUrlToUse is already the final URL, not a file:// URI
      const finalImageUrl = imageUrlToUse;

      // Update Firebase Auth profile
      if (finalImageUrl) {
        await updateProfile(auth.currentUser, {
          photoURL: finalImageUrl,
        });
        console.log('✅ Firebase Auth profile updated successfully');
      } else {
        // If profileImage is null, clear the photoURL
        await updateProfile(auth.currentUser, {
          photoURL: null,
        });
        console.log('✅ Firebase Auth profile image cleared');
      }

      // Always update backend with the image URL (or null if deleted)
      // The image is already uploaded by ImageUpload component, so we just save the URL
      try {
        // Explicitly pass null if deleting, otherwise pass the URL
        const updateData = isDeleting 
          ? { avatarUrl: null as null }
          : { avatarUrl: finalImageUrl };
        
        console.log('🔄 Sending to backend:', updateData);
        
        // Update backend - no need to verify since we trust the response
        await UserService.updateProfile(updateData);
        console.log('✅ Backend profile updated successfully');
      } catch (backendError: any) {
        console.error('⚠️ Backend profile update failed:', backendError);
        throw backendError; // Re-throw to prevent navigation on error
      }

      // Refresh user data in parallel (don't wait for it to block navigation)
      refreshUser().then(() => {
        console.log('✅ User data refreshed');
      }).catch(err => {
        console.warn('⚠️ User refresh failed (non-blocking):', err);
      });
      
      // Update local state immediately for instant UI feedback
      if (finalImageUrl) {
        setProfileImage(finalImageUrl);
      } else {
        setProfileImage(null);
      }
      
      // Navigate back immediately - no need to wait for reload or delays
      navigation.goBack();
    } catch (error: any) {
      console.error('❌ Update profile error:', error);
      // Don't navigate on error - let user see what went wrong
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
          currentPublicId={profileImagePublicId || undefined}
          onImageUploaded={(imageUrl, publicId) => {
            console.log('📸 onImageUploaded called with:', { imageUrl, publicId });
            console.log('📸 Previous profileImage:', profileImage);
            setProfileImage(imageUrl);
            setProfileImagePublicId(publicId);
            console.log('📸 New profileImage set to:', imageUrl);
            // Auto-save when image is uploaded - pass the new URL directly to avoid race condition
            handleUpdateProfile(imageUrl);
          }}
          onImageDeleted={async () => {
            setProfileImage(null);
            setProfileImagePublicId(null);
            // Auto-save when image is deleted - pass null explicitly to avoid race condition
            await handleUpdateProfile(null);
          }}
          placeholder="Tap to upload profile image"
          style={styles.imageUploadSpacing}
          showDeleteButton={false}
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
