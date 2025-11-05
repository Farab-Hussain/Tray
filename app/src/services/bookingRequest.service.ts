import { fetcher, api } from '../lib/fetcher';

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

export const BookingRequestService = {
  // Get all booking requests for a consultant
  async getConsultantBookingRequests(consultantId: string): Promise<BookingRequest[]> {
    try {
      const response = await fetcher(`/booking-requests/consultant/${consultantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching consultant booking requests:', error);
      throw error;
    }
  },

  // Get all booking requests for a student
  async getStudentBookingRequests(studentId: string): Promise<BookingRequest[]> {
    try {
      const response = await fetcher(`/booking-requests/student/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student booking requests:', error);
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
      return response.data;
    } catch (error) {
      console.error('Error creating booking request:', error);
      throw error;
    }
  },

  // Accept a booking request
  async acceptBookingRequest(requestId: string): Promise<BookingRequest> {
    try {
      const response = await api.put(`/booking-requests/${requestId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Error accepting booking request:', error);
      throw error;
    }
  },

  // Decline a booking request
  async declineBookingRequest(requestId: string, reason?: string): Promise<BookingRequest> {
    try {
      const response = await api.put(`/booking-requests/${requestId}/decline`, {
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error declining booking request:', error);
      throw error;
    }
  },

  // Cancel a booking request
  async cancelBookingRequest(requestId: string, reason?: string): Promise<BookingRequest> {
    try {
      const response = await api.put(`/booking-requests/${requestId}/cancel`, {
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking request:', error);
      throw error;
    }
  },

  // Get booking request details
  async getBookingRequest(requestId: string): Promise<BookingRequest> {
    try {
      const response = await fetcher(`/booking-requests/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking request:', error);
      throw error;
    }
  }
};
