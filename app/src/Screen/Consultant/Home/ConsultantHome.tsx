import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Text, ScrollView, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { COLORS } from '../../../constants/core/colors';
import HomeHeader from '../../../components/shared/HomeHeader';
import { consultantHome } from '../../../constants/styles/consultantStyles';
import LeadCard from '../../../components/ui/LeadCard';
import { BookingRequest } from '../../../services/bookingRequest.service';
import { useAuth } from '../../../contexts/AuthContext';
import { ConsultantService } from '../../../services/consultant.service';
import { BookingService } from '../../../services/booking.service';
import { showSuccess, handleApiError } from '../../../utils/toast';
import { api } from '../../../lib/fetcher';
import { useChatContext } from '../../../contexts/ChatContext';

interface Booking {
  id: string;
  studentId: string;
  consultantId: string;
  serviceId: string;
  date: string;
  time: string;
  amount: number;
  quantity: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

const ConsultantHome = ({ navigation }: any) => {
  const { user } = useAuth();
  const { openChatWith } = useChatContext();
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availableSlots, setAvailableSlots] = useState(0);
  const [totalSlots, setTotalSlots] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const isFetchingRef = useRef(false);

  // Debounced fetch function to prevent rapid successive calls
  const fetchBookingRequests = useCallback(async (forceRefresh = false) => {
    if (!user?.uid || isFetchingRef.current) return;

    // Prevent rapid successive calls (debounce)
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < 2000) {
      console.log('🚫 [ConsultantHome] Skipping fetch - too soon since last fetch');
      return;
    }

    isFetchingRef.current = true;
    setLastFetchTime(now);

    try {
      console.log('🔍 [ConsultantHome] Fetching booking requests for consultant:', user.uid);
      
      // Fetch consultant availability to check slot availability (only if not refreshing)
      if (!refreshing) {
        try {
          const availabilityResponse = await ConsultantService.getConsultantAvailability(user.uid);
          const availability = availabilityResponse.data;
          
          // Calculate available slots from availability data
          let totalSlotsCount = 0;
          let availableSlotsCount = 0;
          
          if (availability?.availabilitySlots && Array.isArray(availability.availabilitySlots)) {
            availability.availabilitySlots.forEach((slotGroup: any) => {
              if (slotGroup.timeSlots && Array.isArray(slotGroup.timeSlots)) {
                totalSlotsCount += slotGroup.timeSlots.length;
                // For now, assume all slots are available (in real app, you'd check against booked slots)
                availableSlotsCount += slotGroup.timeSlots.length;
              }
            });
          }
          
          setTotalSlots(totalSlotsCount);
          setAvailableSlots(availableSlotsCount);
          
          console.log(`📊 [ConsultantHome] Slot availability: ${availableSlotsCount}/${totalSlotsCount} slots available`);
        } catch {
          console.log('⚠️ [ConsultantHome] Could not fetch availability, using default values');
          setTotalSlots(0);
          setAvailableSlots(0);
        }
      }
      
      // Fetch real booking requests from API
      console.log('🔍 [ConsultantHome] Fetching consultant bookings...');
      const response = await BookingService.getConsultantBookings();
      const bookings: Booking[] = response.bookings || [];
      
      console.log('📊 [ConsultantHome] Found', bookings.length, 'total bookings');

      // Filter bookings - show paid bookings that are not completed/cancelled/approved
      const actionableBookings = bookings.filter(booking => {
        const isPaid = booking.paymentStatus === 'paid';
        const isActionable = !['completed', 'cancelled', 'rejected', 'approved'].includes(booking.status);
        
        return isPaid && isActionable;
      });

      console.log('📊 [ConsultantHome] Found', actionableBookings.length, 'actionable bookings');

      // Batch fetch student and service details to reduce API calls
      const studentIds = [...new Set(actionableBookings.map(b => b.studentId))];
      const serviceIds = [...new Set(actionableBookings.map(b => b.serviceId))];

      // Fetch all student details in parallel
      const studentDetailsMap = new Map();
      const studentPromises = studentIds.map(async (studentId) => {
        try {
          const studentResponse = await api.get(`/auth/users/${studentId}`);
          if (studentResponse.data) {
            // Check multiple possible fields for profile image (profileImage, avatarUrl, avatar, photoURL)
            // Also handle empty strings by converting them to null
            const getValidImageUrl = (url: string | null | undefined): string | null => {
              if (!url || typeof url !== 'string' || url.trim() === '') {
                return null;
              }
              return url.trim();
            };
            
            const profileImage = 
              getValidImageUrl(studentResponse.data.profileImage) ||
              getValidImageUrl(studentResponse.data.avatarUrl) ||
              getValidImageUrl(studentResponse.data.avatar) ||
              getValidImageUrl(studentResponse.data.photoURL) ||
              null;
            
            console.log(`📸 [ConsultantHome] Student ${studentId} profile data:`, {
              name: studentResponse.data.name,
              profileImage: profileImage,
              allFields: {
                profileImage: studentResponse.data.profileImage,
                avatarUrl: studentResponse.data.avatarUrl,
                avatar: studentResponse.data.avatar,
                photoURL: studentResponse.data.photoURL,
              }
            });
            
            studentDetailsMap.set(studentId, {
              name: studentResponse.data.name || `Student ${studentId.slice(0, 8)}`,
              email: studentResponse.data.email || `student@example.com`,
              profileImage: profileImage
            });
          }
        } catch (error: any) {
          console.log(`⚠️ [ConsultantHome] Could not fetch student details for ${studentId}:`, error?.message || error);
          studentDetailsMap.set(studentId, {
            name: `Student ${studentId.slice(0, 8)}`,
            email: `student@example.com`,
            profileImage: null
          });
        }
      });

      // Fetch all service details in parallel
      const serviceDetailsMap = new Map();
      const servicePromises = serviceIds.map(async (serviceId) => {
        try {
          const serviceResponse = await api.get(`/consultants/services/${serviceId}`);
          if (serviceResponse.data?.service) {
            serviceDetailsMap.set(serviceId, {
              title: serviceResponse.data.service.title || 'Consultation Service',
              duration: serviceResponse.data.service.duration || 60
            });
          } else if (serviceResponse.data?.title) {
            serviceDetailsMap.set(serviceId, {
              title: serviceResponse.data.title || 'Consultation Service',
              duration: serviceResponse.data.duration || 60
            });
          }
        } catch {
          console.log(`⚠️ [ConsultantHome] Could not fetch service details for ${serviceId}`);
          serviceDetailsMap.set(serviceId, {
            title: 'Consultation Service',
            duration: 60
          });
        }
      });

      // Wait for all parallel requests to complete
      await Promise.all([...studentPromises, ...servicePromises]);

      // Transform bookings to booking requests using cached data
      const bookingRequestsList: BookingRequest[] = actionableBookings.map((booking) => {
        const studentDetails = studentDetailsMap.get(booking.studentId) || {
          name: `Student ${booking.studentId.slice(0, 8)}`,
          email: `student@example.com`,
          profileImage: null
        };

        const serviceDetails = serviceDetailsMap.get(booking.serviceId) || {
          title: 'Consultation Service',
          duration: 60
        };

        return {
          id: booking.id,
          studentId: booking.studentId,
          studentName: studentDetails.name,
          studentEmail: studentDetails.email,
          studentProfileImage: studentDetails.profileImage,
          consultantId: booking.consultantId,
          serviceId: booking.serviceId,
          serviceTitle: serviceDetails.title,
          servicePrice: booking.amount,
          serviceDuration: serviceDetails.duration,
          date: booking.date,
          startTime: booking.time,
          endTime: booking.time,
          status: booking.status as 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled',
          message: 'Booking request from student',
          createdAt: booking.createdAt,
          updatedAt: booking.createdAt
        };
      });

      // Sort by most recent
      bookingRequestsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setBookingRequests(bookingRequestsList);
      
      console.log('✅ [ConsultantHome] Successfully loaded', bookingRequestsList.length, 'booking requests');
    } catch (error) {
      console.error('❌ [ConsultantHome] Error fetching booking requests:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [user?.uid, refreshing, lastFetchTime]);

  // Load data on component mount only
  useEffect(() => {
    if (user?.uid) {
      fetchBookingRequests(true);
    }
  }, [user?.uid, fetchBookingRequests]);

  // Load data when screen comes into focus (with debouncing)
  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        fetchBookingRequests();
      }
    }, [user?.uid, fetchBookingRequests])
  );

  const handleAcceptLead = async (request: BookingRequest) => {
    try {
      console.log('🔍 [ConsultantHome] Accepting booking request:', request.id);
      
      // Update booking status to approved
      await BookingService.updateBookingStatus(request.id, { 
        status: 'approved',
        paymentStatus: 'paid' // Ensure payment status is set
      });
      
      // Remove from the list
      setBookingRequests(prev => prev.filter(req => req.id !== request.id));
      
      // Create chat between consultant and student
      if (user?.uid && request.studentId) {
        try {
          const chatId = await openChatWith(request.studentId);
          console.log('✅ [ConsultantHome] Chat created with ID:', chatId);
          
          showSuccess('Booking accepted! Opening chat...');
          
          // Navigate directly to chat screen with the student
          navigation.navigate('ChatScreen', {
            chatId: chatId,
            otherUserId: request.studentId,
            consultant: {
              name: request.studentName,
              title: 'Student',
              avatar: request.studentProfileImage ? { uri: request.studentProfileImage } : require('../../../assets/image/avatar.png'),
              isOnline: true
            }
          });
        } catch (chatError) {
          console.error('❌ [ConsultantHome] Error creating chat:', chatError);
          showSuccess('Booking accepted!');
        }
      } else {
        showSuccess('Booking request accepted!');
      }
    } catch (error) {
      console.error('❌ [ConsultantHome] Error accepting booking request:', error);
      handleApiError(error);
    }
  };

  const handleDeclineLead = async (requestId: string) => {
    try {
      console.log('🔍 [ConsultantHome] Declining booking request:', requestId);
      
      // Update booking status to cancelled
      await BookingService.updateBookingStatus(requestId, { status: 'cancelled' });
      
      // Remove from the list
      setBookingRequests(prev => prev.filter(req => req.id !== requestId));
      
      showSuccess('Booking request declined');
    } catch (error) {
      console.error('❌ [ConsultantHome] Error declining booking request:', error);
      handleApiError(error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookingRequests(true);
  };

  return (
    <SafeAreaView style={screenStyles.safeArea} edges={['top']}>
      <HomeHeader />
      
      {/* Show alert bar only when 0 slots are available */}
      {availableSlots === 0 && totalSlots > 0 && (
        <View style={consultantHome.warningBanner}>
          <Text style={consultantHome.warningTitle}>
            ⚠️ Full Capacity - 0 seats available
          </Text>
        </View>
      )}
      
      <ScrollView
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.green}
          />
        }
      >
        <View>
          <Text style={consultantHome.sectionTitle}>
            Booking Requests ({bookingRequests.length})
          </Text>
          {totalSlots > 0 && (
            <Text style={consultantHome.loadingText}>
              Available Slots: {availableSlots}/{totalSlots}
            </Text>
          )}
        </View>
        
        {loading ? (
          <View style={consultantHome.loadingContainer}>
            <Text style={consultantHome.loadingText}>Loading booking requests...</Text>
          </View>
        ) : bookingRequests.length === 0 ? (
          <View style={consultantHome.emptyContainer}>
            <Text style={consultantHome.emptyText}>
              No pending booking requests at the moment.{'\n'}
              Students will appear here when they book your services.
            </Text>
          </View>
        ) : (
          <View style={consultantHome.leadCardsContainer}>
            {bookingRequests.map((request) => {
              console.log(`🎯 [ConsultantHome] Rendering LeadCard for booking ${request.id}:`, {
                studentName: request.studentName,
                serviceTitle: request.serviceTitle,
                serviceId: request.serviceId,
                fullRequest: request
              });
              
              // Validate profile image URL before using it
              const getAvatarSource = () => {
                const profileImage = request.studentProfileImage;
                if (profileImage && typeof profileImage === 'string' && profileImage.trim() !== '') {
                  // Validate URL format
                  try {
                    new URL(profileImage);
                    return { uri: profileImage.trim() };
                  } catch {
                    // Invalid URL, use placeholder
                    console.log(`⚠️ [ConsultantHome] Invalid profile image URL for ${request.studentName}: ${profileImage}`);
                    return require('../../../assets/image/avatar.png');
                  }
                }
                return require('../../../assets/image/avatar.png');
              };
              
              return (
                <LeadCard
                  key={request.id}
                  clientName={request.studentName}
                  serviceNeeded={request.serviceTitle}
                  avatarUri={getAvatarSource()}
                  onAccept={() => handleAcceptLead(request)}
                  onDecline={() => handleDeclineLead(request.id)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ConsultantHome;
