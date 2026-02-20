import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/fetcher';
import { getConsultantApplications } from '../../../services/consultantFlow.service';
import { COLORS } from '../../../constants/core/colors';
import { CheckCircle, XCircle, Clock, Mail } from 'lucide-react-native';
import { consultantVerificationFlowStyles as styles } from '../../../constants/styles/consultantVerificationFlowStyles';
import { logger } from '../../../utils/logger';

type VerificationStep = 
  | 'checking_email'
  | 'email_not_verified'
  | 'checking_profile'
  | 'profile_not_found'
  | 'profile_pending'
  | 'profile_rejected'
  | 'checking_services'
  | 'no_services'
  | 'services_pending'
  | 'ready_to_earn';

interface VerificationState {
  step: VerificationStep;
  message: string;
  isLoading: boolean;
}

export default function ConsultantVerificationFlow() {
  const navigation = useNavigation();
  const { user, activeRole, switchRole } = useAuth();
  const [verificationState, setVerificationState] = useState<VerificationState>({
    step: 'checking_email',
    message: 'Checking email verification...',
    isLoading: true,
  });

  const performVerificationFlow = useCallback(async () => {
    try {
      // Step 1: Check email verification (required)
      setVerificationState({
        step: 'checking_email',
        message: 'Checking email verification...',
        isLoading: true,
      });

      if (!user?.emailVerified) {
        setVerificationState({
          step: 'email_not_verified',
          message: 'Please verify your email address to continue',
          isLoading: false,
        });
        return;
      }

      // Step 2: Check profile status
      setVerificationState({
        step: 'checking_profile',
        message: 'Checking consultant profile...',
        isLoading: true,
      });

      const statusRes = await api.get('/consultant-flow/status');
      const backendStatus = statusRes.data?.status;

      if (backendStatus === 'no_profile' || backendStatus === 'incomplete') {
        setVerificationState({
          step: 'profile_not_found',
          message: 'Please create your consultant profile',
          isLoading: false,
        });
        return;
      }

      if (backendStatus === 'pending') {
        setVerificationState({
          step: 'profile_pending',
          message: 'Your profile is under review',
          isLoading: false,
        });
        return;
      }

      if (backendStatus === 'rejected') {
        setVerificationState({
          step: 'profile_rejected',
          message: 'Your profile was rejected. Please contact support.',
          isLoading: false,
        });
        return;
      }

      if (backendStatus !== 'approved') {
        setVerificationState({
          step: 'profile_not_found',
          message: 'Please create your consultant profile',
          isLoading: false,
        });
        return;
      }

      // Step 3: Check services
      setVerificationState({
        step: 'checking_services',
        message: 'Checking your service applications...',
        isLoading: true,
      });

      const applications = await getConsultantApplications();
      const approvedServices = applications.filter(app => app.status === 'approved');

      if (approvedServices.length === 0) {
        setVerificationState({
          step: 'no_services',
          message: 'Please apply for services to start earning',
          isLoading: false,
        });
        return;
      }

      // All checks passed - automatically switch to consultant role and redirect
      // Automatically switch to consultant role if not already
      if (activeRole !== 'consultant') {
        try {
          await switchRole('consultant');
                    if (__DEV__) {
            logger.debug('ConsultantVerificationFlow - Successfully switched to consultant role')
          };
        } catch (error: any) {
                    if (__DEV__) {
            logger.error('ConsultantVerificationFlow - Error switching role:', error)
          };
          // Continue navigation even if role switch fails
        }
      }
      
      // Use reset to prevent navigation stack issues
      (navigation as any).reset({
        index: 0,
        routes: [{ name: 'ConsultantTabs' as never }],
      });
      return; // Exit early, don't update state

    } catch (error) {
            if (__DEV__) {
        logger.error('Verification flow error:', error)
      };
      setVerificationState({
        step: 'profile_not_found',
        message: 'Unable to verify your status. Please try again.',
        isLoading: false,
      });
    }
  }, [user, navigation, activeRole, switchRole]);

  useEffect(() => {
    if (user) {
      performVerificationFlow();
    }
  }, [user, performVerificationFlow]);

  const getStepIcon = () => {
    switch (verificationState.step) {
      case 'checking_email':
      case 'checking_profile':
      case 'checking_services':
        return <ActivityIndicator size="large" color={COLORS.green} />;
      case 'email_not_verified':
        return <Mail size={48} color={COLORS.orange} />;
      case 'profile_not_found':
        return <XCircle size={48} color={COLORS.red} />;
      case 'profile_pending':
        return <Clock size={48} color={COLORS.orange} />;
      case 'profile_rejected':
        return <XCircle size={48} color={COLORS.red} />;
      case 'no_services':
        return <XCircle size={48} color={COLORS.orange} />;
      case 'ready_to_earn':
        return <CheckCircle size={48} color={COLORS.green} />;
      default:
        return <ActivityIndicator size="large" color={COLORS.green} />;
    }
  };

  const getStepColor = () => {
    switch (verificationState.step) {
      case 'checking_email':
      case 'checking_profile':
      case 'checking_services':
        return COLORS.green;
      case 'email_not_verified':
      case 'profile_pending':
      case 'no_services':
        return COLORS.green;
      case 'profile_not_found':
      case 'profile_rejected':
        return COLORS.green;
      case 'ready_to_earn':
        return COLORS.green;
      default:
        return COLORS.green;
    }
  };

  const handleRetry = () => {
    performVerificationFlow();
  };

  const handleNavigateToNextStep = () => {
    switch (verificationState.step) {
      case 'email_not_verified':
        // Navigate to email verification screen
        (navigation as any).navigate('EmailVerification');
        break;
      case 'profile_not_found':
        (navigation as any).navigate('ConsultantProfileFlow');
        break;
      case 'profile_pending':
      case 'profile_rejected':
        (navigation as any).navigate('PendingApproval');
        break;
      case 'no_services':
        (navigation as any).navigate('ConsultantDashboard');
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {getStepIcon()}
        </View>
        
        <Text style={styles.title}>
          {verificationState.step === 'ready_to_earn' ? 'Welcome Back!' : 'Verifying Your Account'}
        </Text>
        
        <Text style={styles.message}>
          {verificationState.message}
        </Text>

        {!verificationState.isLoading && verificationState.step !== 'ready_to_earn' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={handleNavigateToNextStep} style={[styles.actionButton, { backgroundColor: getStepColor() }]}>
              <Text style={styles.actionButtonText} >
                {verificationState.isLoading ? 'Continuing...' : 'Continue'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity disabled={verificationState.isLoading} onPress={handleRetry} style={[styles.actionButton, styles.retryButton]}>
              <Text style={styles.retryButtonText} >
                {verificationState.isLoading ? 'Retrying...' : 'Retry'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[
              styles.progressDot, 
              ['checking_email', 'email_not_verified'].includes(verificationState.step) 
                ? styles.progressDotActive 
                : styles.progressDotCompleted
            ]}>
              <Text style={styles.progressDotText}>1</Text>
            </View>
            <Text style={styles.progressLabel}>Email</Text>
          </View>
          
          <View style={styles.progressLine} />
          
          <View style={styles.progressStep}>
            <View style={[
              styles.progressDot, 
              ['checking_profile', 'profile_not_found', 'profile_pending', 'profile_rejected'].includes(verificationState.step)
                ? styles.progressDotActive 
                : ['checking_services', 'no_services', 'ready_to_earn'].includes(verificationState.step)
                ? styles.progressDotCompleted
                : styles.progressDotInactive
            ]}>
              <Text style={styles.progressDotText}>2</Text>
            </View>
            <Text style={styles.progressLabel}>Profile</Text>
          </View>
          
          <View style={styles.progressLine} />
          
          <View style={styles.progressStep}>
            <View style={[
              styles.progressDot, 
              ['checking_services', 'no_services'].includes(verificationState.step)
                ? styles.progressDotActive 
                : verificationState.step === 'ready_to_earn'
                ? styles.progressDotCompleted
                : styles.progressDotInactive
            ]}>
              <Text style={styles.progressDotText}>3</Text>
            </View>
            <Text style={styles.progressLabel}>Services</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

