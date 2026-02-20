import { api } from '../lib/fetcher';
import { logger } from '../utils/logger';

export interface EmailTemplate {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface RefundEmailData {
  studentName: string;
  consultantName: string;
  serviceTitle: string;
  sessionDate: string;
  sessionTime: string;
  amount: number;
  reason: string;
  refundRequestId: string;
}

export const EmailService = {
  // Send refund request notification to consultant
  async sendRefundRequestToConsultant(emailData: RefundEmailData): Promise<void> {
    try {
      const emailTemplate: EmailTemplate = {
        to: emailData.consultantName, // This should be consultant's email
        subject: `Refund Request - Session with ${emailData.studentName}`,
        template: 'refund-request-consultant',
        data: {
          studentName: emailData.studentName,
          consultantName: emailData.consultantName,
          serviceTitle: emailData.serviceTitle,
          sessionDate: emailData.sessionDate,
          sessionTime: emailData.sessionTime,
          amount: emailData.amount,
          reason: emailData.reason,
          refundRequestId: emailData.refundRequestId
        }
      };

      await api.post('/email/send', emailTemplate);
            if (__DEV__) {
        logger.debug('✅ Refund request email sent to consultant')
      };
    } catch (error) {
            if (__DEV__) {
        logger.error('❌ Error sending refund request email to consultant:', error)
      };
      throw error;
    }
  },

  // Send refund request notification to admin
  async sendRefundRequestToAdmin(emailData: RefundEmailData): Promise<void> {
    try {
      const emailTemplate: EmailTemplate = {
        to: 'admin@tray.com', // Admin email
        subject: `New Refund Request - ${emailData.studentName} vs ${emailData.consultantName}`,
        template: 'refund-request-admin',
        data: {
          studentName: emailData.studentName,
          consultantName: emailData.consultantName,
          serviceTitle: emailData.serviceTitle,
          sessionDate: emailData.sessionDate,
          sessionTime: emailData.sessionTime,
          amount: emailData.amount,
          reason: emailData.reason,
          refundRequestId: emailData.refundRequestId
        }
      };

      await api.post('/email/send', emailTemplate);
            if (__DEV__) {
        logger.debug('✅ Refund request email sent to admin')
      };
    } catch (error) {
            if (__DEV__) {
        logger.error('❌ Error sending refund request email to admin:', error)
      };
      throw error;
    }
  },

  // Send consultant response notification to admin
  async sendConsultantResponseToAdmin(
    refundRequestId: string,
    consultantName: string,
    studentName: string,
    consultantResponse: string
  ): Promise<void> {
    try {
      const emailTemplate: EmailTemplate = {
        to: 'admin@tray.com',
        subject: `Consultant Response - Refund Request ${refundRequestId}`,
        template: 'consultant-response-admin',
        data: {
          refundRequestId,
          consultantName,
          studentName,
          consultantResponse
        }
      };

      await api.post('/email/send', emailTemplate);
            if (__DEV__) {
        logger.debug('✅ Consultant response email sent to admin')
      };
    } catch (error) {
            if (__DEV__) {
        logger.error('❌ Error sending consultant response email to admin:', error)
      };
      throw error;
    }
  },

  // Send refund decision notification to student
  async sendRefundDecisionToStudent(
    studentEmail: string,
    studentName: string,
    decision: 'approved' | 'denied',
    amount: number,
    adminNotes?: string
  ): Promise<void> {
    try {
      const emailTemplate: EmailTemplate = {
        to: studentEmail,
        subject: `Refund Request ${decision === 'approved' ? 'Approved' : 'Denied'}`,
        template: 'refund-decision-student',
        data: {
          studentName,
          decision,
          amount,
          adminNotes
        }
      };

      await api.post('/email/send', emailTemplate);
            if (__DEV__) {
        logger.debug(`✅ Refund ${decision} email sent to student`)
      };
    } catch (error) {
            if (__DEV__) {
        logger.error(`❌ Error sending refund ${decision} email to student:`, error)
      };
      throw error;
    }
  },

  // Send refund decision notification to consultant
  async sendRefundDecisionToConsultant(
    consultantEmail: string,
    consultantName: string,
    studentName: string,
    decision: 'approved' | 'denied',
    amount: number,
    adminNotes?: string
  ): Promise<void> {
    try {
      const emailTemplate: EmailTemplate = {
        to: consultantEmail,
        subject: `Refund Request ${decision === 'approved' ? 'Approved' : 'Denied'} - Session with ${studentName}`,
        template: 'refund-decision-consultant',
        data: {
          consultantName,
          studentName,
          decision,
          amount,
          adminNotes
        }
      };

      await api.post('/email/send', emailTemplate);
            if (__DEV__) {
        logger.debug(`✅ Refund ${decision} email sent to consultant`)
      };
    } catch (error) {
            if (__DEV__) {
        logger.error(`❌ Error sending refund ${decision} email to consultant:`, error)
      };
      throw error;
    }
  },

  // Send session completion notification to student
  async sendSessionCompletionToStudent(
    studentEmail: string,
    studentName: string,
    consultantName: string,
    serviceTitle: string,
    sessionDate: string,
    sessionTime: string
  ): Promise<void> {
    try {
      const emailTemplate: EmailTemplate = {
        to: studentEmail,
        subject: `Please Rate Your Session with ${consultantName}`,
        template: 'session-completion-student',
        data: {
          studentName,
          consultantName,
          serviceTitle,
          sessionDate,
          sessionTime
        }
      };

      await api.post('/email/send', emailTemplate);
            if (__DEV__) {
        logger.debug('✅ Session completion email sent to student')
      };
    } catch (error) {
            if (__DEV__) {
        logger.error('❌ Error sending session completion email to student:', error)
      };
      throw error;
    }
  }
};
