// src/controllers/authController.ts
import { Request, Response } from "express";
import { db, auth } from "../config/firebase";
import { Logger } from "../utils/logger";
import { sendEmail } from "../utils/email";
import { randomUUID, randomBytes, createHash } from "crypto";
import axios from "axios";
import { cache } from "../utils/cache";
import { consultantFlowService } from "../services/consultantFlow.service";


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
    if (!['student', 'consultant', 'admin', 'recruiter'].includes(role)) {
      Logger.error(route, "", `Invalid role: ${role}`);
      return res.status(400).json({
        error: "Invalid role. Must be 'student', 'consultant', 'admin', or 'recruiter'"
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

    // Create user document with roles array and activeRole
    const userData = {
      name: name || null,
      role, // Keep for backward compatibility
      roles: [role], // New: array of roles user has access to
      activeRole: role, // New: currently active role
      email,
      profileImage: null, // Will be set later via profile update
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("users").doc(uid).set(userData);

    // Cache the new user profile
    cache.set(`user:${uid}`, userData, 2 * 60 * 1000); // 2 minutes

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
  const startTime = Date.now();
  console.log("🎯 [GET /auth/me] - Route hit");

  // Set timeout for the request (10 seconds max)
  req.setTimeout(10000);
  res.setTimeout(10000);

  try {
    const user = (req as any).user;

    if (!user || !user.uid) {
      console.error("❌ [GET /auth/me] - No user or uid in request");
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log(`🔍 [GET /auth/me] - Fetching profile for user: ${user.uid}`);

    // OPTIMIZATION: Check cache first to avoid Firestore query
    const cacheKey = `user:${user.uid}`;
    const cachedProfile = cache.get(cacheKey);

    if (cachedProfile) {
      const cacheTime = Date.now() - startTime;
      console.log(`⚡ [GET /auth/me] - Profile retrieved from cache in ${cacheTime}ms for user: ${user.uid}`);

      const responseData = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.email_verified,
        ...cachedProfile
      };

      return res.json(responseData);
    }

    // OPTIMIZED: Firestore query with proper timeout and error handling
    // Use direct document reference for fastest access (no collection scan needed)
    const FIRESTORE_TIMEOUT_MS = 5000; // 5 seconds - faster timeout

    let doc: any;
    try {
      // OPTIMIZATION: Use direct document reference - fastest way to get a document
      // This bypasses any collection-level queries and goes straight to the document
      const userDocRef = db.collection("users").doc(user.uid);
      const firestorePromise = userDocRef.get();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Firestore query timeout after ${FIRESTORE_TIMEOUT_MS}ms`));
        }, FIRESTORE_TIMEOUT_MS);
      });

      doc = await Promise.race([firestorePromise, timeoutPromise]);

      // Log query performance for monitoring
      const queryTime = Date.now() - startTime;
      if (queryTime > 2000) {
        // Only warn for queries > 2 seconds (very slow)
        console.warn(`⚠️ [GET /auth/me] - Very slow Firestore query: ${queryTime}ms for user: ${user.uid}`);
      } else if (queryTime > 1000) {
        // Log as info for queries between 1-2 seconds (moderately slow, but acceptable)
        console.log(`ℹ️ [GET /auth/me] - Firestore query took ${queryTime}ms for user: ${user.uid} (first query may be slower due to connection warm-up)`);
      } else {
        console.log(`✅ [GET /auth/me] - Firestore query completed in ${queryTime}ms for user: ${user.uid}`);
      }
    } catch (queryError: any) {
      const elapsed = Date.now() - startTime;
      console.error(`❌ [GET /auth/me] - Firestore query error after ${elapsed}ms:`, queryError.message);

      // Check for specific Firestore errors
      if (queryError.message?.includes('timeout') || queryError.code === 'deadline-exceeded') {
        return res.status(504).json({
          error: "Database timeout",
          message: "The database query took too long. This may be due to index building. Please try again in a moment."
        });
      }

      if (queryError.code === 'unavailable' || queryError.code === 'internal') {
        return res.status(503).json({
          error: "Database unavailable",
          message: "The database is temporarily unavailable. Please try again."
        });
      }

      // Generic error
      return res.status(500).json({
        error: "Failed to fetch user profile",
        message: "Database error occurred. Please try again."
      });
    }

    if (!doc.exists) {
      console.log(`⚠️ [GET /auth/me] - User profile not found, creating default profile: ${user.uid}`);

      // Auto-create a default user profile
      // Note: Firebase decoded token properties: uid, email, email_verified, name, picture
      const defaultUserData = {
        name: user.name || null,
        role: 'student', // Keep for backward compatibility
        roles: ['student'], // New: array of roles user has access to
        activeRole: 'student', // New: currently active role
        email: user.email || null,
        profileImage: user.picture || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // OPTIMIZED: Firestore write with timeout
      const FIRESTORE_WRITE_TIMEOUT_MS = 5000; // 5 seconds
      const writePromise = db.collection("users").doc(user.uid).set(defaultUserData, { merge: false });
      const writeTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Firestore write timeout after ${FIRESTORE_WRITE_TIMEOUT_MS}ms`));
        }, FIRESTORE_WRITE_TIMEOUT_MS);
      });

      try {
        await Promise.race([writePromise, writeTimeoutPromise]);
        // Cache the newly created default profile
        cache.set(cacheKey, defaultUserData, 2 * 60 * 1000); // 2 minutes
      } catch (writeError: any) {
        console.error(`❌ [GET /auth/me] - Firestore write error:`, writeError.message);
        // If write fails, still return the default data (it's in memory)
        // Don't fail the request just because we couldn't persist
        console.warn(`⚠️ [GET /auth/me] - Could not persist default profile, returning in-memory data`);
        // Still cache it even if write failed (for faster subsequent requests)
        cache.set(cacheKey, defaultUserData, 2 * 60 * 1000);
      }
      console.log(`✅ [GET /auth/me] - Default user profile created: ${user.uid}`);

      const responseData = {
        uid: user.uid,
        emailVerified: user.email_verified,
        ...defaultUserData
      };

      console.log(`✅ [GET /auth/me] - Response sent in ${Date.now() - startTime}ms`);
      return res.json(responseData);
    }

    const profile = doc.data();
    console.log(`✅ [GET /auth/me] - User profile retrieved: ${user.uid}`);

    // OPTIMIZATION: Cache the profile for 2 minutes to reduce Firestore queries
    // Cache TTL is shorter than default to ensure fresh data for profile updates
    cache.set(cacheKey, profile, 2 * 60 * 1000); // 2 minutes

    const responseData = {
      uid: user.uid,
      email: user.email,
      emailVerified: user.email_verified,
      ...profile
    };

    const totalTime = Date.now() - startTime;
    console.log(`✅ [GET /auth/me] - Response sent in ${totalTime}ms`);

    // Ensure response is sent
    if (!res.headersSent) {
      res.json(responseData);
    }
  } catch (error: any) {
    console.error("❌ [GET /auth/me] - Get user error:", {
      message: error.message,
      stack: error.stack,
      elapsedTime: Date.now() - startTime,
    });

    // Ensure error response is sent
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  console.log("🎯 [PUT /auth/profile] - Route hit");

  try {
    const user = (req as any).user;
    const { name, profileImage, externalProfiles } = req.body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (externalProfiles) updateData.externalProfiles = externalProfiles;

    console.log(`💾 [PUT /auth/profile] - Updating user ${user.uid} with data:`, updateData);

    await db.collection("users").doc(user.uid).update(updateData);

    // OPTIMIZATION: Invalidate cache after profile update to ensure fresh data
    const cacheKey = `user:${user.uid}`;
    cache.delete(cacheKey);
    console.log(`🗑️ [PUT /auth/profile] - Cache invalidated for user: ${user.uid}`);

    console.log(`✅ [PUT /auth/profile] - Profile updated successfully: ${user.uid}`);
    res.json({ message: "Profile updated successfully", updateData });
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

    // Invalidate cache after account deletion
    cache.delete(`user:${user.uid}`);

    console.log(`✅ [DELETE /auth/account] - Account deactivated successfully: ${user.uid}`);
    res.json({ message: "Account deactivated successfully" });
  } catch (error) {
    console.error("❌ [DELETE /auth/account] - Delete account error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
};


// Email functionality now uses centralized sendEmail utility from utils/email.ts



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

    // Send OTP email using centralized sendEmail utility
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Your Tray App Password Reset Code</h2>
        <p style="font-size: 18px; color: #555;">Your password reset code is:</p>
        <h1 style="background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 5px; font-size: 32px; margin: 20px 0;">
          ${otp}
        </h1>
        <p style="color: #666; font-size: 14px;">This code will expire in 30 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this reset, please ignore this email.</p>
      </div>
    `;

    const emailResult = await sendEmail({
      to: email,
      subject: "Your Tray App Password Reset Code",
      html: emailHtml,
      text: `Your Tray App Password Reset Code: ${otp}\n\nThis code will expire in 30 minutes.\n\nIf you didn't request this reset, please ignore this email.`
    });

    if (emailResult.sent) {
      console.log('✅ Password reset email sent successfully!');
      return res.json({
        message: "OTP sent to your email.",
        resetSessionId,
      });
    } else {
      // Email sending failed (not configured or error)
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
      profileImage: userData?.profileImage || userData?.avatarUrl || userData?.photoURL || userData?.avatar || null,
      avatarUrl: userData?.avatarUrl || null,
      photoURL: userData?.photoURL || null,
      avatar: userData?.avatar || null,
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
 * Resend email verification using custom token system and SMTP email
 * Completely bypasses Firebase email verification APIs and rate limits
 */
export const resendVerificationEmail = async (req: Request, res: Response) => {
  const route = "POST /auth/resend-verification-email";

  // Declare userRecord outside try block so it's accessible in catch block
  let userRecord: any = null;

  try {
    const { uid, email } = req.body;

    if (!uid && !email) {
      Logger.error(route, "", "Missing uid or email");
      return res.status(400).json({ error: "uid or email is required" });
    }

    // Get user by uid or email
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

    // Generate custom verification token (bypasses Firebase rate limits)
    const verificationToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(verificationToken).digest('hex');

    // Store token in Firestore with expiration (24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await db.collection('email_verification_tokens').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      tokenHash: tokenHash,
      expiresAt: expiresAt,
      createdAt: new Date()
    });

    // Generate verification links (no Firebase API calls - bypasses rate limits)
    // Support both web and mobile verification links
    // FRONTEND_URL can be set to:
    // - localhost:3000 (for local development)
    // - https://tray-dashboard-eight.vercel.app (for production web)
    // - Leave empty to use mobile deep link only
    const webUrl = (process.env.FRONTEND_URL || process.env.APP_URL || '').replace(/\/+$/, ''); // Remove trailing slashes
    const mobileLink = `tray://email-verification?token=${verificationToken}&uid=${userRecord.uid}`;
    const webLink = webUrl ? `${webUrl}/verify-email?token=${verificationToken}&uid=${userRecord.uid}` : null;

    // Use web link if available, otherwise use mobile link
    const verificationLink = webLink || mobileLink;
    
    // Log both links for debugging
    Logger.info(route, userRecord.uid, `Mobile deep link: ${mobileLink}`);
    if (webLink) {
      Logger.info(route, userRecord.uid, `Web link: ${webLink}`);
    }

    Logger.success(route, userRecord.uid, `Generated custom verification token for ${userRecord.email}`);
    Logger.info(route, userRecord.uid, `Verification link: ${verificationLink}`);

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
            <p style="font-size: 16px;">Thank you for registering with Tray! Please verify your email address by clicking one of the buttons below:</p>
            <div style="text-align: center; margin: 30px 0;">
              ${webLink ? `<a href="${webLink}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px; margin: 10px; width: 200px;">Verify on Web</a>` : ''}
              <a href="${mobileLink}" style="background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px; margin: 10px; width: 200px;">Open in App</a>
            </div>
            <div style="background: #fff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;"><strong>📱 For Mobile Users:</strong></p>
              <p style="font-size: 12px; color: #999; word-break: break-all; margin: 0;">${mobileLink}</p>
            </div>
            ${webLink ? `
            <div style="background: #fff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;"><strong>🌐 For Web Users:</strong></p>
              <p style="font-size: 12px; color: #999; word-break: break-all; margin: 0;">${webLink}</p>
            </div>
            ` : ''}
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
        
        Thank you for registering with Tray! Please verify your email address using one of the links below:
        
        📱 For Mobile App Users:
        ${mobileLink}
        
        ${webLink ? `🌐 For Web Users:\n${webLink}\n` : ''}
        
        This link will expire in 24 hours.
        
        ${webLink ? 'Note: If you\'re on desktop, use the web link. If you\'re on mobile, use the mobile link to open in the app.' : 'Note: Click the mobile link above to open in the Tray app.'}
        
        If you didn't create an account, please ignore this email.
        
        © ${new Date().getFullYear()} Tray. All rights reserved.
      `;

      const emailResult = await sendEmail({
        to: userRecord.email!,
        subject: "Verify Your Email Address - Tray",
        html: emailHtml,
        text: emailText
      });

      if (emailResult.sent) {
        Logger.success(route, userRecord.uid, `Verification email sent via SMTP to ${userRecord.email}`);
        res.json({
          success: true,
          message: "Verification email sent successfully",
          email: userRecord.email,
          emailSent: true
        });
      } else {
        // Email sending failed (not configured or error)
        Logger.warn(route, userRecord.uid, `SMTP email failed: ${emailResult.error || 'Unknown error'}`);
        res.json({
          success: true,
          message: "Verification link generated (SMTP email failed)",
          verificationLink: verificationLink,
          email: userRecord.email,
          emailSent: false,
          note: emailResult.error || "Email sending failed, but verification link is available. Please use the link to verify your email."
        });
      }
    } catch (emailError: any) {
      // Catch any unexpected errors
      Logger.warn(route, userRecord.uid, `SMTP email error: ${emailError.message}`);

      res.json({
        success: true,
        message: "Verification link generated (SMTP email failed)",
        verificationLink: verificationLink,
        email: userRecord.email,
        emailSent: false,
        note: `Email sending failed: ${emailError.message}. Verification link is available. Please use the link to verify your email.`
      });
    }
  } catch (error: any) {
    // Log full error for debugging
    Logger.error(route, userRecord?.uid || "", `Error details: ${JSON.stringify(error)}`);

    // Extract error information from various possible structures
    const errorCode = error.code || error.error?.code || error.response?.data?.error?.code || '';
    const errorMessage = error.message || error.error?.message || error.response?.data?.error?.message || '';
    const errorString = JSON.stringify(error).toLowerCase();

    // Fallback: If continue URI error somehow reached here, try generating default link

    if (errorCode === 'auth/invalid-continue-uri' ||
      errorCode === 'auth/unauthorized-continue-uri' ||
      errorMessage?.toLowerCase().includes('invalid-continue-uri') ||
      errorMessage?.toLowerCase().includes('unauthorized-continue-uri') ||
      errorMessage?.toLowerCase().includes('domain not allowlisted') ||
      errorString.includes('invalid-continue-uri') ||
      errorString.includes('unauthorized-continue-uri') ||
      errorString.includes('domain not allowlisted')) {

      // No Firebase fallback - custom token system handles all verification
      // Errors will be returned as normal error responses
    }

    // If error has a nested error structure (from Firebase API)
    const finalErrorMessage = errorMessage ||
      (typeof error === 'string' ? error : 'An error occurred while sending verification email');
    const finalErrorCode = errorCode || 'auth/internal-error';

    res.status(500).json({
      error: finalErrorMessage,
      code: finalErrorCode,
      message: finalErrorMessage
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

    // Use Firestore's native limit for better performance
    // Note: For large datasets, consider implementing cursor-based pagination
    query = query.limit(limit * 10); // Fetch a larger batch to support pagination

    const allDocs = await query.get();
    const total = allDocs.size;

    // Apply pagination by slicing the results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDocs = allDocs.docs.slice(startIndex, endIndex);

        // Map documents to user objects and calculate profileComplete for consultants
        const users = await Promise.all(
          paginatedDocs.map(async (doc) => {
            const data = doc.data();
            const userRole = data.role || data.activeRole;
            const userRoles = data.roles || [];
            const userUid = doc.id;
            
            const userObj: any = {
              uid: userUid,
              ...data,
              createdAt: data.createdAt?.toDate?.() || data.createdAt,
              updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
              deletedAt: data.deletedAt?.toDate?.() || data.deletedAt,
            };

            // Only calculate profileComplete for consultants
            // Check both role field and roles array
            const isConsultant = userRole === 'consultant' || userRoles.includes('consultant');
            if (isConsultant) {
          try {
            // Check if consultant has an approved profile
            const profileDoc = await db.collection("consultantProfiles").doc(userUid).get();
            
            if (profileDoc.exists) {
              const profile = profileDoc.data();
              const isProfileApproved = profile?.status === 'approved';
              
              if (isProfileApproved) {
                // Check if consultant has at least one approved service application
                const applications = await consultantFlowService.getApplicationsByConsultant(userUid);
                const hasApprovedService = applications.some(app => app.status === 'approved');
                
                userObj.profileComplete = hasApprovedService;
              } else {
                userObj.profileComplete = false;
              }
            } else {
              // No profile exists
              userObj.profileComplete = false;
            }
          } catch (error: any) {
            // If there's an error checking profile, default to incomplete
            Logger.warn(route, userUid, `Error checking profile completeness: ${error.message}`);
            userObj.profileComplete = false;
          }
        }
        // For non-consultants (student, recruiter, admin), profileComplete is not applicable
        // Don't set it, so it will be undefined in the response

        return userObj;
      })
    );

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

/**
 * POST /auth/request-consultant-role
 * Request access to consultant role (adds consultant to roles array if not present)
 */
export const requestConsultantRole = async (req: Request, res: Response) => {
  const route = "POST /auth/request-consultant-role";

  try {
    const user = (req as any).user;
    const userDoc = await db.collection("users").doc(user.uid).get();

    if (!userDoc.exists) {
      Logger.error(route, user.uid, "User not found");
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    const currentRoles = userData?.roles || [userData?.role || 'student'];

    // Check if user already has consultant role
    if (currentRoles.includes('consultant')) {
      return res.status(200).json({
        message: "You already have consultant role access",
        roles: currentRoles,
      });
    }

    // Add consultant to roles array
    const updatedRoles = [...currentRoles, 'consultant'];

    await db.collection("users").doc(user.uid).update({
      roles: updatedRoles,
      updatedAt: new Date(),
    });

    // Invalidate cache after role update
    cache.delete(`user:${user.uid}`);

    Logger.success(route, user.uid, "Consultant role requested and added to roles array");
    res.status(200).json({
      message: "Consultant role access requested. Complete your consultant profile to get verified.",
      roles: updatedRoles,
    });
  } catch (error) {
    Logger.error(route, "", "Error requesting consultant role", error);
    res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * POST /auth/switch-role
 * Switch active role
 * - Switching to consultant: Check email verification, allow creating profile if doesn't exist
 * - Switching to student: Check email verification
 */
export const switchRole = async (req: Request, res: Response) => {
  const route = "POST /auth/switch-role";

  try {
    const user = (req as any).user;
    const { newRole } = req.body;

    if (!newRole) {
      Logger.error(route, user.uid, "New role not provided");
      return res.status(400).json({ error: "New role is required" });
    }

    if (!['student', 'consultant', 'recruiter'].includes(newRole)) {
      Logger.error(route, user.uid, `Invalid role: ${newRole}`);
      return res.status(400).json({ error: "Invalid role. Must be 'student', 'consultant', or 'recruiter'" });
    }

    // Email verification is already required at login, so no need to check here
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (!userDoc.exists) {
      Logger.error(route, user.uid, "User not found");
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    const currentRoles = userData?.roles || [userData?.role || 'student'];
    const currentActiveRole = userData?.activeRole || userData?.role || 'student';

    // If switching to consultant
    if (newRole === 'consultant') {
      // Add consultant to roles if not already present
      let updatedRoles = currentRoles;
      if (!currentRoles.includes('consultant')) {
        updatedRoles = [...currentRoles, 'consultant'];
        await db.collection("users").doc(user.uid).update({
          roles: updatedRoles,
          updatedAt: new Date(),
        });
      }

      // Check if consultant profile exists
      const consultantProfileDoc = await db.collection("consultantProfiles").doc(user.uid).get();

      if (!consultantProfileDoc.exists) {
        // Profile doesn't exist - don't switch role, user must create profile first
        Logger.info(route, user.uid, `Consultant profile not found - role switch blocked`);
        return res.status(403).json({
          error: "Consultant profile is required. Please create your consultant profile first.",
          action: "create_consultant_profile",
        });
      }

      // Profile exists - check status
      const consultantProfile = consultantProfileDoc.data();
      const profileStatus = consultantProfile?.status;

      // Allow switching regardless of status (user can see their profile status)
      await db.collection("users").doc(user.uid).update({
        activeRole: newRole,
        role: newRole, // Keep for backward compatibility
        roles: updatedRoles,
        updatedAt: new Date(),
      });

      // Invalidate cache after role switch
      cache.delete(`user:${user.uid}`);

      Logger.success(route, user.uid, `Role switched from ${currentActiveRole} to ${newRole} (profile status: ${profileStatus})`);
      return res.status(200).json({
        message: `Role switched to ${newRole} successfully`,
        activeRole: newRole,
        roles: updatedRoles,
        profileStatus: profileStatus,
      });
    }

    // If switching to recruiter - no approval needed, can switch immediately
    if (newRole === 'recruiter') {
      // Add recruiter to roles if not already present
      let updatedRoles = currentRoles;
      if (!currentRoles.includes('recruiter')) {
        updatedRoles = [...currentRoles, 'recruiter'];
        await db.collection("users").doc(user.uid).update({
          roles: updatedRoles,
          updatedAt: new Date(),
        });
      }

      // No profile check needed - recruiters can post jobs immediately
      await db.collection("users").doc(user.uid).update({
        activeRole: newRole,
        role: newRole, // Keep for backward compatibility
        roles: updatedRoles,
        updatedAt: new Date(),
      });

      // Invalidate cache after role switch
      cache.delete(`user:${user.uid}`);

      Logger.success(route, user.uid, `Role switched from ${currentActiveRole} to ${newRole}`);
      return res.status(200).json({
        message: `Role switched to ${newRole} successfully`,
        activeRole: newRole,
        roles: updatedRoles,
      });
    }

    // If switching to student - just check email verification (already checked above)
    await db.collection("users").doc(user.uid).update({
      activeRole: newRole,
      role: newRole, // Keep for backward compatibility
      updatedAt: new Date(),
    });

    // Invalidate cache after role switch
    cache.delete(`user:${user.uid}`);

    Logger.success(route, user.uid, `Role switched from ${currentActiveRole} to ${newRole}`);
    res.status(200).json({
      message: `Role switched to ${newRole} successfully`,
      activeRole: newRole,
      roles: currentRoles,
    });
  } catch (error) {
    Logger.error(route, "", "Error switching role", error);
    res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * POST /auth/change-password
 * Change password for authenticated user
 */
export const changePassword = async (req: Request, res: Response) => {
  const route = "POST /auth/change-password";

  try {
    const user = (req as any).user;
    const { newPassword, currentPassword } = req.body;

    if (!currentPassword) {
      Logger.error(route, user.uid, "Missing current password");
      return res.status(400).json({ error: "Current password is required" });
    }

    if (!newPassword) {
      Logger.error(route, user.uid, "Missing new password");
      return res.status(400).json({ error: "New password is required" });
    }

    if (newPassword.length < 8) {
      Logger.error(route, user.uid, "Password too short");
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    // Get user email from Firebase Auth
    const userRecord = await auth.getUser(user.uid);
    const email = userRecord.email;

    if (!email) {
      Logger.error(route, user.uid, "User email not found");
      return res.status(400).json({ error: "User email not found" });
    }

    // Verify current password by attempting to sign in using Firebase Auth REST API
    const firebaseApiKey = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    if (!firebaseApiKey) {
      Logger.error(route, "", "Firebase API key not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      // Verify current password by attempting to sign in using Firebase Auth REST API
      // This is the only way to verify a password with Firebase Admin SDK
      const verifyResponse = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
        {
          email: email,
          password: currentPassword,
          returnSecureToken: true
        }
      );

      // If sign-in succeeds (200 status), the current password is correct
      // Now we can safely update to the new password
      await auth.updateUser(user.uid, {
        password: newPassword
      });

      Logger.success(route, user.uid, "Password changed successfully");
      res.status(200).json({
        message: "Password changed successfully"
      });
    } catch (verifyError: any) {
      // If sign-in fails, the current password is incorrect
      Logger.error(route, user.uid, "Password verification failed", verifyError.response?.data || verifyError.message);

      if (verifyError.response?.status === 400 && verifyError.response?.data?.error) {
        const errorCode = verifyError.response.data.error.message || '';
        const errorMessage = verifyError.response.data.error.message || '';

        // Check for specific Firebase Auth error codes
        if (errorCode.includes("INVALID_PASSWORD") ||
          errorMessage.includes("INVALID_PASSWORD") ||
          errorCode.includes("WRONG_PASSWORD") ||
          errorMessage.includes("WRONG_PASSWORD")) {
          Logger.error(route, user.uid, "Current password is incorrect");
          return res.status(400).json({
            error: "Current password is incorrect"
          });
        }

        if (errorCode.includes("EMAIL_NOT_FOUND") ||
          errorMessage.includes("EMAIL_NOT_FOUND") ||
          errorCode.includes("USER_NOT_FOUND") ||
          errorMessage.includes("USER_NOT_FOUND")) {
          Logger.error(route, user.uid, "User email not found in Firebase Auth");
          return res.status(400).json({
            error: "User email not found"
          });
        }

        if (errorCode.includes("INVALID_EMAIL") ||
          errorMessage.includes("INVALID_EMAIL")) {
          Logger.error(route, user.uid, "Invalid email format");
          return res.status(400).json({
            error: "Invalid email format"
          });
        }
      }

      // Default error response for any other verification failures
      Logger.error(route, user.uid, "Current password verification failed", verifyError);
      return res.status(400).json({
        error: "Current password is incorrect"
      });
    }
  } catch (error: any) {
    Logger.error(route, "", "Error changing password", error);
    res.status(500).json({
      error: "Failed to change password",
      message: error.message
    });
  }
};

/**
 * POST /auth/admin/create-admin
 * Create a new admin user (Admin only)
 */
export const createAdminUser = async (req: Request, res: Response) => {
  const route = "POST /auth/admin/create-admin";

  try {
    const currentUser = (req as any).user;
    const userRole = (req as any).userRole;

    // Verify admin access
    if (userRole !== "admin") {
      Logger.error(route, currentUser.uid, "Non-admin user attempted to create admin");
      return res.status(403).json({ error: "Admin access required" });
    }

    const { email, password, name } = req.body;

    if (!email || !password) {
      Logger.error(route, "", "Missing required fields");
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    if (password.length < 8) {
      Logger.error(route, "", "Password too short");
      return res.status(400).json({
        error: "Password must be at least 8 characters long"
      });
    }

    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      Logger.warn(route, "", `User with email ${email} already exists`);
      return res.status(400).json({
        error: "User with this email already exists"
      });
    } catch (error: any) {
      // User doesn't exist, continue with creation
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create user in Firebase Auth
    userRecord = await auth.createUser({
      email,
      password,
      emailVerified: true, // Auto-verify email for admin users
      displayName: name || email.split('@')[0]
    });

    // Create user document in Firestore with admin role
    const userData = {
      name: name || email.split('@')[0],
      role: 'admin', // Keep for backward compatibility
      roles: ['admin'],
      activeRole: 'admin',
      email,
      profileImage: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentUser.uid // Track who created this admin
    };

    await db.collection("users").doc(userRecord.uid).set(userData);

    Logger.success(route, currentUser.uid, `Admin user created: ${email} (${userRecord.uid})`);
    res.status(201).json({
      message: "Admin user created successfully",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userData.name,
        role: 'admin'
      }
    });
  } catch (error: any) {
    Logger.error(route, "", "Error creating admin user", error);

    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({
        error: "User with this email already exists"
      });
    }

    res.status(500).json({
      error: "Failed to create admin user",
      message: error.message
    });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  const route = "POST /auth/verify-email";

  try {
    const { token, uid, email } = req.body;
    Logger.info(route, uid || "", `Starting email verification - token: ${token ? 'provided' : 'missing'}, uid: ${uid || 'missing'}`);

    // Support both token-based (new) and uid/email-based (legacy) verification
    let targetUid: string | null = null;

    if (token && uid) {
      // New token-based verification (bypasses Firebase rate limits)
      targetUid = uid;
      Logger.info(route, uid, "Using token-based verification");

      // Get token from Firestore
      Logger.info(route, uid, "Fetching token from Firestore...");
      const tokenDoc = await db.collection('email_verification_tokens').doc(uid).get();
      Logger.info(route, uid, `Token document exists: ${tokenDoc.exists}`);

      if (!tokenDoc.exists) {
        Logger.error(route, uid, "Verification token not found in Firestore - may have been used or expired");
        // Fall back to legacy verification if token not found (user might have already verified)
        Logger.info(route, uid, "Falling back to legacy verification...");
        const user = (req as any).user;
        targetUid = uid || user?.uid || null;

        if (!email && !targetUid) {
          return res.status(400).json({
            error: "Invalid or expired verification token. Please request a new verification email.",
            code: "INVALID_TOKEN"
          });
        }
        // Continue with legacy verification below
      } else {
        const tokenData = tokenDoc.data();

        // Check if token expired
        if (tokenData && tokenData.expiresAt && tokenData.expiresAt.toDate() < new Date()) {
          Logger.error(route, uid, "Verification token expired");
          await db.collection('email_verification_tokens').doc(uid).delete();
          return res.status(400).json({
            error: "Verification token has expired. Please request a new verification email.",
            code: "TOKEN_EXPIRED"
          });
        }

        // Verify token hash
        Logger.info(route, uid, "Verifying token hash...");
        const tokenHash = createHash('sha256').update(token).digest('hex');
        if (tokenData?.tokenHash !== tokenHash) {
          Logger.error(route, uid, `Invalid verification token - hash mismatch. Expected: ${tokenData?.tokenHash?.substring(0, 10)}..., Got: ${tokenHash.substring(0, 10)}...`);
          // Don't return error immediately - fall back to legacy verification
          Logger.info(route, uid, "Token hash mismatch, falling back to legacy verification...");
          const user = (req as any).user;
          targetUid = uid || user?.uid || null;

          if (!email && !targetUid) {
            return res.status(400).json({
              error: "Invalid verification token. Please request a new verification email.",
              code: "INVALID_TOKEN"
            });
          }
          // Continue with legacy verification below
        } else {
          // Token is valid
          Logger.info(route, uid, "Token verified successfully, deleting from Firestore...");
          await db.collection('email_verification_tokens').doc(uid).delete();
          Logger.info(route, uid, "Token deleted from Firestore");
        }
      }
    }

    // Legacy verification (for backward compatibility or when token verification fails)
    if (!targetUid) {
      // Legacy verification (for backward compatibility)
      Logger.info(route, uid || "", "Using legacy verification");
      const user = (req as any).user;
      targetUid = uid || user?.uid || null;

      if (!email && !targetUid) {
        Logger.error(route, "", "Missing token+uid, email, or authenticated uid");
        return res.status(400).json({
          error: "Invalid verification token. If you're logged in, you can verify your email from the app settings.",
          code: "INVALID_TOKEN"
        });
      }
    }

    // Get user by uid
    Logger.info(route, targetUid || "", "Fetching user from Firebase Auth...");
    let userRecord;
    if (targetUid) {
      userRecord = await auth.getUser(targetUid);
    } else if (email) {
      userRecord = await auth.getUserByEmail(email);
    } else {
      return res.status(400).json({ error: "token+uid, email, or uid is required" });
    }
    Logger.info(route, userRecord.uid, `User found: ${userRecord.email}`);

    // Check if email is already verified
    if (userRecord.emailVerified) {
      Logger.info(route, userRecord.uid, `Email already verified for ${userRecord.email}`);
      const response = {
        success: true,
        message: "Email is already verified",
        email: userRecord.email,
        uid: userRecord.uid,
        emailVerified: true
      };
      Logger.info(route, userRecord.uid, "Sending response: email already verified");
      return res.json(response);
    }

    // Verify email directly using Firebase Admin SDK (no rate limits)
    Logger.info(route, userRecord.uid, "Updating user email verification status...");
    await auth.updateUser(userRecord.uid, {
      emailVerified: true
    });
    Logger.info(route, userRecord.uid, "User email verification updated successfully");

    Logger.success(route, userRecord.uid, `Email verified successfully for ${userRecord.email}`);

    const response = {
      success: true,
      message: "Email verified successfully",
      email: userRecord.email,
      uid: userRecord.uid,
      emailVerified: true
    };
    Logger.info(route, userRecord.uid, "Sending success response");
    res.json(response);
    Logger.info(route, userRecord.uid, "Response sent successfully");
  } catch (error: any) {
    Logger.error(route, "", `Error in verifyEmail: ${error.message}`, error);

    const errorResponse = {
      error: error.message,
      code: error.code
    };
    Logger.info(route, "", "Sending error response");
    res.status(500).json(errorResponse);
    Logger.info(route, "", "Error response sent");
  }
};
