import { api } from '../lib/fetcher';

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
  }) {
    const response = await api.post('/bookings', bookingData);
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
    return response.data;
  },

  // Get all bookings for current user (student)
  async getMyBookings() {
    const response = await api.get('/bookings/student');
    return response.data;
  },

  // Get consultant's bookings (clients)
  async getConsultantBookings() {
    const response = await api.get('/bookings/consultant');
    return response.data;
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
    return response.data;
  },

  // Get booked slots for a specific consultant
  async getConsultantBookedSlots(consultantId: string) {
    const response = await api.get(`/bookings/consultant/${consultantId}/booked-slots`);
    return response.data;
  },
};

