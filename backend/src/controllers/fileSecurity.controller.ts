// src/controllers/fileSecurity.controller.ts
import { Request, Response } from 'express';
import { FileSecurityService } from '../services/fileSecurity.service';
import { Logger } from '../utils/logger';
import { checkFilePermissions, validateFileUpload, logFileAccess } from '../middleware/filePermissions.middleware';

/**
 * Upload file with security validation
 */
export const uploadFile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { fileName, mimeType, size, visibility, associatedEntityType, associatedEntityId } = req.body;
    const storagePath = req.file?.path; // Assuming file is uploaded via multer

    // Validate file upload
    await validateFileUpload(req, res, () => {});

    const fileMetadata = await FileSecurityService.storeFileMetadata({
      fileName,
      originalName: req.body.originalName || fileName,
      mimeType,
      size,
      uploadedBy: user.uid,
      uploadedByRole: user.role,
      visibility: visibility || 'private',
      associatedEntityType: associatedEntityType || null,
      associatedEntityId: associatedEntityId || null,
      studentId: user.role === 'student' ? user.uid : null,
      consultantId: user.role === 'consultant' ? user.uid : null,
      employerId: user.role === 'employer' ? user.uid : null,
      storagePath: storagePath || undefined,
      isDeleted: false,
    });

    // Log upload
    await FileSecurityService.logFileAccess({
      fileId: fileMetadata.id,
      userId: user.uid,
      userRole: user.role,
      action: 'upload',
      success: true
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      file: fileMetadata,
    });
  } catch (error: any) {
    Logger.error('FileSecurity', 'upload', `Failed to upload file: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
};

/**
 * Get file by ID with permission check
 */
export const getFileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const file = await FileSecurityService.getFileMetadata(id, user.uid, user.role);

    if (!file) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    res.status(200).json({ file });
  } catch (error: any) {
    Logger.error('FileSecurity', 'get-file', `Failed to get file: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to get file' });
  }
};

/**
 * Get user's files
 */
export const getUserFiles = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { fileType, associatedEntityType, visibility } = req.query;

    const files = await FileSecurityService.getUserFiles(user.uid, user.role, {
      fileType: fileType as string,
      associatedEntityType: associatedEntityType as string,
      visibility: visibility as string,
    });

    res.status(200).json({ files });
  } catch (error: any) {
    Logger.error('FileSecurity', 'get-user-files', `Failed to get user files: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to get user files' });
  }
};

/**
 * Get consultant accessible files (own content + client files)
 */
export const getConsultantAccessibleFiles = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid || user.role !== 'consultant') {
      return res.status(403).json({ error: 'Consultant access required' });
    }

    const files = await FileSecurityService.getConsultantAccessibleFiles(user.uid);

    res.status(200).json({ files });
  } catch (error: any) {
    Logger.error('FileSecurity', 'get-consultant-files', `Failed to get consultant files: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to get consultant files' });
  }
};

/**
 * Get public content
 */
export const getPublicContent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const files = await FileSecurityService.getPublicContent();

    res.status(200).json({ files });
  } catch (error: any) {
    Logger.error('FileSecurity', 'get-public-content', `Failed to get public content: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to get public content' });
  }
};

/**
 * Delete file (soft delete)
 */
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check permissions first
    const permission = await FileSecurityService.checkFileAccess({
      fileId: id,
      userId: user.uid,
      userRole: user.role,
      action: 'delete'
    });

    if (!permission.canDelete) {
      return res.status(403).json({ 
        error: 'Access denied', 
        reason: permission.reason || 'Insufficient permissions to delete this file' 
      });
    }

    await FileSecurityService.softDeleteFile(id, user.uid, user.role);

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error: any) {
    Logger.error('FileSecurity', 'delete-file', `Failed to delete file: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to delete file' });
  }
};

/**
 * Get security audit logs (admin only)
 */
export const getSecurityAuditLogs = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { fileId, userId, action, startDate, endDate } = req.query;

    const logs = await FileSecurityService.getSecurityAuditLogs({
      fileId: fileId as string,
      userId: userId as string,
      action: action as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.status(200).json({ logs });
  } catch (error: any) {
    Logger.error('FileSecurity', 'get-audit-logs', `Failed to get audit logs: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to get audit logs' });
  }
};

/**
 * Test file access (for security testing)
 */
export const testFileAccess = async (req: Request, res: Response) => {
  try {
    const { fileId, action } = req.body;
    const user = (req as any).user;

    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const permission = await FileSecurityService.checkFileAccess({
      fileId,
      userId: user.uid,
      userRole: user.role,
      action: action || 'read'
    });

    // Log the test access
    await FileSecurityService.logFileAccess({
      fileId,
      userId: user.uid,
      userRole: user.role,
      action: 'read',
      success: permission.canRead || permission.canWrite || permission.canDelete,
      reason: permission.reason
    });

    res.status(200).json({ 
      message: 'Access test completed',
      permission,
      userRole: user.role,
      userId: user.uid
    });
  } catch (error: any) {
    Logger.error('FileSecurity', 'test-access', `Failed to test file access: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to test file access' });
  }
};

/**
 * Security demo endpoint - Test employer access to student files
 */
export const demoEmployerAccessTest = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Only allow this test for demo purposes
    if (user.role !== 'employer' && user.role !== 'admin') {
      return res.status(403).json({ error: 'This test is for employers and admins only' });
    }

    // Get a sample student file to test access
    const studentFilesSnapshot = await require('../config/firebase').db
      .collection('files')
      .where('associatedEntityType', '==', 'resume')
      .where('isDeleted', '==', false)
      .limit(1)
      .get();

    if (studentFilesSnapshot.empty) {
      return res.status(404).json({ 
        message: 'No student files found for testing',
        testResult: 'NO_FILES_FOUND'
      });
    }

    const testFile = studentFilesSnapshot.docs[0].data();
    const fileId = studentFilesSnapshot.docs[0].id;

    // Test access
    const permission = await FileSecurityService.checkFileAccess({
      fileId,
      userId: user.uid,
      userRole: user.role,
      action: 'read'
    });

    // Log the security test
    await FileSecurityService.logFileAccess({
      fileId,
      userId: user.uid,
      userRole: user.role,
      action: 'read',
      success: permission.canRead,
      reason: permission.reason
    });

    res.status(200).json({ 
      message: 'Security test completed',
      testResult: permission.canRead ? 'ACCESS_GRANTED' : 'ACCESS_BLOCKED',
      securityStatus: permission.canRead ? '⚠️ SECURITY BREACH' : '✅ SECURITY WORKING',
      permission,
      fileTested: {
        id: fileId,
        fileName: testFile.fileName,
        associatedEntityType: testFile.associatedEntityType,
        uploadedBy: testFile.uploadedBy,
        uploadedByRole: testFile.uploadedByRole
      },
      recommendation: permission.canRead 
        ? '🚨 CRITICAL: Security system failed - employers should NOT access student files!'
        : '✅ Security system working correctly - employer access blocked as expected'
    });
  } catch (error: any) {
    Logger.error('FileSecurity', 'demo-test', `Failed security demo test: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to run security test' });
  }
};
