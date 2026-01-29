// src/controllers/authorizationDocument.controller.ts
import { Request, Response } from "express";
import { authorizationDocumentService, AuthorizationDocumentInput } from "../services/authorizationDocument.service";
import { authenticateUser, authorizeRole } from "../middleware/authMiddleware";

/**
 * Upload authorization document
 */
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const documentData: AuthorizationDocumentInput = req.body;
    const document = await authorizationDocumentService.uploadDocument(user.uid, documentData);

    res.status(201).json({
      message: "Document uploaded successfully",
      document,
    });
  } catch (error: any) {
    console.error("Error uploading document:", error);
    res.status(500).json({ error: error.message || "Failed to upload document" });
  }
};

/**
 * Get user's authorization documents
 */
export const getUserDocuments = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const documents = await authorizationDocumentService.getUserDocuments(user.uid);
    res.status(200).json({ documents });
  } catch (error: any) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: error.message || "Failed to fetch documents" });
  }
};

/**
 * Get document by ID
 */
export const getDocumentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await authorizationDocumentService.getDocumentById(id);

    // Check if user owns this document or is admin
    const user = (req as any).user;
    if (document.userId !== user.uid && user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    res.status(200).json({ document });
  } catch (error: any) {
    console.error("Error fetching document:", error);
    res.status(500).json({ error: error.message || "Failed to fetch document" });
  }
};

/**
 * Update document status (Admin only)
 */
export const updateDocumentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const user = (req as any).user;

    if (!['pending', 'verified', 'rejected', 'expired'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const document = await authorizationDocumentService.updateDocumentStatus(
      id, 
      status, 
      user.uid, 
      rejectionReason
    );

    res.status(200).json({
      message: "Document status updated successfully",
      document,
    });
  } catch (error: any) {
    console.error("Error updating document status:", error);
    res.status(500).json({ error: error.message || "Failed to update document status" });
  }
};

/**
 * Delete document
 */
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Check if user owns this document
    const document = await authorizationDocumentService.getDocumentById(id);
    if (document.userId !== user.uid && user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    await authorizationDocumentService.deleteDocument(id);

    res.status(200).json({
      message: "Document deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: error.message || "Failed to delete document" });
  }
};

/**
 * Get all pending documents (Admin only)
 */
export const getPendingDocuments = async (req: Request, res: Response) => {
  try {
    const documents = await authorizationDocumentService.getPendingDocuments();
    res.status(200).json({ documents });
  } catch (error: any) {
    console.error("Error fetching pending documents:", error);
    res.status(500).json({ error: error.message || "Failed to fetch pending documents" });
  }
};

/**
 * Get user document statistics
 */
export const getUserDocumentStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const stats = await authorizationDocumentService.getUserDocumentStats(user.uid);
    res.status(200).json({ stats });
  } catch (error: any) {
    console.error("Error fetching document stats:", error);
    res.status(500).json({ error: error.message || "Failed to fetch document stats" });
  }
};
