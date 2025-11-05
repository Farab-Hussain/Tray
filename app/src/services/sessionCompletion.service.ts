import { fetcher, api } from '../lib/fetcher';

export interface SessionRating {
  consultantRating: number; // 1-5 stars
  serviceRating: number; // 1-5 stars
  consultantFeedback?: string;
  serviceFeedback?: string;
}

export interface SessionCompletion {
  id: string;
  sessionId: string;
  bookingId: string;
  studentId: string;
  consultantId: string;
  serviceId: string;
  sessionDate: string;
  sessionTime: string;
  sessionDuration: number;
  consultantRating?: number;
  serviceRating?: number;
  consultantFeedback?: string;
  serviceFeedback?: string;
  paymentReleased: boolean;
  refundRequested: boolean;
  refundReason?: string;
  consultantResponse?: string;
  adminDecision?: 'approved' | 'denied' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface RefundRequest {
  id: string;
  sessionCompletionId: string;
  studentId: string;
  consultantId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'consultant_responded' | 'admin_reviewed' | 'approved' | 'denied';
  consultantResponse?: string;
  adminDecision?: 'approved' | 'denied';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export const SessionCompletionService = {
  // Complete a session (consultant marks session as ended)
  async completeSession(sessionId: string, bookingId: string): Promise<SessionCompletion> {
    try {
      const response = await api.post('/session-completion', {
        sessionId,
        bookingId
      });
      return response.data;
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  },

  // Student rates consultant
  async rateConsultant(sessionCompletionId: string, rating: number, feedback?: string): Promise<SessionCompletion> {
    try {
      const response = await api.put(`/session-completion/${sessionCompletionId}/rate-consultant`, {
        consultantRating: rating,
        consultantFeedback: feedback
      });
      return response.data;
    } catch (error) {
      console.error('Error rating consultant:', error);
      throw error;
    }
  },

  // Student rates service
  async rateService(sessionCompletionId: string, rating: number, feedback?: string): Promise<SessionCompletion> {
    try {
      const response = await api.put(`/session-completion/${sessionCompletionId}/rate-service`, {
        serviceRating: rating,
        serviceFeedback: feedback
      });
      return response.data;
    } catch (error) {
      console.error('Error rating service:', error);
      throw error;
    }
  },

  // Get session completion details
  async getSessionCompletion(sessionCompletionId: string): Promise<SessionCompletion> {
    try {
      const response = await fetcher(`/session-completion/${sessionCompletionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching session completion:', error);
      throw error;
    }
  },

  // Get all session completions for a student
  async getStudentSessionCompletions(studentId: string): Promise<SessionCompletion[]> {
    try {
      const response = await fetcher(`/session-completion/student/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student session completions:', error);
      throw error;
    }
  },

  // Get all session completions for a consultant
  async getConsultantSessionCompletions(consultantId: string): Promise<SessionCompletion[]> {
    try {
      const response = await fetcher(`/session-completion/consultant/${consultantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching consultant session completions:', error);
      throw error;
    }
  },

  // Request refund for a session
  async requestRefund(sessionCompletionId: string, reason: string): Promise<RefundRequest> {
    try {
      const response = await api.post('/refund-requests', {
        sessionCompletionId,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error requesting refund:', error);
      throw error;
    }
  },

  // Consultant responds to refund request
  async respondToRefundRequest(refundRequestId: string, response: string): Promise<RefundRequest> {
    try {
      const apiResponse = await api.put(`/refund-requests/${refundRequestId}/consultant-response`, {
        consultantResponse: response
      });
      return apiResponse.data;
    } catch (error) {
      console.error('Error responding to refund request:', error);
      throw error;
    }
  },

  // Admin reviews refund request
  async reviewRefundRequest(refundRequestId: string, decision: 'approved' | 'denied', notes?: string): Promise<RefundRequest> {
    try {
      const response = await api.put(`/refund-requests/${refundRequestId}/admin-review`, {
        adminDecision: decision,
        adminNotes: notes
      });
      return response.data;
    } catch (error) {
      console.error('Error reviewing refund request:', error);
      throw error;
    }
  },

  // Get all refund requests (admin only)
  async getAllRefundRequests(): Promise<RefundRequest[]> {
    try {
      const response = await fetcher('/refund-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching refund requests:', error);
      throw error;
    }
  },

  // Get refund requests for a consultant
  async getConsultantRefundRequests(consultantId: string): Promise<RefundRequest[]> {
    try {
      const response = await fetcher(`/refund-requests/consultant/${consultantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching consultant refund requests:', error);
      throw error;
    }
  },

  // Get refund requests for a student
  async getStudentRefundRequests(studentId: string): Promise<RefundRequest[]> {
    try {
      const response = await fetcher(`/refund-requests/student/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student refund requests:', error);
      throw error;
    }
  }
};
