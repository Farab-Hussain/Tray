// src/routes/job.routes.ts
import express, { Request, Response, NextFunction } from "express";
import {
  createJob,
  getAllJobs,
  getJobById,
  getMyJobs,
  updateJob,
  deleteJob,
  searchJobs,
  getMatchScore,
} from "../controllers/job.controller";
import {
  applyForJob,
  getJobApplications,
  getMyApplications,
  updateApplicationStatus,
  getApplicationById,
  testEmployerAccessSecurity,
} from "../controllers/jobApplication.controller";
import {
  validateCreateJob,
  validateUpdateJob,
  validateJobId,
  validateApplyForJob,
  validateUpdateApplicationStatus,
} from "../middleware/validation";
import { authenticateUser, authorizeRole } from "../middleware/authMiddleware";

// Async handler wrapper to catch promise rejections
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const router = express.Router();

// Job Management Routes

// Public routes
router.get("/", getAllJobs); // GET /jobs - Get all active jobs (paginated, filterable)
router.get("/search", searchJobs); // GET /jobs/search - Search jobs

// Protected routes - Must be before /:id to avoid route conflicts
router.get("/my", authenticateUser(), getMyJobs); // GET /jobs/my - Get my posted jobs (MUST be before /:id)
router.post("/", authenticateUser(), authorizeRole(["admin", "recruiter", "consultant"]), validateCreateJob, createJob); // POST /jobs - Create job posting (Admin, Recruiter, or Consultant - Students cannot post)

// Dynamic routes - Must be after specific routes
router.get("/:id", validateJobId, getJobById); // GET /jobs/:id - Get job details
router.get("/:id/match-score", validateJobId, authenticateUser(), getMatchScore); // GET /jobs/:id/match-score - Get match score for current user
router.put("/:id", authenticateUser(), validateUpdateJob, updateJob); // PUT /jobs/:id - Update job
router.delete("/:id", authenticateUser(), validateJobId, deleteJob); // DELETE /jobs/:id - Delete job

// Job Application Routes

// Student routes
router.post("/:id/apply", authenticateUser(), validateApplyForJob, asyncHandler(applyForJob)); // POST /jobs/:id/apply - Apply for a job
router.get("/applications/my", authenticateUser(), getMyApplications); // GET /jobs/applications/my - Get my applications

// Hiring Manager routes
router.get("/:id/applications", authenticateUser(), validateJobId, getJobApplications); // GET /jobs/:id/applications - Get applications for a job (sorted by rating)
router.put("/applications/:id/status", authenticateUser(), validateUpdateApplicationStatus, updateApplicationStatus); // PUT /jobs/applications/:id/status - Update application status
router.get("/applications/:id", authenticateUser(), getApplicationById); // GET /jobs/applications/:id - Get application by ID

// Security Test Routes
router.post("/security/test-employer-access", authenticateUser(), testEmployerAccessSecurity); // POST /jobs/security/test-employer-access - Test employer security access

export default router;

