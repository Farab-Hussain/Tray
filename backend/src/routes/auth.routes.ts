// src/routes/auth.ts
import { Router } from "express";
import { authenticateUser, authorizeRole } from "../middleware/authMiddleware";
import { validateRegister, validateLogin, validateForgotPassword, validateVerifyOTP, validateResetPassword, validateUpdateProfile } from "../middleware/validation";
import * as authController from "../controllers/auth.Controller";

const router = Router();

/**
 * POST /auth/register
 * Register user (Firebase handles signup, we just store extra info)
 */
router.post("/register", validateRegister, authController.register);

/**
 * POST /auth/login
 * Login with Firebase ID token and return user info
 */
router.post("/login", validateLogin, authController.login);

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
 * Get user details by UID (for consultants to fetch student names)
 * NOTE: This must be defined AFTER /admin/users to avoid route conflicts
 */
router.get("/users/:uid", authController.getUserById);

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
router.post("/forgot-password", validateForgotPassword, authController.forgotPassword);

/**
 * POST /auth/verify-otp
 * Verify OTP sent to user's email
 */
router.post("/verify-otp", validateVerifyOTP, authController.verifyOTP);

/**
 * POST /auth/reset-password
 * Reset user's password after OTP verification
 */
router.post("/reset-password", validateResetPassword, authController.resetPassword);

/**
 * POST /auth/resend-verification-email
 * Resend email verification using Firebase Admin SDK (fallback method)
 */
router.post("/resend-verification-email", authenticateUser(), authController.resendVerificationEmail);

/**
 * POST /auth/verify-email
 * Verify email using token-based verification (no auth required - token itself is the auth)
 * Supports both token+uid (new) and legacy email/uid verification
 */
router.post("/verify-email", authController.verifyEmail);

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
router.post("/change-password", authenticateUser(), authController.changePassword);

/**
 * POST /auth/admin/create-admin
 * Create a new admin user (Admin only)
 */
router.post("/admin/create-admin", authenticateUser(), authorizeRole(["admin"]), authController.createAdminUser);

export default router;
