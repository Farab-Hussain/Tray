import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStripe } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { COLORS } from '../../../constants/core/colors';
import PaymentService, { PaymentIntentRequest } from '../../../services/payment.service';
import { BookingService } from '../../../services/booking.service';
import { useAuth } from '../../../contexts/AuthContext';
import * as NotificationStorage from '../../../services/notification-storage.service';
import { UserService } from '../../../services/user.service';
import { paymentScreenStyles } from '../../../constants/styles/paymentScreenStyles';

interface BookedSlot {
  date: string;
  startTime: string;
  endTime: string;
}

interface CartItem {
  id: string;
  consultantId: string;
  consultantName: string;
  consultantCategory: string;
  serviceId: string;
  serviceTitle: string;
  pricePerSlot?: number;
  bookedSlots?: BookedSlot[];
  counter: number;
  totalPrice?: number;
  duration?: number;
  
  // Legacy format support
  price?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
}

interface PaymentScreenProps {
  navigation: any;
  route: {
    params: {
      cartItems: CartItem[];
    };
  };
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(route.params.cartItems);
  
  // Update cartItems when route params change
  React.useEffect(() => {
    if (route.params?.cartItems) {
      setCartItems(route.params.cartItems);
    }
  }, [route.params?.cartItems]);
  const [platformFeeAmount, setPlatformFeeAmount] = useState<number>(5.00);
  const [platformFeeLoading, setPlatformFeeLoading] = useState<boolean>(true);
  const [platformFeeError, setPlatformFeeError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPlatformFee = async () => {
      try {
        const config = await PaymentService.getPlatformFeeConfig();
        if (isMounted && typeof config.platformFeeAmount === 'number') {
          setPlatformFeeAmount(config.platformFeeAmount);
        }
      } catch (error: any) {
        console.error('❌ Failed to load platform fee configuration:', error);
        if (isMounted) {
          setPlatformFeeError(error.message || 'Unable to load platform fee. Using default amount.');
        }
      } finally {
        if (isMounted) {
          setPlatformFeeLoading(false);
        }
      }
    };

    fetchPlatformFee();
    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate totals - use route params directly to ensure fresh data
  const currentCartItems = route.params?.cartItems || cartItems;
  const subtotal = useMemo(() => {
    return currentCartItems.reduce((sum, item) => {
      const itemTotal = item.totalPrice || (item.price || item.pricePerSlot || 0) * item.counter;
      return sum + itemTotal;
    }, 0);
  }, [currentCartItems]);

  const total = useMemo(() => Number((subtotal + platformFeeAmount).toFixed(2)), [subtotal, platformFeeAmount]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handlePayment = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'Please log in to proceed with payment');
      return;
    }

    try {
      setPaymentLoading(true);

      // Generate a unique booking ID for this cart
      const bookingId = `CART_${Date.now()}_${user.uid.slice(-8)}`;

      // Create payment intent for the entire cart
      const paymentData: PaymentIntentRequest = {
        amount: total,
        currency: 'usd',
        bookingId,
        studentId: user.uid,
        consultantId: 'MULTIPLE', // Multiple consultants in cart
      };

      console.log('💳 Creating payment intent for cart:', paymentData);

      // Step 1: Create payment intent on your backend
      let clientSecret: string;
      let paymentIntentId: string;
      try {
        const response = await PaymentService.createPaymentIntent(paymentData);
        clientSecret = response.clientSecret;
        paymentIntentId = response.paymentIntentId;
        
        if (!clientSecret || !paymentIntentId) {
          throw new Error('No client secret returned from backend');
        }
        console.log('✅ Payment intent created successfully');
      } catch (error: any) {
        console.error('❌ Error creating payment intent:', error);
        Alert.alert('Payment Error', error?.message || 'Failed to initialize payment. Please try again.');
        setPaymentLoading(false);
        return;
      }

      // Step 2: Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Tray',
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          name: user.displayName || 'Customer',
        },
        allowsDelayedPaymentMethods: true,
        returnURL: 'tray://stripe-redirect',
      });

      if (initError) {
        console.error('❌ Error initializing payment sheet:', initError);
        Alert.alert('Payment Error', initError.message || 'Failed to initialize payment form');
        setPaymentLoading(false);
        return;
      }

      console.log('✅ Payment sheet initialized successfully');

      // Step 3: Present payment sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        console.error('Payment failed:', paymentError);
        if (paymentError.code !== 'Canceled') {
          Alert.alert('Payment Failed', paymentError.message || 'Payment could not be processed');
        }
        setPaymentLoading(false);
        return;
      }

      // Payment succeeded - create all bookings
      await handlePaymentSuccess(paymentIntentId);

    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert('Payment Error', error.message || 'An unexpected error occurred');
      setPaymentLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      console.log('✅ Payment successful, creating bookings...');

      // Create bookings for each cart item (and each booked slot within)
      const bookingPromises: Promise<any>[] = [];
      const bookingDetails: Array<{ bookingData: any; item: CartItem }> = [];
      
      cartItems.forEach((item) => {
        // Check if item has bookedSlots (new format)
        if (item.bookedSlots && item.bookedSlots.length > 0) {
          // Create a booking for each slot
          item.bookedSlots.forEach((slot) => {
            const bookingData = {
              consultantId: item.consultantId,
              studentId: user?.uid!,
              serviceId: item.serviceId,
              date: slot.date,
              time: slot.startTime,
              amount: item.pricePerSlot || item.price || 100,
              quantity: 1,
              status: 'confirmed',
              paymentStatus: 'paid',
              paymentIntentId,
            };
            
            bookingPromises.push(BookingService.createBooking(bookingData));
            bookingDetails.push({ bookingData, item });
          });
        } else if (item.date && item.startTime) {
          // Legacy format: single booking per item
          const bookingData = {
            consultantId: item.consultantId,
            studentId: user?.uid!,
            serviceId: item.serviceId,
            date: item.date,
            time: item.startTime,
            amount: item.price || item.pricePerSlot || 100,
            quantity: 1,
            status: 'confirmed',
            paymentStatus: 'paid',
            paymentIntentId,
          };
          
          bookingPromises.push(BookingService.createBooking(bookingData));
          bookingDetails.push({ bookingData, item });
        }
      });

      // Create bookings one by one to handle conflicts properly
      const results = [];
      const conflicts = [];
      const consultantInfoCache: Record<string, { name: string; avatar: string }> = {};
      const getConsultantInfo = async (consultantId: string, fallbackName?: string) => {
        if (consultantInfoCache[consultantId]) {
          return consultantInfoCache[consultantId];
        }
        try {
          const consultantData = await UserService.getUserById(consultantId);
          const info = {
            name: consultantData?.name || consultantData?.displayName || fallbackName || 'Consultant',
            avatar: consultantData?.profileImage || consultantData?.avatarUrl || consultantData?.avatar || '',
          };
          consultantInfoCache[consultantId] = info;
          return info;
        } catch {
          const info = {
            name: fallbackName || 'Consultant',
            avatar: '',
          };
          consultantInfoCache[consultantId] = info;
          return info;
        }
      };

      const userAny = user as any;
      const studentName = userAny?.name || user?.email?.split('@')[0] || 'Student';
      const studentAvatar = userAny?.profileImage || '';

      for (let i = 0; i < bookingPromises.length; i++) {
        try {
          const result = await bookingPromises[i];
          results.push(result);
          console.log(`✅ Booking ${i + 1}/${bookingPromises.length} created successfully`);

          const detail = bookingDetails[i];
          if (detail) {
            const { bookingData, item } = detail;
            const bookingId = result?.bookingId;
            const consultantInfo = await getConsultantInfo(bookingData.consultantId, item.consultantName);
            const sessionLabel = `${item.serviceTitle || 'a service'}${bookingData.date ? ` • ${bookingData.date}` : ''}${bookingData.time ? ` at ${bookingData.time}` : ''}`;

            try {
              await NotificationStorage.createNotification({
                userId: bookingData.consultantId,
                type: 'booking_confirmed',
                category: 'booking',
                title: studentName,
                message: `${studentName} booked ${sessionLabel}`,
                data: {
                  bookingId,
                  consultantId: bookingData.consultantId,
                  studentId: bookingData.studentId,
                  serviceId: bookingData.serviceId,
                },
                senderId: bookingData.studentId,
                senderName: studentName,
                senderAvatar: studentAvatar || '',
              });
            } catch (consultantNotifError) {
              console.warn('⚠️ Failed to create consultant booking notification:', consultantNotifError);
            }

            try {
              await NotificationStorage.createNotification({
                userId: bookingData.studentId,
                type: 'payment',
                category: 'payment',
                title: consultantInfo.name,
                message: `Payment of ${formatAmount(bookingData.amount)} confirmed for ${sessionLabel}`,
                data: {
                  bookingId,
                  consultantId: bookingData.consultantId,
                  serviceId: bookingData.serviceId,
                },
                senderId: bookingData.consultantId,
                senderName: consultantInfo.name,
                senderAvatar: consultantInfo.avatar,
              });
            } catch (studentNotifError) {
              console.warn('⚠️ Failed to create payment notification for student:', studentNotifError);
            }
          }
        } catch (error: any) {
          console.error(`❌ Booking ${i + 1}/${bookingPromises.length} failed:`, error);
          
          if (error.response?.status === 409) {
            // Conflict error - slot already booked
            conflicts.push({
              bookingIndex: i,
              error: error.response.data,
              message: error.response.data.message || 'Time slot is already booked'
            });
          } else {
            // Other error - fail the entire payment
            throw error;
          }
        }
      }
      
      console.log(`✅ ${results.length} bookings created successfully`);
      
      if (conflicts.length > 0) {
        console.log(`⚠️ ${conflicts.length} booking conflicts detected:`, conflicts);
        
        // Show conflict alert but don't fail the payment
        const conflictMessages = conflicts.map(c => c.message).join('\n');
        Alert.alert(
          'Some Slots Unavailable',
          `The following time slots were already booked by other students:\n\n${conflictMessages}\n\nYour payment has been processed for the available slots.`,
          [{ text: 'OK' }]
        );
      }

      // Clear cart after successful payment
      await AsyncStorage.removeItem('@tray_cart_items');

      // Handle payment success
      await PaymentService.handlePaymentSuccess(paymentIntentId, `CART_${Date.now()}`);

      // Navigate to bookings screen after successful payment
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' as never }],
      });
      setTimeout(() => {
        navigation.navigate('BookedConsultants' as never);
      }, 100);

    } catch (error: any) {
      console.error('Error creating bookings after payment:', error);
      Alert.alert(
        'Booking Error',
        'Payment successful but failed to create bookings. Please contact support.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' as never }],
              });
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader 
        title="Payment" 
        onBackPress={() => navigation.goBack()} 
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {currentCartItems.map((item) => {
            const itemPrice = item.totalPrice || (item.price || item.pricePerSlot || 0) * item.counter;
            const displayText = item.bookedSlots && item.bookedSlots.length > 0
              ? `${item.bookedSlots.length} session${item.bookedSlots.length > 1 ? 's' : ''} (${item.bookedSlots[0].date}${item.bookedSlots.length > 1 ? ' +' : ''})`
              : `${item.date || 'N/A'} • ${item.startTime || 'N/A'} - ${item.endTime || 'N/A'}`;
            
            return (
              <View key={item.id} style={styles.orderItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.consultantName}</Text>
                  <Text style={styles.itemService}>{item.serviceTitle}</Text>
                  <Text style={styles.itemDate}>{displayText}</Text>
                </View>
                <Text style={styles.itemPrice}>{formatAmount(itemPrice)}</Text>
              </View>
            );
          })}
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatAmount(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Platform Fee:</Text>
            <Text style={styles.summaryValue}>{formatAmount(platformFeeAmount)}</Text>
          </View>
          {platformFeeLoading && (
            <Text style={styles.platformFeeInfo}>Retrieving latest platform fee...</Text>
          )}
          {!platformFeeLoading && platformFeeError && (
            <Text style={styles.platformFeeWarning}>{platformFeeError}</Text>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatAmount(total)}</Text>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>
            Your payment information is secure and encrypted. We use Stripe for secure payment processing.
          </Text>
        </View>
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.paymentButtonContainer}>
        <TouchableOpacity
          style={[styles.paymentButton, paymentLoading && styles.paymentButtonDisabled]}
          onPress={handlePayment}
          disabled={paymentLoading}
        >
          {paymentLoading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.paymentButtonText}>
              Pay {formatAmount(total)}
            </Text>
          )}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

const styles = paymentScreenStyles;

export default PaymentScreen;
