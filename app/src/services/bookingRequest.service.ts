import { fetcher, api } from '../lib/fetcher';
import * as NotificationStorage from './notification-storage.service';
import { UserService } from './user.service';
import {
  normalizeAvatarUrl,
  normalizeBookingStatus,
  normalizeTimestampToIso,
} from '../utils/normalize';
import { logger } from '../utils/logger';

export interface BookingRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentProfileImage?: string | null;
  consultantId: string;
  serviceId: string;
  serviceTitle: string;
  servicePrice: number;
  serviceDuration: number;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  message?: string;
  createdAt: string;
  updatedAt: string;
}

const normalizeBookingRequestStatus = (status: any): BookingRequest['status'] => {
  const raw = normalizeBookingStatus(status);
  if (raw === 'confirmed' || raw === 'approved') return 'accepted';
  if (raw === 'rejected') return 'declined';
  if (raw === 'canceled') return 'cancelled';
  if (['pending', 'accepted', 'declined', 'completed', 'cancelled'].includes(raw)) {
    return raw as BookingRequest['status'];
  }
  return 'pending';
};

const normalizeBookingRequest = (item: any): BookingRequest => ({
  ...item,
  status: normalizeBookingRequestStatus(item?.status),
  studentProfileImage: normalizeAvatarUrl({
    profileImage: item?.studentProfileImage,
    avatarUrl: item?.studentAvatarUrl,
    avatar: item?.studentAvatar,
  }) || null,
  createdAt: normalizeTimestampToIso(item?.createdAt) || '',
  updatedAt: normalizeTimestampToIso(item?.updatedAt) || '',
});

export const BookingRequestService = {
  // Get all booking requests for a consultant
  async getConsultantBookingRequests(consultantId: string): Promise<BookingRequest[]> {
    try {
      const response = await fetcher(`/booking-requests/consultant/${consultantId}`);
      return (Array.isArray(response.data) ? response.data : []).map(normalizeBookingRequest);
    } catch (error) {
      logger.error('Error fetching consultant booking requests:', error);
      throw error;
    }
  },

  // Get all booking requests for a student
  async getStudentBookingRequests(studentId: string): Promise<BookingRequest[]> {
    try {
      const response = await fetcher(`/booking-requests/student/${studentId}`);
      return (Array.isArray(response.data) ? response.data : []).map(normalizeBookingRequest);
    } catch (error) {
      logger.error('Error fetching student booking requests:', error);
      throw error;
    }
  },

  // Create a new booking request
  async createBookingRequest(bookingData: {
    studentId: string;
    consultantId: string;
    serviceId: string;
    date: string;
    startTime: string;
    endTime: string;
    message?: string;
  }): Promise<BookingRequest> {
    try {
      const response = await api.post('/booking-requests', bookingData);
      const bookingRequest = normalizeBookingRequest(response.data);
      
      // Create notification for consultant about new booking request
      try {
        const studentData = await UserService.getUserById(bookingData.studentId);
        const studentName = studentData?.name || studentData?.displayName || 'A student';
        const studentAvatar = normalizeAvatarUrl(studentData);
        
        await NotificationStorage.createNotification({
          userId: bookingData.consultantId,
          type: 'booking',
          category: 'booking',
          title: studentName,
          message: `New booking request for ${bookingRequest.serviceTitle || 'your service'}`,
          data: {
            bookingId: bookingRequest.id,
            consultantId: bookingData.consultantId,
            studentId: bookingData.studentId,
          },
          senderId: bookingData.studentId,
          senderName: studentName,
          senderAvatar: studentAvatar,
        });
      } catch (notifError) {
        logger.warn('⚠️ Failed to create booking notification:', notifError);
      }
      
      return bookingRequest;
    } catch (error) {
      logger.error('Error creating booking request:', error);
      throw error;
    }
  },

  // Accept a booking request
  async acceptBookingRequest(requestId: string): Promise<BookingRequest> {
    try {
      const response = await api.put(`/booking-requests/${requestId}/accept`);
      const bookingRequest = normalizeBookingRequest(response.data);
      
      // Create notification for student about booking confirmation
      try {
        const consultantData = await UserService.getUserById(bookingRequest.consultantId);
        const consultantName = consultantData?.name || consultantData?.displayName || 'Consultant';
        const consultantAvatar = normalizeAvatarUrl(consultantData);
        
        await NotificationStorage.createNotification({
          userId: bookingRequest.studentId,
          type: 'booking_confirmed',
          category: 'booking',
          title: consultantName,
          message: `Your booking request has been confirmed for ${bookingRequest.serviceTitle || 'the service'}`,
          data: {
            bookingId: bookingRequest.id,
            consultantId: bookingRequest.consultantId,
            studentId: bookingRequest.studentId,
          },
          senderId: bookingRequest.consultantId,
          senderName: consultantName,
          senderAvatar: consultantAvatar,
        });
      } catch (notifError) {
        logger.warn('⚠️ Failed to create booking confirmation notification:', notifError);
      }
      
      return bookingRequest;
    } catch (error) {
      logger.error('Error accepting booking request:', error);
      throw error;
    }
  },

  // Decline a booking request
  async declineBookingRequest(requestId: string, reason?: string): Promise<BookingRequest> {
    try {
      // Get booking request details first to know who to notify
      const bookingRequest = await this.getBookingRequest(requestId);
      
      const response = await api.put(`/booking-requests/${requestId}/decline`, {
        reason
      });
      const declinedRequest = normalizeBookingRequest(response.data);
      
      // Create notification for student about booking decline
      try {
        const consultantData = await UserService.getUserById(bookingRequest.consultantId);
        const consultantName = consultantData?.name || consultantData?.displayName || 'Consultant';
        const consultantAvatar = normalizeAvatarUrl(consultantData);
        
        await NotificationStorage.createNotification({
          userId: bookingRequest.studentId,
          type: 'booking_cancelled',
          category: 'booking',
          title: consultantName,
          message: `Your booking request has been declined${reason ? `: ${reason}` : ''}`,
          data: {
            bookingId: bookingRequest.id,
            consultantId: bookingRequest.consultantId,
            studentId: bookingRequest.studentId,
          },
          senderId: bookingRequest.consultantId,
          senderName: consultantName,
          senderAvatar: consultantAvatar,
        });
      } catch (notifError) {
        logger.warn('⚠️ Failed to create booking decline notification:', notifError);
      }
      
      return declinedRequest;
    } catch (error) {
      logger.error('Error declining booking request:', error);
      throw error;
    }
  },

  // Cancel a booking request
  async cancelBookingRequest(requestId: string, reason?: string): Promise<BookingRequest> {
    try {
      // Get booking request details first to know who to notify
      const bookingRequest = await this.getBookingRequest(requestId);
      
      const response = await api.put(`/booking-requests/${requestId}/cancel`, {
        reason
      });
      const cancelledRequest = normalizeBookingRequest(response.data);
      
      // Create notifications for both parties
      try {
        const studentData = await UserService.getUserById(bookingRequest.studentId);
        const consultantData = await UserService.getUserById(bookingRequest.consultantId);
        
        const studentName = studentData?.name || studentData?.displayName || 'Student';
        const consultantName = consultantData?.name || consultantData?.displayName || 'Consultant';
        const studentAvatar = normalizeAvatarUrl(studentData);
        const consultantAvatar = normalizeAvatarUrl(consultantData);
        
        // Notify consultant
        await NotificationStorage.createNotification({
          userId: bookingRequest.consultantId,
          type: 'booking_cancelled',
          category: 'booking',
          title: studentName,
          message: `Booking request cancelled for ${bookingRequest.serviceTitle || 'your service'}`,
          data: {
            bookingId: bookingRequest.id,
            consultantId: bookingRequest.consultantId,
            studentId: bookingRequest.studentId,
          },
          senderId: bookingRequest.studentId,
          senderName: studentName,
          senderAvatar: studentAvatar,
        });
        
        // Notify student
        await NotificationStorage.createNotification({
          userId: bookingRequest.studentId,
          type: 'booking_cancelled',
          category: 'booking',
          title: consultantName,
          message: `Your booking request has been cancelled`,
          data: {
            bookingId: bookingRequest.id,
            consultantId: bookingRequest.consultantId,
            studentId: bookingRequest.studentId,
          },
          senderId: bookingRequest.consultantId,
          senderName: consultantName,
          senderAvatar: consultantAvatar,
        });
      } catch (notifError) {
        logger.warn('⚠️ Failed to create booking cancellation notifications:', notifError);
      }
      
      return cancelledRequest;
    } catch (error) {
      logger.error('Error cancelling booking request:', error);
      throw error;
    }
  },

  // Get booking request details
  async getBookingRequest(requestId: string): Promise<BookingRequest> {
    try {
      const response = await fetcher(`/booking-requests/${requestId}`);
      return normalizeBookingRequest(response.data);
    } catch (error) {
      logger.error('Error fetching booking request:', error);
      throw error;
    }
  }
};
