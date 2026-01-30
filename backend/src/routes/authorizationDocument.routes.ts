// src/routes/authorizationDocument.routes.ts
import express from "express";
import {
  uploadDocument,
  getUserDocuments,
  getDocumentById,
  updateDocumentStatus,
  deleteDocument,
  getPendingDocuments,
  getUserDocumentStats,
} from "../controllers/authorizationDocument.controller";
import { authenticateUser, authorizeRole } from "../middleware/authMiddleware";
import { 
  enforceDocumentSecurity, 
  checkConsultantDocumentAccess, 
  sanitizeDocumentForEmployer,
  logDocumentAccess 
} from "../middleware/documentSecurity.middleware";

const router = express.Router();

// User routes (require authentication)
router.use(authenticateUser());

// Apply logging to all routes
router.use(logDocumentAccess);

// Upload document
router.post("/", uploadDocument); // POST /authorization-documents

// Get user's documents
router.get("/my", getUserDocuments); // GET /authorization-documents/my

// Get user document statistics
router.get("/my/stats", getUserDocumentStats); // GET /authorization-documents/my/stats

// Get specific document - apply security middleware
router.get("/:id", enforceDocumentSecurity, getDocumentById); // GET /authorization-documents/:id

// Delete document - apply security middleware
router.delete("/:id", enforceDocumentSecurity, deleteDocument); // DELETE /authorization-documents/:id

// Admin routes (require admin role)
router.use(authorizeRole(['admin']));

// Get all pending documents
router.get("/admin/pending", getPendingDocuments); // GET /authorization-documents/admin/pending

// Update document status
router.put("/:id/status", updateDocumentStatus); // PUT /authorization-documents/:id/status

export default router;
