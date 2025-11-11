// src/controllers/authController.ts
import { Request, Response } from "express";
import { db, auth } from "../config/firebase";
import { Logger } from "../utils/logger";
import { sendEmail } from "../utils/email";
import nodemailer from "nodemailer";
import { randomUUID } from "crypto";


/**
 * Register user (Firebase handles signup, we just store extra info)
 */
export const register = async (req: Request, res: Response) => {
  const route = "POST /auth/register";

  try {
    const { uid, name, role, email } = req.body;

    // Validate required fields
    if (!uid || !role || !email) {
      Logger.error(route, "", "Missing required fields");
      return res.status(400).json({
        error: "Missing required fields: uid, role, email"
      });
    }

    // Validate role
    if (!['student', 'consultant', 'admin'].includes(role)) {
      Logger.error(route, "", `Invalid role: ${role}`);
      return res.status(400).json({
        error: "Invalid role. Must be 'student', 'consultant', or 'admin'"
      });
    }

    // Check if user already exists
    const existingUser = await db.collection("users").doc(uid).get();

    if (existingUser.exists) {
      // User already exists, return existing user data
      const existingData = existingUser.data();
      Logger.success(route, "", `User already registered: ${uid}`);
      return res.status(200).json({
        message: "User already registered",
        user: { uid, ...existingData }
      });
    }

    // Create user document
    const userData = {
      name: name || null,
      role,
      email,
      profileImage: null, // Will be set later via profile update
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("users").doc(uid).set(userData);

    Logger.success(route, "", `User registered successfully: ${uid} (${role})`);
    res.status(201).json({
      message: "User registered successfully",
      user: { uid, ...userData }
    });
  } catch (error) {
    Logger.error(route, "", "Registration error", error);
    res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * Get current user details
 */
export const getMe = async (req: Request, res: Response) => {
  console.log("🎯 [GET /auth/me] - Route hit");

  try {
    const user = (req as any).user;

    const doc = await db.collection("users").doc(user.uid).get();

    if (!doc.exists) {
      console.log(`⚠️ [GET /auth/me] - User profile not found, creating default profile: ${user.uid}`);

      // Auto-create a default user profile
      // Note: Firebase decoded token properties: uid, email, email_verified, name, picture
      const defaultUserData = {
        name: user.name || null,
        role: 'student', // Default role, can be updated later via registration
        email: user.email || null,
        profileImage: user.picture || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("users").doc(user.uid).set(defaultUserData);
      console.log(`✅ [GET /auth/me] - Default user profile created: ${user.uid}`);

      return res.json({
        uid: user.uid,
        emailVerified: user.email_verified,
        ...defaultUserData
      });
    }

    const profile = doc.data();
    console.log(`✅ [GET /auth/me] - User profile retrieved: ${user.uid}`);
    res.json({
      uid: user.uid,
      email: user.email,
      emailVerified: user.email_verified,
      ...profile
    });
  } catch (error) {
    console.error("❌ [GET /auth/me] - Get user error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  console.log("🎯 [PUT /auth/profile] - Route hit");

  try {
    const user = (req as any).user;
    const { name, profileImage } = req.body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    await db.collection("users").doc(user.uid).update(updateData);

    console.log(`✅ [PUT /auth/profile] - Profile updated successfully: ${user.uid}`);
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("❌ [PUT /auth/profile] - Update profile error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * Login with Firebase ID token and return user info
 */
export const login = async (req: Request, res: Response) => {
  console.log("🎯 [POST /auth/login] - Route hit");

  try {
    const { idToken } = req.body;

    if (!idToken) {
      console.log("❌ [POST /auth/login] - ID token is missing");
      return res.status(400).json({ error: "ID token is required" });
    }

    const decodedToken = await auth.verifyIdToken(idToken);

    // Get user profile from Firestore
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    const profile = userDoc.exists ? userDoc.data() : null;

    console.log(`✅ [POST /auth/login] - User logged in successfully: ${decodedToken.uid}`);
    res.json({
      valid: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        ...profile
      }
    });
  } catch (error) {
    console.error("❌ [POST /auth/login] - Token verification error:", error);
    res.status(401).json({
      valid: false,
      error: "Invalid token"
    });
  }
};

/**
 * Delete user account (soft delete)
 */
export const deleteAccount = async (req: Request, res: Response) => {
  console.log("🎯 [DELETE /auth/account] - Route hit");

  try {
    const user = (req as any).user;

    // Soft delete by setting isActive to false
    await db.collection("users").doc(user.uid).update({
      isActive: false,
      deletedAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ [DELETE /auth/account] - Account deactivated successfully: ${user.uid}`);
    res.json({ message: "Account deactivated successfully" });
  } catch (error) {
    console.error("❌ [DELETE /auth/account] - Delete account error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
};


// Lazy initialization of email transport to ensure env vars are loaded
let transportInstance: nodemailer.Transporter | null = null;

const getEmailTransport = (): nodemailer.Transporter | null => {
  if (!transportInstance) {
    const smtpEmail = process.env.SMTP_EMAIL || process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    console.log('📧 Initializing SMTP transport...');
    console.log('  SMTP_EMAIL:', smtpEmail ? '✓ Set' : '✗ Missing');
    console.log('  SMTP_PASSWORD:', smtpPassword ? '✓ Set' : '✗ Missing');

    // Only create transport if credentials exist
    if (!smtpEmail || !smtpPassword) {
      console.warn('⚠️ Email credentials not configured - email functionality disabled');
      return null;
    }

    transportInstance = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: smtpEmail,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection asynchronously (don't block startup)
    transportInstance.verify((error, success) => {
      if (error) {
        console.error('❌ Email transport verification failed:', error.message);
        console.warn('⚠️ Email functionality may not work properly');
      } else {
        console.log('✅ Email transport verified and ready');
      }
    });
  }
  return transportInstance;
}



export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const userRecord = await auth.getUserByEmail(email);
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const resetSessionId = randomUUID();

    await db.collection("password_resets").doc(resetSessionId).set({
      uid: userRecord.uid,
      email,
      otp,
      createdAt: new Date(),
      expiresAt: Date.now() + 30 * 60 * 1000,
      verified: false,
    });

    console.log('📧 Attempting to send email...');
    // send OTP email using lazy-loaded transport
    const transport = getEmailTransport();

    if (!transport) {
      console.warn('⚠️ Email transport not available - OTP sent to console instead');
      console.log('📧 OTP for', email, ':', otp);
      console.log('📧 Reset session ID:', resetSessionId);
      console.warn('⚠️ Configure SMTP_EMAIL and SMTP_PASSWORD in .env to enable email sending');
      return res.status(200).json({
        message: "OTP generated (email not configured - check console for OTP)",
        resetSessionId,
        otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only return OTP in dev
      });
    }

    await transport.sendMail({
      from: `"Tray App Support" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "Your Tray App Password Reset Code",
      html: `<p>Your password reset code:</p><h2>${otp}</h2><p>Expires in 30 minutes.</p>`,
    });
    console.log('✅ Email sent successfully!');
    console.log(`${email} - ${otp}`);

    return res.json({
      message: "OTP sent to your email.",
      resetSessionId, // 👈 frontend stores this for next steps
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return res.status(400).json({
      error: error.code === "auth/user-not-found"
        ? "No user found with this email."
        : error.message,
    });
  }
};





export const verifyOTP = async (req: Request, res: Response) => {
  const { resetSessionId, otp } = req.body;

  if (!resetSessionId || !otp) {
    return res.status(400).json({ error: 'Reset session ID and OTP is missing' })
  }

  try {
    const doc = await db.collection('password_resets').doc(resetSessionId).get();
    if (!doc.exists) return res.status(400).json({ error: 'Reset session ID is invalid' });

    const data = doc.data();
    if (!data) return res.status(400).json({ error: 'Reset session ID is invalid' });
    if (data.verified) return res.status(400).json({ error: 'OTP already verified' });
    if (data.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (Date.now() > data.expiresAt) return res.status(400).json({ error: 'OTP expired' });

    await db.collection("password_resets").doc(resetSessionId).update({
      verified: true,
      verifiedAt: new Date(),
    });

    res.json({ message: "OTP verified successfully", resetSessionId });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}


export const getUserById = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({ error: "User ID is required" });
    }

    console.log(`🎯 [GET /auth/users/:uid] - Fetching user: ${uid}`);

    // Try to get user from users collection
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      console.log(`❌ [GET /auth/users/:uid] - User not found: ${uid}`);
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    console.log(`✅ [GET /auth/users/:uid] - User found: ${userData?.name || userData?.email}`);

    res.status(200).json({
      uid: userData?.uid,
      name: userData?.name,
      email: userData?.email,
      role: userData?.role,
      profileImage: userData?.profileImage || userData?.avatar || null,
      createdAt: userData?.createdAt
    });
  } catch (error: any) {
    console.error("❌ [GET /auth/users/:uid] - Error fetching user:", error);
    res.status(500).json({ error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { resetSessionId, newPassword } = req.body;

  console.log('🔐 Reset Password Request:');
  console.log('  resetSessionId:', resetSessionId);
  console.log('  newPassword provided:', !!newPassword);

  if (!resetSessionId || !newPassword) {
    console.log('❌ Missing required fields');
    return res.status(400).json({ error: "Missing resetSessionId or password" });
  }

  try {
    const doc = await db.collection("password_resets").doc(resetSessionId).get();
    console.log('  Document exists:', doc.exists);

    if (!doc.exists) {
      console.log('❌ Invalid session - document not found');
      return res.status(400).json({ error: "Invalid session" });
    }

    const data = doc.data()!;
    console.log('  Document data:', {
      verified: data.verified,
      email: data.email,
      hasOtp: !!data.otp,
      expiresAt: new Date(data.expiresAt).toISOString()
    });

    if (!data.verified) {
      console.log('❌ OTP not verified yet');
      return res.status(400).json({ error: "OTP not verified" });
    }

    if (Date.now() > data.expiresAt) {
      console.log('❌ Reset session expired');
      return res.status(400).json({ error: "Reset session expired. Please request a new password reset." });
    }

    console.log('✅ All validations passed, updating password...');
    await auth.updateUser(data.uid, { password: newPassword });
    await db.collection("password_resets").doc(resetSessionId).delete();

    console.log('✅ Password reset successfully');
    res.json({ message: "Password reset successfully" });
  } catch (error: any) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /auth/resend-verification-email
 * Resend email verification using Firebase Admin SDK and SMTP email
 */
export const resendVerificationEmail = async (req: Request, res: Response) => {
  const route = "POST /auth/resend-verification-email";

  try {
    const { uid, email } = req.body;

    if (!uid && !email) {
      Logger.error(route, "", "Missing uid or email");
      return res.status(400).json({ error: "uid or email is required" });
    }

    // Get user by uid or email
    let userRecord;
    if (uid) {
      userRecord = await auth.getUser(uid);
    } else {
      userRecord = await auth.getUserByEmail(email);
    }

    // Check if email is already verified
    if (userRecord.emailVerified) {
      Logger.info(route, userRecord.uid, `Email already verified for ${userRecord.email}`);
      return res.json({
        success: true,
        message: "Email is already verified",
        emailVerified: true,
        email: userRecord.email
      });
    }

    // Generate email verification link using Admin SDK
    // For backend, we need to use a valid HTTPS URL (not custom scheme)
    // Firebase Admin SDK requires a valid HTTPS URL, not custom schemes
    let verificationLink: string;
    try {
      // Use web URL for email verification
      const webUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const actionCodeSettings = {
        url: `${webUrl}/verify-email`,
        handleCodeInApp: false,
      };

      verificationLink = await auth.generateEmailVerificationLink(
        userRecord.email!,
        actionCodeSettings
      );
    } catch (linkError: any) {
      // Handle Firebase rate limiting and other errors when generating link
      if (linkError.code === 'auth/too-many-requests' ||
        linkError.message?.includes('TOO_MANY_ATTEMPTS') ||
        linkError.message?.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
        Logger.warn(route, userRecord.uid, "Firebase rate limit exceeded - too many verification link attempts");
        return res.status(429).json({
          error: "Too many verification email attempts. Please wait a few minutes before trying again.",
          message: "Firebase rate limit exceeded. Please wait 5-10 minutes before trying again.",
          code: "TOO_MANY_ATTEMPTS",
          retryAfter: 300, // Suggest waiting 5 minutes
          suggestion: "Please wait a few minutes and try resending from the app's verification screen."
        });
      }

      // Re-throw other errors to be caught by outer catch
      throw linkError;
    }

    Logger.success(route, userRecord.uid, `Generated verification link for ${userRecord.email}`);

    // Send email via SMTP if configured, otherwise just return the link
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Verify Your Email Address</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hello,</p>
            <p style="font-size: 16px;">Thank you for registering with Tray! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">Verify Email Address</a>
            </div>
            <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
            <p style="font-size: 12px; color: #999; word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">${verificationLink}</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">This link will expire in 24 hours.</p>
            <p style="font-size: 14px; color: #666;">If you didn't create an account, please ignore this email.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Tray. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;

      const emailText = `
        Verify Your Email Address
        
        Hello,
        
        Thank you for registering with Tray! Please verify your email address by clicking the link below:
        
        ${verificationLink}
        
        This link will expire in 24 hours.
        
        If you didn't create an account, please ignore this email.
        
        © ${new Date().getFullYear()} Tray. All rights reserved.
      `;

      await sendEmail({
        to: userRecord.email!,
        subject: "Verify Your Email Address - Tray",
        html: emailHtml,
        text: emailText
      });

      Logger.success(route, userRecord.uid, `Verification email sent via SMTP to ${userRecord.email}`);

      res.json({
        success: true,
        message: "Verification email sent successfully",
        email: userRecord.email,
        emailSent: true
      });
    } catch (emailError: any) {
      // If SMTP sending fails, still return the link so user can verify manually
      Logger.warn(route, userRecord.uid, `SMTP email failed, returning link: ${emailError.message}`);

      res.json({
        success: true,
        message: "Verification link generated (SMTP email failed)",
        verificationLink: verificationLink,
        email: userRecord.email,
        emailSent: false,
        note: "Email sending failed, but verification link is available. Please use the link to verify your email."
      });
    }
  } catch (error: any) {
    Logger.error(route, "", error.message);

    // Handle Firebase rate limiting - check both error code and message
    if (error.code === 'auth/too-many-requests' ||
      error.code === 'TOO_MANY_ATTEMPTS_TRY_LATER' ||
      error.message?.includes('TOO_MANY_ATTEMPTS') ||
      error.message?.includes('TOO_MANY_ATTEMPTS_TRY_LATER') ||
      (error.errors && Array.isArray(error.errors) &&
        error.errors.some((e: any) => e.message?.includes('TOO_MANY_ATTEMPTS')))) {
      Logger.warn(route, "", "Firebase rate limit exceeded - too many verification email attempts");
      return res.status(429).json({
        error: "Too many verification email attempts. Please wait a few minutes before trying again.",
        message: "Too many verification email attempts. Please wait a few minutes before trying again.",
        code: "TOO_MANY_ATTEMPTS",
        retryAfter: 300 // Suggest waiting 5 minutes
      });
    }

    // Handle invalid continue URI
    if (error.code === 'auth/invalid-continue-uri' ||
      error.code === 'auth/unauthorized-continue-uri' ||
      error.message?.includes('invalid-continue-uri') ||
      error.message?.includes('unauthorized-continue-uri')) {
      Logger.error(route, "", "Invalid continue URI configuration");
      return res.status(400).json({
        error: "Invalid email verification configuration. Please contact support.",
        code: error.code
      });
    }

    // If error has a nested error structure (from Firebase API)
    const errorMessage = error.message ||
      error.error?.message ||
      (typeof error === 'string' ? error : 'An error occurred while sending verification email');
    const errorCode = error.code || error.error?.code || 'auth/internal-error';

    res.status(500).json({
      error: errorMessage,
      code: errorCode,
      message: errorMessage
    });
  }
};

/**
 * POST /auth/verify-email
 * Verify email directly (fallback when client-side verification fails)
 * Note: This endpoint requires the user to be authenticated and provides the email
 */

/**
 * Get all users (Admin only)
 * Supports pagination and filtering by role
 */
export const getAllUsers = async (req: Request, res: Response) => {
  const route = "GET /auth/admin/users";
  
  try {
    const userRole = (req as any).userRole;
    
    // Double check admin role (should be handled by middleware, but extra safety)
    if (userRole !== "admin") {
      Logger.error(route, "", "Non-admin user attempted to access admin endpoint");
      return res.status(403).json({ error: "Admin access required" });
    }

    // Get query parameters for pagination and filtering
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const role = req.query.role as string | undefined;
    const isActive = req.query.isActive !== undefined 
      ? req.query.isActive === 'true' 
      : undefined;

    // Build query
    let query: FirebaseFirestore.Query = db.collection("users");

    // Filter by role if provided
    if (role && ['student', 'consultant', 'admin'].includes(role)) {
      query = query.where("role", "==", role);
    }

    // Filter by active status if provided
    if (isActive !== undefined) {
      query = query.where("isActive", "==", isActive);
    }

    // Order by creation date (newest first)
    query = query.orderBy("createdAt", "desc");

    // Get all documents (Firestore doesn't support offset pagination natively)
    // For better performance with large datasets, consider using cursor-based pagination
    const allDocs = await query.get();
    const total = allDocs.size;

    // Apply pagination by slicing the results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDocs = allDocs.docs.slice(startIndex, endIndex);

    // Map documents to user objects
    const users = paginatedDocs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        deletedAt: data.deletedAt?.toDate?.() || data.deletedAt,
      };
    });

    Logger.success(route, "", `Retrieved ${users.length} users (page ${page})`);
    
    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: endIndex < total,
        hasPrevPage: page > 1,
      },
      filters: {
        role: role || null,
        isActive: isActive !== undefined ? isActive : null,
      },
    });
  } catch (error) {
    Logger.error(route, "", "Error fetching users", error);
    res.status(500).json({ error: (error as Error).message });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  const route = "POST /auth/verify-email";

  try {
    const { email, uid } = req.body;

    // Get user from request (authenticated via middleware) or from body
    const user = (req as any).user;
    const targetUid = uid || user?.uid;

    if (!email && !targetUid) {
      Logger.error(route, "", "Missing email or uid");
      return res.status(400).json({ error: "email or uid is required" });
    }

    // Get user by email or uid
    let userRecord;
    if (targetUid) {
      userRecord = await auth.getUser(targetUid);
    } else if (email) {
      userRecord = await auth.getUserByEmail(email);
    } else {
      return res.status(400).json({ error: "email or uid is required" });
    }

    // Check if email is already verified
    if (userRecord.emailVerified) {
      Logger.info(route, userRecord.uid, `Email already verified for ${userRecord.email}`);
      return res.json({
        success: true,
        message: "Email is already verified",
        email: userRecord.email,
        uid: userRecord.uid,
        emailVerified: true
      });
    }

    // Verify email directly
    await auth.updateUser(userRecord.uid, {
      emailVerified: true
    });

    Logger.success(route, userRecord.uid, `Email verified directly for ${userRecord.email}`);

    res.json({
      success: true,
      message: "Email verified successfully",
      email: userRecord.email,
      uid: userRecord.uid,
      emailVerified: true
    });
  } catch (error: any) {
    Logger.error(route, "", error.message);

    res.status(500).json({
      error: error.message,
      code: error.code
    });
  }
};
