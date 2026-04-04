import express from "express";
import { sendNewsletter } from "../controllers/newsletter.controller";
import { authenticateUser, authorizeRole } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/send", authenticateUser(), authorizeRole(["admin"]), sendNewsletter);

export default router;

