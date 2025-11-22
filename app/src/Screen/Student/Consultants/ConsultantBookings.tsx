import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { COLORS } from '../../../constants/core/colors';
import LoadingState from '../../../components/ui/LoadingState';
import {
  Calendar,
  Clock,
  DollarSign,
  XCircle,
  AlertCircle,
  MessageCircle,
} from 'lucide-react-native';
import { getStatusColor } from '../../../utils/statusUtils';
import { formatDate } from '../../../utils/dateUtils';
import { BookingService } from '../../../services/booking.service';
import { ConsultantService } from '../../../services/consultant.service';
import CancelBookingModal from '../../../components/ui/CancelBookingModal';
import { showSuccess, showError } from '../../../utils/toast';
import { useChatContext } from '../../../contexts/ChatContext';
import { useAuth } from '../../../contexts/AuthContext';

interface Booking {
  id: string;
  consultantId: string;
  consultantName?: string;
  serviceId: string;
  serviceTitle?: string;
  date: string;
  time: string;
  amount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface ConsultantBookingsProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    replace: (screen: string, params?: any) => void;
    goBack: () => void;
  };
  route: {
    params?: {
      consultantId?: string;
      consultantName?: string;
    };
  };
}

const ConsultantBookings = ({ navigation, route }: ConsultantBookingsProps) => {
  const { consultantId, consultantName } = route.params || {};
  const { user } = useAuth();
  const { openChatWith } = useChatContext();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const isFetchingRef = useRef(false);

  // Debounced fetch function to prevent rapid successive calls
  const fetchBookings = useCallback(
    async (forceRefresh = false) => {
      if (!consultantId || isFetchingRef.current) return;

      // Prevent rapid successive calls (debounce)
      const now = Date.now();
      if (!forceRefresh && now - lastFetchTime < 3000) {
        console.log(
          '🚫 [ConsultantBookings] Skipping fetch - too soon since last fetch',
        );
        return;
      }

      isFetchingRef.current = true;
      setLastFetchTime(now);

      try {
        setLoading(true);
        console.log('📅 [ConsultantBookings] Fetching all bookings...');
        const response = await BookingService.getMyBookings();
        console.log('✅ [ConsultantBookings] Bookings response:', response);

        // Filter bookings for this consultant
        const allBookings = response?.bookings || [];
        const consultantBookings = allBookings.filter(
          (booking: Booking) => booking.consultantId === consultantId,
        );

        console.log(
          `📊 [ConsultantBookings] Found ${consultantBookings.length} bookings for consultant ${consultantId}`,
        );

        // Batch fetch service details to reduce API calls
        const serviceIds = [
          ...new Set(consultantBookings.map((b: Booking) => b.serviceId)),
        ];
        const serviceDetailsMap = new Map();

        // Fetch all service details in parallel
        const servicePromises = serviceIds.map(async serviceId => {
          try {
            if (serviceId && consultantId) {
              const serviceData = await ConsultantService.getConsultantServices(
                consultantId,
              );
              const service = serviceData.services?.find(
                (s: { id: string; title: string }) => s.id === serviceId,
              );
              if (service) {
                serviceDetailsMap.set(serviceId, service.title);
              }
            }
          } catch {
            console.log(
              `⚠️ [ConsultantBookings] Could not fetch service details for ${serviceId}`,
            );
          }
        });

        // Wait for all service requests to complete
        await Promise.all(servicePromises);

        // Transform bookings using cached service data
        const bookingsWithServiceDetails = consultantBookings.map(
          (booking: Booking) => ({
            ...booking,
            serviceTitle:
              serviceDetailsMap.get(booking.serviceId) ||
              'Consultation Service',
          }),
        );

        // Sort by date (most recent first)
        bookingsWithServiceDetails.sort((a: Booking, b: Booking) => {
          const dateA = new Date(`${a.date} ${a.time}`);
          const dateB = new Date(`${b.date} ${b.time}`);
          return dateB.getTime() - dateA.getTime();
        });

        setBookings(bookingsWithServiceDetails);
        console.log(
          `✅ [ConsultantBookings] Successfully loaded ${bookingsWithServiceDetails.length} bookings`,
        );
      } catch (error: unknown) {
        console.error(
          '❌ [ConsultantBookings] Error fetching bookings:',
          error,
        );
        showError('Failed to load bookings');
        setBookings([]);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [consultantId, lastFetchTime],
  );

  // Load data on component mount only
  useEffect(() => {
    if (consultantId) {
      fetchBookings(true);
    }
  }, [consultantId, fetchBookings]);

  const canCancelBooking = (booking: Booking): boolean => {
    // Cannot cancel if already cancelled
    if (booking.status === 'cancelled') {
      return false;
    }

    // Check if session has already started
    const bookingDateTime = new Date(`${booking.date} ${booking.time}`);
    const currentDateTime = new Date();

    // If session time has passed AND consultant has accepted
    if (currentDateTime >= bookingDateTime && booking.status === 'accepted') {
      return false;
    }

    return true;
  };

  const getRefundPercentage = (booking: Booking): number => {
    // If consultant hasn't accepted yet: 100% refund
    if (booking.status === 'pending' || booking.status === 'confirmed') {
      return 100;
    }
    // If consultant has accepted: 80% refund (20% cancellation fee)
    if (booking.status === 'accepted' || booking.status === 'approved') {
      return 80;
    }
    return 100;
  };

  const handleCancelPress = (booking: Booking) => {
    if (!canCancelBooking(booking)) {
      Alert.alert(
        'Cannot Cancel',
        'This booking cannot be cancelled because the session has already started or passed.',
        [{ text: 'OK' }],
      );
      return;
    }

    setSelectedBooking(booking);
    setCancelModalVisible(true);
  };

  const handleCancelConfirm = async (reason?: string) => {
    if (!selectedBooking) return;

    try {
      console.log('🚫 Cancelling booking:', selectedBooking.id);
      const response = await BookingService.cancelBooking(
        selectedBooking.id,
        reason,
      );
      console.log('✅ Cancellation response:', response);

      const refundAmount =
        typeof response.refundAmount === 'number'
          ? response.refundAmount
          : undefined;
      const refundPercentage =
        typeof response.refundPercentage === 'number'
          ? response.refundPercentage
          : undefined;

      if (refundAmount !== undefined && refundPercentage !== undefined) {
        showSuccess(
          `Booking cancelled successfully! Refund: $${refundAmount.toFixed(
            2,
          )} (${refundPercentage}%)`,
        );
      } else {
        showSuccess(response.message || 'Booking cancelled successfully.');
      }

      // Refresh bookings list
      await fetchBookings(true);

      setCancelModalVisible(false);
      setSelectedBooking(null);
    } catch (error: unknown) {
      console.error('❌ Error cancelling booking:', error);
      let errorMessage = 'Failed to cancel booking';

      if (error && typeof error === 'object') {
        if (
          'response' in error &&
          error.response &&
          typeof error.response === 'object' &&
          'data' in error.response
        ) {
          const responseData = error.response.data;
          if (
            responseData &&
            typeof responseData === 'object' &&
            'error' in responseData
          ) {
            errorMessage = String(responseData.error);
          }
        } else if ('message' in error) {
          errorMessage = String(error.message);
        }
      }

      showError(errorMessage);
    }
  };

  const handleViewDetails = (booking: Booking) => {
    const refundPercentage = getRefundPercentage(booking);
    const cancellationFee = 100 - refundPercentage;
    const refundAmount = (booking.amount * refundPercentage) / 100;

    let details =
      `Service: ${booking.serviceTitle || 'Consultation Service'}\n` +
      `Date: ${formatDate(booking.date)}\n` +
      `Time: ${booking.time}\n` +
      `Amount: $${booking.amount.toFixed(2)}\n` +
      `Status: ${
        booking.status.charAt(0).toUpperCase() + booking.status.slice(1)
      }\n` +
      `Payment Status: ${
        booking.paymentStatus.charAt(0).toUpperCase() +
        booking.paymentStatus.slice(1)
      }`;

    // Add refund information if booking is cancelled
    if (booking.status === 'cancelled') {
      details +=
        `\n\nRefund Information:\n` +
        `Refund Amount: $${refundAmount.toFixed(2)}\n` +
        `Cancellation Fee: $${(booking.amount - refundAmount).toFixed(
          2,
        )} (${cancellationFee}%)\n` +
        `Refund Percentage: ${refundPercentage}%`;
    }

    Alert.alert('Booking Details', details, [
      { text: 'Book Again', onPress: () => handleBookAgain(booking) },
      { text: 'Close', style: 'cancel' },
    ]);
  };

  const handleBookAgain = (booking: Booking) => {
    // Navigate to booking slots for the same consultant
    navigation.navigate('BookingSlots', {
      consultantId: booking.consultantId,
      consultantName: consultantName || 'Consultant',
      consultantCategory: 'Consultation',
      serviceId: booking.serviceId,
      serviceTitle: booking.serviceTitle || 'Consultation Service',
      servicePrice: booking.amount,
      serviceDuration: 60, // Default duration
    });
  };

  const handleOpenChat = async (booking: Booking) => {
    try {
      if (!user?.uid || !booking.consultantId) {
        showError('Unable to open chat');
        return;
      }

      // Create or open chat with consultant
      const chatId = await openChatWith(booking.consultantId);

      // Navigate to ChatScreen with the chat details
      navigation.navigate('ChatScreen', {
        chatId,
        otherUserId: booking.consultantId,
        consultant: {
          name: booking.consultantName || consultantName || 'Consultant',
          title: 'Consultant',
          avatar: require('../../../assets/image/avatar.png'),
          isOnline: true,
        },
      });
    } catch (error) {
      console.error('❌ Error opening chat:', error);
      showError('Failed to open chat');
    }
  };


  const getStatusBackground = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'accepted':
      case 'approved':
        return COLORS.green; // Green background for confirmed/accepted
      case 'completed':
        return COLORS.green; // Green background for completed
      case 'pending':
        return COLORS.orange; // Orange background for pending
      case 'cancelled':
        return COLORS.gray; // Gray background for cancelled
      default:
        return COLORS.green;
    }
  };


  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader
        title={`Bookings with ${consultantName || 'Consultant'}`}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <LoadingState message="Loading bookings..." />
        ) : bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <AlertCircle size={48} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No Bookings Found</Text>
            <Text style={styles.emptySubtitle}>
              You don't have any bookings with this consultant yet.
            </Text>
          </View>
        ) : (
          <View style={styles.bookingsList}>
            {bookings.map(booking => {
              const displayStatus =
                booking.status.charAt(0).toUpperCase() +
                booking.status.slice(1);
              const isCancellable = canCancelBooking(booking);
              const refundPercentage = getRefundPercentage(booking);

              return (
                <View key={booking.id} style={styles.bookingCard}>
                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusBackground(displayStatus) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(displayStatus, 'booking') },
                      ]}
                    >
                      {displayStatus}
                    </Text>
                  </View>

                  {/* Service Title */}
                  <Text style={styles.serviceTitle}>
                    {booking.serviceTitle || 'Consultation Service'}
                  </Text>

                  {/* Booking Details */}
                  <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                      <Calendar size={16} color={COLORS.gray} />
                      <Text style={styles.detailText}>
                        {formatDate(booking.date)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Clock size={16} color={COLORS.gray} />
                      <Text style={styles.detailText}>{booking.time}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <DollarSign size={16} color={COLORS.gray} />
                      <Text style={styles.detailText}>
                        ${booking.amount.toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {/* Refund Info (if cancellable) */}
                  {isCancellable && booking.status !== 'cancelled' && (
                    <View style={styles.refundInfo}>
                      <Text style={styles.refundText}>
                        {refundPercentage === 100
                          ? 'Full refund available'
                          : `${refundPercentage}% refund (${
                              100 - refundPercentage
                            }% cancellation fee)`}
                      </Text>
                    </View>
                  )}

                  {/* Action Buttons Container */}
                  <View style={styles.actionButtonsContainer}>
                    {/* Chat Button - Only show for accepted bookings */}
                    {(booking.status === 'accepted' ||
                      booking.status === 'approved' ||
                      booking.status === 'confirmed') && (
                      <TouchableOpacity
                        style={styles.chatButton}
                        onPress={() => handleOpenChat(booking)}
                      >
                        <MessageCircle size={16} color={COLORS.white} />
                        <Text style={styles.chatButtonText}>Open Chat</Text>
                      </TouchableOpacity>
                    )}

                    {/* Cancel Button */}
                    {isCancellable && booking.status !== 'cancelled' && (
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelPress(booking)}
                      >
                        <XCircle size={16} color={COLORS.white} />
                        <Text style={styles.cancelButtonText}>
                          Cancel Booking
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Already Cancelled Button */}
                  {booking.status === 'cancelled' && (
                    <TouchableOpacity
                      style={styles.cancelledButton}
                      onPress={() => handleViewDetails(booking)}
                    >
                      <Text style={styles.cancelledButtonText}>
                        View Details
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Cannot Cancel Message */}
                  {!isCancellable && booking.status !== 'cancelled' && (
                    <View style={styles.noCancelMessage}>
                      <Text style={styles.noCancelText}>
                        ⓘ Session has started - cancellation not available
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Cancel Booking Modal */}
      {selectedBooking && (
        <CancelBookingModal
          visible={cancelModalVisible}
          onClose={() => {
            setCancelModalVisible(false);
            setSelectedBooking(null);
          }}
          onConfirm={handleCancelConfirm}
          bookingDetails={{
            consultantName: consultantName,
            serviceTitle: selectedBooking.serviceTitle,
            date: formatDate(selectedBooking.date),
            time: selectedBooking.time,
            amount: selectedBooking.amount,
            refundPercentage: getRefundPercentage(selectedBooking),
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = {
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  bookingsList: {
    paddingVertical: 8,
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 12,
    minWidth: 80,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.dark,
    marginBottom: 12,
  },
  detailsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  refundInfo: {
    backgroundColor: COLORS.green,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  refundText: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '500' as const,
    flex: 1,
  },
  actionButtonsContainer: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    minHeight: 48,
  },
  chatButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: COLORS.white,
    textAlign: 'center' as const,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: COLORS.orange,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    minHeight: 48,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: COLORS.white,
    textAlign: 'center' as const,
  },
  cancelledButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: COLORS.red,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    minHeight: 48,
  },
  cancelledButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: COLORS.white,
    textAlign: 'center' as const,
  },
  noCancelMessage: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
  },
  noCancelText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
};

export default ConsultantBookings;
