// Application constants
export const APP_CONFIG = {
  name: 'Tray Dashboard',
  version: '1.0.0',
  description: 'Consultant and Admin Dashboard',
  author: 'Tray Team',
} as const;

// API Configuration (disabled - backend integration removed)
// export const API_CONFIG = {
//   baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
//   timeout: 10000,
//   retries: 3,
// } as const;

// Routes
export const ROUTES = {
  HOME: '/',
  SERVICES: '/consultant/services',
  EARNING: '/earning',
  BROKER_COMMISSION: '/brokerComission',
  ADMIN_MAIN: '/admin/main',
  ADMIN_PAYMENT: '/admin/payment',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_CONTENT: '/admin/content',
} as const;

// Page titles
export const PAGE_TITLES = {
  HOME: 'Create Profile',
  SERVICES: 'My Services',
  EARNING: 'Earnings Dashboard',
  BROKER_COMMISSION: 'Broker Commission',
  ADMIN_MAIN: 'Admin Main Dashboard',
  ADMIN_PAYMENT: 'Admin Payment Dashboard',
} as const;

// Form field labels
export const FORM_LABELS = {
  NAME: 'Name',
  SURNAME: 'Surname',
  EDUCATION: 'Education',
  GENDER: 'Gender',
  HEADQUARTERS: 'Headquarters Location',
  EMAIL: 'Contact Email',
  PHONE: 'Phone Number',
  FAIR_CHANCE: 'Do you follow Ban-the-Box or similar policies?',
  COMMITMENT: 'We believe everyone deserves a second chance to succeed. We are committed to fair hiring practices that consider the whole person, not just their past. By supporting initiatives like Ban-the-Box, we strive to create opportunities that promote inclusion, dignity, and growth for all individuals.',
} as const;

// Validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_URL: 'Please enter a valid URL',
  MIN_LENGTH: (min: number) => `Minimum ${min} characters required`,
  MAX_LENGTH: (max: number) => `Maximum ${max} characters allowed`,
  PATTERN_MISMATCH: 'Please enter a valid format',
} as const;

// Status options
export const STATUS_OPTIONS = {
  BOOKING: [
    { value: 'completed', label: 'Completed' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
  PAYOUT: [
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
  ],
  CLIENT: [
    { value: 'online', label: 'Online' },
    { value: 'busy', label: 'Busy' },
    { value: 'offline', label: 'Offline' },
  ],
} as const;

// Filter options
export const FILTER_OPTIONS = {
  SERVICES: [
    { value: 'all', label: 'All Services' },
    { value: 'available', label: 'Available' },
    { value: 'applied', label: 'Applied' },
    { value: 'bookmarked', label: 'Bookmarked' },
  ],
  PERIOD: [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this-week', label: 'This Week' },
    { value: 'last-week', label: 'Last Week' },
    { value: 'this-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
  ],
} as const;

// Service icons
export const SERVICE_ICONS = {
  figma: 'figma',
  react: 'react',
  node: 'node',
  python: 'python',
  mobile: 'mobile',
  database: 'database',
  design: 'design',
  marketing: 'marketing',
  writing: 'writing',
  consulting: 'consulting',
} as const;

// Color themes
export const COLORS = {
  PRIMARY: '#10B981', // Green
  SECONDARY: '#6B7280', // Gray
  SUCCESS: '#10B981', // Green
  WARNING: '#F59E0B', // Yellow
  ERROR: '#EF4444', // Red
  INFO: '#3B82F6', // Blue
  BACKGROUND: '#F9FAFB', // Light gray
  SURFACE: '#FFFFFF', // White
  TEXT_PRIMARY: '#111827', // Dark gray
  TEXT_SECONDARY: '#6B7280', // Gray
} as const;

// Breakpoints
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
} as const;

// Animation durations
export const ANIMATION_DURATION = {
  FAST: '150ms',
  NORMAL: '300ms',
  SLOW: '500ms',
} as const;

// Z-index values
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
  MAX_PAGE_SIZE: 100,
} as const;

// File upload
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  TIME: 'HH:mm',
  DATETIME: 'MMM dd, yyyy HH:mm',
} as const;

// Currency
export const CURRENCY = {
  DEFAULT: 'USD',
  SYMBOL: '$',
  LOCALE: 'en-US',
} as const;

// Local storage keys (moved from utils for better organization)
export const STORAGE_KEYS = {
  CONSULTANT_PROFILE: 'consultantProfile',
  SERVICES: 'services',
  BOOKMARKED_SERVICES: 'bookmarkedServices',
  APPLIED_SERVICES: 'appliedServices',
  CLIENTS: 'clients',
  BOOKINGS: 'bookings',
  PAYOUTS: 'payouts',
  USER_PREFERENCES: 'userPreferences',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PROFILE_CREATED: 'Profile created successfully!',
  SERVICE_APPLIED: 'Application submitted successfully!',
  SERVICE_BOOKMARKED: 'Service bookmarked!',
  SERVICE_REMOVED: 'Service removed successfully!',
  BOOKING_CREATED: 'Booking created successfully!',
  PAYOUT_PROCESSED: 'Payout processed successfully!',
  DATA_SAVED: 'Data saved successfully!',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  PROFILE_CREATION_FAILED: 'Error creating profile. Please try again.',
  SERVICE_APPLICATION_FAILED: 'Error submitting application. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
} as const;
