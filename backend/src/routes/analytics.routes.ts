// src/routes/analytics.routes.ts
import express from "express";
import { getConsultantAnalyticsController } from "../controllers/analytics.controller";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/consultant", authenticateUser, getConsultantAnalyticsController);

export default router;

