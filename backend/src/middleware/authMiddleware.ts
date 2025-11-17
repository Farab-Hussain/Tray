// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { auth, db } from "../config/firebase";
import { Logger } from "../utils/logger";

/**
 * Wrapper to ensure async middleware errors are properly caught
 * Industry best practice: Always wrap async middleware in error handler
 */
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Internal middleware function to verify Firebase ID token
 * Email verification is optional - unverified users are allowed by default
 * 
 * Industry best practices applied:
 * 1. Early validation and exit
 * 2. Timeout protection for external services
 * 3. Comprehensive error handling
 * 4. Proper async/await patterns
 * 5. Request timeout handling
 */
const createAuthenticateMiddleware = (allowUnverified: boolean = true) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const route = `${req.method} ${req.path}`;
    const startTime = Date.now();
    
    // CRITICAL: Log immediately to confirm middleware is called
    console.log(`\n🔐 [Auth Middleware] ${route} - Authentication middleware called at ${new Date().toISOString()}`);
    
    // Set request timeout to prevent hanging (Express-level timeout)
    req.setTimeout(12000, () => {
      if (!res.headersSent) {
        console.error(`⏱️ [Auth Middleware] ${route} - Request timeout (12s)`);
        res.status(408).json({ error: "Request timeout" });
      }
    });
    
    try {
      // Step 1: Check Authorization header exists
      const authHeader = req.headers.authorization;
      
      console.log(`🔐 [Auth Middleware] ${route} - Authorization header present: ${!!authHeader}`);
      
      if (!authHeader) {
        const elapsed = Date.now() - startTime;
        console.log(`❌ [Auth Middleware] ${route} - No Authorization header provided (${elapsed}ms)`);
        Logger.error(route, "", "No authorization header provided");
        return res.status(401).json({ 
          error: "No token provided",
          message: "Authorization header is required"
        });
      }

      // Step 2: Validate Bearer format
      if (!authHeader.startsWith("Bearer ")) {
        const elapsed = Date.now() - startTime;
        console.log(`❌ [Auth Middleware] ${route} - Invalid token format (${elapsed}ms)`);
        Logger.error(route, "", "Invalid token format - must be 'Bearer <token>'");
        return res.status(401).json({ 
          error: "Invalid token format",
          message: "Token must be in format: Bearer <token>"
        });
      }

      // Step 3: Extract and validate token
      const idToken = authHeader.substring(7).trim(); // More efficient than split
      
      if (!idToken || idToken.length === 0) {
        const elapsed = Date.now() - startTime;
        console.log(`❌ [Auth Middleware] ${route} - Token is empty (${elapsed}ms)`);
        Logger.error(route, "", "Token is empty");
        return res.status(401).json({ 
          error: "No token provided",
          message: "Token cannot be empty"
        });
      }

      console.log(`🔐 [Auth Middleware] ${route} - Token extracted, length: ${idToken.length} chars`);
      console.log(`🔐 [Auth Middleware] ${route} - Starting Firebase verification...`);

      // Step 4: Verify token with timeout protection
      // OPTIMIZATION: Don't check revoked tokens (false) - faster, reduces network calls
      // Industry best practice: Only check revocation when absolutely necessary (e.g., sensitive operations)
      const VERIFY_TIMEOUT_MS = 8000; // 8 seconds - reduced for faster failure
      
      // Use false to skip revocation check - much faster, only checks token signature and expiration
      // This avoids an extra network call to check token revocation status
      const verifyPromise = auth.verifyIdToken(idToken, false);
      
      let timeoutId: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Firebase token verification timeout after ${VERIFY_TIMEOUT_MS}ms`));
        }, VERIFY_TIMEOUT_MS);
      });

      let decodedToken: any;
      try {
        decodedToken = await Promise.race([verifyPromise, timeoutPromise]);
        // Clear timeout if verification succeeded
        if (timeoutId) clearTimeout(timeoutId);
        
        const verifyTime = Date.now() - startTime;
        console.log(`✅ [Auth Middleware] ${route} - Token verified in ${verifyTime}ms for user: ${decodedToken.uid}`);
      } catch (verifyError: any) {
        const elapsed = Date.now() - startTime;
        const errorMessage = verifyError?.message || 'Unknown verification error';
        
        if (errorMessage.includes('timeout')) {
          console.error(`⏱️ [Auth Middleware] ${route} - Verification timeout after ${elapsed}ms`);
          Logger.error(route, "", "Token verification timeout", verifyError);
          return res.status(408).json({ 
            error: "Authentication timeout",
            message: "Token verification took too long. Please try again."
          });
        }
        
        // Handle specific Firebase errors
        if (errorMessage.includes('expired')) {
          console.error(`❌ [Auth Middleware] ${route} - Token expired (${elapsed}ms)`);
          return res.status(401).json({ 
            error: "Token expired",
            message: "Your session has expired. Please sign in again."
          });
        }
        
        if (errorMessage.includes('revoked')) {
          console.error(`❌ [Auth Middleware] ${route} - Token revoked (${elapsed}ms)`);
          return res.status(401).json({ 
            error: "Token revoked",
            message: "Your session has been revoked. Please sign in again."
          });
        }
        
        console.error(`❌ [Auth Middleware] ${route} - Verification failed (${elapsed}ms):`, errorMessage);
        Logger.error(route, "", "Token verification failed", verifyError);
        return res.status(401).json({ 
          error: "Invalid token",
          message: "Token verification failed. Please sign in again."
        });
      }

      // Step 5: Check email verification (only if explicitly required)
      if (!allowUnverified && !decodedToken.email_verified) {
        const elapsed = Date.now() - startTime;
        console.log(`⚠️ [Auth Middleware] ${route} - Email not verified for user: ${decodedToken.uid} (${elapsed}ms)`);
        Logger.warn(route, decodedToken.uid, "Access denied - Email not verified");
        return res.status(403).json({ 
          error: "Email verification required",
          message: "Please verify your email address before accessing this resource",
          emailVerified: false,
          requiresVerification: true
        });
      }

      // Step 6: Attach user to request and proceed
      (req as any).user = decodedToken;
      const totalTime = Date.now() - startTime;
      
      Logger.info(route, decodedToken.uid, `User authenticated${!decodedToken.email_verified ? ' (unverified)' : ''} in ${totalTime}ms`);
      console.log(`✅ [Auth Middleware] ${route} - Authentication successful, calling next() (total: ${totalTime}ms)`);
      
      next();
    } catch (error: any) {
      // Catch-all for any unexpected errors
      const elapsed = Date.now() - startTime;
      const errorMessage = error?.message || 'Unknown error';
      
      console.error(`💥 [Auth Middleware] ${route} - Unexpected error after ${elapsed}ms:`, errorMessage);
      console.error(`💥 [Auth Middleware] ${route} - Error stack:`, error?.stack);
      Logger.error(route, "", "Unexpected authentication error", error);
      
      // Ensure we haven't already sent a response
      if (!res.headersSent) {
        res.status(500).json({ 
          error: "Authentication error",
          message: "An unexpected error occurred during authentication"
        });
      }
    }
  });
};

/**
 * Default authentication middleware (allows unverified users)
 */
const defaultAuthenticateUser = createAuthenticateMiddleware(true);

/**
 * Factory function to create authentication middleware
 * 
 * Usage in routes:
 * - router.get("/me", authenticateUser(), controller) - allows unverified users (default)
 * - router.post("/route", authenticateUser(false), controller) - requires email verification
 * 
 * IMPORTANT: Always call authenticateUser() with parentheses, even with no arguments
 * This ensures the middleware function is returned, not the factory function itself
 */
export function authenticateUser(allowUnverified?: boolean): ReturnType<typeof createAuthenticateMiddleware> {
  if (allowUnverified === false) {
    return createAuthenticateMiddleware(false);
  }
  // Return default middleware (allows unverified users)
  return defaultAuthenticateUser;
}

// Export default middleware directly for explicit use
export const authenticateUserMiddleware = defaultAuthenticateUser;

/**
 * Middleware to authorize user roles
 * Must be used after authenticateUser middleware
 */
export const authorizeRole = (roles: string[]) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const route = `${req.method} ${req.path}`;
    
    try {
      const user = (req as any).user;
      
      if (!user || !user.uid) {
        Logger.error(route, "", "User not authenticated - authorizeRole must be used after authenticateUser");
        return res.status(401).json({ error: "Authentication required" });
      }

      // Fetch user's role from Firestore with timeout
      const rolePromise = db.collection("users").doc(user.uid).get();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Role fetch timeout')), 5000);
      });

      const userDoc = await Promise.race([rolePromise, timeoutPromise]) as any;
      
      if (!userDoc.exists) {
        Logger.error(route, user.uid, "User document not found in Firestore");
        return res.status(403).json({ error: "User profile not found" });
      }

      const userData = userDoc.data();
      const userRole = userData?.role || "user";

      if (!roles.includes(userRole)) {
        Logger.warn(route, user.uid, `Access denied - Required roles: ${roles.join(", ")}, User role: ${userRole}`);
        return res.status(403).json({ 
          error: "Access denied - Insufficient permissions",
          required: roles,
          current: userRole
        });
      }

      (req as any).userRole = userRole;
      Logger.info(route, user.uid, `Access granted - Role: ${userRole}`);
      next();
    } catch (error: any) {
      Logger.error(route, "", "Error checking user role", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to verify permissions" });
      }
    }
  });
};
