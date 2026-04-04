import express from "express";
import { sendBroadcast } from "../controllers/broadcast.controller";
import { authenticateUser, authorizeRole } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/send", sendBroadcast);

export default router;

