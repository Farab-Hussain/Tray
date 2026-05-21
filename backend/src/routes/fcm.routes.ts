// src/routes/fcm.routes.ts
import { Router } from "express";
import { authenticateUser } from "../middleware/authMiddleware";
import * as fcmController from "../controllers/fcm.controller";

const router = Router();

/**
 * POST /fcm/token
 * Register FCM token for current user
 */
router.post("/token", authenticateUser(), fcmController.registerFCMToken);

/**
 * DELETE /fcm/token
 * Delete FCM token(s) for current user
 */
router.delete("/token", authenticateUser(), fcmController.deleteFCMToken);

/**
 * POST /fcm/voip-token
 * Register iOS PushKit VoIP token (CallKit / killed-app calls)
 */
router.post("/voip-token", authenticateUser(), fcmController.registerVoIPToken);

export default router;

