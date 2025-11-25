import React, { useState, useEffect, useRef } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AppButton from '../../components/ui/AppButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authStyles } from '../../constants/styles/authStyles';
import { ChevronLeft } from 'lucide-react-native';
import { api } from '../../lib/fetcher';

const Verify = ({ navigation, route }: any) => {
  const { resetSessionId, email } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  const handleVerify = async () => {
    if (!otp) return Alert.alert('Error', 'Please enter the 4 digit code');
    setLoading(true);

    try {
      const data = await api.post('/auth/verify-otp',{resetSessionId,otp})
      Alert.alert('Success', data.data.message);
      navigation.navigate("ResetPassword", { resetSessionId });
    } catch (err: any) {
            if (__DEV__) {
        console.error('Verify OTP error:', err.response?.data || err.message)
      };
      Alert.alert("Error", err.response?.data?.error || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return; // Don't allow resend if countdown is active
    
    setResending(true);
    try {
      await api.post('/auth/forgot-password', { email });
      Alert.alert('Success', 'New code sent to your email');
      
      // Reset countdown
      setCountdown(60);
    } catch (err: any) {
            if (__DEV__) {
        console.error('Resend code error:', err.response?.data || err.message)
      };
      Alert.alert("Error", err.response?.data?.error || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={authStyles.keyboardContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={24}
        showsVerticalScrollIndicator={false}
      >
        <View style={authStyles.screenFlex}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={authStyles.backButton}
        >
          <ChevronLeft color="#000" style={authStyles.back} />
        </TouchableOpacity>
        <View style={authStyles.formContainer}>
        <Text style={authStyles.authHeading}>Please check your email</Text>
        <Text style={authStyles.authPara}>
          We've sent a code to {email || 'your email'}
        </Text>
        <View style={authStyles.inputRow}>
          {[0, 1, 2, 3].map(i => (
            <TextInput
              key={i}
              ref={ref => { inputRefs.current[i] = ref; }}
              style={authStyles.box}
              keyboardType="number-pad"
              maxLength={1}
              value={otp[i] || ''}
              onChangeText={text => {
                const newOtp = otp.slice(0, i) + text + otp.slice(i + 1);
                setOtp(newOtp);
                
                // Auto-focus to next input if text is entered
                if (text && i < 3) {
                  inputRefs.current[i + 1]?.focus();
                }
              }}
              onKeyPress={({ nativeEvent }) => {
                // Handle backspace to go to previous input
                if (nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
                  inputRefs.current[i - 1]?.focus();
                }
              }}
            />
          ))}
          
        </View>

        <AppButton
         title={loading ? 'Verifying...' : 'Verify'}
         onPress={handleVerify}
         disabled={loading}
          style={authStyles.signUpBtn}
          textStyle={authStyles.signUpText}
        />
      </View>

      <View style={authStyles.bottomContainer}>
        {/* Footer */}
        <TouchableOpacity 
          onPress={handleResendCode}
          disabled={countdown > 0 || resending}
          style={{ 
            opacity: countdown > 0 ? 0.5 : 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={[authStyles.footer, { textAlign: 'center' }]}>
            {resending ? 'Sending...' : 'Send code again'} 
            {countdown > 0 && <Text style={authStyles.loginLink}> 00:{countdown}</Text>}
          </Text>
        </TouchableOpacity>
      </View>
      </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default Verify;
