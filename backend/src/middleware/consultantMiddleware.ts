import { Request, Response, NextFunction } from "express";
import { db } from "../config/firebase";
import { Logger } from "../utils/logger";

/**
 * Middleware to check consultant profile status
 * Ensures consultant has gone through the onboarding flow
 */
export const checkConsultantStatus = async (req: Request, res: Response, next: NextFunction) => {
  const route = `${req.method} ${req.path}`;
  
  try {
    const user = (req as any).user;
    
    if (!user || !user.uid) {
      Logger.error(route, "", "User not authenticated");
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if consultant profile exists
    const profileDoc = await db.collection("consultantProfiles").doc(user.uid).get();
    
    if (!profileDoc.exists) {
      Logger.warn(route, user.uid, "Consultant profile not found - needs to complete onboarding");
      return res.status(403).json({ 
        error: "Profile not found",
        status: "no_profile",
        message: "Please complete your consultant profile to continue"
      });
    }

    const profile = profileDoc.data();
    
    // Attach profile to request for use in controllers
    (req as any).consultantProfile = profile;
    
    Logger.info(route, user.uid, `Consultant profile found - Status: ${profile?.status}`);
    next();
  } catch (error) {
    Logger.error(route, "", "Error checking consultant status", error);
    res.status(500).json({ error: "Failed to verify consultant status" });
  }
};

/**
 * Middleware to check if consultant profile is approved
 * Blocks access to protected routes until admin approval
 */
export const requireApprovedConsultant = async (req: Request, res: Response, next: NextFunction) => {
  const route = `${req.method} ${req.path}`;
  
  try {
    const profile = (req as any).consultantProfile;
    
    if (!profile) {
      Logger.error(route, "", "Consultant profile not attached - use checkConsultantStatus first");
      return res.status(500).json({ error: "Middleware error" });
    }

    // Check if profile is approved
    if (profile.status === "pending") {
      Logger.warn(route, profile.uid, "Access denied - Profile pending approval");
      return res.status(403).json({ 
        error: "Profile pending approval",
        status: "pending",
        message: "Your profile is under review. You'll receive an email once it's approved.",
        submittedAt: profile.createdAt
      });
    }

    if (profile.status === "rejected") {
      Logger.warn(route, profile.uid, "Access denied - Profile rejected");
      return res.status(403).json({ 
        error: "Profile rejected",
        status: "rejected",
        message: "Your profile was not approved. Please review and resubmit your application.",
        updatedAt: profile.updatedAt
      });
    }

    if (profile.status !== "approved") {
      Logger.error(route, profile.uid, `Unknown profile status: ${profile.status}`);
      return res.status(403).json({ 
        error: "Invalid profile status",
        status: profile.status
      });
    }

    // Profile is approved - allow access
    Logger.info(route, profile.uid, "Access granted - Approved consultant");
    next();
  } catch (error) {
    Logger.error(route, "", "Error verifying consultant approval", error);
    res.status(500).json({ error: "Failed to verify consultant approval" });
  }
};

/**
 * Middleware to check if consultant can apply for services
 * Allows profile creation but blocks service applications until approved
 */
export const canApplyForServices = async (req: Request, res: Response, next: NextFunction) => {
  const route = `${req.method} ${req.path}`;
  
  try {
    const user = (req as any).user;
    
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if consultant profile exists and is approved
    const profileDoc = await db.collection("consultantProfiles").doc(user.uid).get();
    
    if (!profileDoc.exists) {
      Logger.warn(route, user.uid, "Cannot apply - No consultant profile");
      return res.status(403).json({ 
        error: "Profile required",
        status: "no_profile",
        message: "Please create your consultant profile first"
      });
    }

    const profile = profileDoc.data();
    
    if (profile?.status !== "approved") {
      Logger.warn(route, user.uid, `Cannot apply - Profile status: ${profile?.status}`);
      return res.status(403).json({ 
        error: "Profile not approved",
        status: profile?.status,
        message: "Your profile must be approved before applying for services"
      });
    }

    // Profile is approved - allow service application
    (req as any).consultantProfile = profile;
    Logger.info(route, user.uid, "Service application allowed - Approved consultant");
    next();
  } catch (error) {
    Logger.error(route, "", "Error checking service application eligibility", error);
    res.status(500).json({ error: "Failed to verify eligibility" });
  }
};

