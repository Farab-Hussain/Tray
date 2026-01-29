// src/controllers/consultantContent.controller.ts
import { Request, Response } from "express";
import { consultantContentService } from "../services/consultantContent.service";
import { ConsultantContentInput } from "../models/consultantContent.model";
import { authenticateUser, authorizeRole } from "../middleware/authMiddleware";

/**
 * Create new content (Consultant only)
 */
export const createContent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify user is a consultant
    if (user.role !== 'consultant') {
      return res.status(403).json({ error: "Consultant access required" });
    }

    const contentData: ConsultantContentInput = req.body;
    const content = await consultantContentService.create(contentData, user.uid);

    res.status(201).json({
      message: "Content created successfully and submitted for approval",
      content,
    });
  } catch (error: any) {
    console.error("Error creating content:", error);
    res.status(500).json({ error: error.message || "Failed to create content" });
  }
};

/**
 * Get consultant's content
 */
export const getMyContent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const filters = {
      status: req.query.status as string,
      contentType: req.query.contentType as string,
      category: req.query.category as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const { content, total } = await consultantContentService.getByConsultant(user.uid, filters);

    res.status(200).json({ content, total });
  } catch (error: any) {
    console.error("Error fetching content:", error);
    res.status(500).json({ error: error.message || "Failed to fetch content" });
  }
};

/**
 * Get published content (Public/Students)
 */
export const getPublishedContent = async (req: Request, res: Response) => {
  try {
    const filters = {
      contentType: req.query.contentType as string,
      category: req.query.category as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      isFree: req.query.isFree ? req.query.isFree === 'true' : undefined,
      consultantId: req.query.consultantId as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const { content, total } = await consultantContentService.getPublishedContent(filters);

    res.status(200).json({ content, total });
  } catch (error: any) {
    console.error("Error fetching published content:", error);
    res.status(500).json({ error: error.message || "Failed to fetch content" });
  }
};

/**
 * Get content by ID
 */
export const getContentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const content = await consultantContentService.getById(id);

    // Increment view count
    await consultantContentService.incrementViewCount(id);

    res.status(200).json({ content });
  } catch (error: any) {
    console.error("Error fetching content:", error);
    res.status(500).json({ error: error.message || "Failed to fetch content" });
  }
};

/**
 * Update content (Consultant only)
 */
export const updateContent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    const updates: Partial<ConsultantContentInput> = req.body;

    const content = await consultantContentService.update(id, user.uid, updates);

    res.status(200).json({
      message: "Content updated successfully",
      content,
    });
  } catch (error: any) {
    console.error("Error updating content:", error);
    res.status(500).json({ error: error.message || "Failed to update content" });
  }
};

/**
 * Delete content (Consultant only)
 */
export const deleteContent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    await consultantContentService.delete(id, user.uid);

    res.status(200).json({
      message: "Content deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting content:", error);
    res.status(500).json({ error: error.message || "Failed to delete content" });
  }
};

/**
 * Approve content (Admin only)
 */
export const approveContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const content = await consultantContentService.approveContent(id, user.uid);

    res.status(200).json({
      message: "Content approved and published",
      content,
    });
  } catch (error: any) {
    console.error("Error approving content:", error);
    res.status(500).json({ error: error.message || "Failed to approve content" });
  }
};

/**
 * Reject content (Admin only)
 */
export const rejectContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = (req as any).user;

    if (!reason) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    const content = await consultantContentService.rejectContent(id, user.uid, reason);

    res.status(200).json({
      message: "Content rejected",
      content,
    });
  } catch (error: any) {
    console.error("Error rejecting content:", error);
    res.status(500).json({ error: error.message || "Failed to reject content" });
  }
};

/**
 * Get pending content (Admin only)
 */
export const getPendingContent = async (req: Request, res: Response) => {
  try {
    const content = await consultantContentService.getPendingContent();

    res.status(200).json({ content });
  } catch (error: any) {
    console.error("Error fetching pending content:", error);
    res.status(500).json({ error: error.message || "Failed to fetch pending content" });
  }
};

/**
 * Download content (increment download count)
 */
export const downloadContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get content to verify it exists and is published
    const content = await consultantContentService.getById(id);
    if (content.status !== 'published') {
      return res.status(404).json({ error: "Content not available" });
    }

    // Increment download count
    await consultantContentService.incrementDownloadCount(id);

    res.status(200).json({
      message: "Download counted",
      downloadUrl: content.contentUrl,
    });
  } catch (error: any) {
    console.error("Error downloading content:", error);
    res.status(500).json({ error: error.message || "Failed to download content" });
  }
};

/**
 * Add rating to content
 */
export const addRating = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    await consultantContentService.addRating(id, user.uid, rating, comment);

    res.status(200).json({
      message: "Rating added successfully",
    });
  } catch (error: any) {
    console.error("Error adding rating:", error);
    res.status(500).json({ error: error.message || "Failed to add rating" });
  }
};

/**
 * Get consultant content statistics
 */
export const getConsultantStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const stats = await consultantContentService.getConsultantStats(user.uid);

    res.status(200).json({ stats });
  } catch (error: any) {
    console.error("Error fetching consultant stats:", error);
    res.status(500).json({ error: error.message || "Failed to fetch stats" });
  }
};
