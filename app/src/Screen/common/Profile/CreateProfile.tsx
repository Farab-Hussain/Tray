import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { useAuth } from '../../../contexts/AuthContext';
import { COLORS } from '../../../constants/core/colors';
import { api } from '../../../lib/fetcher';
import { createProfileStyles } from '../../../constants/styles/createProfileStyles';

const CreateProfile = ({ navigation }: any) => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      // Create user profile
      await api.post('/auth/register', {
        uid: user?.uid,
        name: name.trim(),
        role: 'student', // Default role
        email: user?.email,
      });

      // Refresh user data
      await refreshUser();

      Alert.alert('Success', 'Profile created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigation will be handled by AuthContext
          },
        },
      ]);
    } catch (error: any) {
            if (__DEV__) {
        console.error('Profile creation error:', error)
      };
      Alert.alert('Error', error.response?.data?.error || 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={screenStyles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScreenHeader
          title="Create Profile"
          onBackPress={() => navigation.goBack()}
        />

        <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>
            Let's create your profile to get started
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleCreateProfile}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Create Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = createProfileStyles;

export default CreateProfile;
