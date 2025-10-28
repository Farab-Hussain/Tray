import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import AppButton from '../../components/ui/AppButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authStyles } from '../../constants/styles/authStyles';
import * as LucideIcons from 'lucide-react-native';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { api } from '../../lib/fetcher';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getConsultantVerificationStatus, getConsultantApplications } from '../../services/consultantFlow.service';

const Login = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Note: We fetch role directly from backend on login instead of using AuthContext's role state
  // This ensures we get the most up-to-date role information

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('Login - Attempting to sign in with Firebase...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      
      console.log('Login - Firebase sign-in successful, token obtained');
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        console.log('Login - User email not verified');
        Alert.alert(
          'Email Not Verified',
          'Please verify your email address before logging in. Check your email for a verification link.',
          [
            {
              text: 'Resend Verification',
              onPress: async () => {
                try {
                  await sendEmailVerification(userCredential.user);
                  Alert.alert(
                    'Verification Email Sent',
                    'A new verification email has been sent to your email address.',
                    [
                      {
                        text: 'Go to Verification',
                        onPress: () => {
                          navigation.navigate('EmailVerification', { 
                            email: userCredential.user.email,
                            fromLogin: true 
                          });
                        },
                      },
                      { text: 'OK' },
                    ]
                  );
                } catch (error) {
                  console.error('Resend verification error:', error);
                  Alert.alert('Error', 'Failed to resend verification email.');
                }
              },
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );
        return;
      }
      
      console.log('Login - Email verified, proceeding with login');
      
      // Set token for backend calls
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch role from backend
      console.log('Login - Fetching user role from backend...');
      const res = await api.get('/auth/me');
      console.log('Login - /auth/me response:', JSON.stringify(res.data, null, 2));
      
      const userRole = res.data?.role || 'student';
      console.log('Login - User role:', userRole);
      console.log('Login - User email:', email);
      
      // Save role to AsyncStorage immediately so AuthContext can read it
      await AsyncStorage.setItem('role', userRole);
      console.log('Login - Role saved to AsyncStorage:', userRole);
      
      // For consultants, also fetch and save verification status
      if (userRole === 'consultant') {
        try {
          const statusRes = await api.get('/consultant-flow/status');
          const backendStatus = statusRes.data?.status;
          let verificationStatus: 'incomplete' | 'pending' | 'approved' | 'rejected';
          
          if (backendStatus === 'no_profile') {
            verificationStatus = 'incomplete';
          } else if (backendStatus === 'pending') {
            verificationStatus = 'pending';
          } else if (backendStatus === 'approved') {
            verificationStatus = 'approved';
          } else if (backendStatus === 'rejected') {
            verificationStatus = 'rejected';
          } else {
            verificationStatus = 'incomplete';
          }
          
          await AsyncStorage.setItem('consultantVerificationStatus', verificationStatus);
          console.log('Login - Consultant verification status saved:', verificationStatus);
        } catch (error) {
          console.error('Login - Error fetching consultant status:', error);
          await AsyncStorage.setItem('consultantVerificationStatus', 'incomplete');
        }
      }
      
      // Wait a moment for AuthContext to sync (it loads from AsyncStorage on init)
      await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
      
      // Navigate based on role and status
      if (userRole === 'consultant') {
        console.log('Login - User is consultant, checking verification status...');
        
        // Check consultant verification status to determine navigation
        try {
          const statusRes = await api.get('/consultant-flow/status');
          const backendStatus = statusRes.data?.status;
          console.log('Login - Consultant status:', backendStatus);
          
          if (backendStatus === 'no_profile' || backendStatus === 'incomplete') {
            console.log('Login - No profile found, navigating to profile creation');
            navigation.replace('Screen', { 
              screen: 'ConsultantProfileFlow'
            });
          } else if (backendStatus === 'pending') {
            console.log('Login - Profile pending, navigating to pending approval');
            navigation.replace('Screen', { 
              screen: 'PendingApproval'
            });
          } else if (backendStatus === 'approved') {
            console.log('Login - Profile approved, checking services status');
            // Check if consultant has approved services
            try {
              const applicationsResponse = await getConsultantApplications();
              const approvedServices = applicationsResponse.filter(app => app.status === 'approved');
              
              if (approvedServices.length > 0) {
                console.log('Login - Profile and services approved, navigating to consultant applications screen');
                navigation.replace('Screen', { 
                  screen: 'Applications',
                  params: { role: 'consultant' }
                });
              } else {
                console.log('Login - Profile approved but no services approved, navigating to pending approval');
                navigation.replace('Screen', { 
                  screen: 'PendingApproval'
                });
              }
            } catch (servicesError) {
              console.error('Login - Error checking services:', servicesError);
              // If services check fails, navigate to pending approval
              navigation.replace('Screen', { 
                screen: 'PendingApproval'
              });
            }
          } else if (backendStatus === 'rejected') {
            console.log('Login - Profile rejected, navigating to pending approval');
            navigation.replace('Screen', { 
              screen: 'PendingApproval'
            });
          } else {
            console.log('Login - Unknown status, navigating to profile creation');
            navigation.replace('Screen', { 
              screen: 'ConsultantProfileFlow'
            });
          }
        } catch (statusError) {
          console.error('Login - Error checking consultant status:', statusError);
          // If status check fails, navigate to profile creation as fallback
          navigation.replace('Screen', { 
            screen: 'ConsultantProfileFlow'
          });
        }
      } else {
        console.log('Login - User is student, navigating to student tabs');
        navigation.replace('Screen', { 
          screen: 'MainTabs',
          params: { role: 'student' }
        });
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific Firebase errors
      let errorMessage = 'Something went wrong';
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Login Failed', errorMessage);
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
        <Text style={authStyles.authHeading}>Login</Text>
        
        {/* Email Input */}
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
        
        {/* Password Input */}
        <Text style={authStyles.label}>Password</Text>
        <View style={authStyles.inputWrapper}>
          <TextInput
            style={authStyles.input}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={{ padding: 8, justifyContent: 'center', alignItems: 'center' }}
          >
            {showPassword ? (
              <LucideIcons.EyeOff size={24} color="#333333" strokeWidth={1.5} />
            ) : (
              <LucideIcons.Eye size={24} color="#333333" strokeWidth={1.5} />
            )}
          </TouchableOpacity>
        </View>
        
        {/* Forgot Password */}
        <TouchableOpacity
          style={authStyles.forgotPassword}
          onPress={() => {
            navigation.navigate('ForgotPassword');
          }}
        >
          <Text>Forgot password?</Text>
        </TouchableOpacity>
        
        {/* Login Button */}
        <AppButton
          title={loading ? "Logging in..." : "Log in"}
          onPress={handleLogin}
          style={authStyles.signUpBtn}
          textStyle={authStyles.signUpText}
          disabled={loading}
        />
        
        {loading && (
          <ActivityIndicator size="small" color="#FFC107" style={{ marginTop: 10 }} />
        )}

        {/* Bottom Section - Now inside ScrollView */}
        <View style={authStyles.bottomSection}>
          <View style={authStyles.dividerWrapper}>
            <View style={authStyles.divider} />
            <Text style={authStyles.dividerText}>Or Login With</Text>
            <View style={authStyles.divider} />
          </View>

          {/* Social Buttons */}
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

          {/* Footer */}
          <Text style={authStyles.footer}>
            Don't have an account?{' '}
            <Text
              style={authStyles.loginLink}
              onPress={() => navigation.navigate('Register')}
            >
              Register
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Login;
