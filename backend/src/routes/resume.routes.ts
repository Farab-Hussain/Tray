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
  updateEducation,
  getEducation,
  updateCertifications,
  getCertifications,
  updateExternalProfiles,
  getExternalProfiles,
  updateMultipleSections,
  getProfileCompletionStatus,
  getResumeByUserIdAdmin,
  reviewWorkEligibilitySection,
} from "../controllers/resume.controller";
import {
  validateCreateResume,
  validateUpdateResume,
} from "../middleware/validation";
import { authenticateUser, authorizeRole } from "../middleware/authMiddleware";
import { enforceDocumentSecurity, sanitizeDocumentForEmployer, logDocumentAccess } from "../middleware/documentSecurity.middleware";

const router = express.Router();

// Resume Management Routes (Students)

router.post("/", authenticateUser(), validateCreateResume, createOrUpdateResume); // POST /resumes - Create/update resume
router.get("/my", authenticateUser(), getMyResume); // GET /resumes/my - Get my resume
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

// Education
router.put("/education", authenticateUser(), updateEducation); // PUT /resumes/education
router.get("/education", authenticateUser(), getEducation); // GET /resumes/education

// Certifications
router.put("/certifications", authenticateUser(), updateCertifications); // PUT /resumes/certifications
router.get("/certifications", authenticateUser(), getCertifications); // GET /resumes/certifications

// External Profiles
router.put("/external-profiles", authenticateUser(), updateExternalProfiles); // PUT /resumes/external-profiles
router.get("/external-profiles", authenticateUser(), getExternalProfiles); // GET /resumes/external-profiles

// Multiple Sections Update
router.put("/multiple-sections", authenticateUser(), updateMultipleSections); // PUT /resumes/multiple-sections

// Profile Completion Status
router.get("/completion-status", authenticateUser(), getProfileCompletionStatus); // GET /resumes/completion-status

// Admin: fetch resume by user ID
router.get(
  "/admin/by-user/:userId",
  authenticateUser(),
  authorizeRole(["admin"]),
  getResumeByUserIdAdmin
); // GET /resumes/admin/by-user/:userId

// Admin review for one eligibility section
router.put(
  "/:userId/work-eligibility/review",
  authenticateUser(),
  authorizeRole(["admin"]),
  reviewWorkEligibilitySection
); // PUT /resumes/:userId/work-eligibility/review

// Keep dynamic :id route last so it does not swallow static endpoints above.
router.get("/:id", authenticateUser(), logDocumentAccess, enforceDocumentSecurity, sanitizeDocumentForEmployer, getResumeById); // GET /resumes/:id - Get resume by ID (for job applications)

export default router;
