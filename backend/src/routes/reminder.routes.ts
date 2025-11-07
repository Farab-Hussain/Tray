// src/routes/reminder.routes.ts
import express from "express";
import { triggerReminders } from "../controllers/reminder.controller";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

// Admin-only route for manual trigger
router.post("/send", authenticateUser, triggerReminders);

export default router;

