/**
 * Utility functions for the application
 */

type FirestoreSecondsTimestamp = {
  seconds: number;
  nanoseconds?: number;
};

type FirestoreToDateTimestamp = {
  toDate: () => Date;
};

type DateInput = string | Date | FirestoreSecondsTimestamp | FirestoreToDateTimestamp | null | undefined;

const hasSeconds = (value: unknown): value is FirestoreSecondsTimestamp => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    typeof (value as { seconds: unknown }).seconds === 'number'
  );
};

const hasToDate = (value: unknown): value is FirestoreToDateTimestamp => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: unknown }).toDate === 'function'
  );
};

/**
 * Format ISO date string to readable format
 * @param input - ISO date string, Date object, or Firestore Timestamp
 * @returns Formatted date string (e.g., "Jan 15, 2025")
 */
export function formatDate(input: DateInput): string {
  if (!input) return '';
  
  try {
    let date: Date;
    
    // Handle Firestore Timestamp objects (has seconds and nanoseconds properties)
    if (hasSeconds(input)) {
      date = new Date(input.seconds * 1000);
    }
    // Handle Firestore Timestamp with toDate() method
    else if (hasToDate(input)) {
      date = input.toDate();
    }
    // Handle string dates
    else if (typeof input === 'string') {
      date = new Date(input);
    }
    // Handle Date objects
    else if (input instanceof Date) {
      date = input;
    }
    // Unknown format
    else {
      console.warn('Unknown date format:', input);
      return 'Invalid Date';
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format number as currency
 * @param amount - The amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string (e.g., "$100.00")
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get initials from full name
 * @param name - Full name
 * @returns Initials (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param input - ISO date string, Date object, or Firestore Timestamp
 * @returns Relative time string
 */
export function formatRelativeTime(input: DateInput): string {
  if (!input) return '';
  
  try {
    let date: Date;
    
    // Handle Firestore Timestamp objects
    if (hasSeconds(input)) {
      date = new Date(input.seconds * 1000);
    }
    // Handle Firestore Timestamp with toDate() method
    else if (hasToDate(input)) {
      date = input.toDate();
    }
    // Handle string dates
    else if (typeof input === 'string') {
      date = new Date(input);
    }
    // Handle Date objects
    else if (input instanceof Date) {
      date = input;
    }
    // Unknown format
    else {
      return 'Recently';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 7) {
      return formatDate(date);
    } else if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Recently';
  }
}

