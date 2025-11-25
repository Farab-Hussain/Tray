import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { COLORS } from '../../constants/core/colors';
import PaymentService, { PaymentIntentRequest } from '../../services/payment.service';
import { paymentModalStyles } from '../../constants/styles/paymentModalStyles';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (paymentIntentId: string) => void;
  onFailure: (error: string) => void;
  paymentData: PaymentIntentRequest;
  consultantName?: string;
  serviceTitle?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onFailure,
  paymentData,
  consultantName = 'Consultant',
  serviceTitle = 'Consultation Service',
}) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [paymentLoading, setPaymentLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setPaymentLoading(true);

      // Step 1: Create payment intent on your backend
      const { clientSecret } = await PaymentService.createPaymentIntent(paymentData);

      // Step 2: Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Tray',
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          name: 'Customer',
        },
        allowsDelayedPaymentMethods: true,
      });

      if (initError) {
                if (__DEV__) {
          console.error('Error initializing payment sheet:', initError)
        };
        Alert.alert('Payment Error', initError.message);
        onFailure(initError.message);
        return;
      }

      // Step 3: Present payment sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
                if (__DEV__) {
          console.error('Payment failed:', paymentError)
        };
        if (paymentError.code !== 'Canceled') {
          Alert.alert('Payment Failed', paymentError.message);
          onFailure(paymentError.message);
        }
        return;
      }

      // Payment succeeded
      Alert.alert(
        'Payment Successful!',
        'Your consultation has been booked successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess(clientSecret);
              onClose();
            },
          },
        ]
      );

    } catch (error: any) {
            if (__DEV__) {
        console.error('Payment error:', error)
      };
      Alert.alert('Payment Error', error.message || 'An unexpected error occurred');
      onFailure(error.message || 'Payment failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: paymentData.currency?.toUpperCase() || 'USD',
    }).format(amount);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Complete Payment</Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service:</Text>
              <Text style={styles.detailValue}>{serviceTitle}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Consultant:</Text>
              <Text style={styles.detailValue}>{consultantName}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={styles.amountValue}>{formatAmount(paymentData.amount)}</Text>
            </View>
          </View>

          <Text style={styles.securityNote}>
            🔒 Your payment information is secure and encrypted
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={paymentLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.payButton, paymentLoading && styles.payButtonDisabled]}
              onPress={handlePayment}
              disabled={paymentLoading}
            >
              {paymentLoading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.payButtonText}>
                  Pay {formatAmount(paymentData.amount)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = paymentModalStyles;

export default PaymentModal;
