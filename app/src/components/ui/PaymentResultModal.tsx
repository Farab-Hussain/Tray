import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { CheckCircle, XCircle, Calendar, Clock, DollarSign, CreditCard } from 'lucide-react-native';
import { COLORS } from '../../constants/core/colors';
import { paymentResultModalStyles } from '../../constants/styles/paymentResultModalStyles';
import { formatApplicationDate } from '../../utils/dateUtils';

interface OrderItem {
  id?: string;
  consultantName: string;
  serviceTitle: string;
  price: number;
  sessionInfo?: string;
  date?: string;
  time?: string;
}

type PaymentResultModalProps = {
  visible: boolean;
  success: boolean;
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
  date?: Date | string;
  consultantName?: string;
  serviceTitle?: string;
  orderItems?: OrderItem[];
  sessionDetails?: Array<{
    date: string;
    time: string;
    consultantName: string;
    serviceTitle: string;
  }>;
  errorMessage?: string;
  onClose: () => void;
  onViewBookings?: () => void;
};

const PaymentResultModal: React.FC<PaymentResultModalProps> = ({
  visible,
  success,
  paymentIntentId,
  amount,
  currency = 'USD',
  date = new Date(),
  consultantName,
  serviceTitle,
  orderItems = [],
  sessionDetails = [],
  errorMessage,
  onClose,
  onViewBookings,
}) => {
  const formatAmount = (amt: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amt);
  };

  const formattedDate = date instanceof Date ? date : new Date(date);
  const displayDate = formattedDate.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Convert sessionDetails to orderItems if orderItems is not provided
  const displayOrderItems: OrderItem[] = orderItems.length > 0 
    ? orderItems 
    : sessionDetails.map((session, index) => ({
        id: `session-${index}`,
        consultantName: session.consultantName,
        serviceTitle: session.serviceTitle,
        price: amount ? amount / sessionDetails.length : 0,
        sessionInfo: `1 session (${session.date})`,
        date: session.date,
        time: session.time,
      }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={paymentResultModalStyles.overlay}>
        <View style={paymentResultModalStyles.modal}>
          <ScrollView 
            style={paymentResultModalStyles.scrollView}
            contentContainerStyle={paymentResultModalStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            {success ? (
              <>
                <View style={paymentResultModalStyles.header}>
                  <CheckCircle size={64} color={COLORS.green} />
                  <Text style={paymentResultModalStyles.title}>Payment Successful!</Text>
                  <Text style={paymentResultModalStyles.subtitle}>Your payment has been processed</Text>
                </View>

                {/* Order Summary */}
                {displayOrderItems.length > 0 && (
                  <View style={paymentResultModalStyles.orderSummarySection}>
                    <Text style={paymentResultModalStyles.orderSummaryTitle}>Order Summary</Text>
                    {displayOrderItems.map((item, index) => (
                      <View key={item.id || index}>
                        <View style={paymentResultModalStyles.orderItem}>
                          <View style={paymentResultModalStyles.orderItemInfo}>
                            <Text style={paymentResultModalStyles.orderItemTitle}>
                              {item.consultantName}
                            </Text>
                            <Text style={paymentResultModalStyles.orderItemService}>
                              {item.serviceTitle}
                            </Text>
                            <Text style={paymentResultModalStyles.orderItemDate}>
                              {item.sessionInfo || `${item.date || ''}${item.time ? ` • ${item.time}` : ''}`}
                            </Text>
                          </View>
                          <Text style={paymentResultModalStyles.orderItemPrice}>
                            {formatAmount(item.price)}
                          </Text>
                        </View>
                        {index < displayOrderItems.length - 1 && (
                          <View style={paymentResultModalStyles.orderItemSeparator} />
                        )}
                      </View>
                    ))}
                    
                    {/* Total */}
                    {amount && (
                      <>
                        <View style={paymentResultModalStyles.orderItemSeparator} />
                        <View style={paymentResultModalStyles.orderTotalRow}>
                          <Text style={paymentResultModalStyles.orderTotalLabel}>Total:</Text>
                          <Text style={paymentResultModalStyles.orderTotalValue}>
                            {formatAmount(amount)}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                )}

                {/* Payment Details (if no order items) */}
                {displayOrderItems.length === 0 && (
                  <View style={paymentResultModalStyles.detailsCard}>
                    <Text style={paymentResultModalStyles.detailsTitle}>Payment Details</Text>
                    
                    {paymentIntentId && (
                      <View style={paymentResultModalStyles.detailRow}>
                        <CreditCard size={20} color={COLORS.gray} />
                        <View style={paymentResultModalStyles.detailContent}>
                          <Text style={paymentResultModalStyles.detailLabel}>Transaction ID</Text>
                          <Text style={paymentResultModalStyles.detailValue}>{paymentIntentId}</Text>
                        </View>
                      </View>
                    )}

                    {amount && (
                      <View style={paymentResultModalStyles.detailRow}>
                        <DollarSign size={20} color={COLORS.gray} />
                        <View style={paymentResultModalStyles.detailContent}>
                          <Text style={paymentResultModalStyles.detailLabel}>Amount Paid</Text>
                          <Text style={[paymentResultModalStyles.detailValue, paymentResultModalStyles.amountValue]}>
                            {formatAmount(amount)}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={paymentResultModalStyles.detailRow}>
                      <Calendar size={20} color={COLORS.gray} />
                      <View style={paymentResultModalStyles.detailContent}>
                        <Text style={paymentResultModalStyles.detailLabel}>Date & Time</Text>
                        <Text style={paymentResultModalStyles.detailValue}>{displayDate}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Security Message */}
                <View style={paymentResultModalStyles.securityNotice}>
                  <Text style={paymentResultModalStyles.securityIcon}>🔒</Text>
                  <Text style={paymentResultModalStyles.securityText}>
                    Your payment information is secure and encrypted. We use Stripe for secure payment processing.
                  </Text>
                </View>
              </>
            ) : (
              <View style={paymentResultModalStyles.header}>
                <XCircle size={64} color={COLORS.red} />
                <Text style={[paymentResultModalStyles.title, { color: COLORS.red }]}>
                  Payment Failed
                </Text>
                <Text style={paymentResultModalStyles.subtitle}>
                  {errorMessage || 'Payment could not be processed'}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={paymentResultModalStyles.buttonContainer}>
            {success && onViewBookings && (
              <TouchableOpacity
                style={[paymentResultModalStyles.button, paymentResultModalStyles.primaryButton]}
                onPress={onViewBookings}
              >
                <Text style={paymentResultModalStyles.primaryButtonText}>View My Bookings</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                paymentResultModalStyles.button,
                success ? paymentResultModalStyles.secondaryButton : paymentResultModalStyles.primaryButton
              ]}
              onPress={onClose}
            >
              <Text
                style={
                  success
                    ? paymentResultModalStyles.secondaryButtonText
                    : paymentResultModalStyles.primaryButtonText
                }
              >
                {success ? 'Close' : 'OK'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PaymentResultModal;

