// src/controllers/authController.ts
import { Request, Response } from "express";
import { db, auth } from "../config/firebase";
import { Logger } from "../utils/logger";
import { sendEmail } from "../utils/email";
import nodemailer from "nodemailer";
import { randomUUID } from "crypto";
import axios from "axios";


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
        role: 'student', // Keep for backward compatibility
        roles: ['student'], // New: array of roles user has access to
        activeRole: 'student', // New: currently active role
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

    let verificationLink: string;
    try {
      // Try to use web URL for email verification if configured
      const webUrl = process.env.FRONTEND_URL;
      
      if (webUrl && webUrl.trim() !== '') {
        try {
      const actionCodeSettings = {
        url: `${webUrl}/verify-email`,
        handleCodeInApp: false,
      };

      verificationLink = await auth.generateEmailVerificationLink(
        userRecord.email!,
        actionCodeSettings
      );
        } catch (uriError: any) {
          // If continue URI fails (domain not allowlisted, invalid config), use default link
          const errorCode = uriError.code || uriError.error?.code || '';
          const errorMessage = uriError.message || uriError.error?.message || '';
          const errorString = JSON.stringify(uriError).toLowerCase();
          
          if (errorCode === 'auth/invalid-continue-uri' ||
              errorCode === 'auth/unauthorized-continue-uri' ||
              errorMessage?.toLowerCase().includes('invalid-continue-uri') ||
              errorMessage?.toLowerCase().includes('unauthorized-continue-uri') ||
              errorMessage?.toLowerCase().includes('domain not allowlisted') ||
              errorString.includes('invalid-continue-uri') ||
              errorString.includes('unauthorized-continue-uri') ||
              errorString.includes('domain not allowlisted')) {
            Logger.warn(route, userRecord.uid, `Continue URI not configured (${errorCode || errorMessage}), using default verification link`);
            // Generate link without actionCodeSettings (works for mobile apps)
            verificationLink = await auth.generateEmailVerificationLink(userRecord.email!);
          } else {
            throw uriError;
          }
        }
      } else {
        // No FRONTEND_URL configured, generate default link (works for mobile apps)
        Logger.info(route, userRecord.uid, "FRONTEND_URL not configured, generating default verification link");
        verificationLink = await auth.generateEmailVerificationLink(userRecord.email!);
      }
    } catch (linkError: any) {
      // Re-throw errors to be caught by outer catch
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

    // Fallback: If continue URI error somehow reached here, try generating default link
    // Extract error information from various possible structures
    const errorCode = error.code || error.error?.code || error.response?.data?.error?.code || '';
    const errorMessage = error.message || error.error?.message || error.response?.data?.error?.message || '';
    const errorString = JSON.stringify(error).toLowerCase();
    
    if (errorCode === 'auth/invalid-continue-uri' ||
        errorCode === 'auth/unauthorized-continue-uri' ||
        errorMessage?.toLowerCase().includes('invalid-continue-uri') ||
        errorMessage?.toLowerCase().includes('unauthorized-continue-uri') ||
        errorMessage?.toLowerCase().includes('domain not allowlisted') ||
        errorString.includes('invalid-continue-uri') ||
        errorString.includes('unauthorized-continue-uri') ||
        errorString.includes('domain not allowlisted')) {
      
      // Only attempt fallback if we have userRecord
      if (userRecord && userRecord.email) {
        Logger.warn(route, userRecord.uid || "", `Continue URI error in outer catch, attempting fallback with default link`);
        
        try {
          // Try to generate default link as fallback
          const defaultLink = await auth.generateEmailVerificationLink(userRecord.email);
          Logger.success(route, userRecord.uid || "", `Fallback: Generated default verification link`);
          
          // Try to send email with default link
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
                    <a href="${defaultLink}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">Verify Email Address</a>
                  </div>
                  <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
                  <p style="font-size: 12px; color: #999; word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">${defaultLink}</p>
                  <p style="font-size: 14px; color: #666; margin-top: 30px;">This link will expire in 24 hours.</p>
                  <p style="font-size: 14px; color: #666;">If you didn't create an account, please ignore this email.</p>
                </div>
              </body>
              </html>
            `;
            
            const emailResult = await sendEmail({
              to: userRecord.email,
              subject: "Verify Your Email Address - Tray",
              html: emailHtml
            });
            
            if (emailResult.sent) {
              return res.json({
                success: true,
                message: "Verification email sent successfully",
                email: userRecord.email,
                emailSent: true
              });
            } else {
              Logger.warn(route, userRecord.uid || "", `Email send failed in fallback: ${emailResult.error || 'Unknown error'}`);
              return res.json({
                success: true,
                message: "Verification link generated",
                verificationLink: defaultLink,
                email: userRecord.email,
                emailSent: false,
                note: emailResult.error || "Email sending failed, but verification link is available."
              });
            }
          } catch (emailErr: any) {
            Logger.warn(route, userRecord.uid || "", `Email send error in fallback: ${emailErr.message}`);
            return res.json({
              success: true,
              message: "Verification link generated",
              verificationLink: defaultLink,
              email: userRecord.email,
              emailSent: false,
              note: `Email sending failed: ${emailErr.message}`
            });
          }
        } catch (fallbackError: any) {
          Logger.error(route, userRecord.uid || "", `Fallback also failed: ${fallbackError.message}`);
          // Continue to generic error response
        }
      } else {
        Logger.warn(route, "", `Continue URI error but userRecord not available for fallback`);
      }
    }

    // Check for rate limiting errors (TOO_MANY_ATTEMPTS_TRY_LATER)
    if (errorCode === 'TOO_MANY_ATTEMPTS_TRY_LATER' ||
        errorMessage?.includes('TOO_MANY_ATTEMPTS_TRY_LATER') ||
        errorString.includes('too_many_attempts_try_later')) {
      Logger.warn(route, userRecord?.uid || "", "Too many verification email attempts");
      return res.status(429).json({
        error: "Too many attempts. Please wait a few minutes before requesting another verification email.",
        code: "TOO_MANY_ATTEMPTS_TRY_LATER",
        message: "Too many attempts. Please wait a few minutes before requesting another verification email."
      });
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

    if (!['student', 'consultant'].includes(newRole)) {
      Logger.error(route, user.uid, `Invalid role: ${newRole}`);
      return res.status(400).json({ error: "Invalid role. Must be 'student' or 'consultant'" });
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

      Logger.success(route, user.uid, `Role switched from ${currentActiveRole} to ${newRole} (profile status: ${profileStatus})`);
      return res.status(200).json({
        message: `Role switched to ${newRole} successfully`,
        activeRole: newRole,
        roles: updatedRoles,
        profileStatus: profileStatus,
      });
    }

    // If switching to student - just check email verification (already checked above)
    await db.collection("users").doc(user.uid).update({
      activeRole: newRole,
      role: newRole, // Keep for backward compatibility
      updatedAt: new Date(),
    });

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
