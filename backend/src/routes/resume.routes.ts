// src/routes/resume.routes.ts
import express from "express";
import {
  createOrUpdateResume,
  getMyResume,
  getResumeById,
  updateResume,
  deleteResume,
  updateResumeSkills,
} from "../controllers/resume.controller";
import {
  validateCreateResume,
  validateUpdateResume,
} from "../middleware/validation";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

// Resume Management Routes (Students)

router.post("/", authenticateUser(), validateCreateResume, createOrUpdateResume); // POST /resumes - Create/update resume
router.get("/my", authenticateUser(), getMyResume); // GET /resumes/my - Get my resume
router.get("/:id", authenticateUser(), getResumeById); // GET /resumes/:id - Get resume by ID (for job applications)
router.put("/", authenticateUser(), validateUpdateResume, updateResume); // PUT /resumes - Update resume
router.put("/skills", authenticateUser(), updateResumeSkills); // PUT /resumes/skills - Update skills in resume
router.delete("/", authenticateUser(), deleteResume); // DELETE /resumes - Delete resume

export default router;

