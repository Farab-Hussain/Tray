/**
 * Utility functions for formatting time in chat
 */

/**
 * Formats a relative time (e.g., "2m ago", "3h ago")
 * @param date - The date to format
 * @returns A string representing the relative time
 */
export const formatRelativeTime = (date: Date) => {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
};

/**
 * Formats a date to HH:MM format
 * @param date - The date to format
 * @returns A string in HH:MM format
 */
export const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

/**
 * Formats a timestamp from Firestore
 * @param timestamp - Firestore timestamp
 * @returns Formatted time string
 */
export const formatFirestoreTime = (timestamp: any) => {
  if (!timestamp) return '';
  if (timestamp.toDate) {
    return formatTime(timestamp.toDate());
  }
  if (timestamp instanceof Date) {
    return formatTime(timestamp);
  }
  return '';
};

/**
 * Formats a timestamp from Firestore for list view
 * @param timestamp - Firestore timestamp
 * @returns Formatted relative time or date string
 */
export const formatFirestoreTimeRelative = (timestamp: any) => {
  if (!timestamp) return '';
  if (timestamp.toDate) {
    return formatRelativeTime(timestamp.toDate());
  }
  if (timestamp instanceof Date) {
    return formatRelativeTime(timestamp);
  }
  return '';
};
