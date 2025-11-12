import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ [Validation] Validation failed:', {
      path: req.path,
      method: req.method,
      params: req.params,
      errors: errors.array(),
    });
    return res.status(400).json({
      error: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Validation rules for authentication endpoints
 */
export const validateRegister = [
  body('uid').notEmpty().withMessage('UID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['student', 'consultant', 'admin']).withMessage('Role must be student, consultant, or admin'),
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  handleValidationErrors,
];

export const validateLogin = [
  body('idToken').notEmpty().withMessage('ID token is required'),
  handleValidationErrors,
];

export const validateUpdateProfile = [
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  body('profileImage').optional().isString().isURL().withMessage('Profile image must be a valid URL'),
  handleValidationErrors,
];

export const validateForgotPassword = [
  body('email').isEmail().withMessage('Valid email is required'),
  handleValidationErrors,
];

export const validateVerifyOTP = [
  body('resetSessionId').notEmpty().withMessage('Reset session ID is required'),
  body('otp').isLength({ min: 4, max: 6 }).isNumeric().withMessage('OTP must be 4-6 digits'),
  handleValidationErrors,
];

export const validateResetPassword = [
  body('resetSessionId').notEmpty().withMessage('Reset session ID is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

/**
 * Validation rules for booking endpoints
 */
export const validateCreateBooking = [
  body('consultantId').notEmpty().withMessage('Consultant ID is required'),
  body('serviceId').notEmpty().withMessage('Service ID is required'),
  body('date').isISO8601().withMessage('Date must be a valid ISO 8601 date'),
  body('time')
    .custom((value) => {
      // Accept both formats:
      // 1. HH:MM or HH:MM:SS (24-hour format)
      // 2. HH:MM AM/PM - HH:MM AM/PM (12-hour range format)
      const hhmmFormat = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:00)?$/;
      const timeRangeFormat = /^(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
      
      if (hhmmFormat.test(value) || timeRangeFormat.test(value)) {
        return true;
      }
      throw new Error('Time must be in HH:MM format or "HH:MM AM/PM - HH:MM AM/PM" format');
    })
    .withMessage('Time must be in HH:MM format or "HH:MM AM/PM - HH:MM AM/PM" format'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('status').optional().isIn(['pending', 'confirmed', 'accepted', 'rejected', 'cancelled']).withMessage('Invalid status'),
  body('paymentStatus').optional().isIn(['unpaid', 'paid', 'refunded', 'cancelled']).withMessage('Invalid payment status'),
  handleValidationErrors,
];

export const validateUpdateBookingStatus = [
  param('bookingId').notEmpty().withMessage('Booking ID is required'),
  body('status').isIn(['pending', 'confirmed', 'accepted', 'approved', 'rejected', 'cancelled', 'completed']).withMessage('Invalid status'),
  body('paymentStatus').optional().isIn(['unpaid', 'paid', 'refunded', 'cancelled']).withMessage('Invalid payment status'),
  handleValidationErrors,
];

/**
 * Validation rules for payment endpoints
 */
export const validateCreatePaymentIntent = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be at least 0.01'),
  body('currency').optional().isIn(['usd']).withMessage('Currency must be USD'),
  body('bookingId').optional().isString().withMessage('Booking ID must be a string'),
  handleValidationErrors,
];

/**
 * Validation rules for support endpoints
 */
export const validateSupportRequest = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('subject').isString().trim().isLength({ min: 1, max: 200 }).withMessage('Subject must be between 1 and 200 characters'),
  body('message').isString().trim().isLength({ min: 10, max: 5000 }).withMessage('Message must be between 10 and 5000 characters'),
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  handleValidationErrors,
];

/**
 * Validation rules for consultant flow endpoints
 */
export const validateConsultantId = [
  param('uid').notEmpty().withMessage('Consultant UID is required'),
  handleValidationErrors,
];

/**
 * Validation rules for consultant ID in booking endpoints
 */
export const validateConsultantIdParam = [
  param('consultantId')
    .notEmpty()
    .withMessage('Consultant ID is required')
    .isString()
    .withMessage('Consultant ID must be a string')
    .trim()
    .notEmpty()
    .withMessage('Consultant ID cannot be empty'),
  handleValidationErrors,
];

/**
 * Validation rules for query parameters
 */
export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

/**
 * Validation rules for platform fee update
 */
export const validatePlatformFeeUpdate = [
  body('platformFeeAmount')
    .notEmpty()
    .withMessage('platformFeeAmount is required')
    .isFloat({ min: 0 })
    .withMessage('platformFeeAmount must be a non-negative number'),
  handleValidationErrors,
];

