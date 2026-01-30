import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStripe } from '@stripe/stripe-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { COLORS } from '../../../constants/core/colors';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { PaymentService } from '../../../services/payment.service';
import { paymentScreenStyles } from '../../../constants/styles/paymentScreenStyles';

interface JobPostingPaymentScreenProps {
  navigation: any;
  route: {
    params: {
      jobData?: any;
      returnScreen?: string;
    };
  };
}

const JobPostingPaymentScreen: React.FC<JobPostingPaymentScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [jobData, setJobData] = useState(route.params?.jobData || null);

  const JOB_POSTING_FEE = 1.00; // $1.00

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  const initializePaymentSheet = async () => {
    try {
      setLoading(true);

      // Create payment intent for job posting
      const response = await PaymentService.createJobPostingPaymentIntent();
      
      if (response.success && response.clientSecret) {
        const { error } = await initPaymentSheet({
          paymentIntentClientSecret: response.clientSecret,
          merchantDisplayName: 'Tray Platform',
          allowsDelayedPaymentMethods: true,
          defaultBillingDetails: {
            name: user?.name || '',
            email: user?.email || '',
          },
        });

        if (error) {
          Alert.alert('Error', 'Failed to initialize payment sheet');
          console.error('Payment sheet initialization error:', error);
        } else {
          setPaymentIntent(response);
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to create payment intent');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      Alert.alert('Error', 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentIntent) {
      Alert.alert('Error', 'Payment not initialized');
      return;
    }

    try {
      setProcessing(true);

      const { error } = await presentPaymentSheet();

      if (error) {
        Alert.alert('Payment Failed', error.message);
        console.error('Payment error:', error);
      } else {
        // Payment successful - confirm and record
        await confirmPayment();
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      Alert.alert('Error', 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const confirmPayment = async () => {
    try {
      const response = await PaymentService.confirmJobPostingPayment(paymentIntent.paymentIntentId);
      
      if (response.success) {
        Alert.alert(
          'Payment Successful',
          'Your job posting payment has been processed successfully. You can now post your job.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to job posting screen or proceed with posting
                if (jobData) {
                  navigation.navigate('CreateJob', { 
                    jobData, 
                    paymentConfirmed: true 
                  });
                } else {
                  navigation.goBack();
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to confirm payment');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      Alert.alert('Error', 'Failed to confirm payment');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Payment',
      'Are you sure you want to cancel? Your job posting will not be processed.',
      [
        {
          text: 'Keep Payment',
          style: 'cancel',
        },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={paymentScreenStyles.container}>
        <ScreenHeader 
          title="Job Posting Payment" 
          onBackPress={() => navigation.goBack()} 
        />
        <View style={paymentScreenStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue} />
          <Text style={paymentScreenStyles.loadingText}>
            Initializing payment...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={paymentScreenStyles.container}>
      <ScreenHeader 
        title="Job Posting Payment" 
        onBackPress={() => navigation.goBack()} 
      />
      
      <ScrollView style={paymentScreenStyles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={paymentScreenStyles.content}>
          {/* Payment Summary */}
          <View style={paymentScreenStyles.summaryCard}>
            <Text style={paymentScreenStyles.summaryTitle}>
              Job Posting Fee
            </Text>
            <View style={paymentScreenStyles.priceContainer}>
              <Text style={paymentScreenStyles.currencySymbol}>$</Text>
              <Text style={paymentScreenStyles.priceAmount}>
                {JOB_POSTING_FEE.toFixed(2)}
              </Text>
            </View>
            <Text style={paymentScreenStyles.summaryDescription}>
              One-time fee for posting a job on the Tray platform
            </Text>
          </View>

          {/* Payment Benefits */}
          <View style={paymentScreenStyles.benefitsCard}>
            <Text style={paymentScreenStyles.benefitsTitle}>
              What you get:
            </Text>
            <View style={paymentScreenStyles.benefitItem}>
              <Text style={paymentScreenStyles.benefitText}>
                • 30 days of job posting visibility
              </Text>
            </View>
            <View style={paymentScreenStyles.benefitItem}>
              <Text style={paymentScreenStyles.benefitText}>
                • Access to qualified candidates
              </Text>
            </View>
            <View style={paymentScreenStyles.benefitItem}>
              <Text style={paymentScreenStyles.benefitText}>
                • Application management tools
              </Text>
            </View>
            <View style={paymentScreenStyles.benefitItem}>
              <Text style={paymentScreenStyles.benefitText}>
                • Candidate matching system
              </Text>
            </View>
          </View>

          {/* Payment Info */}
          <View style={paymentScreenStyles.infoCard}>
            <Text style={paymentScreenStyles.infoTitle}>
              Payment Information
            </Text>
            <Text style={paymentScreenStyles.infoText}>
              Your payment is securely processed by Stripe. We accept all major credit and debit cards.
            </Text>
            <View style={paymentScreenStyles.secureBadge}>
              <Text style={paymentScreenStyles.secureBadgeText}>
                🔒 Secure Payment
              </Text>
            </View>
          </View>

          {/* Refund Policy */}
          <View style={paymentScreenStyles.policyCard}>
            <Text style={paymentScreenStyles.policyTitle}>
              Refund Policy
            </Text>
            <Text style={paymentScreenStyles.policyText}>
              Job posting fees are non-refundable once the job is posted. However, you can edit or remove your job posting at any time.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={paymentScreenStyles.buttonContainer}>
          <TouchableOpacity
            style={[
              paymentScreenStyles.cancelButton,
              { marginBottom: 12 }
            ]}
            onPress={handleCancel}
            disabled={processing}
          >
            <Text style={paymentScreenStyles.cancelButtonText}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              paymentScreenStyles.payButton,
              processing && paymentScreenStyles.payButtonDisabled
            ]}
            onPress={handlePayment}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={paymentScreenStyles.payButtonText}>
                Pay ${JOB_POSTING_FEE.toFixed(2)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default JobPostingPaymentScreen;
