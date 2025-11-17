// src/routes/upload.routes.ts
import express from "express";
import {
  uploadSingle,
  uploadProfileImage,
  uploadConsultantImage,
  uploadServiceImage,
  deleteProfileImage,
  deleteConsultantImage,
  getUploadSignature,
} from "../controllers/upload.controller";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

// Upload routes
router.post("/profile-image", authenticateUser(), uploadSingle, uploadProfileImage);
router.post("/consultant-image", authenticateUser(), uploadSingle, uploadConsultantImage);
router.post("/service-image", authenticateUser(), uploadSingle, uploadServiceImage);
router.delete("/profile-image", authenticateUser(), deleteProfileImage);
router.delete("/consultant-image", authenticateUser(), deleteConsultantImage);
router.post("/upload-signature", authenticateUser(), getUploadSignature);

export default router;
