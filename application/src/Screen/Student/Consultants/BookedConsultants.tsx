import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { COLORS } from '../../../constants/core/colors';
import { bookedConsultantsStyles } from '../../../constants/styles/bookedConsultantsStyles';
import { Calendar, Clock, Phone, MessageCircle, Star } from 'lucide-react-native';
import { BookingService } from '../../../services/booking.service';

const BookedConsultants = ({ navigation }: any) => {
  const [bookedConsultants, setBookedConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  // const [debugInfo, setDebugInfo] = useState<any>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const isFetchingRef = useRef(false);

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
      console.log('🚫 [BookedConsultants] Skipping fetch - too soon since last fetch');
      return;
    }

    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLastFetchTime(now);

    try {
      setLoading(true);
      console.log('📅 [BookedConsultants] Fetching my booked consultants...');
      const response = await BookingService.getMyConsultants();
      console.log('✅ [BookedConsultants] Booked consultants response:', response);
      
      // Extract consultants array from response
      const consultantsData = response?.consultants || response?.bookings || [];
      setBookedConsultants(consultantsData);
      console.log(`✅ [BookedConsultants] Successfully loaded ${consultantsData.length} consultants`);
    } catch (error: any) {
      // Mark API as unavailable on 404 to prevent repeated calls
      if (error?.response?.status === 404) {
        console.log('⚠️ [BookedConsultants] Bookings API not available (404) - showing empty state');
        setApiUnavailable(true);
      } else {
        console.error('❌ [BookedConsultants] Error fetching booked consultants:', error?.message || error);
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

  // const handleDebugBookings = async () => {
  //   try {
  //     console.log('🧪 Testing booking debug...');
  //     const debugData = await BookingService.debugBookings();
  //     console.log('🔍 Debug data:', debugData);
  //     setDebugInfo(debugData);
  //   } catch (error) {
  //     console.error('❌ Debug error:', error);
  //   }
  // };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return COLORS.white; // White text on red background
      case 'Completed':
        return COLORS.white; // White text on green background
      case 'Pending':
        return COLORS.white; // White text on red background
      default:
        return COLORS.white;
    }
  };

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
          <View style={screenStyles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={screenStyles.loadingText}>Loading your bookings...</Text>
          </View>
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
            
            {/* Debug Button */}
            {/* <TouchableOpacity 
              style={[bookedConsultantsStyles.browseButton, { backgroundColor: COLORS.orange, marginTop: 10 }]}
              onPress={handleDebugBookings}
            >
              <Text style={bookedConsultantsStyles.browseButtonText}>Debug Bookings</Text>
            </TouchableOpacity> */}
            
            {/* Debug Info Display */}
            {/* {debugInfo && (
              <View style={bookedConsultantsStyles.debugContainer}>
                <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Debug Info:</Text>
                <Text>Total Bookings: {debugInfo.totalBookings}</Text>
                <Text>Student ID: {debugInfo.studentId}</Text>
                {debugInfo.bookings?.map((booking: any, index: number) => (
                  <Text key={index} style={{ fontSize: 12, marginTop: 5 }}>
                    Booking {index + 1}: {booking.paymentStatus} - {booking.status}
                  </Text>
                ))}
              </View>
            )} */}
          </View>
        ) : (
          <View style={bookedConsultantsStyles.consultantsList}>
            {bookedConsultants.map((consultant) => {
              // Handle different image field names from backend
              const imageSource = consultant.profileImage || consultant.avatarUri || consultant.avatar;
              const consultantImage = imageSource 
                ? (typeof imageSource === 'string' 
                    ? { uri: imageSource } 
                    : imageSource)
                : require('../../../assets/image/avatar.png');

              // Map backend status to display status
              const displayStatus = consultant.lastBookingStatus 
                ? consultant.lastBookingStatus.charAt(0).toUpperCase() + consultant.lastBookingStatus.slice(1)
                : (consultant.status || 'Confirmed');

              return (
                <View key={consultant.uid || consultant.id || consultant.bookingId} style={bookedConsultantsStyles.consultantCard}>
                  {/* Header with avatar and basic info */}
                  <View style={bookedConsultantsStyles.cardHeader}>
                    <Image 
                      source={consultantImage} 
                      style={bookedConsultantsStyles.avatar}
                      defaultSource={require('../../../assets/image/avatar.png')}
                    />
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
                          {consultant.rating || '5.0'}
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
                        { color: getStatusColor(displayStatus) }
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
                        Last Booking: {consultant.lastBookingDate || 'Not scheduled'}
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
                      style={bookedConsultantsStyles.messageButton}
                      onPress={() => navigation.navigate('ChatScreen', {
                        consultant: {
                          name: consultant.name,
                          title: consultant.category,
                          avatar: consultantImage,
                          isOnline: true
                        }
                      })}
                    >
                    <MessageCircle size={16} color={COLORS.white} />
                    <Text style={bookedConsultantsStyles.messageButtonText}>Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={bookedConsultantsStyles.callButton}>
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
