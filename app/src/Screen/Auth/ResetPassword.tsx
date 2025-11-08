import React, { useState, useEffect } from "react";
import { Text, TextInput, View, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import AppButton from "../../components/ui/AppButton";
import PasswordStrengthIndicator from "../../components/ui/PasswordStrengthIndicator";
import { SafeAreaView } from "react-native-safe-area-context";
import { authStyles } from "../../constants/styles/authStyles";
import { api } from "../../lib/fetcher";
import { validatePassword, PasswordValidation } from "../../utils/passwordValidation";
import { Eye, EyeOff } from "lucide-react-native";
import { COLORS } from "../../constants/core/colors";

const ResetPassword = ({ navigation, route }: any) => {
  const { resetSessionId } = route.params;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate password in real-time
  useEffect(() => {
    if (newPassword.length > 0) {
      const validation = validatePassword(newPassword);
      setPasswordValidation(validation);
    } else {
      setPasswordValidation(null);
    }
  }, [newPassword]);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword)
      return Alert.alert('Error', 'Please fill all fields');
    
    // Validate password strength
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      Alert.alert(
        'Password Requirements Not Met',
        validation.errors.join('\n\n') + '\n\nPlease improve your password and try again.'
      );
      return;
    }
    
    if (newPassword !== confirmPassword)
      return Alert.alert('Error', 'Passwords do not match');

    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", {
        resetSessionId,
        newPassword,
      });
      Alert.alert("Success", data.message, [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      console.error('Reset password error:', err);
      
      // Handle different error scenarios
      let errorMessage = "Something went wrong";
      
      if (err && typeof err === 'object') {
        if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
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
        <View style={authStyles.formContainer}>
        <Text style={authStyles.authHeading}>Reset Password</Text>
        <Text style={authStyles.authPara}>Enter your new password below.</Text>

        <Text style={authStyles.label}>New Password</Text>
        <View style={authStyles.inputWrapper}>
          <TextInput
            style={authStyles.input}
            secureTextEntry={!showNewPassword}
            placeholder="Enter new password"
            placeholderTextColor={COLORS.lightGray}
            value={newPassword}
            onChangeText={setNewPassword}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowNewPassword(!showNewPassword)}
            style={authStyles.passwordToggle}
          >
            {showNewPassword ? (
              <EyeOff size={20} color={COLORS.gray} />
            ) : (
              <Eye size={20} color={COLORS.gray} />
            )}
          </TouchableOpacity>
        </View>
        
        {/* Password Strength Indicator with feedback */}
        {passwordValidation && (
          <PasswordStrengthIndicator 
            strength={passwordValidation.strength}
            showFeedback={true}
          />
        )}

        <Text style={authStyles.label}>Confirm Password</Text>
        <View style={authStyles.inputWrapper}>
          <TextInput
            style={authStyles.input}
            secureTextEntry={!showConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor={COLORS.lightGray}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={authStyles.passwordToggle}
          >
            {showConfirmPassword ? (
              <EyeOff size={20} color={COLORS.gray} />
            ) : (
              <Eye size={20} color={COLORS.gray} />
            )}
          </TouchableOpacity>
        </View>

        <AppButton
          title={loading ? 'Resetting...' : 'Reset Password'}
          onPress={handleResetPassword}
          disabled={loading || (passwordValidation ? !passwordValidation.isValid : false)}
          style={[
            authStyles.signUpBtn,
            ...(passwordValidation && !passwordValidation.isValid ? [{ opacity: 0.6 }] : [])
          ]}
          textStyle={authStyles.signUpText}
        />
        {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
      </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default ResetPassword;
