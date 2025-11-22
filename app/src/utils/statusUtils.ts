/**
 * Utility functions for status-related operations
 */
import { COLORS } from '../constants/core/colors';

export type ApplicationStatus =
  | 'pending'
  | 'reviewed'
  | 'shortlisted'
  | 'hired'
  | 'rejected';

export type JobStatus = 'active' | 'closed' | 'draft';

export type ServiceApplicationStatus = 'pending' | 'approved' | 'rejected';

export type TransactionStatus = 'completed' | 'pending' | 'cancelled';

export type BookingStatus =
  | 'confirmed'
  | 'accepted'
  | 'approved'
  | 'completed'
  | 'pending'
  | 'cancelled';

/**
 * Gets the color for application status badges
 * @param status - Application status
 * @returns Color string
 */
export const getApplicationStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'hired':
      return COLORS.green;
    case 'shortlisted':
      return COLORS.blue;
    case 'reviewed':
      return COLORS.orange;
    case 'rejected':
      return COLORS.red;
    case 'pending':
    default:
      return COLORS.gray;
  }
};

/**
 * Gets the color for job status badges
 * @param status - Job status
 * @returns Color string
 */
export const getJobStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
      return COLORS.green;
    case 'closed':
      return COLORS.red;
    case 'draft':
    default:
      return COLORS.gray;
  }
};

/**
 * Gets the color for service application status badges
 * @param status - Service application status
 * @returns Color string
 */
export const getServiceApplicationStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'approved':
      return COLORS.green;
    case 'rejected':
      return COLORS.red;
    case 'pending':
    default:
      return COLORS.orange;
  }
};

/**
 * Gets the color for transaction status badges
 * @param status - Transaction status
 * @returns Color string
 */
export const getTransactionStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed':
      return COLORS.green;
    case 'pending':
      return COLORS.orange;
    case 'cancelled':
      return COLORS.red;
    default:
      return COLORS.gray;
  }
};

/**
 * Gets the color for booking status badges
 * @param status - Booking status
 * @returns Color string (text color for use with colored backgrounds)
 */
export const getBookingStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'accepted':
    case 'approved':
    case 'completed':
      return COLORS.white; // White text on colored background
    case 'pending':
    case 'cancelled':
      return COLORS.white; // White text on colored background
    default:
      return COLORS.white;
  }
};

/**
 * Universal status color getter - automatically determines the appropriate color based on context
 * @param status - Status string
 * @param type - Type of status (optional, for explicit type checking)
 * @returns Color string
 */
export const getStatusColor = (
  status: string,
  type?: 'application' | 'job' | 'service' | 'transaction' | 'booking'
): string => {
  if (type) {
    switch (type) {
      case 'application':
        return getApplicationStatusColor(status);
      case 'job':
        return getJobStatusColor(status);
      case 'service':
        return getServiceApplicationStatusColor(status);
      case 'transaction':
        return getTransactionStatusColor(status);
      case 'booking':
        return getBookingStatusColor(status);
      default:
        return COLORS.gray;
    }
  }

  // Auto-detect based on status value
  const lowerStatus = status.toLowerCase();
  
  // Application statuses
  if (['hired', 'shortlisted', 'reviewed'].includes(lowerStatus)) {
    return getApplicationStatusColor(status);
  }
  
  // Job statuses
  if (['active', 'closed', 'draft'].includes(lowerStatus)) {
    return getJobStatusColor(status);
  }
  
  // Service application statuses
  if (['approved', 'rejected'].includes(lowerStatus)) {
    return getServiceApplicationStatusColor(status);
  }
  
  // Transaction statuses
  if (['completed', 'cancelled'].includes(lowerStatus)) {
    return getTransactionStatusColor(status);
  }
  
  // Default
  return COLORS.gray;
};

