// src/services/fileSecurity.service.ts
import { db } from '../config/firebase';
import { Logger } from '../utils/logger';
import { FilePermission, FileAccessRequest } from '../middleware/filePermissions.middleware';

export interface FileMetadata {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedByRole: 'student' | 'consultant' | 'employer' | 'admin';
  uploadedAt: string;
  visibility: 'public' | 'private' | 'shared';
  associatedEntityType?: 'resume' | 'document' | 'consultant-content' | 'job-posting' | 'company-profile';
  associatedEntityId?: string;
  studentId?: string; // For student documents
  consultantId?: string; // For consultant content
  employerId?: string; // For employer files
  downloadUrl?: string;
  storagePath?: string;
  tags?: string[];
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface SecurityAuditLog {
  id: string;
  fileId: string;
  userId: string;
  userRole: string;
  action: 'read' | 'write' | 'delete' | 'upload';
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  reason?: string;
  timestamp: string;
}

/**
 * File Security Service
 * Handles file metadata, permissions, and security auditing
 */
export class FileSecurityService {
  /**
   * Store file metadata with security information
   */
  static async storeFileMetadata(metadata: Omit<FileMetadata, 'id' | 'uploadedAt'>): Promise<FileMetadata> {
    try {
      const fileRef = db.collection('files').doc();
      const fileData: FileMetadata = {
        ...metadata,
        id: fileRef.id,
        uploadedAt: new Date().toISOString(),
        isDeleted: false,
      };

      await fileRef.set(fileData);
      Logger.info('FileSecurity', fileData.id, `File metadata stored: ${fileData.fileName}`);
      
      return fileData;
    } catch (error: any) {
      Logger.error('FileSecurity', 'store-metadata', `Failed to store file metadata: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get file metadata with permission check
   */
  static async getFileMetadata(fileId: string, userId: string, userRole: string): Promise<FileMetadata | null> {
    try {
      const fileDoc = await db.collection('files').doc(fileId).get();
      
      if (!fileDoc.exists) {
        return null;
      }

      const fileData = fileDoc.data() as FileMetadata;
      
      // Check if file is deleted
      if (fileData.isDeleted) {
        return null;
      }

      // Log access attempt
      await this.logFileAccess({
        fileId,
        userId,
        userRole,
        action: 'read',
        success: true
      });

      return fileData;
    } catch (error: any) {
      Logger.error('FileSecurity', fileId, `Failed to get file metadata: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Soft delete file (mark as deleted)
   */
  static async softDeleteFile(fileId: string, deletedBy: string, userRole: string): Promise<void> {
    try {
      await db.collection('files').doc(fileId).update({
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy,
      });

      await this.logFileAccess({
        fileId,
        userId: deletedBy,
        userRole,
        action: 'delete',
        success: true
      });

      Logger.info('FileSecurity', fileId, `File soft deleted by ${deletedBy} (${userRole})`);
    } catch (error: any) {
      Logger.error('FileSecurity', fileId, `Failed to soft delete file: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get user's files with permission filtering
   */
  static async getUserFiles(userId: string, userRole: string, filters?: {
    fileType?: string;
    associatedEntityType?: string;
    visibility?: string;
  }): Promise<FileMetadata[]> {
    try {
      let query = db.collection('files')
        .where('isDeleted', '==', false);

      // Filter by user role and ownership
      switch (userRole) {
        case 'student':
          query = query.where('uploadedBy', '==', userId);
          break;
        case 'consultant':
          query = query.where('uploadedBy', '==', userId);
          break;
        case 'employer':
          query = query.where('uploadedBy', '==', userId);
          break;
        case 'admin':
          // Admin can see all files
          break;
      }

      // Apply additional filters
      if (filters?.associatedEntityType) {
        query = query.where('associatedEntityType', '==', filters.associatedEntityType);
      }

      if (filters?.visibility) {
        query = query.where('visibility', '==', filters.visibility);
      }

      const snapshot = await query.orderBy('uploadedAt', 'desc').get();
      const files = snapshot.docs.map(doc => doc.data() as FileMetadata);

      // Filter by file type if specified (client-side filtering for complex types)
      if (filters?.fileType) {
        return files.filter(file => file.mimeType.includes(filters.fileType!));
      }

      return files;
    } catch (error: any) {
      Logger.error('FileSecurity', userId, `Failed to get user files: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get files accessible to consultant (their content + client files with active bookings)
   */
  static async getConsultantAccessibleFiles(consultantId: string): Promise<FileMetadata[]> {
    try {
      // Get consultant's own files
      const ownFilesSnapshot = await db.collection('files')
        .where('uploadedBy', '==', consultantId)
        .where('isDeleted', '==', false)
        .get();

      const ownFiles = ownFilesSnapshot.docs.map(doc => doc.data() as FileMetadata);

      // Get client files from active bookings
      const bookingsSnapshot = await db.collection('bookings')
        .where('consultantId', '==', consultantId)
        .where('status', 'in', ['confirmed', 'completed'])
        .get();

      const clientIds = bookingsSnapshot.docs.map(doc => doc.data().studentId);
      
      if (clientIds.length === 0) {
        return ownFiles;
      }

      // Get files from clients
      const clientFilesSnapshot = await db.collection('files')
        .where('studentId', 'in', clientIds)
        .where('isDeleted', '==', false)
        .get();

      const clientFiles = clientFilesSnapshot.docs.map(doc => doc.data() as FileMetadata);

      return [...ownFiles, ...clientFiles];
    } catch (error: any) {
      Logger.error('FileSecurity', consultantId, `Failed to get consultant accessible files: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get public content (accessible to all authenticated users)
   */
  static async getPublicContent(): Promise<FileMetadata[]> {
    try {
      const snapshot = await db.collection('files')
        .where('visibility', '==', 'public')
        .where('isDeleted', '==', false)
        .orderBy('uploadedAt', 'desc')
        .get();

      return snapshot.docs.map(doc => doc.data() as FileMetadata);
    } catch (error: any) {
      Logger.error('FileSecurity', 'public-content', `Failed to get public content: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Log file access for security auditing
   */
  static async logFileAccess(log: Omit<SecurityAuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const logRef = db.collection('securityAuditLogs').doc();
      const auditLog: SecurityAuditLog = {
        ...log,
        id: logRef.id,
        timestamp: new Date().toISOString(),
      };

      await logRef.set(auditLog);
    } catch (error: any) {
      Logger.error('FileSecurity', 'audit-log', `Failed to log file access: ${error.message}`, error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Get security audit logs for admin
   */
  static async getSecurityAuditLogs(filters?: {
    fileId?: string;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<SecurityAuditLog[]> {
    try {
      let query = db.collection('securityAuditLogs') as any;

      if (filters?.fileId) {
        query = query.where('fileId', '==', filters.fileId);
      }

      if (filters?.userId) {
        query = query.where('userId', '==', filters.userId);
      }

      if (filters?.action) {
        query = query.where('action', '==', filters.action);
      }

      if (filters?.startDate) {
        query = query.where('timestamp', '>=', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.where('timestamp', '<=', filters.endDate);
      }

      const snapshot = await query.orderBy('timestamp', 'desc').limit(1000).get();
      return snapshot.docs.map((doc: any) => doc.data() as SecurityAuditLog);
    } catch (error: any) {
      Logger.error('FileSecurity', 'audit-logs', `Failed to get security audit logs: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Check file access permissions (used by middleware)
   */
  static async checkFileAccess(request: FileAccessRequest): Promise<FilePermission> {
    const { fileId, userId, userRole, action } = request;

    try {
      const fileDoc = await db.collection('files').doc(fileId).get();
      
      if (!fileDoc.exists) {
        return { canRead: false, canWrite: false, canDelete: false, reason: 'File not found' };
      }

      const fileData = fileDoc.data() as FileMetadata;

      // Check if file is deleted
      if (fileData.isDeleted) {
        return { canRead: false, canWrite: false, canDelete: false, reason: 'File has been deleted' };
      }

      // File owner can access their own files
      if (fileData.uploadedBy === userId) {
        return { canRead: true, canWrite: true, canDelete: true };
      }

      // Admin can access everything
      if (userRole === 'admin') {
        return { canRead: true, canWrite: true, canDelete: true };
      }

      // Role-based access rules
      switch (userRole) {
        case 'student':
          return this.getStudentAccess(fileData, userId);
        
        case 'consultant':
          return await this.getConsultantAccess(fileData, userId);
        
        case 'employer':
          return this.getEmployerAccess(fileData);
        
        default:
          return { canRead: false, canWrite: false, canDelete: false, reason: 'Unknown user role' };
      }
    } catch (error: any) {
      Logger.error('FileSecurity', fileId, `Error checking file access: ${error.message}`, error);
      return { canRead: false, canWrite: false, canDelete: false, reason: 'Error checking permissions' };
    }
  }

  private static getStudentAccess(fileData: FileMetadata, userId: string): FilePermission {
    // Students can read their own resume and documents
    if (fileData.associatedEntityType === 'resume' && fileData.associatedEntityId === userId) {
      return { canRead: true, canWrite: true, canDelete: true };
    }

    if (fileData.associatedEntityType === 'document' && fileData.studentId === userId) {
      return { canRead: true, canWrite: true, canDelete: true };
    }

    // Students can read public consultant content
    if (fileData.associatedEntityType === 'consultant-content' && fileData.visibility === 'public') {
      return { canRead: true, canWrite: false, canDelete: false };
    }

    return { canRead: false, canWrite: false, canDelete: false, reason: 'Students can only access their own files' };
  }

  private static async getConsultantAccess(fileData: FileMetadata, userId: string): Promise<FilePermission> {
    // Consultants can read their own content
    if (fileData.associatedEntityType === 'consultant-content' && fileData.associatedEntityId === userId) {
      return { canRead: true, canWrite: true, canDelete: true };
    }

    // Consultants can read client files if they have an active booking
    if (fileData.associatedEntityType === 'resume' || fileData.associatedEntityType === 'document') {
      const hasAccess = await this.checkConsultantClientAccess(userId, fileData.studentId || '');
      if (hasAccess) {
        return { canRead: true, canWrite: false, canDelete: false };
      }
    }

    return { canRead: false, canWrite: false, canDelete: false, reason: 'Consultants can only access their own content or client files with active bookings' };
  }

  private static getEmployerAccess(fileData: FileMetadata): FilePermission {
    // EMPLOYERS CANNOT ACCESS ANY PRIVATE CLIENT DOCUMENTS
    if (fileData.associatedEntityType === 'resume' || fileData.associatedEntityType === 'document') {
      return { 
        canRead: false, 
        canWrite: false, 
        canDelete: false, 
        reason: 'Employers are not permitted to access private client documents for security and privacy reasons' 
      };
    }

    // Employers can only read public consultant content
    if (fileData.associatedEntityType === 'consultant-content' && fileData.visibility === 'public') {
      return { canRead: true, canWrite: false, canDelete: false };
    }

    return { canRead: false, canWrite: false, canDelete: false, reason: 'Employers can only access public content' };
  }

  private static async checkConsultantClientAccess(consultantId: string, studentId: string): Promise<boolean> {
    try {
      const bookingsSnapshot = await db.collection('bookings')
        .where('consultantId', '==', consultantId)
        .where('studentId', '==', studentId)
        .where('status', 'in', ['confirmed', 'completed'])
        .limit(1)
        .get();

      return !bookingsSnapshot.empty;
    } catch (error: any) {
      Logger.error('FileSecurity', 'consultant-access', `Error checking consultant access: ${(error as Error).message}`, error);
      return false;
    }
  }
}
