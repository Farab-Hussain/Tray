// src/routes/auth.ts
import { Router } from "express";
import { authenticateUser } from "../middleware/authMiddleware";
import * as authController from "../controllers/auth.Controller";

const router = Router();

/**
 * POST /auth/register
 * Register user (Firebase handles signup, we just store extra info)
 */
router.post("/register", authController.register);

/**
 * POST /auth/login
 * Login with Firebase ID token and return user info
 */
router.post("/login", authController.login);

/**
 * GET /auth/me
 * Get current user details
 */
router.get("/me", authenticateUser, authController.getMe);

/**
 * GET /auth/users/:uid
 * Get user details by UID (for consultants to fetch student names)
 */
router.get("/users/:uid", authController.getUserById);

/**
 * PUT /auth/profile
 * Update user profile
 */
router.put("/profile", authenticateUser, authController.updateProfile);

/**
 * DELETE /auth/account
 * Delete user account (soft delete)
 */
router.delete("/account", authenticateUser, authController.deleteAccount);

/**
 * POST /auth/forgot-password
 * Send OTP to user's email for password reset
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * POST /auth/verify-otp
 * Verify OTP sent to user's email
 */
router.post("/verify-otp", authController.verifyOTP);

/**
 * POST /auth/reset-password
 * Reset user's password after OTP verification
 */
router.post("/reset-password", authController.resetPassword);

export default router;
