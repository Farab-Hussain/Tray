// src/routes/review.routes.ts
import express from "express";
import {
  createReview,
  getConsultantReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  getAllReviews,
} from "../controllers/review.controller";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

// Public routes
router.get("/consultant/:consultantId", getConsultantReviews);

// Protected routes (Student)
router.post("/", authenticateUser(), createReview);
router.get("/my-reviews", authenticateUser(), getMyReviews);
router.put("/:reviewId", authenticateUser(), updateReview);
router.delete("/:reviewId", authenticateUser(), deleteReview);

// Admin routes
router.get("/admin/all", authenticateUser(), getAllReviews);

export default router;

