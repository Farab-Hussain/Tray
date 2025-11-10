import express from "express";
import {
  getMyConsultantStatus,
  createConsultantProfile,
  getConsultantProfile,
  getConsultantAvailability,
  setAvailabilitySlots,
  deleteAvailabilitySlot,
  getAllConsultantProfiles,
  updateConsultantProfile,
  approveConsultantProfile,
  rejectConsultantProfile,
  createConsultantApplication,
  updateConsultantApplication,
  getConsultantApplication,
  getMyConsultantApplications,
  getAllConsultantApplications,
  approveConsultantApplication,
  rejectConsultantApplication,
  deleteConsultantApplication,
  getDashboardStats,
} from "../controllers/consultantFlow.controller";
import { getAdminAnalyticsController } from "../controllers/analytics.controller";
import { authenticateUser, authorizeRole } from "../middleware/authMiddleware";
import { 
  checkConsultantStatus, 
  requireApprovedConsultant,
  canApplyForServices 
} from "../middleware/consultantMiddleware";

const router = express.Router();

// ========== Consultant Status & Onboarding Routes ==========

// GET /consultant-flow/status - Check current user's consultant status (determines which screen to show)
router.get("/status", authenticateUser, getMyConsultantStatus);

// POST /consultant-flow/profiles - Create consultant profile (open to all authenticated users)
router.post("/profiles", authenticateUser, createConsultantProfile);

// GET /consultant-flow/profiles/:uid - Get specific profile (consultant can view their own) - MUST BE BEFORE /profiles
router.get("/profiles/:uid", authenticateUser, getConsultantProfile);

// GET /consultant-flow/profiles/:uid/availability - Get consultant availability (public for students)
router.get("/profiles/:uid/availability", getConsultantAvailability);

// PUT /consultant-flow/profiles/:uid - Update profile (consultant can update their own profile)
router.put("/profiles/:uid", authenticateUser, updateConsultantProfile);

// PUT /consultant-flow/profiles/:uid/availability-slots - Set availability slots (consultant only)
router.put("/profiles/:uid/availability-slots", authenticateUser, setAvailabilitySlots);

// DELETE /consultant-flow/profiles/:uid/availability-slots - Delete a specific availability slot (consultant only)
router.delete("/profiles/:uid/availability-slots", authenticateUser, deleteAvailabilitySlot);

// ========== Admin Profile Management Routes ==========

// GET /consultant-flow/profiles - Get all profiles (admin only, with status filter)
router.get(
  "/profiles", 
  authenticateUser, 
  authorizeRole(["admin"]), 
  getAllConsultantProfiles
);

// POST /consultant-flow/profiles/:uid/approve - Approve profile (admin only)
router.post(
  "/profiles/:uid/approve", 
  authenticateUser, 
  authorizeRole(["admin"]), 
  approveConsultantProfile
);

// POST /consultant-flow/profiles/:uid/reject - Reject profile (admin only)
router.post(
  "/profiles/:uid/reject", 
  authenticateUser, 
  authorizeRole(["admin"]), 
  rejectConsultantProfile
);

// ========== Service Application Routes ==========

// POST /consultant-flow/applications - Submit service application (requires approved profile)
router.post("/applications", authenticateUser, canApplyForServices, createConsultantApplication);
router.put("/applications/:id", authenticateUser, updateConsultantApplication);

// GET /consultant-flow/applications/my - Get MY applications (consultant-only route)
router.get("/applications/my", authenticateUser, getMyConsultantApplications);

// GET /consultant-flow/applications/:id - Get specific application (consultant can view their own)
router.get("/applications/:id", authenticateUser, getConsultantApplication);

// DELETE /consultant-flow/applications/:id - Delete application (consultant can delete their own)
router.delete("/applications/:id", authenticateUser, deleteConsultantApplication);

// ========== Admin Application Management Routes ==========

// GET /consultant-flow/applications - Get all applications (admin only, with filters)
router.get(
  "/applications", 
  authenticateUser, 
  authorizeRole(["admin"]), 
  getAllConsultantApplications
);

// POST /consultant-flow/applications/:id/approve - Approve application (admin only)
router.post(
  "/applications/:id/approve", 
  authenticateUser, 
  authorizeRole(["admin"]), 
  approveConsultantApplication
);

// POST /consultant-flow/applications/:id/reject - Reject application (admin only)
router.post(
  "/applications/:id/reject", 
  authenticateUser, 
  authorizeRole(["admin"]), 
  rejectConsultantApplication
);

// ========== Admin Dashboard Routes ==========

// GET /consultant-flow/dashboard/stats - Get dashboard statistics (admin only)
router.get(
  "/dashboard/stats", 
  authenticateUser, 
  authorizeRole(["admin"]), 
  getDashboardStats
);

// GET /consultant-flow/admin/analytics - Get admin analytics (admin only)
router.get(
  "/admin/analytics", 
  authenticateUser, 
  authorizeRole(["admin"]), 
  getAdminAnalyticsController
);

export default router;

