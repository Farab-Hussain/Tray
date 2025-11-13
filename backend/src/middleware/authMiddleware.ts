// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { auth, db } from "../config/firebase";
import { Logger } from "../utils/logger";

/**
 * Internal middleware function to verify Firebase ID token
 * Optionally allows unverified users for specific routes (like resend-verification-email)
 */
const createAuthenticateMiddleware = (allowUnverified: boolean = false) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const route = `${req.method} ${req.path}`;
    
    try {
      const authHeader = req.headers.authorization;
      
      // Check if Authorization header exists
      if (!authHeader) {
        Logger.error(route, "", "No authorization header provided");
        return res.status(401).json({ error: "No token provided" });
      }

      // Check if token follows Bearer format
      if (!authHeader.startsWith("Bearer ")) {
        Logger.error(route, "", "Invalid token format - must be 'Bearer <token>'");
        return res.status(401).json({ error: "Invalid token format" });
      }

      // Extract token from "Bearer <token>"
      const idToken = authHeader.split(" ")[1];
      
      if (!idToken) {
        Logger.error(route, "", "Token is empty");
        return res.status(401).json({ error: "No token provided" });
      }

      // Verify Firebase ID token
      const decodedToken = await auth.verifyIdToken(idToken);

      // Check if email is verified (required for app access, unless allowUnverified is true)
      if (!allowUnverified && !decodedToken.email_verified) {
        Logger.warn(route, decodedToken.uid, "Access denied - Email not verified");
        return res.status(403).json({ 
          error: "Email verification required",
          message: "Please verify your email address before accessing the app",
          emailVerified: false,
          requiresVerification: true
        });
      }

      (req as any).user = decodedToken;
      
      Logger.info(route, "", `User authenticated: ${decodedToken.uid}${!decodedToken.email_verified ? ' (unverified)' : ''}`);
      next();
    } catch (error) {
      Logger.error(route, "", "Invalid or expired token", error);
      res.status(401).json({ error: "Invalid or expired token" });
    }
  };
};

/**
 * Middleware to verify Firebase ID token from Authorization header
 * Requires email verification by default
 * Use authenticateUser(true) to allow unverified users (e.g., for resend-verification-email)
 */
const defaultAuthenticateUser = createAuthenticateMiddleware(false);

// Export as a function that can be used both ways:
// - authenticateUser (as middleware, requires email verification)
// - authenticateUser(true) (allows unverified users)
export function authenticateUser(allowUnverified?: boolean): ReturnType<typeof createAuthenticateMiddleware> {
  if (allowUnverified === true) {
    return createAuthenticateMiddleware(true);
  }
  return defaultAuthenticateUser;
}


export const authorizeRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const route = `${req.method} ${req.path}`;
    
    try {
      const user = (req as any).user;
      
      if (!user || !user.uid) {
        Logger.error(route, "", "User not authenticated - authorizeRole must be used after authenticateUser");
        return res.status(401).json({ error: "Authentication required" });
      }

      // Fetch user's role from Firestore users collection
      const userDoc = await db.collection("users").doc(user.uid).get();
      
      if (!userDoc.exists) {
        Logger.error(route, user.uid, "User document not found in Firestore");
        return res.status(403).json({ error: "User profile not found" });
      }

      const userData = userDoc.data();
      const userRole = userData?.role || "user";

      // Check if user's role is in the allowed roles list
      if (!roles.includes(userRole)) {
        Logger.warn(route, user.uid, `Access denied - Required roles: ${roles.join(", ")}, User role: ${userRole}`);
        return res.status(403).json({ 
          error: "Access denied - Insufficient permissions",
          required: roles,
          current: userRole
        });
      }

      // Attach role to request for use in controllers
      (req as any).userRole = userRole;
      
      Logger.info(route, user.uid, `Access granted - Role: ${userRole}`);
      next();
    } catch (error) {
      Logger.error(route, "", "Error checking user role", error);
      res.status(500).json({ error: "Failed to verify permissions" });
    }
  };
};
