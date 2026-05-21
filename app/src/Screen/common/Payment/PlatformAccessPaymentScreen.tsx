import React, { useCallback, useEffect, useState } from 'react';
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
import { Lock } from 'lucide-react-native';

interface PlatformAccessPaymentScreenProps {
  navigation: any;
}

const PlatformAccessPaymentScreen: React.FC<PlatformAccessPaymentScreenProps> = ({
  navigation,
}) => {
  const { user, refreshUser } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [accessFee, setAccessFee] = useState(25);
  const [promotionCode, setPromotionCode] = useState('');

  const initializePaymentSheet = useCallback(async () => {
    try {
      setLoading(true);

      const status = await PaymentService.getAccessFeeStatus();
      if (status.paid) {
        navigation.goBack();
        return;
      }
      setAccessFee(status.fee ?? 25);

      const response = await PaymentService.createAccessFeePaymentIntent(
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
        } else {
          setPaymentIntent(response);
          if (typeof response.amount === 'number') {
            setAccessFee(response.amount / 100);
          }
        }
      } else {
        Alert.alert('Issue', response.error || 'Failed to create payment intent');
      }
    } catch {
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

  const confirmPayment = async () => {
    const response = await PaymentService.confirmAccessFeePayment(
      paymentIntent.paymentIntentId,
    );

    if (response.success) {
      await refreshUser?.();
      Alert.alert(
        'Payment Successful',
        'You now have full platform access.',
        [
          {
            text: 'Continue',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } else {
      Alert.alert('Issue', response.error || 'Failed to confirm payment');
    }
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
      } else {
        await confirmPayment();
      }
    } catch {
      Alert.alert('Issue', 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={paymentScreenStyles.container}>
        <ScreenHeader title="Platform Access" onBackPress={() => navigation.goBack()} />
        <View style={paymentScreenStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue} />
          <Text style={paymentScreenStyles.loadingText}>Initializing payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={paymentScreenStyles.container}>
      <ScreenHeader title="Platform Access" onBackPress={() => navigation.goBack()} />

      <ScrollView style={paymentScreenStyles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={paymentScreenStyles.content}>
          <View style={paymentScreenStyles.pricingCard}>
            <View style={paymentScreenStyles.pricingHeader}>
              <Text style={paymentScreenStyles.pricingTitle}>One-Time Access Fee</Text>
              <View style={paymentScreenStyles.priceContainer}>
                <Text style={paymentScreenStyles.currencySymbol}>$</Text>
                <Text style={paymentScreenStyles.priceAmount}>{accessFee.toFixed(2)}</Text>
              </View>
              <Text style={paymentScreenStyles.pricingSubtitle}>
                Flat rate for students and consultants — full platform access
              </Text>
            </View>
          </View>

          <TextInput
            style={{
              borderWidth: 1,
              borderColor: COLORS.lightGray || '#ddd',
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
              fontSize: 16,
            }}
            placeholder="Promotion code (optional)"
            value={promotionCode}
            onChangeText={setPromotionCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[paymentScreenStyles.cancelButton, { marginBottom: 16 }]}
            onPress={handleApplyPromo}
            disabled={processing}
          >
            <Text style={paymentScreenStyles.cancelButtonText}>Apply Code</Text>
          </TouchableOpacity>
        </View>

        <View style={paymentScreenStyles.buttonContainer}>
          <TouchableOpacity
            style={paymentScreenStyles.payButton}
            onPress={handlePayment}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Lock size={20} color={COLORS.white} />
                <Text style={paymentScreenStyles.payButtonText}>
                  Pay ${accessFee.toFixed(2)}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PlatformAccessPaymentScreen;
