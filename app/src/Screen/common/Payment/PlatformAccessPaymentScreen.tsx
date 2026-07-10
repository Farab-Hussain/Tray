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
import { ACCESS_FEE_ROLE_LABELS, navigateToReturnTarget } from '../../../utils/platformAccessFee';
import {
  formatStripePaymentError,
  getStripePaymentSheetOptions,
} from '../../../utils/stripePaymentSheet';

interface PlatformAccessPaymentScreenProps {
  navigation: any;
}

const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ]);

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

  const {
    user,
    activeRole,
    refreshUser,
    refreshPlatformAccessStatus,
    markPlatformAccessPaid,
  } = useAuth();
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
  const [initError, setInitError] = useState<string | null>(null);
  const [roleLabel, setRoleLabel] = useState(defaultRoleLabel);

  const preparePaymentSheet = useCallback(
    async (clientSecret: string): Promise<boolean> => {
      const { error } = await initPaymentSheet(
        getStripePaymentSheetOptions(clientSecret, {
          name: user?.displayName || user?.email || '',
          email: user?.email || '',
        }),
      );

      if (error) {
        setSheetReady(false);
        const message = formatStripePaymentError(error.message);
        setInitError(message);
        return false;
      }

      setSheetReady(true);
      setInitError(null);
      return true;
    },
    [initPaymentSheet, user?.displayName, user?.email],
  );

  const finishAndNavigate = useCallback(() => {
    if (returnTo?.screen) {
      navigateToReturnTarget(navigation, returnTo, 'replace');
      return;
    }
    // MainTabs → RoleBasedTabs picks consultant / student / recruiter from activeRole
    navigation.replace('MainTabs');
  }, [navigation, returnTo]);

  /** Mark paid locally and leave the paywall immediately — never block on network. */
  const grantAccessAndLeave = useCallback(
    (messageTitle: string, messageBody: string) => {
      setCompleted(true);
      setProcessing(false);
      setLoading(false);
      markPlatformAccessPaid();

      // Background sync only
      refreshPlatformAccessStatus().catch(() => undefined);
      refreshUser?.().catch(() => undefined);

      Alert.alert(messageTitle, messageBody, [
        { text: 'Continue', onPress: finishAndNavigate },
      ]);
    },
    [
      markPlatformAccessPaid,
      refreshPlatformAccessStatus,
      refreshUser,
      finishAndNavigate,
    ],
  );

  const initializePaymentSheet = useCallback(
    async (promoCodeInput?: string) => {
      try {
        setLoading(true);
        setInitError(null);

        const status = await withTimeout(
          PaymentService.getAccessFeeStatus(feeRole),
          10000,
          // Fail open on timeout — do not trap paid users on a spinner/paywall
          { paid: true, fee: 0 } as any,
        );

        if (status?.roleLabel) {
          setRoleLabel(status.roleLabel);
        }

        if (status?.paid) {
          setCompleted(true);
          markPlatformAccessPaid();
          setLoading(false);
          if (!isRequired) {
            navigation.goBack();
          } else {
            finishAndNavigate();
          }
          refreshPlatformAccessStatus().catch(() => undefined);
          refreshUser?.().catch(() => undefined);
          return;
        }

        const fee = status?.fee ?? 25;
        setBaseFee(fee);
        setAccessFee(fee);

        const trimmedPromo = (promoCodeInput ?? promotionCode).trim();
        const response = await withTimeout(
          PaymentService.createAccessFeePaymentIntent(
            trimmedPromo || undefined,
            feeRole,
          ),
          15000,
          {
            success: false,
            error: 'Payment setup timed out. Check your connection and try again.',
            clientSecret: '',
            paymentIntentId: '',
          } as any,
        );

        if (response?.roleLabel) {
          setRoleLabel(response.roleLabel);
        }

        if (!response?.success) {
          const message =
            response?.error ||
            'Could not apply this code. Check the code and try again.';
          setInitError(message);
          Alert.alert('Promotion code', message);
          setPromoApplied(false);
          setSheetReady(false);
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
          setPaymentIntent({
            ...response,
            paymentIntentId: response.paymentIntentId,
            clientSecret: response.clientSecret,
          });
          if (typeof response.amount === 'number') {
            setAccessFee(response.amount / 100);
          }

          const ready = await preparePaymentSheet(response.clientSecret);
          if (!ready) {
            setInitError(
              prev => prev || 'Payment could not be prepared. Tap Pay again to retry.',
            );
          }
        } else {
          setSheetReady(false);
          setPaymentIntent(null);
          const message =
            'Failed to create payment session. Check your connection and try again.';
          setInitError(message);
          Alert.alert('Issue', message);
        }
      } catch (error: any) {
        const message =
          error?.response?.data?.error ||
          error?.message ||
          'Failed to initialize payment';
        setInitError(message);
        setSheetReady(false);
        Alert.alert('Issue', message);
      } finally {
        setLoading(false);
      }
    },
    [
      preparePaymentSheet,
      navigation,
      promotionCode,
      isRequired,
      finishAndNavigate,
      feeRole,
      markPlatformAccessPaid,
      refreshPlatformAccessStatus,
      refreshUser,
    ],
  );

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

      const unsubscribe = navigation.addListener(
        'beforeRemove',
        (e: { preventDefault: () => void }) => {
          if (completed) {
            return;
          }
          e.preventDefault();
          Alert.alert(
            'Payment Required',
            'Please complete the one-time platform access fee ($25) to use FairChance. You cannot book sessions or purchase courses until this is paid.',
          );
        },
      );

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
    const response = await withTimeout(
      PaymentService.confirmAccessFeePayment(paymentIntentId),
      15000,
      {
        success: false,
        error: 'Confirmation timed out. If you were charged, reopen the app — access may already be active.',
        clientSecret: '',
        paymentIntentId: '',
      } as any,
    );

    if (response?.success) {
      grantAccessAndLeave(
        'Payment Successful',
        'You now have full platform access. You can book sessions and purchase courses.',
      );
    } else {
      Alert.alert('Issue', response?.error || 'Failed to confirm payment');
    }
  };

  const handlePayment = async () => {
    if (!paymentIntent) {
      Alert.alert(
        'Issue',
        'Payment not initialized. Pull down to reload or tap Apply Code.',
      );
      await initializePaymentSheet();
      return;
    }

    if (paymentIntent.freeAccess) {
      try {
        setProcessing(true);
        grantAccessAndLeave(
          'Access granted',
          'Your promotion code was applied. You now have full platform access.',
        );
      } finally {
        setProcessing(false);
      }
      return;
    }

    try {
      setProcessing(true);
      const intentId = paymentIntent.paymentIntentId;
      const clientSecret = paymentIntent.clientSecret;
      if (!intentId || !clientSecret) {
        Alert.alert('Issue', 'Payment session expired. Tap Pay again to refresh.');
        await initializePaymentSheet();
        return;
      }

      if (!sheetReady) {
        const ready = await preparePaymentSheet(clientSecret);
        if (!ready) {
          return;
        }
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
          <ActivityIndicator
            size="large"
            color={COLORS.blue}
            style={{ marginTop: 16 }}
          />
          <Text style={paymentScreenStyles.loadingText}>Initializing payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={paymentScreenStyles.container}>
      <ScrollView
        style={paymentScreenStyles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={paymentScreenStyles.content}>
          <Text
            style={[
              paymentScreenStyles.pricingTitle,
              { marginBottom: 8, textAlign: 'center' },
            ]}
          >
            {roleLabel} Entry Fee Required
          </Text>
          <Text
            style={[
              paymentScreenStyles.pricingSubtitle,
              { textAlign: 'center', marginBottom: 16 },
            ]}
          >
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
                <Text style={paymentScreenStyles.priceAmount}>
                  {accessFee.toFixed(2)}
                </Text>
              </View>
              {promoApplied && accessFee < baseFee && (
                <Text
                  style={[paymentScreenStyles.pricingSubtitle, { marginTop: 8 }]}
                >
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
            onChangeText={text => {
              setPromotionCode(text);
              setPromoApplied(false);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[paymentScreenStyles.cancelButton, { marginBottom: 16 }]}
            onPress={handleApplyPromo}
            disabled={processing || loading}
          >
            <Text style={paymentScreenStyles.cancelButtonText}>Apply Code</Text>
          </TouchableOpacity>

          {initError ? (
            <View style={{ marginBottom: 12 }}>
              <Text
                style={[
                  paymentScreenStyles.pricingSubtitle,
                  { color: COLORS.red || '#dc2626' },
                ]}
              >
                {initError}
              </Text>
              <TouchableOpacity
                onPress={() => initializePaymentSheet()}
                disabled={loading || processing}
                style={{ marginTop: 8 }}
              >
                <Text style={{ color: COLORS.blue, fontWeight: '600' }}>
                  Retry payment setup
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={paymentScreenStyles.buttonContainer}>
          <TouchableOpacity
            style={[
              paymentScreenStyles.payButton,
              (processing || loading || !paymentIntent) &&
                paymentScreenStyles.payButtonDisabled,
            ]}
            onPress={handlePayment}
            disabled={processing || loading || !paymentIntent}
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
