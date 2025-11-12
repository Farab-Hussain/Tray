import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { authStyles } from '../../../constants/styles/authStyles';
import AppButton from '../../../components/ui/AppButton';
import { useAuth } from '../../../contexts/AuthContext';
import { auth } from '../../../lib/firebase';
import { COLORS } from '../../../constants/core/colors';
import { Eye, EyeOff } from 'lucide-react-native';

const ChangePassword = ({ navigation }: any) => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    const email = user?.email;
    const authUser = auth.currentUser;

    if (!email || !authUser) {
      Alert.alert(
        'Account Error',
        'We could not find your account details. Please log out and log back in before trying again.',
      );
      return;
    }

    setCurrentPasswordError('');
    setGeneralError('');

    if (!currentPassword.trim()) {
      setCurrentPasswordError('Please enter your current password.');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('New Password Required', 'Please enter a new password.');
      return;
    }

    if (newPassword.trim().length < 6) {
      Alert.alert('Password Too Short', 'Your new password must be at least 6 characters long.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      Alert.alert('Passwords Do Not Match', 'Please make sure both new password fields match.');
      return;
    }

    try {
      setIsSubmitting(true);

      const credential = EmailAuthProvider.credential(email, currentPassword);
      await reauthenticateWithCredential(authUser, credential);

      await updatePassword(authUser, newPassword.trim());

      Alert.alert(
        'Password Updated',
        'Your password has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('❌ Change password error:', error);

      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        setCurrentPasswordError('The current password you entered is incorrect. Please enter the correct password.');
      } else if (error?.code === 'auth/too-many-requests') {
        setGeneralError('Too many attempts. Please wait a moment before trying again.');
      } else if (error?.code === 'auth/requires-recent-login') {
        setGeneralError('Please log out and sign in again before changing your password.');
      } else {
        setGeneralError('We could not update your password right now. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader title="Change Password" onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={authStyles.formContainer}>
          <Text style={authStyles.authHeading}>Update Password</Text>
          <Text style={authStyles.authPara}>
            Enter your current password, then choose a new password for your Tray account.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={COLORS.gray}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, styles.inputWithIcon]}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(prev => !prev)}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showCurrentPassword ? (
                  <EyeOff size={20} color={COLORS.gray} />
                ) : (
                  <Eye size={20} color={COLORS.gray} />
                )}
              </TouchableOpacity>
            </View>
            {currentPasswordError ? (
              <Text style={styles.errorText}>{currentPasswordError}</Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={COLORS.gray}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, styles.inputWithIcon]}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(prev => !prev)}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showNewPassword ? (
                  <EyeOff size={20} color={COLORS.gray} />
                ) : (
                  <Eye size={20} color={COLORS.gray} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor={COLORS.gray}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, styles.inputWithIcon]}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(prev => !prev)}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={COLORS.gray} />
                ) : (
                  <Eye size={20} color={COLORS.gray} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <AppButton
            title={isSubmitting ? 'Updating...' : 'Update Password'}
            onPress={handleChangePassword}
            disabled={isSubmitting}
            style={[authStyles.signUpBtn, styles.submitButton]}
            textStyle={authStyles.signUpText}
          />
          {generalError ? (
            <Text style={[styles.errorText, styles.generalError]}>{generalError}</Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 6,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  submitButton: {
    marginTop: 12,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.red,
  },
  generalError: {
    textAlign: 'center',
  },
});

export default ChangePassword;

