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

const router = express.Router();

// User routes (require authentication)
router.use(authenticateUser());

// Upload document
router.post("/", uploadDocument); // POST /authorization-documents

// Get user's documents
router.get("/my", getUserDocuments); // GET /authorization-documents/my

// Get user document statistics
router.get("/my/stats", getUserDocumentStats); // GET /authorization-documents/my/stats

// Get specific document
router.get("/:id", getDocumentById); // GET /authorization-documents/:id

// Delete document
router.delete("/:id", deleteDocument); // DELETE /authorization-documents/:id

// Admin routes (require admin role)
router.use(authorizeRole(['admin']));

// Get all pending documents
router.get("/admin/pending", getPendingDocuments); // GET /authorization-documents/admin/pending

// Update document status
router.put("/:id/status", updateDocumentStatus); // PUT /authorization-documents/:id/status

export default router;
