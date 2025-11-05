// src/routes/notification.routes.ts
import express from "express";
import { sendMessageNotification, sendCallNotification } from "../controllers/notification.controller";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * POST /notifications/send-message
 * Send push notification for a new message
 * Requires authentication
 */
router.post("/send-message", authenticateUser, sendMessageNotification);

/**
 * POST /notifications/send-call
 * Send push notification for an incoming call
 * Requires authentication
 */
router.post("/send-call", authenticateUser, sendCallNotification);

export default router;

