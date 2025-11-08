import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { COLORS } from '../../constants/core/colors';
import { AlertCircle, X } from 'lucide-react-native';

interface CancelBookingModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
  bookingDetails?: {
    consultantName?: string;
    serviceTitle?: string;
    date?: string;
    time?: string;
    amount?: number;
    refundPercentage?: number;
  };
}

const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  visible,
  onClose,
  onConfirm,
  bookingDetails,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(reason);
      setReason(''); // Reset reason after successful cancellation
    } catch (error) {
      console.error('Error cancelling booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      onClose();
    }
  };

  // Calculate estimated refund
  const originalAmount = bookingDetails?.amount || 0;
  const refundPercentage = bookingDetails?.refundPercentage || 100;
  const refundAmount = (originalAmount * refundPercentage) / 100;
  const cancellationFee = originalAmount - refundAmount;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <AlertCircle size={24} color={COLORS.orange} />
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={loading}
            >
              <X size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={styles.title}>Cancel Booking?</Text>
          <Text style={styles.subtitle}>
            Are you sure you want to cancel this booking?
          </Text>

          {/* Booking Details */}
          {bookingDetails && (
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Consultant:</Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.consultantName || 'N/A'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Service:</Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.serviceTitle || 'N/A'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date & Time:</Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.date || 'N/A'} at {bookingDetails.time || 'N/A'}
                </Text>
              </View>
            </View>
          )}

          {/* Refund Information */}
          <View style={styles.refundContainer}>
            <Text style={styles.refundTitle}>Refund Information</Text>
            <View style={styles.refundRow}>
              <Text style={styles.refundLabel}>Original Amount:</Text>
              <Text style={styles.refundValue}>${originalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.refundRow}>
              <Text style={styles.refundLabel}>Refund ({refundPercentage}%):</Text>
              <Text style={[styles.refundValue, styles.refundAmount]}>
                ${refundAmount.toFixed(2)}
              </Text>
            </View>
            {cancellationFee > 0 && (
              <View style={styles.refundRow}>
                <Text style={styles.refundLabel}>Cancellation Fee:</Text>
                <Text style={[styles.refundValue, styles.feeAmount]}>
                  ${cancellationFee.toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          {/* Cancellation Reason (Optional) */}
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>
              Reason for Cancellation (Optional)
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Let us know why you're cancelling..."
              placeholderTextColor={COLORS.lightGray}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
              maxLength={200}
              editable={!loading}
            />
            <Text style={styles.characterCount}>{reason.length}/200</Text>
          </View>

              {/* Warning Note */}
              <Text style={styles.warningNote}>
                This action cannot be undone. You will receive your refund within 5-7 business days.
              </Text>
            </ScrollView>

            {/* Action Buttons - Outside ScrollView to stay fixed */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Keep Booking</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.confirmButtonText}>Cancel Booking</Text>
              )}
            </TouchableOpacity>
          </View>
          </View>
      </View>
        </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF4E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 20,
    lineHeight: 20,
  },
  detailsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  refundContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  refundTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  refundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  refundLabel: {
    fontSize: 13,
    color: COLORS.gray,
  },
  refundValue: {
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: '600',
  },
  refundAmount: {
    color: COLORS.green,
    fontSize: 14,
  },
  feeAmount: {
    color: COLORS.orange,
  },
  reasonContainer: {
    marginBottom: 20,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark,
    marginBottom: 8,
  },
  reasonInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.dark,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.lightGray,
    textAlign: 'right',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: COLORS.white,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  confirmButton: {
    backgroundColor: COLORS.red,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  warningNote: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default CancelBookingModal;

