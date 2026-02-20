import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { COLORS } from '../../../constants/core/colors';
import { bookedConsultantsStyles } from '../../../constants/styles/bookedConsultantsStyles';
import LoadingState from '../../../components/ui/LoadingState';
import { Calendar, Clock, Phone, Star, UserRound } from 'lucide-react-native';
import { getStatusColor } from '../../../utils/statusUtils';
import { BookingService } from '../../../services/booking.service';
import { useAuth } from '../../../contexts/AuthContext';
import { showError } from '../../../utils/toast';
import { logger } from '../../../utils/logger';
import { normalizeAvatarUrl, normalizeBookingStatus, normalizeTimestampToIso } from '../../../utils/normalize';

const BookedConsultants = ({ navigation }: any) => {
  const [bookedConsultants, setBookedConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  // const [debugInfo, setDebugInfo] = useState<any>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const isFetchingRef = useRef(false);
  const { user } = useAuth();

  // Debounced fetch function to prevent rapid successive calls
  const fetchBookedConsultants = useCallback(async (forceRefresh = false) => {
    // Skip fetch if API is known to be unavailable
    if (apiUnavailable && !forceRefresh) {
      setLoading(false);
      return;
    }

    // Prevent rapid successive calls (debounce)
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < 3000) {
            if (__DEV__) {
        logger.debug('🚫 [BookedConsultants] Skipping fetch - too soon since last fetch')
      };
      return;
    }

    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLastFetchTime(now);

    try {
      setLoading(true);
            if (__DEV__) {
        logger.debug('📅 [BookedConsultants] Fetching my booked consultants...')
      };
      const response = await BookingService.getMyConsultants();
            if (__DEV__) {
        logger.debug('✅ [BookedConsultants] Booked consultants response:', response)
      };
      
      // Extract consultants array from response
      const consultantsData = response?.consultants || response?.bookings || [];
      setBookedConsultants(consultantsData);
            if (__DEV__) {
        logger.debug(`✅ [BookedConsultants] Successfully loaded ${consultantsData.length} consultants`)
      };
    } catch (error: any) {
      // Mark API as unavailable on 404 to prevent repeated calls
      if (error?.response?.status === 404) {
                if (__DEV__) {
          logger.debug('⚠️ [BookedConsultants] Bookings API not available (404) - showing empty state')
        };
        setApiUnavailable(true);
      } else {
                if (__DEV__) {
          logger.error('❌ [BookedConsultants] Error fetching booked consultants:', error?.message || error)
        };
      }
      // Keep empty array on error
      setBookedConsultants([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [apiUnavailable, lastFetchTime]);

  // Load data on component mount only
  useEffect(() => {
    fetchBookedConsultants(true);
  }, [fetchBookedConsultants]);

  // Refresh when returning from review/edit-review screens
  useFocusEffect(
    useCallback(() => {
      fetchBookedConsultants(true);
    }, [fetchBookedConsultants]),
  );

  // const handleDebugBookings = async () => {
  //   try {
  //     logger.debug('🧪 Testing booking debug...');
  //     const debugData = await BookingService.debugBookings();
  //     logger.debug('🔍 Debug data:', debugData);
  //     setDebugInfo(debugData);
  //   } catch (error) {
  //     logger.error('❌ Debug error:', error);
  //   }
  // };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return COLORS.red; // Red background for confirmed
      case 'Completed':
        return COLORS.green; // Green background for completed
      case 'Pending':
        return COLORS.red; // Red background for pending
      default:
        return COLORS.red;
    }
  };

  const handleCallPress = async (consultant: any) => {
    try {
      if (!user?.uid) {
        showError('You must be logged in to make calls');
        return;
      }

      const consultantId = consultant.uid || consultant.id;
      if (!consultantId) {
        showError('Consultant information is missing');
        return;
      }

      // Check if student has a confirmed booking with this consultant
      const bookings = await BookingService.getMyBookings();
      const studentBookings = bookings?.bookings || [];

      const consultantBookings = studentBookings.filter(
        (booking: any) => booking.consultantId === consultantId,
      );

      const confirmedBooking = consultantBookings.find((booking: any) =>
        isActiveBookingStatus(booking.status),
      );

      if (!confirmedBooking) {
        const pendingBooking = consultantBookings.find(
          (booking: any) => normalizeBookingStatus(booking.status) === 'pending',
        );

        let alertMessage = '';
        if (pendingBooking) {
          alertMessage = `Your booking with ${consultant.name || 'this consultant'} is pending confirmation. Please wait for the consultant to confirm your booking before you can make calls.`;
        } else {
          alertMessage = `You need to book with ${consultant.name || 'this consultant'} before you can make calls.`;
        }

        Alert.alert('Booking Required', alertMessage, [
          {
            text: pendingBooking ? 'View Booking' : 'Book Now',
            onPress: () => {
              navigation.navigate('MainTabs', {
                screen: 'Services',
                params: {
                  screen: 'ServicesScreen',
                  params: {
                    consultantId: consultantId,
                    consultantName: consultant.name,
                    consultantCategory: consultant.category,
                  },
                },
              });
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
        return;
      }

      // Generate callId: callerId_receiverId-timestamp
      const callId = `${user.uid}_${consultantId}-${Date.now()}`;

      // Navigate to audio call screen
      navigation.navigate('CallingScreen', {
        callId,
        callerId: user.uid,
        receiverId: consultantId,
        isCaller: true,
      });
    } catch (error: any) {
      if (__DEV__) {
        logger.error('Error initiating call:', error);
      }
      showError('Unable to initiate call. Please try again.');
    }
  };

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader 
        title="My Consultants" 
        onBackPress={() => navigation.goBack()} 
        rightComponent={
          <TouchableOpacity 
            style={bookedConsultantsStyles.browseAllButton}
            onPress={() => navigation.navigate('Consultants')}
          >
            <Text style={bookedConsultantsStyles.browseAllText}>Browse All</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView 
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <LoadingState message="Loading your bookings..." />
        ) : bookedConsultants.length === 0 ? (
          <View style={bookedConsultantsStyles.emptyContainer}>
            <Text style={bookedConsultantsStyles.emptyTitle}>No Booked Consultants</Text>
            <Text style={bookedConsultantsStyles.emptySubtitle}>
              You haven't booked any consultants yet. Browse our consultants to get started!
            </Text>
            <TouchableOpacity 
              style={bookedConsultantsStyles.browseButton}
              onPress={() => navigation.navigate('Consultants')}
            >
              <Text style={bookedConsultantsStyles.browseButtonText}>Browse Consultants</Text>
            </TouchableOpacity>
            
            
          </View>
        ) : (
          <View style={bookedConsultantsStyles.consultantsList}>
            {bookedConsultants.map((consultant) => {
              // Handle different image field names from backend
              const imageSource = normalizeAvatarUrl({
                profileImage: consultant.profileImage,
                avatarUrl: consultant.avatarUri,
                avatar: consultant.avatar,
              });
              const consultantImage = imageSource 
                ? (typeof imageSource === 'string' 
                    ? { uri: imageSource } 
                    : imageSource)
                : null;

              // Map backend status to display status
              const normalizedLastBookingStatus = normalizeBookingStatus(consultant.lastBookingStatus);
              const displayStatus = normalizedLastBookingStatus
                ? normalizedLastBookingStatus.charAt(0).toUpperCase() + normalizedLastBookingStatus.slice(1)
                : (consultant.status || 'Confirmed');

              return (
                <View key={consultant.uid || consultant.id || consultant.bookingId} style={bookedConsultantsStyles.consultantCard}>
                  {/* Header with avatar and basic info */}
                  <View style={bookedConsultantsStyles.cardHeader}>
                    {consultantImage ? (
                      <Image 
                        source={consultantImage} 
                        style={bookedConsultantsStyles.avatar}
                      />
                    ) : (
                      <View
                        style={[
                          bookedConsultantsStyles.avatar,
                          {
                            backgroundColor: '#A5AFBD',
                            alignItems: 'center',
                            justifyContent: 'center',
                          },
                        ]}
                      >
                        <UserRound size={20} color={COLORS.gray} />
                      </View>
                    )}
                    <View style={bookedConsultantsStyles.consultantInfo}>
                      <Text style={bookedConsultantsStyles.consultantName} numberOfLines={1}>
                        {consultant.name || consultant.consultantName || 'Consultant'}
                      </Text>
                      <Text style={bookedConsultantsStyles.consultantTitle} numberOfLines={1}>
                        {consultant.category || consultant.title || consultant.serviceTitle || 'Consultation'}
                      </Text>
                      <View style={bookedConsultantsStyles.ratingContainer}>
                        {Array.from({ length: 5 }).map((_, i) => {
                          const size = 14;
                          const emptyColor = COLORS.lightGray;
                          const fillColor = COLORS.yellow;
                          const raw = parseFloat(consultant.rating) || 0;
                          const fullCount = Math.floor(raw);
                          const hasHalf = raw < 5 && raw - fullCount > 0;
                          const isFull = i < fullCount || (raw === 5 && i < 5);
                          const isHalf = i === fullCount && hasHalf;
                          return (
                            <View key={i} style={{ position: 'relative', width: size, height: size }}>
                              <Star size={size} color={emptyColor} />
                              {(isFull || isHalf) && (
                                <View style={{ position: 'absolute', left: 0, top: 0, width: isFull ? size : size / 2, height: size, overflow: 'hidden' }}>
                                  <Star size={size} color={fillColor} fill={fillColor} />
                                </View>
                              )}
                            </View>
                          );
                        })}
                        <Text style={bookedConsultantsStyles.rating}>
                          {consultant.rating ?? 0}
                        </Text>
                        <Text style={bookedConsultantsStyles.reviewCount}>
                          ({consultant.totalReviews || 0})
                        </Text>
                      </View>
                    </View>
                    <View style={[
                      bookedConsultantsStyles.statusBadge, 
                      { backgroundColor: getStatusBackground(displayStatus) }
                    ]}>
                      <Text style={[
                        bookedConsultantsStyles.statusText, 
                        { color: getStatusColor(displayStatus, 'booking') }
                      ]}>
                        {displayStatus}
                      </Text>
                    </View>
                  </View>

                  {/* Session details */}
                  <View style={bookedConsultantsStyles.sessionDetails}>
                    <View style={bookedConsultantsStyles.detailRow}>
                      <Calendar size={16} color={COLORS.gray} />
                      <Text style={bookedConsultantsStyles.detailText}>
                        Last Booking: {normalizeTimestampToIso(consultant.lastBookingDate)?.split('T')[0] || consultant.lastBookingDate || 'Not scheduled'}
                      </Text>
                    </View>
                    <View style={bookedConsultantsStyles.detailRow}>
                      {Array.from({ length: 5 }).map((_, i) => {
                        const size = 16;
                        const emptyColor = COLORS.lightGray;
                        const fillColor = COLORS.yellow;
                        const raw = parseFloat(consultant.rating) || 0;
                        const fullCount = Math.floor(raw);
                        const hasHalf = raw < 5 && raw - fullCount > 0;
                        const isFull = i < fullCount || (raw === 5 && i < 5);
                        const isHalf = i === fullCount && hasHalf;
                        return (
                          <View key={i} style={{ position: 'relative', width: size, height: size }}>
                            <Star size={size} color={emptyColor} />
                            {(isFull || isHalf) && (
                              <View style={{ position: 'absolute', left: 0, top: 0, width: isFull ? size : size / 2, height: size, overflow: 'hidden' }}>
                                <Star size={size} color={fillColor} fill={fillColor} />
                              </View>
                            )}
                          </View>
                        );
                      })}
                      <Text style={bookedConsultantsStyles.detailText}>
                        Total Bookings: {consultant.totalBookings || 0}
                      </Text>
                    </View>
                    <View style={bookedConsultantsStyles.detailRow}>
                      <Clock size={16} color={COLORS.gray} />
                      <Text style={bookedConsultantsStyles.detailText}>
                        Status: {displayStatus}
                      </Text>
                    </View>
                  </View>

                  {/* Progress bar - only show if session data is available */}
                  {consultant.totalSessions && (
                    <View style={bookedConsultantsStyles.progressContainer}>
                      <Text style={bookedConsultantsStyles.progressText}>
                        Sessions: {consultant.completedSessions || 0}/{consultant.totalSessions}
                      </Text>
                      <View style={bookedConsultantsStyles.progressBar}>
                        <View 
                          style={[
                            bookedConsultantsStyles.progressFill, 
                            { width: `${((consultant.completedSessions || 0) / consultant.totalSessions) * 100}%` }
                          ]} 
                        />
                      </View>
                    </View>
                  )}

                  {/* Action buttons */}
                  <View style={bookedConsultantsStyles.actionButtons}>
               
                  <TouchableOpacity 
                    style={bookedConsultantsStyles.callButton}
                    onPress={() => handleCallPress(consultant)}
                  >
                    <Phone size={16} color={COLORS.white} />
                    <Text style={bookedConsultantsStyles.callButtonText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={bookedConsultantsStyles.reviewButton}
                    onPress={() => navigation.navigate('ReviewEmployer', {
                      consultantId: consultant.uid,
                      consultantName: consultant.name,
                      consultantImage: consultant.profileImage,
                      bookingId: consultant.uid
                    })}
                  >
                    <Star size={16} color={COLORS.white} />
                    <Text style={bookedConsultantsStyles.reviewButtonText}>Review</Text>
                  </TouchableOpacity>
                </View>
                {/* View Bookings Button */}
                <TouchableOpacity 
                  style={bookedConsultantsStyles.viewBookingsButton}
                  onPress={() => navigation.navigate('ConsultantBookings', {
                    consultantId: consultant.uid,
                    consultantName: consultant.name
                  })}
                >
                  <Calendar size={16} color={COLORS.green} />
                  <Text style={bookedConsultantsStyles.viewBookingsText}>
                    View & Manage Bookings ({consultant.totalBookings || 0})
                  </Text>
                </TouchableOpacity>

              </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookedConsultants;
  const isActiveBookingStatus = (rawStatus: any) => {
    const status = normalizeBookingStatus(rawStatus);
    return ['pending', 'accepted', 'approved', 'confirmed'].includes(status);
  };
