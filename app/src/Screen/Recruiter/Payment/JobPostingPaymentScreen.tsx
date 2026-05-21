import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStripe } from '@stripe/stripe-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { COLORS } from '../../../constants/core/colors';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import PaymentService from '../../../services/payment.service';
import { paymentScreenStyles } from '../../../constants/styles/paymentScreenStyles';
import { Lock, AlertCircle } from 'lucide-react-native';

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
  const [jobData] = useState(route.params?.jobData || null);
  const [bundleFee, setBundleFee] = useState(5);
  const [displayAmount, setDisplayAmount] = useState(5);
  const [postingsPerBundle, setPostingsPerBundle] = useState(3);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [promotionCode, setPromotionCode] = useState('');

  const initializePaymentSheet = useCallback(async () => {
    try {
      setLoading(true);

      const status = await PaymentService.getJobPostingPaymentStatus();
      const fee = status.bundleFee ?? 5;
      setBundleFee(fee);
      setDisplayAmount(fee);
      setPostingsPerBundle(status.postingsPerBundle ?? 3);
      setCreditsRemaining(status.creditsRemaining ?? 0);

      if (status.paid && (status.creditsRemaining ?? 0) > 0) {
        Alert.alert(
          'Credits Available',
          `You have ${status.creditsRemaining} job posting(s) remaining.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
        return;
      }

      const response = await PaymentService.createJobPostingPaymentIntent(
        promotionCode || undefined,
      );
      
      if (response.success && response.clientSecret) {
        const { error } = await initPaymentSheet({
          paymentIntentClientSecret: response.clientSecret,
          merchantDisplayName: 'Tray Platform',
          allowsDelayedPaymentMethods: true,
          defaultBillingDetails: {
            name: user?.displayName || user?.email || '',
            email: user?.email || '',
          },
        });

        if (error) {
          Alert.alert('Issue', 'Failed to initialize payment sheet');
          console.error('Payment sheet initialization error:', error);
        } else {
          setPaymentIntent(response);
          if (response.bundleFee) {
            setBundleFee(response.bundleFee);
          }
          if (response.postingsPerBundle) {
            setPostingsPerBundle(response.postingsPerBundle);
          }
          if (typeof response.amount === 'number') {
            setDisplayAmount(response.amount / 100);
          }
        }
      } else {
        Alert.alert('Issue', response.error || 'Failed to create payment intent');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      Alert.alert('Issue', 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  }, [user, initPaymentSheet, navigation, promotionCode]);

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  const handleApplyPromo = () => {
    initializePaymentSheet();
  };

  const handlePayment = async () => {
    if (!paymentIntent) {
      Alert.alert('Issue', 'Payment not initialized');
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
      Alert.alert('Issue', 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const confirmPayment = async () => {
    try {
      const response = await PaymentService.confirmJobPostingPayment(paymentIntent.paymentIntentId);
      
      if (response.success) {
        const creditsMsg = response.creditsRemaining != null
          ? ` You now have ${response.creditsRemaining} posting(s) remaining.`
          : '';

        Alert.alert(
          'Payment Successful',
          `Your posting bundle was purchased.${creditsMsg} Posting your job now...`,
          [
            {
              text: 'OK',
              onPress: async () => {
                try {
                  // If we have job data, post the job directly
                  if (jobData) {
                    // Import JobService locally to avoid circular imports
                    const { JobService } = await import('../../../services/job.service');
                    
                    // Post the job with the payment confirmation flag
                    await JobService.createJob({
                      ...jobData,
                      paymentConfirmed: true // Add payment confirmation flag
                    });
                    
                    // Navigate to my jobs or success screen
                    navigation.replace('RecruiterMyJobs'); // Use replace to prevent going back to payment
                  } else {
                    // Fallback: go back if no job data
                    navigation.goBack();
                  }
                } catch (error: any) {
                  console.error('Error posting job after payment:', error);
                  Alert.alert(
                    'Error',
                    'Payment was successful but there was an error posting your job. Please try again.',
                    [
                      {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                      }
                    ]
                  );
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Issue', response.error || 'Failed to confirm payment');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      Alert.alert('Issue', 'Failed to confirm payment');
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
          {/* Hero Pricing Card */}
          <View style={paymentScreenStyles.pricingCard}>
            <View style={paymentScreenStyles.pricingHeader}>
              <Text style={paymentScreenStyles.pricingTitle}>Job Posting Bundle</Text>
              <View style={paymentScreenStyles.priceContainer}>
                <Text style={paymentScreenStyles.currencySymbol}>$</Text>
                <Text style={paymentScreenStyles.priceAmount}>{displayAmount.toFixed(2)}</Text>
              </View>
              <Text style={paymentScreenStyles.pricingSubtitle}>
                {postingsPerBundle} job postings per bundle
                {creditsRemaining > 0 ? ` · ${creditsRemaining} credit(s) left` : ''}
              </Text>
            </View>
            
            <View style={paymentScreenStyles.pricingDivider} />
            <View style={paymentScreenStyles.policyCard}>
            <View style={paymentScreenStyles.policyHeader}>
              <AlertCircle size={20} color={COLORS.orange} />
              <Text style={paymentScreenStyles.policyTitle}>Refund Policy</Text>
            </View>
            <Text style={paymentScreenStyles.policyDescription}>
              Bundle credits are used when you publish a job. Unused credits do not expire. Fees are non-refundable once a job is posted.
            </Text>
          </View>

          <TextInput
            style={{
              borderWidth: 1,
              borderColor: COLORS.lightGray || '#ddd',
              borderRadius: 8,
              padding: 12,
              marginTop: 16,
              fontSize: 16,
            }}
            placeholder="Promotion code (optional)"
            value={promotionCode}
            onChangeText={setPromotionCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[paymentScreenStyles.cancelButton, { marginTop: 8 }]}
            onPress={handleApplyPromo}
            disabled={processing}
          >
            <Text style={paymentScreenStyles.cancelButtonText}>Apply Code</Text>
          </TouchableOpacity>
        </View>
            {/* <View style={paymentScreenStyles.pricingFeatures}>
              <View style={paymentScreenStyles.featureItem}>
                <Check size={20} color={COLORS.green} />
                <Text style={paymentScreenStyles.featureText}>30 days visibility</Text>
              </View>
              <View style={paymentScreenStyles.featureItem}>
                <Check size={20} color={COLORS.green} />
                <Text style={paymentScreenStyles.featureText}>Reach thousands of candidates</Text>
              </View>
              <View style={paymentScreenStyles.featureItem}>
                <Check size={20} color={COLORS.green} />
                <Text style={paymentScreenStyles.featureText}>Application tracking</Text>
              </View>
            </View> */}
          </View>

        

        

          {/* Refund Policy */}
          

        {/* Action Buttons */}
        <View style={paymentScreenStyles.buttonContainer}>
          <TouchableOpacity
            style={paymentScreenStyles.cancelButton}
            onPress={handleCancel}
            disabled={processing}
          >
            <Text style={paymentScreenStyles.cancelButtonText}>Cancel</Text>
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
              <>
                <Lock size={20} color={COLORS.white} />
                <Text style={paymentScreenStyles.payButtonText}>Pay ${displayAmount.toFixed(2)}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default JobPostingPaymentScreen;
