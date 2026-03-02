import express from "express";
import {
  getPublicStudentProfile,
  getPublicConsultantProfile,
  getPublicRecruiterProfile,
} from "../controllers/publicProfile.controller";

const router = express.Router();

// Publicly accessible profile endpoints (no auth)
router.get("/students/:uid", getPublicStudentProfile);
router.get("/consultants/:uid", getPublicConsultantProfile);
router.get("/recruiters/:uid", getPublicRecruiterProfile);

export default router;

