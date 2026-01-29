// src/routes/resume.routes.ts
import express from "express";
import {
  createOrUpdateResume,
  getMyResume,
  getResumeById,
  updateResume,
  deleteResume,
  updateResumeSkills,
  // NEW: Enhanced feature controllers
  updateWorkPreferences,
  getWorkPreferences,
  updateAuthorization,
  getAuthorization,
  updateCareerGoals,
  getCareerGoals,
  updateExternalProfiles,
  getExternalProfiles,
  updateMultipleSections,
  getProfileCompletionStatus,
} from "../controllers/resume.controller";
import {
  validateCreateResume,
  validateUpdateResume,
} from "../middleware/validation";
import { authenticateUser } from "../middleware/authMiddleware";
import { enforceDocumentSecurity, sanitizeDocumentForEmployer, logDocumentAccess } from "../middleware/documentSecurity.middleware";

const router = express.Router();

// Resume Management Routes (Students)

router.post("/", authenticateUser(), validateCreateResume, createOrUpdateResume); // POST /resumes - Create/update resume
router.get("/my", authenticateUser(), getMyResume); // GET /resumes/my - Get my resume
router.get("/:id", authenticateUser(), logDocumentAccess, enforceDocumentSecurity, sanitizeDocumentForEmployer, getResumeById); // GET /resumes/:id - Get resume by ID (for job applications)
router.put("/", authenticateUser(), updateResume); // PUT /resumes - Update resume
router.put("/skills", authenticateUser(), updateResumeSkills); // PUT /resumes/skills - Update skills in resume
router.delete("/", authenticateUser(), deleteResume); // DELETE /resumes - Delete resume

// ==================== NEW FEATURE ROUTES ====================

// Work Preferences
router.put("/work-preferences", authenticateUser(), updateWorkPreferences); // PUT /resumes/work-preferences
router.get("/work-preferences", authenticateUser(), getWorkPreferences); // GET /resumes/work-preferences

// Authorization Information
router.put("/authorization", authenticateUser(), updateAuthorization); // PUT /resumes/authorization
router.get("/authorization", authenticateUser(), getAuthorization); // GET /resumes/authorization

// Career Goals
router.put("/career-goals", authenticateUser(), updateCareerGoals); // PUT /resumes/career-goals
router.get("/career-goals", authenticateUser(), getCareerGoals); // GET /resumes/career-goals

// External Profiles
router.put("/external-profiles", authenticateUser(), updateExternalProfiles); // PUT /resumes/external-profiles
router.get("/external-profiles", authenticateUser(), getExternalProfiles); // GET /resumes/external-profiles

// Multiple Sections Update
router.put("/multiple-sections", authenticateUser(), updateMultipleSections); // PUT /resumes/multiple-sections

// Profile Completion Status
router.get("/completion-status", authenticateUser(), getProfileCompletionStatus); // GET /resumes/completion-status

export default router;

