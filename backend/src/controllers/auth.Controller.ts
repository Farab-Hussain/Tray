// src/controllers/authController.ts
import { Request, Response } from "express";
import { db, auth } from "../config/firebase";
import { Logger } from "../utils/logger";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from 'uuid';


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
      console.log(`❌ [GET /auth/me] - User profile not found: ${user.uid}`);
      return res.status(404).json({ error: "User profile not found" });
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

const getEmailTransport = () => {
  if (!transportInstance) {
    console.log('📧 Initializing SMTP transport...');
    console.log('  SMTP_EMAIL:', process.env.SMTP_EMAIL ? '✓ Set' : '✗ Missing');
    console.log('  SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✓ Set' : '✗ Missing');
    
    transportInstance = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
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
    const resetSessionId = uuidv4();

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
