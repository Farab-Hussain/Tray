import React, { useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateProfile } from 'firebase/auth';
import { sanitizeUserMessage } from '../../../utils/sanitizeUserMessage';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { authStyles } from '../../../constants/styles/authStyles';
import AppButton from '../../../components/ui/AppButton';
import { useAuth } from '../../../contexts/AuthContext';
import { auth } from '../../../lib/firebase';
import { COLORS } from '../../../constants/core/colors';
import { UserService } from '../../../services/user.service';
import { changeUsernameStyles } from '../../../constants/styles/changeUsernameStyles';

const ChangeUsername = ({ navigation }: any) => {
  const { user, refreshUser } = useAuth();
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize with current display name
  useEffect(() => {
    if (user?.displayName) {
      setUsername(user.displayName);
    }
  }, [user?.displayName]);

  const handleChangeUsername = async () => {
    const authUser = auth.currentUser;

    if (!authUser) {
      Alert.alert(
        'Account Error',
        'We could not find your account details. Please log out and log back in before trying again.',
      );
      return;
    }

    if (!username.trim()) {
      setError('Username is required.');
      return;
    }

    if (username.trim().length < 2) {
      setError('Username must be at least 2 characters long.');
      return;
    }

    if (username.trim().length > 50) {
      setError('Username must be less than 50 characters.');
      return;
    }

    // Check if username hasn't changed
    if (username.trim() === user?.displayName) {
      setError('Please enter a different username.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const trimmedUsername = username.trim();

      // Update Firebase Auth displayName
      await updateProfile(authUser, {
        displayName: trimmedUsername,
      });

      // Update backend profile
      await UserService.updateProfile({
        name: trimmedUsername,
      });

      // Refresh user context
      await refreshUser();

      Alert.alert(
        'Username Updated',
        'Your username has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error: any) {
            if (__DEV__) {
        console.error('❌ Change username error:', error)
      };
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        'We could not update your username right now. Please try again later.';

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader title="Change Username" onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={authStyles.formContainer}>
          <Text style={authStyles.authHeading}>Update Username</Text>
          <Text style={authStyles.authPara}>
            Enter a new username for your Tray account. This will be visible to other users.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setError(''); // Clear error when user types
              }}
              placeholder="Enter your username"
              placeholderTextColor={COLORS.gray}
              autoCapitalize="words"
              style={[styles.input, error ? styles.inputError : null]}
              maxLength={50}
            />
            {error ? <Text style={styles.errorText}>{sanitizeUserMessage(error)}</Text> : null}
          </View>

          <AppButton
            title={isSubmitting ? 'Updating...' : 'Update Username'}
            onPress={handleChangeUsername}
            disabled={isSubmitting || !username.trim()}
            style={[authStyles.signUpBtn, styles.submitButton]}
            textStyle={authStyles.signUpText}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = changeUsernameStyles;

export default ChangeUsername;
