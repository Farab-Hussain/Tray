// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AppButton from '../../components/ui/AppButton';
import PasswordStrengthIndicator from '../../components/ui/PasswordStrengthIndicator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authStyles } from '../../constants/styles/authStyles';
import * as LucideIcons from 'lucide-react-native';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validatePassword, PasswordValidation } from '../../utils/passwordValidation';

const Register = ({ navigation, route }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation | null>(null);

  const role = route?.params?.role || 'student';


  useEffect(() => {
    if (password.length > 0) {
      const validation = validatePassword(password);
      setPasswordValidation(validation);
    } else {
      setPasswordValidation(null);
    }
  }, [password]);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    

    const validation = validatePassword(password);
    if (!validation.isValid) {
      Alert.alert(
        'Password Requirements Not Met',
        validation.errors.join('\n\n') + '\n\nPlease improve your password and try again.'
      );
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Password and confirm password do not match');
      return;
    }

    setLoading(true);
    try {
      // Set registration flag to prevent premature role fetching
      await AsyncStorage.setItem('isRegistering', 'true');
      console.log('Register - Registration flag set');
      
      await AsyncStorage.setItem('role', role);
      console.log('Register - Role saved to AsyncStorage FIRST:', role);

      if (role === 'consultant') {
        await AsyncStorage.setItem(
          'consultantVerificationStatus',
          'incomplete',
        );
        console.log('Register - Initial consultant status saved: incomplete');
      }

      console.log('Register - Creating Firebase user...');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCredential.user.uid;
      
      console.log('Register - Firebase user created, UID:', uid);

      // Update user profile with display name
      console.log('Register - Setting display name...');
      await updateProfile(userCredential.user, {
        displayName: name.trim()
      });
      console.log('Register - Display name set:', name.trim());

      // Send email verification
      console.log('Register - Sending email verification...');
      await sendEmailVerification(userCredential.user);
      console.log('Register - Email verification sent');

      // Clear registration flag
      await AsyncStorage.removeItem('isRegistering');
      console.log('Register - Registration flag cleared');

      // Navigate to email verification screen
      console.log('Register - Navigating to email verification');
      navigation.replace('EmailVerification', { 
        email, 
        role, 
        name: name || email.split('@')[0] 
      });
      return;
    } catch (e: any) {
      console.error('Register error:', e);
      // Clear registration flag on error
      await AsyncStorage.removeItem('isRegistering');
      console.log('Register - Registration flag cleared due to error');
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <ScrollView
        style={authStyles.scrollContainer}
        contentContainerStyle={authStyles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={authStyles.authHeading}>Register</Text>

        <Text style={authStyles.label}>Full Name</Text>
        <View style={authStyles.inputWrapper}>
          <TextInput
            style={authStyles.input}
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <Text style={authStyles.label}>Email</Text>
        <View style={authStyles.inputWrapper}>
          <TextInput
            style={authStyles.input}
            placeholder="example@gmail.com"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        </View>

        <Text style={authStyles.label}>Create a password</Text>
        <View style={authStyles.inputWrapper}>
          <TextInput
            style={authStyles.input}
            placeholder="Create a strong password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={authStyles.passwordToggle}
          >
            {showPassword ? (
              <LucideIcons.EyeOff size={24} color="#333333" strokeWidth={1.5} />
            ) : (
              <LucideIcons.Eye size={24} color="#333333" strokeWidth={1.5} />
            )}
          </TouchableOpacity>
        </View>
        
        {passwordValidation && (
          <PasswordStrengthIndicator 
            strength={passwordValidation.strength}
            showFeedback={true}
          />
        )}

        <Text style={authStyles.label}>Re-enter password</Text>
        <View style={authStyles.inputWrapper}>
          <TextInput
            style={authStyles.input}
            placeholder="password must match"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={authStyles.passwordToggle}
          >
            {showConfirmPassword ? (
              <LucideIcons.EyeOff size={24} color="#333333" strokeWidth={1.5} />
            ) : (
              <LucideIcons.Eye size={24} color="#333333" strokeWidth={1.5} />
            )}
          </TouchableOpacity>
        </View>

        <AppButton
          title={loading ? 'Creating account...' : 'Sign up'}
          onPress={handleRegister}
          disabled={loading || (passwordValidation && !passwordValidation.isValid)}
          style={[
            authStyles.signUpBtn,
            (passwordValidation && !passwordValidation.isValid) && { opacity: 0.6 }
          ]}
          textStyle={authStyles.signUpText}
        />

        {loading && (
          <ActivityIndicator
            size="small"
            color="#FFC107"
            style={{ marginTop: 10 }}
          />
        )}

        <View style={authStyles.bottomSection}>
          <View style={authStyles.dividerWrapper}>
            <View style={authStyles.divider} />
            <Text style={authStyles.dividerText}>Or Register With</Text>
            <View style={authStyles.divider} />
          </View>

          <View style={authStyles.socialRow}>
            <Image
              source={require('../../assets/icon/facebook.png')}
              style={authStyles.icon}
            />
            <Image
              source={require('../../assets/icon/google.png')}
              style={authStyles.icon}
            />
            <Image
              source={require('../../assets/icon/apple.png')}
              style={authStyles.icon}
            />
          </View>

          <Text style={authStyles.footer}>
            Already have an account?{' '}
            <Text
              style={authStyles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              Log in
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default Register;
