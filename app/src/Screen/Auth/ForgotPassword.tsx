import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import AppButton from '../../components/ui/AppButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authStyles } from '../../constants/styles/authStyles';
import { ChevronLeft } from 'lucide-react-native';
import { api } from '../../lib/fetcher';

const ForgotPassword = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email');
    setLoading(true);

    try {
      const data = await api.post('/auth/forgot-password', { email });
      Alert.alert('Success', 'Code sent to your email');
      navigation.navigate('Verify', {
        email,
        resetSessionId: data.data.resetSessionId,
      });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={authStyles.backButton}
        >
          <ChevronLeft color="#000" style={authStyles.back} />
        </TouchableOpacity>
        <View style={authStyles.formContainer}>
        <Text style={authStyles.authHeading}>Forgot Password?</Text>
        <Text style={authStyles.authPara}>
          Don’t worry! It happens. Please enter the email associated with your
          account.
        </Text>
        <Text style={authStyles.label}>Email</Text>
        <View style={authStyles.inputWrapper}>
          <TextInput
            style={authStyles.input}
            placeholder="Enter your email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <AppButton
          title={loading ? 'Sending...' : 'Send Code'}
          onPress={handleSendCode}
          disabled={loading}
          style={authStyles.signUpBtn}
          textStyle={authStyles.signUpText}
        />
      </View>

      <View style={[authStyles.bottomContainer]}>
        {/* Footer */}
        <Text style={authStyles.footer}>
          Remember password?{' '}
          <Text
            style={authStyles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            Log in
          </Text>
        </Text>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;
