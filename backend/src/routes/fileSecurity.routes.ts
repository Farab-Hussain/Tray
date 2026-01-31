// src/routes/fileSecurity.routes.ts
import { Router } from 'express';
import { 
  uploadFile, 
  getFileById, 
  getUserFiles, 
  getConsultantAccessibleFiles, 
  getPublicContent, 
  deleteFile, 
  getSecurityAuditLogs, 
  testFileAccess, 
  demoEmployerAccessTest 
} from '../controllers/fileSecurity.controller';
import { authenticateUser } from '../middleware/authMiddleware';
import { checkFilePermissions, logFileAccess } from '../middleware/filePermissions.middleware';
import { authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticateUser());

// Apply security logging to all routes
router.use(logFileAccess);

/**
 * File Management Routes
 */

// Upload file (with validation)
router.post('/upload', uploadFile);

// Get file by ID (with permission check)
router.get('/:id', checkFilePermissions, getFileById);

// Delete file (with permission check)
router.delete('/:id', checkFilePermissions, deleteFile);

/**
 * File Discovery Routes
 */

// Get current user's files
router.get('/user/my-files', getUserFiles);

// Get consultant accessible files (consultant only)
router.get('/consultant/accessible-files', authorizeRole(['consultant']), getConsultantAccessibleFiles);

// Get public content (all authenticated users)
router.get('/public/content', getPublicContent);

/**
 * Admin Routes
 */

// Get security audit logs (admin only)
router.get('/admin/audit-logs', authorizeRole(['admin']), getSecurityAuditLogs);

/**
 * Security Testing Routes
 */

// Test file access permissions
router.post('/test/access', testFileAccess);

// Security demo: Test employer access to student files
router.post('/demo/employer-access-test', demoEmployerAccessTest);

export default router;
