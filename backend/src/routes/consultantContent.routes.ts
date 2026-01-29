// src/routes/consultantContent.routes.ts
import express from "express";
import {
  createContent,
  getMyContent,
  getPublishedContent,
  getContentById,
  updateContent,
  deleteContent,
  approveContent,
  rejectContent,
  getPendingContent,
  downloadContent,
  addRating,
  getConsultantStats,
} from "../controllers/consultantContent.controller";
import { authenticateUser, authorizeRole } from "../middleware/authMiddleware";

const router = express.Router();

// Public routes (no authentication required for viewing published content)
router.get("/published", getPublishedContent); // GET /consultant-content/published
router.get("/published/:id", getContentById); // GET /consultant-content/published/:id

// Authenticated routes
router.use(authenticateUser());

// Consultant routes
router.post("/", authorizeRole(['consultant']), createContent); // POST /consultant-content
router.get("/my", authorizeRole(['consultant']), getMyContent); // GET /consultant-content/my
router.get("/my/stats", authorizeRole(['consultant']), getConsultantStats); // GET /consultant-content/my/stats
router.put("/:id", authorizeRole(['consultant']), updateContent); // PUT /consultant-content/:id
router.delete("/:id", authorizeRole(['consultant']), deleteContent); // DELETE /consultant-content/:id
router.post("/:id/download", downloadContent); // POST /consultant-content/:id/download
router.post("/:id/rating", addRating); // POST /consultant-content/:id/rating

// Admin routes
router.get("/admin/pending", authorizeRole(['admin']), getPendingContent); // GET /consultant-content/admin/pending
router.put("/:id/approve", authorizeRole(['admin']), approveContent); // PUT /consultant-content/:id/approve
router.put("/:id/reject", authorizeRole(['admin']), rejectContent); // PUT /consultant-content/:id/reject

export default router;
