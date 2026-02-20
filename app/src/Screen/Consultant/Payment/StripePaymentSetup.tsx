import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { COLORS } from '../../../constants/core/colors';
import PaymentService from '../../../services/payment.service';
import { CheckCircle, XCircle, Wallet, ExternalLink, AlertCircle } from 'lucide-react-native';
import { stripePaymentSetupStyles as styles } from '../../../constants/styles/stripePaymentSetupStyles';
import { logger } from '../../../utils/logger';

const StripePaymentSetup = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState<{
    hasAccount: boolean;
    accountId?: string;
    status?: {
      detailsSubmitted: boolean;
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      isComplete: boolean;
    };
    onboardingUrl?: string | null;
  } | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [platformFeeAmount, setPlatformFeeAmount] = useState<number | null>(null);
  const [platformFeeLoading, setPlatformFeeLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAccountStatus();
    
    // Handle deep link when returning from Stripe
    const handleDeepLink = async (url: string) => {
      if (url.includes('stripe') || url.includes('return')) {
        // Refresh account status when returning from Stripe
        setTimeout(() => {
          checkAccountStatus();
        }, 1000);
      }
    };

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadPlatformFee = async () => {
      try {
        const config = await PaymentService.getPlatformFeeConfig();
        if (isMounted && typeof config.platformFeeAmount === 'number') {
          setPlatformFeeAmount(config.platformFeeAmount);
        }
      } catch (error) {
                if (__DEV__) {
          logger.error('Error fetching platform fee configuration:', error)
        };
      } finally {
        if (isMounted) {
          setPlatformFeeLoading(false);
        }
      }
    };

    loadPlatformFee();
    return () => {
      isMounted = false;
    };
  }, []);

  const checkAccountStatus = async () => {
    try {
      setLoading(true);
      const status = await PaymentService.getConnectAccountStatus();
      setAccountStatus(status);
    } catch (error: any) {
            if (__DEV__) {
        logger.error('Error checking account status:', error)
      };
      Alert.alert('Error', error.message || 'Failed to check account status');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      setCreatingAccount(true);
      const { onboardingUrl } = await PaymentService.createConnectAccount();
      
      // Open Stripe onboarding URL in browser
      const canOpen = await Linking.canOpenURL(onboardingUrl);
      if (canOpen) {
        await Linking.openURL(onboardingUrl);
      } else {
        Alert.alert('Error', 'Cannot open Stripe onboarding page');
      }
    } catch (error: any) {
            if (__DEV__) {
        logger.error('Error creating account:', error)
      };
      Alert.alert('Error', error.message || 'Failed to create Stripe account');
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleContinueOnboarding = async () => {
    if (!accountStatus?.onboardingUrl) {
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(accountStatus.onboardingUrl);
      if (canOpen) {
        await Linking.openURL(accountStatus.onboardingUrl);
      } else {
        Alert.alert('Error', 'Cannot open Stripe onboarding page');
      }
    } catch (error: any) {
            if (__DEV__) {
        logger.error('Error opening onboarding:', error)
      };
      Alert.alert('Error', 'Failed to open onboarding page');
    }
  };

  const StatusCard = ({ title, value, isComplete }: { title: string; value: boolean; isComplete: boolean }) => (
    <View style={styles.statusCard}>
      <View style={styles.statusHeader}>
        {isComplete ? (
          <CheckCircle size={20} color={COLORS.green} />
        ) : (
          <XCircle size={20} color={COLORS.red} />
        )}
        <Text style={styles.statusTitle}>{title}</Text>
      </View>
      <Text style={[styles.statusValue, { color: isComplete ? COLORS.green : COLORS.red }]}>
        {value ? 'Complete' : 'Pending'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Payment Setup" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={styles.loadingText}>Checking account status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isAccountComplete = accountStatus?.status?.isComplete || false;
  const platformFeeDisplay =
    platformFeeAmount !== null
      ? `$${platformFeeAmount.toFixed(2)}`
      : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Payment Setup" onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Wallet size={48} color={COLORS.green} />
          <Text style={styles.title}>Stripe Payment Account</Text>
          <Text style={styles.subtitle}>
            Set up your payment account to receive payments for completed sessions
          </Text>
        </View>

        {/* Account Status */}
        {accountStatus?.hasAccount ? (
          <>
            <View style={styles.statusContainer}>
              <Text style={styles.sectionTitle}>Account Status</Text>
              
              <StatusCard
                title="Account Details"
                value={accountStatus.status?.detailsSubmitted || false}
                isComplete={accountStatus.status?.detailsSubmitted || false}
              />
              
              <StatusCard
                title="Charges Enabled"
                value={accountStatus.status?.chargesEnabled || false}
                isComplete={accountStatus.status?.chargesEnabled || false}
              />
              
              <StatusCard
                title="Payouts Enabled"
                value={accountStatus.status?.payoutsEnabled || false}
                isComplete={accountStatus.status?.payoutsEnabled || false}
              />

              {isAccountComplete ? (
                <View style={styles.successCard}>
                  <CheckCircle size={32} color={COLORS.green} />
                  <Text style={styles.successTitle}>Account Setup Complete!</Text>
                  <Text style={styles.successText}>
                    Your payment account is ready. You'll receive payments automatically after completing sessions.
                  </Text>
                </View>
              ) : (
                <View style={styles.warningCard}>
                  <AlertCircle size={32} color={COLORS.orange} />
                  <Text style={styles.warningTitle}>Setup Incomplete</Text>
                  <Text style={styles.warningText}>
                    Please complete the Stripe onboarding process to receive payments.
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            {!isAccountComplete && accountStatus.onboardingUrl && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleContinueOnboarding}
                activeOpacity={0.8}
              >
                <ExternalLink size={20} color={COLORS.white} />
                <Text style={styles.primaryButtonText}>Continue Setup on Stripe</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={checkAccountStatus}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Refresh Status</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* No Account */}
            <View style={styles.infoCard}>
              <AlertCircle size={32} color={COLORS.blue} />
              <Text style={styles.infoTitle}>No Payment Account</Text>
              <Text style={[styles.infoText, { textAlign: 'center' }]}>
                You need to set up a Stripe account to receive payments. This will redirect you to Stripe's secure
                onboarding page where you'll provide your bank account details and business information.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCreateAccount}
              disabled={creatingAccount}
              activeOpacity={0.8}
            >
              {creatingAccount ? (
                <>
                  <ActivityIndicator size="small" color={COLORS.white} />
                  <Text style={styles.primaryButtonText}>Creating Account...</Text>
                </>
              ) : (
                <>
                  <Wallet size={20} color={COLORS.white} />
                  <Text style={styles.primaryButtonText}>Create Stripe Account</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>How It Works</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={[styles.infoText, styles.infoItemText]}>
              You'll be redirected to Stripe's secure platform to complete account setup
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={[styles.infoText, styles.infoItemText]}>
              After completing a session, payments are automatically transferred to your account
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={[styles.infoText, styles.infoItemText]}>
              {platformFeeLoading
                ? 'A platform fee is deducted from each payment (loading current fee...)'
                : platformFeeDisplay
                ? `A platform fee of ${platformFeeDisplay} is deducted from each payment`
                : 'A platform fee is deducted from each payment.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


export default StripePaymentSetup;

