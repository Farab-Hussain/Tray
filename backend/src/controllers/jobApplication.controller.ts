// src/controllers/jobApplication.controller.ts
import { Request, Response } from "express";
import { jobApplicationServices } from "../services/jobApplication.service";
import { jobServices } from "../services/job.service";
import { resumeServices } from "../services/resume.service";
import { calculateMatchScore } from "../utils/skillMatching";
import { serializeApplication, serializeApplications } from "../utils/serialization";
import { JobApplicationInput } from "../models/jobApplication.model";

/**
 * Apply for a job (Student)
 * Automatically calculates match rating
 */
export const applyForJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Job ID
    const user = (req as any).user;
    
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { resumeId, coverLetter } = req.body;

    // Verify job exists
    const job = await jobServices.getById(id);
    if (job.status !== "active") {
      return res.status(400).json({ error: "This job is not accepting applications" });
    }

    // Verify resume exists and belongs to user
    const resume = await resumeServices.getById(resumeId);
    if (resume.userId !== user.uid) {
      return res.status(403).json({ error: "You can only use your own resume" });
    }

    // Check if user has already applied
    const hasApplied = await jobApplicationServices.hasUserApplied(id, user.uid);
    if (hasApplied) {
      return res.status(400).json({ error: "You have already applied for this job" });
    }

    // Calculate match score
    const matchResult = calculateMatchScore(job.requiredSkills, resume.skills);

    // Create application
    const applicationData: JobApplicationInput = {
      jobId: id,
      resumeId,
      coverLetter,
    };

    const application = await jobApplicationServices.create(
      applicationData,
      user.uid,
      matchResult
    );

    // Increment application count on job (only track gold and silver)
    const ratingForCount = matchResult.rating === "gold" || matchResult.rating === "silver" 
      ? matchResult.rating 
      : undefined;
    await jobServices.incrementApplicationCount(id, ratingForCount);

    res.status(201).json({
      message: "Application submitted successfully",
      application: serializeApplication({
        ...application,
        matchScore: matchResult.score,
        matchRating: matchResult.rating,
        matchedSkills: matchResult.matchedSkills,
        missingSkills: matchResult.missingSkills,
      }),
    });
  } catch (error: any) {
    console.error("Error applying for job:", error);
    res.status(500).json({ error: error.message || "Failed to submit application" });
  }
};

/**
 * Get applications for a job (Hiring Manager only)
 * CRITICAL: Applications are sorted by match rating (Gold first)
 */
export const getJobApplications = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Job ID
    const user = (req as any).user;
    
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify job exists and user owns it
    const job = await jobServices.getById(id);
    if (job.postedBy !== user.uid) {
      return res.status(403).json({ error: "You can only view applications for your own jobs" });
    }

    // Get applications with details (sorted by rating - Gold first)
    const applications = await jobApplicationServices.getByJobIdWithDetails(id);

    // Count by rating
    const goldCount = applications.filter(app => app.matchRating === "gold").length;
    const silverCount = applications.filter(app => app.matchRating === "silver").length;
    const bronzeCount = applications.filter(app => app.matchRating === "bronze").length;
    const basicCount = applications.filter(app => app.matchRating === "basic").length;

    res.status(200).json({
      applications: serializeApplications(applications),
      summary: {
        total: applications.length,
        gold: goldCount,
        silver: silverCount,
        bronze: bronzeCount,
        basic: basicCount,
      },
    });
  } catch (error: any) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ error: error.message || "Failed to fetch applications" });
  }
};

/**
 * Get my applications (Student)
 */
export const getMyApplications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const applications = await jobApplicationServices.getByUserId(user.uid);

    // Populate job data for each application
    const applicationsWithJobs = await Promise.all(
      applications.map(async (app) => {
        try {
          const job = await jobServices.getById(app.jobId);
          const serialized = serializeApplication({
            ...app,
            job: {
              id: job.id,
              title: job.title,
              company: job.company,
              location: job.location,
              status: job.status,
              requiredSkills: job.requiredSkills || [],
            },
          });
          // Debug: Log status to ensure it's included
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[getMyApplications] Application ${app.id} status:`, serialized.status);
          }
          return serialized;
        } catch (error) {
          const serialized = serializeApplication(app);
          // Debug: Log status to ensure it's included
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[getMyApplications] Application ${app.id} status (no job):`, serialized.status);
          }
          return serialized;
        }
      })
    );

    res.status(200).json({ applications: applicationsWithJobs });
  } catch (error: any) {
    console.error("Error fetching my applications:", error);
    res.status(500).json({ error: error.message || "Failed to fetch applications" });
  }
};

/**
 * Update application status (Hiring Manager only)
 */
export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Application ID
    const user = (req as any).user;
    const { status, reviewNotes } = req.body;
    
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get application
    const application = await jobApplicationServices.getById(id);

    // Verify user owns the job
    const job = await jobServices.getById(application.jobId);
    if (job.postedBy !== user.uid) {
      return res.status(403).json({ error: "You can only update applications for your own jobs" });
    }

    const updatedApplication = await jobApplicationServices.updateStatus(
      id,
      status,
      reviewNotes
    );

    res.status(200).json({
      message: "Application status updated successfully",
      application: serializeApplication(updatedApplication),
    });
  } catch (error: any) {
    console.error("Error updating application status:", error);
    res.status(500).json({ error: error.message || "Failed to update application status" });
  }
};

/**
 * Get application by ID
 */
export const getApplicationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const application = await jobApplicationServices.getById(id);

    // Verify user has access (either applicant or job poster)
    if (application.userId !== user.uid) {
      const job = await jobServices.getById(application.jobId);
      if (job.postedBy !== user.uid) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    // Populate with details
    const resume = await resumeServices.getById(application.resumeId).catch(() => null);
    const job = await jobServices.getById(application.jobId).catch(() => null);

    const serialized = serializeApplication({
      ...application,
      resume: resume || undefined,
      job: job ? {
        id: job.id,
        title: job.title,
        company: job.company || '',
        location: job.location || '',
        requiredSkills: job.requiredSkills,
      } : undefined,
    });

    // Debug: Log status to ensure it's included
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[getApplicationById] Application ${application.id} status:`, serialized.status);
    }

    res.status(200).json({
      application: serialized,
    });
  } catch (error: any) {
    console.error("Error fetching application:", error);
    res.status(404).json({ error: error.message || "Application not found" });
  }
};

