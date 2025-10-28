// src/routes/upload.routes.ts
import express from "express";
import {
  uploadSingle,
  uploadProfileImage,
  uploadConsultantImage,
  deleteProfileImage,
  getUploadSignature,
} from "../controllers/upload.controller";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

// Upload routes
router.post("/profile-image", authenticateUser, uploadSingle, uploadProfileImage);
router.post("/consultant-image", authenticateUser, uploadSingle, uploadConsultantImage);
router.delete("/profile-image", authenticateUser, deleteProfileImage);
router.post("/upload-signature", authenticateUser, getUploadSignature);

export default router;
