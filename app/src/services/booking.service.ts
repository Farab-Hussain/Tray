import { api } from '../lib/fetcher';
import * as NotificationStorage from './notification-storage.service';
import { UserService } from './user.service';
import { normalizeAvatarUrl, normalizeBookingStatus } from '../utils/normalize';
import { logger } from '../utils/logger';

const normalizeBooking = (booking: any) => {
  if (!booking || typeof booking !== 'object') return booking;
  return {
    ...booking,
    status: normalizeBookingStatus(booking.status),
    studentProfileImage: normalizeAvatarUrl({
      profileImage: booking.studentProfileImage,
      avatarUrl: booking.studentAvatarUrl,
      avatar: booking.studentAvatar,
    }),
    consultantProfileImage: normalizeAvatarUrl({
      profileImage: booking.consultantProfileImage,
      avatarUrl: booking.consultantAvatarUrl,
      avatar: booking.consultantAvatar,
    }),
  };
};

export const BookingService = {
  // Create a new booking
  async createBooking(bookingData: {
    consultantId: string;
    studentId: string;
    serviceId: string;
    date: string;
    time: string;
    amount: number;
    quantity: number;
    status: string;
    paymentStatus: string;
    paymentIntentId?: string;
  }) {
    const response = await api.post('/bookings', bookingData, {
      __suppressErrorToast: true,
    } as any);
    return response.data;
  },

  // Check if student has access to consultant (has active booking)
  async checkAccess(consultantId: string) {
    const response = await api.get(`/bookings/has-access/${consultantId}`);
    return response.data;
  },

  // Get student's booked consultants
  async getMyConsultants() {
    const response = await api.get('/bookings/my-consultants');
    const data = response.data;
    if (Array.isArray(data)) return data.map(normalizeBooking);
    if (Array.isArray(data?.consultants)) {
      return { ...data, consultants: data.consultants.map(normalizeBooking) };
    }
    return data;
  },

  // Get all bookings for current user (student)
  async getMyBookings() {
    const response = await api.get('/bookings/student');
    const data = response.data;
    if (Array.isArray(data)) return data.map(normalizeBooking);
    if (Array.isArray(data?.bookings)) {
      return { ...data, bookings: data.bookings.map(normalizeBooking) };
    }
    return data;
  },

  // Get consultant's bookings (clients)
  async getConsultantBookings() {
    const response = await api.get('/bookings/consultant');
    const data = response.data;
    if (Array.isArray(data)) return data.map(normalizeBooking);
    if (Array.isArray(data?.bookings)) {
      return { ...data, bookings: data.bookings.map(normalizeBooking) };
    }
    return data;
  },

  // Update booking status (approve, cancel, etc.)
  async updateBookingStatus(bookingId: string, statusData: { status: string; paymentStatus?: string }) {
    const response = await api.put(`/bookings/${bookingId}/status`, statusData);
    return response.data;
  },

  // Debug endpoint to check all bookings
  async debugBookings() {
    const response = await api.get('/bookings/debug');
    return response.data;
  },

  // Cancel booking
  async cancelBooking(bookingId: string, reason?: string) {
    const response = await api.post(`/bookings/${bookingId}/cancel`, { reason });
    const result = response.data;
    
    // Create notifications for both parties about booking cancellation
    // Note: We need booking details to know who to notify
    // The backend should ideally return booking details, but we'll try to get them
    try {
      // Try to get booking details from the response or fetch them
      const bookingData = result.booking || result;
      
      if (bookingData && bookingData.consultantId && bookingData.studentId) {
        const studentData = await UserService.getUserById(bookingData.studentId);
        const consultantData = await UserService.getUserById(bookingData.consultantId);
        
        const studentName = studentData?.name || studentData?.displayName || 'Student';
        const consultantName = consultantData?.name || consultantData?.displayName || 'Consultant';
        const studentAvatar = normalizeAvatarUrl(studentData);
        const consultantAvatar = normalizeAvatarUrl(consultantData);
        
        // Notify consultant
        await NotificationStorage.createNotification({
          userId: bookingData.consultantId,
          type: 'booking_cancelled',
          category: 'booking',
          title: studentName,
          message: `Booking cancelled${reason ? `: ${reason}` : ''}`,
          data: {
            bookingId: bookingId,
            consultantId: bookingData.consultantId,
            studentId: bookingData.studentId,
          },
          senderId: bookingData.studentId,
          senderName: studentName,
          senderAvatar: studentAvatar,
        });
        
        // Notify student
        await NotificationStorage.createNotification({
          userId: bookingData.studentId,
          type: 'booking_cancelled',
          category: 'booking',
          title: consultantName,
          message: `Your booking has been cancelled${reason ? `: ${reason}` : ''}`,
          data: {
            bookingId: bookingId,
            consultantId: bookingData.consultantId,
            studentId: bookingData.studentId,
          },
          senderId: bookingData.consultantId,
          senderName: consultantName,
          senderAvatar: consultantAvatar,
        });
      }
    } catch (notifError) {
            if (__DEV__) {
        logger.warn('⚠️ Failed to create booking cancellation notifications:', notifError)
      };
    }
    
    return result;
  },

  // Get booked slots for a specific consultant
  async getConsultantBookedSlots(consultantId: string) {
    const response = await api.get(`/bookings/consultant/${consultantId}/booked-slots`);
    return response.data;
  },
};
