// src/controllers/job.controller.ts
import { Request, Response } from "express";
import { jobServices } from "../services/job.service";
import { resumeServices } from "../services/resume.service";
import { calculateMatchScore } from "../utils/skillMatching";
import { Job, JobCard } from "../models/job.model";

/**
 * Create a new job posting (Hiring Manager/Admin only)
 */
export const createJob = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    console.log(`🔍 [Job Creation] User:`, user?.uid, `Email:`, user?.email);
    
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const jobData = req.body;
    console.log(`🔍 [Job Creation] Job data:`, jobData);

    // Check if payment is already confirmed (bypass payment check)
    const paymentConfirmed = req.body.paymentConfirmed || req.headers['x-payment-confirmed'] === 'true';
    
    if (!paymentConfirmed) {
      // ENFORCEMENT: Check if job posting payment is required
      console.log(`🔍 [Job Creation] Checking payment requirement...`);
      const paymentRequired = await jobServices.checkJobPostingPayment(user.uid);
      console.log(`🔍 [Job Creation] Payment check result:`, paymentRequired);
      
      if (paymentRequired.required && !paymentRequired.paid) {
        console.log(`🔍 [Job Creation] Payment required - returning 402`);
        return res.status(402).json({
          error: "Payment required for job posting",
          paymentAmount: paymentRequired.amount,
          paymentUrl: paymentRequired.paymentUrl,
          message: "Please pay the job posting fee to continue"
        });
      }
    } else {
      console.log(`🔍 [Job Creation] Payment already confirmed - bypassing payment check`);
    }

    console.log(`🔍 [Job Creation] Creating job...`);
    const job = await jobServices.create(jobData, user.uid);

    res.status(201).json({
      message: "Job posted successfully",
      job,
    });
  } catch (error: any) {
    console.error("Error creating job:", error);
    res.status(500).json({ error: error.message || "Failed to create job" });
  }
};

/**
 * Get all active jobs (paginated, filterable)
 */
export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = (req.query.status as string) || "active";
    const jobType = req.query.jobType as string;
    const location = req.query.location as string;

    const filters = {
      status: status as "active" | "closed" | "draft",
      jobType,
      location,
      page,
      limit: Math.min(limit, 100), // Max 100 per page
    };

    const { jobs, total } = await jobServices.getAll(filters);

    // If user is authenticated, calculate match scores for each job
    const user = (req as any).user;
    let jobsWithMatch: (Job | JobCard)[] = jobs;

    if (user && user.uid) {
      try {
        const userResume = await resumeServices.getByUserId(user.uid).catch(() => null);
        
        if (userResume && Array.isArray(userResume.skills) && userResume.skills.length > 0) {
          jobsWithMatch = jobs.map(job => {
            try {
              // Ensure requiredSkills is an array
              const requiredSkills = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
              if (requiredSkills.length === 0) {
                // No skills required, return job without match score
                return job;
              }
              
              const matchResult = calculateMatchScore(requiredSkills, userResume.skills);
              return {
                ...job,
                matchScore: matchResult.score,
                matchRating: matchResult.rating,
              } as JobCard;
            } catch (jobError: any) {
              // If match calculation fails for a specific job, return job without match score
              console.error(`Error calculating match score for job ${job.id}:`, jobError.message);
              return job;
            }
          });
        }
      } catch (error: any) {
        // If resume fetch fails, just return jobs without match scores
        console.error("Error calculating match scores:", error.message || error);
      }
    }

    res.status(200).json({
      jobs: jobsWithMatch,
      pagination: {
        page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
        hasNextPage: page * filters.limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: error.message || "Failed to fetch jobs" });
  }
};

/**
 * Get job by ID
 */
export const getJobById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const job = await jobServices.getById(id);

    // If user is authenticated, calculate match score
    const user = (req as any).user;
    let jobWithMatch: any = job;

    if (user && user.uid) {
      try {
        const userResume = await resumeServices.getByUserId(user.uid).catch(() => null);
        
        if (userResume && userResume.skills.length > 0) {
          const matchResult = calculateMatchScore(job.requiredSkills, userResume.skills);
          jobWithMatch = {
            ...job,
            matchScore: matchResult.score,
            matchRating: matchResult.rating,
            matchedSkills: matchResult.matchedSkills,
            missingSkills: matchResult.missingSkills,
          };
        }
      } catch (error) {
        console.error("Error calculating match score:", error);
      }
    }

    res.status(200).json({ job: jobWithMatch });
  } catch (error: any) {
    console.error("Error fetching job:", error);
    res.status(404).json({ error: error.message || "Job not found" });
  }
};

/**
 * Get jobs posted by current user (Hiring Manager)
 */
export const getMyJobs = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const jobs = await jobServices.getByPostedBy(user.uid);
    res.status(200).json({ jobs });
  } catch (error: any) {
    console.error("Error fetching my jobs:", error);
    res.status(500).json({ error: error.message || "Failed to fetch jobs" });
  }
};

/**
 * Update job (Job poster only)
 */
export const updateJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify user owns the job
    const job = await jobServices.getById(id);
    if (job.postedBy !== user.uid) {
      return res.status(403).json({ error: "You can only update your own jobs" });
    }

    const updatedJob = await jobServices.update(id, req.body);
    res.status(200).json({
      message: "Job updated successfully",
      job: updatedJob,
    });
  } catch (error: any) {
    console.error("Error updating job:", error);
    res.status(500).json({ error: error.message || "Failed to update job" });
  }
};

/**
 * Delete job (Job poster only)
 */
export const deleteJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify user owns the job
    const job = await jobServices.getById(id);
    if (job.postedBy !== user.uid) {
      return res.status(403).json({ error: "You can only delete your own jobs" });
    }

    await jobServices.delete(id);
    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting job:", error);
    res.status(500).json({ error: error.message || "Failed to delete job" });
  }
};

/**
 * Search jobs
 */
export const searchJobs = async (req: Request, res: Response) => {
  try {
    const searchTerm = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = (req.query.status as string) || "active";

    if (!searchTerm || searchTerm.trim().length === 0) {
      return res.status(400).json({ error: "Search term is required" });
    }

    const filters = {
      status: status as "active" | "closed" | "draft",
      page,
      limit: Math.min(limit, 100),
    };

    const { jobs, total } = await jobServices.search(searchTerm.trim(), filters);

    res.status(200).json({
      jobs,
      pagination: {
        page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
        hasNextPage: page * filters.limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error("Error searching jobs:", error);
    res.status(500).json({ error: error.message || "Failed to search jobs" });
  }
};

/**
 * Get match score for current user (before applying)
 */
export const getMatchScore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const job = await jobServices.getById(id);
    const userResume = await resumeServices.getByUserId(user.uid);

    // Ensure arrays are properly formatted
    const jobSkills = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
    const userSkills = Array.isArray(userResume.skills) ? userResume.skills : [];

    const matchResult = calculateMatchScore(jobSkills, userSkills);

    // Validate that score matches matchedSkills length (safety check)
    const validatedScore = matchResult.matchedSkills.length;
    if (validatedScore !== matchResult.score) {
      console.warn(`Score mismatch detected: calculated=${matchResult.score}, actual=${validatedScore}. Using actual count.`);
    }

    const response = {
      score: validatedScore, // Use actual matchedSkills length for accuracy
      matchRating: matchResult.rating,
      totalRequired: matchResult.totalRequired,
      matchPercentage: matchResult.matchPercentage,
      matchedSkills: matchResult.matchedSkills,
      missingSkills: matchResult.missingSkills,
    };

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Match Score Response:', {
        jobSkills,
        userSkills,
        matchResult,
        response,
      });
    }

    res.status(200).json(response);
  } catch (error: any) {
    console.error("Error calculating match score:", error);
    if (error.message === "Resume not found") {
      return res.status(404).json({ error: "Please create a resume first" });
    }
    res.status(500).json({ error: error.message || "Failed to calculate match score" });
  }
};

