// src/routes/auth.ts
import { Router } from "express";
import { authenticateUser, authorizeRole } from "../middleware/authMiddleware";
import { validateLogin, validateForgotPassword, validateVerifyOTP, validateResetPassword, validateChangePassword, validateUpdateProfile } from "../middleware/validation";
import { validateBody, validateParams } from "../middleware/zodValidation";
import { registerSchema } from "../schemas/register.schema";
import { uidParamSchema } from "../schemas/uidParam.schema";
import { authLimiter } from "../middleware/rateLimit";
import * as authController from "../controllers/auth.Controller";

const router = Router();

/**
 * POST /auth/register
 * Register user (Firebase handles signup, we just store extra info)
 * Requires Firebase ID token — uid is taken from the verified token, not the body.
 */
router.post("/register", authLimiter, authenticateUser(), validateBody(registerSchema), authController.register);

/**
 * POST /auth/login
 * Login with Firebase ID token and return user info
 */
router.post("/login", authLimiter, validateLogin, authController.login);

/**
 * GET /auth/me
 * Get current user details
 */
router.get("/me", authenticateUser(), authController.getMe);

/**
 * GET /auth/admin/users
 * Get all users (Admin only)
 * Query params: page (default: 1), limit (default: 50), role (optional filter), isActive (optional filter)
 * NOTE: This must be defined BEFORE /users/:uid to avoid route conflicts
 */
router.get("/admin/users", authenticateUser(), authorizeRole(["admin"]), authController.getAllUsers);

/**
 * GET /auth/users/:uid
 * Get user profile by UID (authenticated; email hidden unless self or admin)
 */
router.get(
  "/users/:uid",
  authenticateUser(),
  validateParams(uidParamSchema),
  authController.getUserById,
);

/**
 * PUT /auth/profile
 * Update user profile
 */
router.put("/profile", authenticateUser(), validateUpdateProfile, authController.updateProfile);

/**
 * DELETE /auth/account
 * Delete user account (soft delete)
 */
router.delete("/account", authenticateUser(), authController.deleteAccount);

/**
 * POST /auth/forgot-password
 * Send OTP to user's email for password reset
 */
router.post("/forgot-password", authLimiter, validateForgotPassword, authController.forgotPassword);

/**
 * POST /auth/verify-otp
 * Verify OTP sent to user's email
 */
router.post("/verify-otp", authLimiter, validateVerifyOTP, authController.verifyOTP);

/**
 * POST /auth/reset-password
 * Reset user's password after OTP verification
 */
router.post("/reset-password", authLimiter, validateResetPassword, authController.resetPassword);

/**
 * GET /auth/verification-status
 * Check if email is verified (does not send email)
 */
router.get("/verification-status", authenticateUser(), authController.getVerificationStatus);

/**
 * POST /auth/resend-verification-email
 * Resend email verification using Firebase Admin SDK (fallback method)
 */
router.post("/resend-verification-email", authenticateUser(), authController.resendVerificationEmail);

/**
 * POST /auth/verify-email
 * Verify email using a one-time token+uid from the verification link.
 * Legacy uid/email-only verification is not supported.
 */
router.post("/verify-email", authLimiter, authController.verifyEmail);

/**
 * POST /auth/request-consultant-role
 * Request access to consultant role
 */
router.post("/request-consultant-role", authenticateUser(), authController.requestConsultantRole);

/**
 * POST /auth/switch-role
 * Switch active role (requires consultant verification if switching to consultant)
 */
router.post("/switch-role", authenticateUser(), authController.switchRole);

/**
 * POST /auth/change-password
 * Change password for authenticated user
 */
router.post("/change-password", authLimiter, authenticateUser(), validateChangePassword, authController.changePassword);

/**
 * POST /auth/admin/create-admin
 * Create a new admin user (Admin only)
 */
router.post("/admin/create-admin", authenticateUser(), authorizeRole(["admin"]), authController.createAdminUser);

export default router;
