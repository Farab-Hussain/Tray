import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStripe } from '@stripe/stripe-react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useAuth } from '../../../contexts/AuthContext';
import { COLORS } from '../../../constants/core/colors';
import PaymentService from '../../../services/payment.service';
import { paymentScreenStyles } from '../../../constants/styles/paymentScreenStyles';
import { Lock } from 'lucide-react-native';
import type { PlatformAccessReturnTo } from '../../../utils/platformAccessFee';

interface PlatformAccessPaymentScreenProps {
  navigation: any;
}

const PlatformAccessPaymentScreen: React.FC<PlatformAccessPaymentScreenProps> = ({
  navigation,
}) => {
  const route = useRoute();
  const routeParams = (route.params || {}) as {
    required?: boolean;
    returnTo?: PlatformAccessReturnTo;
  };
  const isRequired = routeParams.required !== false;
  const returnTo = routeParams.returnTo;

  const { user, refreshUser, refreshPlatformAccessStatus } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [accessFee, setAccessFee] = useState(25);
  const [promotionCode, setPromotionCode] = useState('');
  const [completed, setCompleted] = useState(false);

  const finishAndNavigate = useCallback(() => {
    if (returnTo?.screen) {
      navigation.replace(returnTo.screen, returnTo.params);
      return;
    }
    navigation.replace('MainTabs');
  }, [navigation, returnTo]);

  const initializePaymentSheet = useCallback(async () => {
    try {
      setLoading(true);

      const status = await PaymentService.getAccessFeeStatus();
      if (status.paid) {
        setCompleted(true);
        await refreshPlatformAccessStatus();
        if (!isRequired) {
          navigation.goBack();
        } else {
          finishAndNavigate();
        }
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
  }, [
    user,
    initPaymentSheet,
    navigation,
    promotionCode,
    isRequired,
    refreshPlatformAccessStatus,
    finishAndNavigate,
  ]);

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isRequired || completed) {
        return undefined;
      }

      const onBackPress = () => true;

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      const unsubscribe = navigation.addListener('beforeRemove', (e: { preventDefault: () => void }) => {
        if (completed) {
          return;
        }
        e.preventDefault();
        Alert.alert(
          'Payment Required',
          'Please complete the one-time platform access fee ($25) to use Tray. You cannot book sessions or purchase courses until this is paid.',
        );
      });

      return () => {
        subscription.remove();
        unsubscribe();
      };
    }, [navigation, isRequired, completed]),
  );

  const handleApplyPromo = () => {
    initializePaymentSheet();
  };

  const confirmPayment = async () => {
    const response = await PaymentService.confirmAccessFeePayment(
      paymentIntent.paymentIntentId,
    );

    if (response.success) {
      setCompleted(true);
      await refreshUser?.();
      await refreshPlatformAccessStatus();
      Alert.alert(
        'Payment Successful',
        'You now have full platform access. You can book sessions and purchase courses.',
        [{ text: 'Continue', onPress: finishAndNavigate }],
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
        <View style={paymentScreenStyles.loadingContainer}>
          <Text style={paymentScreenStyles.pricingTitle}>Platform Access</Text>
          <ActivityIndicator size="large" color={COLORS.blue} style={{ marginTop: 16 }} />
          <Text style={paymentScreenStyles.loadingText}>Initializing payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={paymentScreenStyles.container}>
      <ScrollView style={paymentScreenStyles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={paymentScreenStyles.content}>
          <Text style={[paymentScreenStyles.pricingTitle, { marginBottom: 8, textAlign: 'center' }]}>
            Platform Access Required
          </Text>
          <Text style={[paymentScreenStyles.pricingSubtitle, { textAlign: 'center', marginBottom: 16 }]}>
            One-time fee to book consultants and purchase courses. Required before any session payment.
          </Text>

          <View style={paymentScreenStyles.pricingCard}>
            <View style={paymentScreenStyles.pricingHeader}>
              <Text style={paymentScreenStyles.pricingTitle}>One-Time Access Fee</Text>
              <View style={paymentScreenStyles.priceContainer}>
                <Text style={paymentScreenStyles.currencySymbol}>$</Text>
                <Text style={paymentScreenStyles.priceAmount}>{accessFee.toFixed(2)}</Text>
              </View>
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
                  Pay ${accessFee.toFixed(2)} to Continue
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
