// src/middleware/documentSecurity.middleware.ts
import { Request, Response, NextFunction } from "express";
import { db } from "../config/firebase";
import { auth } from "../config/firebase";

/**
 * Middleware to enforce document access permissions
 * Prevents employers from accessing private student documents
 */
export const enforceDocumentSecurity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get user role from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Invalid authorization header" });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    const userData = userDoc.data();
    const userRole = userData?.role || userData?.activeRole || 'student';

    // Check if user is trying to access student documents
    const { documentId, userId } = req.params;
    const requestedUserId = userId || documentId;

    // If employer/recruiter tries to access student documents - BLOCK
    if ((userRole === 'recruiter' || userRole === 'employer') && requestedUserId) {
      // Check if the requested document belongs to a student
      const targetUserDoc = await db.collection("users").doc(requestedUserId).get();
      const targetUserData = targetUserDoc.data();
      const targetUserRole = targetUserData?.role || targetUserData?.activeRole;

      if (targetUserRole === 'student') {
        console.log(`🚫 [DocumentSecurity] Employer ${user.uid} blocked from accessing student ${requestedUserId} documents`);
        return res.status(403).json({
          error: "Access denied",
          message: "Employers cannot access student private documents",
          code: "DOCUMENT_ACCESS_DENIED"
        });
      }
    }

    // Allow access for:
    // - Students accessing their own documents
    // - Consultants accessing assigned client documents
    // - Admins accessing any documents
    if (userRole === 'admin' || userRole === 'student' || userRole === 'consultant') {
      return next();
    }

    // Default deny for unknown roles
    return res.status(403).json({
      error: "Access denied",
      message: "Insufficient permissions to access documents"
    });

  } catch (error: any) {
    console.error("Document security middleware error:", error);
    return res.status(500).json({ error: "Security check failed" });
  }
};

/**
 * Middleware to check if consultant can access specific student documents
 */
export const checkConsultantDocumentAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = user.role;
    if (userRole !== 'consultant') {
      return res.status(403).json({ error: "Consultant access required" });
    }

    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ error: "Student ID required" });
    }

    // Check if consultant has a booking with this student
    const bookingSnapshot = await db.collection("bookings")
      .where("consultantId", "==", user.uid)
      .where("studentId", "==", studentId)
      .where("status", "in", ["confirmed", "completed"])
      .limit(1)
      .get();

    if (bookingSnapshot.empty) {
      console.log(`🚫 [ConsultantSecurity] Consultant ${user.uid} blocked from accessing student ${studentId} documents - no booking found`);
      return res.status(403).json({
        error: "Access denied",
        message: "Consultants can only access documents of students they have bookings with",
        code: "CONSULTANT_ACCESS_DENIED"
      });
    }

    // Allow access
    return next();

  } catch (error: any) {
    console.error("Consultant document access check error:", error);
    return res.status(500).json({ error: "Access check failed" });
  }
};

/**
 * Middleware to sanitize document data before sending to employers
 * Removes sensitive information from student documents
 */
export const sanitizeDocumentForEmployer = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const userRole = user.role;

    // Only apply to employer/recruiter roles
    if (userRole === 'recruiter' || userRole === 'employer') {
      const originalJson = res.json;
      
      res.json = function(data: any) {
        if (data.document || data.resume) {
          const document = data.document || data.resume;
          
          // Remove sensitive fields
          const sanitized = {
            ...document,
            // Keep basic info for job matching
            personalInfo: {
              name: document.personalInfo?.name,
              // Remove: email, phone, location, profileImage
            },
            skills: document.skills,
            experience: document.experience?.map((exp: any) => ({
              title: exp.title,
              company: exp.company,
              // Remove dates and description for privacy
            })),
            education: document.education?.map((edu: any) => ({
              degree: edu.degree,
              institution: edu.institution,
              // Remove graduation year and GPA for privacy
            })),
            // Remove completely: backgroundInformation, certifications, authorizationDocuments
            backgroundInformation: undefined,
            certifications: undefined,
            authorizationDocuments: undefined,
            workRestrictions: undefined,
            transportationStatus: undefined,
            workAuthorized: undefined,
            workEligibilityChecklist: undefined,
          };

          if (data.document) {
            data.document = sanitized;
          } else {
            data.resume = sanitized;
          }
        }
        
        return originalJson.call(this, data);
      };
    }

    next();
  } catch (error: any) {
    console.error("Document sanitization error:", error);
    return res.status(500).json({ error: "Data processing failed" });
  }
};

/**
 * Middleware to log document access attempts
 */
export const logDocumentAccess = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const userRole = user?.role || 'unknown';
  const userId = user?.uid || 'anonymous';
  const documentId = req.params.documentId || req.params.userId || 'unknown';
  const method = req.method;
  const path = req.path;

  console.log(`🔍 [DocumentAccess] ${userRole}:${userId} ${method} ${path} - Document: ${documentId}`);

  // Store access log in database for security auditing
  const logAccess = async () => {
    try {
      await db.collection("documentAccessLogs").add({
        userId,
        userRole,
        documentId,
        method,
        path,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    } catch (error) {
      // Don't fail the request if logging fails
      console.error("Failed to log document access:", error);
    }
  };

  // Log asynchronously
  logAccess();

  next();
};
