// src/middleware/filePermissions.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { Logger } from '../utils/logger';

export interface FilePermission {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  reason?: string;
}

export interface FileAccessRequest {
  fileId: string;
  userId: string;
  userRole: 'student' | 'consultant' | 'employer' | 'admin';
  action: 'read' | 'write' | 'delete';
}

/**
 * File Access Control Middleware
 * Ensures users can only access files they're authorized to see
 */
export const checkFilePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { fileId } = req.params;
    const action = req.method.toLowerCase() === 'get' ? 'read' : 
                   req.method.toLowerCase() === 'post' ? 'write' : 'delete';

    const accessRequest: FileAccessRequest = {
      fileId,
      userId: user.uid,
      userRole: user.role,
      action
    };

    const permission = await getFilePermission(accessRequest);

    if (!permission.canRead && action === 'read') {
      Logger.warn('Security', fileId, `Access denied for read: ${permission.reason}`);
      return res.status(403).json({ 
        error: 'Access denied', 
        reason: permission.reason || 'Insufficient permissions' 
      });
    }

    if (!permission.canWrite && action === 'write') {
      Logger.warn('Security', fileId, `Access denied for write: ${permission.reason}`);
      return res.status(403).json({ 
        error: 'Access denied', 
        reason: permission.reason || 'Insufficient permissions' 
      });
    }

    if (!permission.canDelete && action === 'delete') {
      Logger.warn('Security', fileId, `Access denied for delete: ${permission.reason}`);
      return res.status(403).json({ 
        error: 'Access denied', 
        reason: permission.reason || 'Insufficient permissions' 
      });
    }

    // Add permission info to request for downstream use
    (req as any).filePermission = permission;
    next();
  } catch (error: any) {
    Logger.error('Security', 'file-permission-middleware', `Error checking permissions: ${error.message}`, error);
    res.status(500).json({ error: 'Failed to check file permissions' });
  }
};

/**
 * Get file permission for a specific user and action
 */
export const getFilePermission = async (request: FileAccessRequest): Promise<FilePermission> => {
  const { fileId, userId, userRole, action } = request;

  try {
    // Get file metadata
    const fileDoc = await db.collection('files').doc(fileId).get();
    if (!fileDoc.exists) {
      return { canRead: false, canWrite: false, canDelete: false, reason: 'File not found' };
    }

    const fileData = fileDoc.data();
    const fileOwner = fileData?.uploadedBy;
    const fileOwnerRole = fileData?.uploadedByRole;
    const fileVisibility = fileData?.visibility || 'private';
    const associatedEntityType = fileData?.associatedEntityType; // 'resume', 'document', 'consultant-content', etc.
    const associatedEntityId = fileData?.associatedEntityId;

    // Admin can access everything
    if (userRole === 'admin') {
      return { canRead: true, canWrite: true, canDelete: true };
    }

    // File owner can access their own files
    if (fileOwner === userId) {
      return { canRead: true, canWrite: true, canDelete: true };
    }

    // Role-based access rules
    switch (userRole) {
      case 'student':
        return getStudentFilePermission(fileData, userId, action);
      
      case 'consultant':
        return getConsultantFilePermission(fileData, userId, action);
      
      case 'employer':
        return getEmployerFilePermission(fileData, userId, action);
      
      default:
        return { canRead: false, canWrite: false, canDelete: false, reason: 'Unknown user role' };
    }
  } catch (error: any) {
    Logger.error('Security', fileId, `Error getting file permission: ${error.message}`, error);
    return { canRead: false, canWrite: false, canDelete: false, reason: 'Error checking permissions' };
  }
};

/**
 * Student file permissions
 */
const getStudentFilePermission = async (fileData: any, userId: string, action: string): Promise<FilePermission> => {
  const associatedEntityType = fileData?.associatedEntityType;
  const associatedEntityId = fileData?.associatedEntityId;

  // Students can read their own resume and documents
  if (associatedEntityType === 'resume' && associatedEntityId === userId) {
    return { canRead: true, canWrite: true, canDelete: true };
  }

  // Students can read their own documents
  if (associatedEntityType === 'document' && fileData?.studentId === userId) {
    return { canRead: true, canWrite: true, canDelete: true };
  }

  // Students can read public consultant content
  if (associatedEntityType === 'consultant-content' && fileData?.visibility === 'public') {
    return { canRead: true, canWrite: false, canDelete: false };
  }

  return { canRead: false, canWrite: false, canDelete: false, reason: 'Students can only access their own files' };
};

/**
 * Consultant file permissions
 */
const getConsultantFilePermission = async (fileData: any, userId: string, action: string): Promise<FilePermission> => {
  const associatedEntityType = fileData?.associatedEntityType;
  const associatedEntityId = fileData?.associatedEntityId;

  // Consultants can read their own content
  if (associatedEntityType === 'consultant-content' && associatedEntityId === userId) {
    return { canRead: true, canWrite: true, canDelete: true };
  }

  // Consultants can read client files if they have an active booking
  if (associatedEntityType === 'resume' || associatedEntityType === 'document') {
    const hasAccess = await checkConsultantClientAccess(userId, fileData?.studentId);
    if (hasAccess) {
      return { canRead: true, canWrite: false, canDelete: false };
    }
  }

  return { canRead: false, canWrite: false, canDelete: false, reason: 'Consultants can only access their own content or client files with active bookings' };
};

/**
 * Employer file permissions - MOST RESTRICTIVE
 */
const getEmployerFilePermission = async (fileData: any, userId: string, action: string): Promise<FilePermission> => {
  const associatedEntityType = fileData?.associatedEntityType;

  // EMPLOYERS CANNOT ACCESS ANY PRIVATE CLIENT DOCUMENTS
  if (associatedEntityType === 'resume' || associatedEntityType === 'document') {
    return { 
      canRead: false, 
      canWrite: false, 
      canDelete: false, 
      reason: 'Employers are not permitted to access private client documents for security and privacy reasons' 
    };
  }

  // Employers can only read public consultant content
  if (associatedEntityType === 'consultant-content' && fileData?.visibility === 'public') {
    return { canRead: true, canWrite: false, canDelete: false };
  }

  return { canRead: false, canWrite: false, canDelete: false, reason: 'Employers can only access public content' };
};

/**
 * Check if consultant has access to client files (active booking required)
 */
const checkConsultantClientAccess = async (consultantId: string, studentId: string): Promise<boolean> => {
  try {
    // Check for active or completed bookings between consultant and student
    const bookingsSnapshot = await db.collection('bookings')
      .where('consultantId', '==', consultantId)
      .where('studentId', '==', studentId)
      .where('status', 'in', ['confirmed', 'completed'])
      .limit(1)
      .get();

    return !bookingsSnapshot.empty;
  } catch (error:unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error('Security', 'consultant-client-access', `Error checking access: ${errorMessage}`, error);
    return false;
  }
};

/**
 * File upload validation middleware
 */
export const validateFileUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { fileType, fileSize } = req.body;
    const userRole = user.role as 'student' | 'consultant' | 'employer' | 'admin';

    // File size limits by role
    const sizeLimits = {
      student: 10 * 1024 * 1024, // 10MB
      consultant: 50 * 1024 * 1024, // 50MB
      employer: 20 * 1024 * 1024, // 20MB
      admin: 100 * 1024 * 1024, // 100MB
    };

    // Allowed file types by role
    const allowedTypes = {
      student: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
      consultant: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'mp4', 'mov', 'avi'],
      employer: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
      admin: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'mp4', 'mov', 'avi', 'zip'],
    };

    const maxSize = sizeLimits[userRole] || sizeLimits.student;
    const allowedFileTypes = allowedTypes[userRole] || allowedTypes.student;

    if (fileSize > maxSize) {
      return res.status(400).json({ 
        error: `File size exceeds limit for ${userRole}s (${maxSize / (1024 * 1024)}MB)` 
      });
    }

    if (!allowedFileTypes.includes(fileType)) {
      return res.status(400).json({ 
        error: `File type .${fileType} not allowed for ${userRole}s` 
      });
    }

    next();
  } catch (error: any) {
    Logger.error('Security', 'file-upload-validation', `Error validating upload: ${error.message}`, error);
    res.status(500).json({ error: 'Failed to validate file upload' });
  }
};

/**
 * Security audit logging for file access
 */
export const logFileAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    const user = (req as any).user;
    const fileId = req.params.fileId;
    const action = req.method.toLowerCase();
    const statusCode = res.statusCode;
    
    if (user && fileId) {
      Logger.info('Security', fileId, `File access: ${user.uid} (${user.role}) - ${action} - ${statusCode}`);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};
