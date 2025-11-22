/**
 * Utility functions for date formatting
 */

/**
 * Formats a date value (handles Firestore timestamps, Date objects, strings, numbers)
 * @param dateValue - The date value to format (can be Firestore timestamp, Date, string, or number)
 * @param options - Formatting options
 * @returns Formatted date string or 'N/A' if invalid
 */
export const formatDate = (
  dateValue: any,
  options: {
    includeWeekday?: boolean;
    format?: 'short' | 'long' | 'numeric';
  } = {}
): string => {
  if (!dateValue) return 'N/A';

  try {
    let date: Date;

    // Handle Firestore Timestamp
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    }
    // Handle Firestore Timestamp with seconds property
    else if (dateValue.seconds) {
      date = new Date(dateValue.seconds * 1000);
    }
    // Handle Date object
    else if (dateValue instanceof Date) {
      date = dateValue;
    }
    // Handle string
    else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    }
    // Handle number (timestamp in milliseconds)
    else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    } else {
      return 'N/A';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    const { includeWeekday = false, format = 'short' } = options;

    if (format === 'long') {
      return date.toLocaleDateString('en-US', {
        weekday: includeWeekday ? 'long' : undefined,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    if (format === 'numeric') {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
    }

    // Default short format
    return date.toLocaleDateString('en-US', {
      weekday: includeWeekday ? 'short' : undefined,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

/**
 * Formats a date value to a compact format (MMM DD, YYYY)
 * @param dateValue - The date value to format
 * @returns Formatted date string or 'N/A' if invalid
 */
export const formatDateCompact = (dateValue: any): string => {
  return formatDate(dateValue, { format: 'short' });
};

/**
 * Formats a date value with weekday (e.g., "Mon, Jan 15, 2024")
 * @param dateValue - The date value to format
 * @returns Formatted date string or 'N/A' if invalid
 */
export const formatDateWithWeekday = (dateValue: any): string => {
  return formatDate(dateValue, { includeWeekday: true, format: 'short' });
};

/**
 * Formats a time string (handles various time formats)
 * @param timeStr - Time string (e.g., "01:00 PM", "13:00")
 * @returns Formatted time string
 */
export const formatTimeString = (timeStr: string): string => {
  if (!timeStr) return '';
  // If already in readable format, return as is
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    return timeStr;
  }
  // Try to parse and format
  try {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours || '0', 10);
    const min = minutes || '00';
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${min} ${period}`;
  } catch {
    return timeStr;
  }
};

