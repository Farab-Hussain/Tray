/**
 * Application Status Utilities
 * Provides user-friendly status messages and styling for students
 */

import { COLORS } from '../constants/core/colors';

export type ApplicationStatus = 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';

/**
 * Get user-friendly status message for students
 * Especially handles "rejected" status with encouraging messages
 */
export function getStatusMessage(status?: ApplicationStatus): string {
  if (!status) return 'Pending Review';
  
  switch (status) {
    case 'pending':
      return 'Under Review';
    case 'reviewed':
      return 'Reviewed';
    case 'shortlisted':
      return 'Shortlisted 🎉';
    case 'rejected':
      // User-friendly message instead of "Rejected"
      return 'Not Selected - Keep Exploring!';
    case 'hired':
      return 'Congratulations! 🎊';
    default:
      return 'Under Review';
  }
}

/**
 * Get status description/subtitle for better context
 */
export function getStatusDescription(status?: ApplicationStatus): string {
  if (!status) return 'Your application is being reviewed';
  
  switch (status) {
    case 'pending':
      return 'The recruiter is reviewing your application';
    case 'reviewed':
      return 'Your application has been reviewed';
    case 'shortlisted':
      return 'You\'ve been selected for further consideration!';
    case 'rejected':
      // Encouraging message
      return 'This role wasn\'t the right fit, but many opportunities await you!';
    case 'hired':
      return 'You got the job! Well done!';
    default:
      return 'Your application is being reviewed';
  }
}

/**
 * Get status color for UI display
 */
export function getStatusColor(status?: ApplicationStatus): string {
  if (!status) return COLORS.gray;
  
  switch (status) {
    case 'pending':
      return COLORS.blue;
    case 'reviewed':
      return '#6B7280'; // Gray
    case 'shortlisted':
      return COLORS.green;
    case 'rejected':
      // Use a softer color, not red
      return '#F59E0B'; // Amber/Orange - less harsh than red
    case 'hired':
      return '#10B981'; // Green
    default:
      return COLORS.gray;
  }
}

/**
 * Get status icon/emoji
 */
export function getStatusIcon(status?: ApplicationStatus): string {
  if (!status) return '⏳';
  
  switch (status) {
    case 'pending':
      return '⏳';
    case 'reviewed':
      return '👀';
    case 'shortlisted':
      return '⭐';
    case 'rejected':
      return '💪'; // Encouraging icon
    case 'hired':
      return '🎊';
    default:
      return '⏳';
  }
}

/**
 * Check if status is positive (shortlisted or hired)
 */
export function isPositiveStatus(status?: ApplicationStatus): boolean {
  return status === 'shortlisted' || status === 'hired';
}

/**
 * Check if status is negative (rejected)
 */
export function isNegativeStatus(status?: ApplicationStatus): boolean {
  return status === 'rejected';
}

