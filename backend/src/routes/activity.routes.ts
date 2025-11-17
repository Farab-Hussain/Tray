// src/routes/activity.routes.ts
import express from "express";
import { getRecentActivities } from "../controllers/activity.controller";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

// Admin only endpoint
router.get("/recent", authenticateUser(), getRecentActivities);

export default router;

