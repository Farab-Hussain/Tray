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
import { ACCESS_FEE_ROLE_LABELS } from '../../../utils/platformAccessFee';
import {
  formatStripePaymentError,
  getStripePaymentSheetOptions,
} from '../../../utils/stripePaymentSheet';

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
    role?: string;
  };
  const isRequired = routeParams.required !== false;
  const returnTo = routeParams.returnTo;

  const { user, activeRole, refreshUser, refreshPlatformAccessStatus } = useAuth();
  const feeRole = routeParams.role || activeRole || 'student';
  const defaultRoleLabel =
    ACCESS_FEE_ROLE_LABELS[feeRole as keyof typeof ACCESS_FEE_ROLE_LABELS] || 'Client';
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [accessFee, setAccessFee] = useState(25);
  const [promotionCode, setPromotionCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [baseFee, setBaseFee] = useState(25);
  const [completed, setCompleted] = useState(false);
  const [sheetReady, setSheetReady] = useState(false);
  const [roleLabel, setRoleLabel] = useState(defaultRoleLabel);

  const finishAndNavigate = useCallback(() => {
    if (returnTo?.screen) {
      navigation.replace(returnTo.screen, returnTo.params);
      return;
    }
    navigation.replace('MainTabs');
  }, [navigation, returnTo]);

  const initializePaymentSheet = useCallback(async (promoCodeInput?: string) => {
    try {
      setLoading(true);

      const status = await PaymentService.getAccessFeeStatus(feeRole);
      if (status.roleLabel) {
        setRoleLabel(status.roleLabel);
      }
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
      const fee = status.fee ?? 25;
      setBaseFee(fee);
      setAccessFee(fee);

      const trimmedPromo = (promoCodeInput ?? promotionCode).trim();
      const response = await PaymentService.createAccessFeePaymentIntent(
        trimmedPromo || undefined,
        feeRole,
      );
      if (response.roleLabel) {
        setRoleLabel(response.roleLabel);
      }

      if (!response.success) {
        Alert.alert(
          'Promotion code',
          response.error || 'Could not apply this code. Check the code and try again.',
        );
        setPromoApplied(false);
        return;
      }

      setPromoApplied(!!response.promoApplied && !!trimmedPromo);

      if (response.freeAccess) {
        setPaymentIntent(response);
        setAccessFee(0);
        setSheetReady(true);
        return;
      }

      if (response.clientSecret && response.paymentIntentId) {
        const { error } = await initPaymentSheet(
          getStripePaymentSheetOptions(response.clientSecret, {
            name: user?.displayName || user?.email || '',
            email: user?.email || '',
          }),
        );

        if (error) {
          setSheetReady(false);
          Alert.alert('Issue', formatStripePaymentError(error.message));
        } else {
          setPaymentIntent({
            ...response,
            paymentIntentId: response.paymentIntentId,
            clientSecret: response.clientSecret,
          });
          setSheetReady(true);
          if (typeof response.amount === 'number') {
            setAccessFee(response.amount / 100);
          }
        }
      } else {
        setSheetReady(false);
        Alert.alert('Issue', 'Failed to create payment intent');
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
    feeRole,
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
    const trimmed = promotionCode.trim();
    if (!trimmed) {
      Alert.alert('Promotion code', 'Enter a promotion code first.');
      return;
    }
    initializePaymentSheet(trimmed);
  };

  const confirmPayment = async (paymentIntentId: string) => {
    const response = await PaymentService.confirmAccessFeePayment(paymentIntentId);

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

    if (!paymentIntent.freeAccess && !sheetReady) {
      Alert.alert(
        'Payment not ready',
        'Please wait for payment to finish loading, or tap Apply Code again.',
      );
      return;
    }

    if (paymentIntent.freeAccess) {
      try {
        setProcessing(true);
        setCompleted(true);
        await refreshUser?.();
        await refreshPlatformAccessStatus();
        Alert.alert(
          'Access granted',
          'Your promotion code was applied. You now have full platform access.',
          [{ text: 'Continue', onPress: finishAndNavigate }],
        );
      } finally {
        setProcessing(false);
      }
      return;
    }

    try {
      setProcessing(true);
      const intentId = paymentIntent.paymentIntentId;
      if (!intentId) {
        Alert.alert('Issue', 'Payment session expired. Tap Apply Code again, then pay.');
        return;
      }

      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code !== 'Canceled') {
          Alert.alert('Payment Failed', formatStripePaymentError(error.message));
        }
      } else {
        await confirmPayment(intentId);
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
            {roleLabel} Entry Fee Required
          </Text>
          <Text style={[paymentScreenStyles.pricingSubtitle, { textAlign: 'center', marginBottom: 16 }]}>
            {feeRole === 'recruiter'
              ? 'One-time fee to post jobs on the platform. Nonprofits can use a partner promotion code below.'
              : feeRole === 'consultant'
                ? 'Complete payment if an entry fee applies to your consultant account.'
                : 'One-time fee to book consultants and purchase courses. Nonprofits can use a partner promotion code below.'}
          </Text>

          <View style={paymentScreenStyles.pricingCard}>
            <View style={paymentScreenStyles.pricingHeader}>
              <Text style={paymentScreenStyles.pricingTitle}>{roleLabel} Entry Fee</Text>
              <View style={paymentScreenStyles.priceContainer}>
                <Text style={paymentScreenStyles.currencySymbol}>$</Text>
                <Text style={paymentScreenStyles.priceAmount}>{accessFee.toFixed(2)}</Text>
              </View>
              {promoApplied && accessFee < baseFee && (
                <Text style={[paymentScreenStyles.pricingSubtitle, { marginTop: 8 }]}>
                  Was ${baseFee.toFixed(2)} — promotion applied
                </Text>
              )}
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
            placeholder="Nonprofit / partner code"
            value={promotionCode}
            onChangeText={(text) => {
              setPromotionCode(text);
              setPromoApplied(false);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
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
            disabled={processing || (!paymentIntent?.freeAccess && !sheetReady)}
          >
            {processing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Lock size={20} color={COLORS.white} />
                <Text style={paymentScreenStyles.payButtonText}>
                  {paymentIntent?.freeAccess
                    ? 'Continue with free access'
                    : `Pay $${accessFee.toFixed(2)} to Continue`}
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
