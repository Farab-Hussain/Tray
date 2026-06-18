import express from "express";
import { sendBroadcast } from "../controllers/broadcast.controller";
import { authenticateUser, authorizeRole } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/send", authenticateUser(), authorizeRole(["admin"]), sendBroadcast);

export default router;

