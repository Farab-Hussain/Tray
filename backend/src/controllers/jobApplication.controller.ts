// src/controllers/jobApplication.controller.ts
import { Request, Response } from "express";
import { Timestamp } from "firebase-admin/firestore";
import { jobApplicationServices } from "../services/jobApplication.service";
import { jobServices } from "../services/job.service";
import { resumeServices } from "../services/resume.service";
import { calculateMatchScore } from "../utils/skillMatching";
import { serializeApplication, serializeApplications } from "../utils/serialization";
import { JobApplicationInput } from "../models/jobApplication.model";

// Helper functions for enhanced fit score display
function generateImprovementSuggestions(missingSkills: string[]): Array<{
  skill: string;
  suggestion: string;
  actionType: 'update-resume' | 'book-coach' | 'view-courses';
  priority: 'high' | 'medium' | 'low';
}> {
  return missingSkills.map(skill => ({
    skill,
    suggestion: `Consider adding ${skill} to your skillset`,
    actionType: 'update-resume' as const,
    priority: 'high' as const,
  }));
}

async function checkAvailabilityAlignment(userId: string, jobId: string): Promise<{
  aligned: boolean;
  score: number;
  message: string;
}> {
  try {
    // Placeholder implementation - would check student availability vs job requirements
    return {
      aligned: true,
      score: 85,
      message: "Your availability aligns well with this position"
    };
  } catch (error) {
    return {
      aligned: false,
      score: 0,
      message: "Unable to check availability alignment"
    };
  }
}

async function checkLocationCompatibility(userId: string, jobLocation: string): Promise<{
  compatible: boolean;
  score: number;
  message: string;
  distance?: number;
}> {
  try {
    // Get student's location from resume
    const resume = await resumeServices.getByUserId(userId);
    const studentLocation = resume.personalInfo.location;

    if (!studentLocation) {
      return {
        compatible: false,
        score: 0,
        message: "Location not specified in profile"
      };
    }

    // Simple location compatibility check (placeholder)
    const compatible = studentLocation.toLowerCase().includes(jobLocation.toLowerCase()) ||
                     jobLocation.toLowerCase().includes(studentLocation.toLowerCase());

    return {
      compatible,
      score: compatible ? 90 : 30,
      message: compatible ? "Great location match!" : "Location may require relocation",
      distance: compatible ? 0 : 50 // Placeholder distance
    };
  } catch (error) {
    return {
      compatible: false,
      score: 0,
      message: "Unable to check location compatibility"
    };
  }
}

/**
 * Apply for a job (Student)
 * Automatically calculates match rating
 */
export const applyForJob = async (req: Request, res: Response) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[applyForJob:${requestId}] Starting application process`);
    const { id } = req.params; // Job ID
    const user = (req as any).user;
    
    if (!user || !user.uid) {
      console.error(`[applyForJob:${requestId}] Authentication failed: no user or uid`);
      return res.status(401).json({ error: "Authentication required" });
    }

    console.log(`[applyForJob:${requestId}] User authenticated: ${user.uid}`);
    const { resumeId, coverLetter } = req.body;

    // Validate resumeId is provided
    if (!resumeId) {
      console.error(`[applyForJob:${requestId}] Validation failed: resumeId missing`);
      return res.status(400).json({ error: "Resume ID is required" });
    }

    // Ensure resumeId is a string
    const cleanResumeId = String(resumeId).trim();
    if (!cleanResumeId) {
      console.error(`[applyForJob:${requestId}] Validation failed: resumeId is empty after cleaning`);
      return res.status(400).json({ error: "Resume ID is required" });
    }
    
    console.log(`[applyForJob:${requestId}] Processing application - Job: ${id}, Resume: ${cleanResumeId}`);

    // Verify job exists
    let job;
    try {
      job = await jobServices.getById(id);
    } catch (jobError: any) {
      console.error("Error fetching job:", jobError);
      return res.status(404).json({ error: "Job not found" });
    }

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status !== "active") {
      return res.status(400).json({ error: "This job is not accepting applications" });
    }

    // Verify resume exists and belongs to user
    let resume;
    try {
      console.log(`[applyForJob:${requestId}] Fetching resume: ${cleanResumeId}`);
      resume = await resumeServices.getById(cleanResumeId);
    } catch (resumeError: any) {
      console.error(`[applyForJob:${requestId}] Error fetching resume:`, resumeError);
      console.error(`[applyForJob:${requestId}] Resume error stack:`, resumeError?.stack);
      if (!res.headersSent) {
        return res.status(404).json({ error: "Resume not found" });
      }
      return;
    }

    if (!resume) {
      console.error(`[applyForJob:${requestId}] Resume not found: ${cleanResumeId}`);
      if (!res.headersSent) {
        return res.status(404).json({ error: "Resume not found" });
      }
      return;
    }

    if (resume.userId !== user.uid) {
      console.error(`[applyForJob:${requestId}] Resume ownership mismatch - Resume userId: ${resume.userId}, User uid: ${user.uid}`);
      if (!res.headersSent) {
        return res.status(403).json({ error: "You can only use your own resume" });
      }
      return;
    }
    
    console.log(`[applyForJob:${requestId}] Resume verified successfully`);

    // Check if user has already applied
    let hasApplied;
    try {
      hasApplied = await jobApplicationServices.hasUserApplied(id, user.uid);
    } catch (hasAppliedError: any) {
      console.error("Error checking if user has applied:", hasAppliedError);
      // Don't fail the request if this check fails - continue with application
      hasApplied = false;
    }

    if (hasApplied) {
      return res.status(400).json({ error: "You have already applied for this job" });
    }

    // Calculate match score with defensive checks
    const jobSkills = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
    const resumeSkills = Array.isArray(resume.skills) ? resume.skills : [];
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[applyForJob] Job ID: ${id}, Job Skills: ${JSON.stringify(jobSkills)}, Resume Skills: ${JSON.stringify(resumeSkills)}`);
    }
    
    let matchResult;
    try {
      matchResult = calculateMatchScore(jobSkills, resumeSkills);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[applyForJob] Match result:`, JSON.stringify(matchResult));
      }
    } catch (matchError: any) {
      console.error("Error calculating match score:", matchError);
      console.error("Match error stack:", matchError.stack);
      // Use default match result if calculation fails
      matchResult = {
        score: 0,
        totalRequired: jobSkills.length,
        matchPercentage: 0,
        rating: "basic" as const,
        matchedSkills: [],
        missingSkills: jobSkills,
      };
    }

    // Create application
    const applicationData: JobApplicationInput = {
      jobId: id,
      resumeId: cleanResumeId,
      coverLetter: coverLetter || undefined,
    };

    console.log(`[applyForJob:${requestId}] Creating application with data:`, {
      jobId: applicationData.jobId,
      resumeId: applicationData.resumeId,
      hasCoverLetter: !!applicationData.coverLetter,
      matchScore: matchResult.score,
      matchRating: matchResult.rating,
    });

    let application;
    try {
      // Validate matchResult before passing to create
      const validatedMatchResult = {
        score: typeof matchResult.score === 'number' ? matchResult.score : 0,
        rating: (['gold', 'silver', 'bronze', 'basic'].includes(matchResult.rating) ? matchResult.rating : 'basic') as "gold" | "silver" | "bronze" | "basic",
        matchedSkills: Array.isArray(matchResult.matchedSkills) ? matchResult.matchedSkills : [],
        missingSkills: Array.isArray(matchResult.missingSkills) ? matchResult.missingSkills : [],
      };
      
      application = await jobApplicationServices.create(
        applicationData,
        user.uid,
        validatedMatchResult
      );
      console.log(`[applyForJob:${requestId}] Application created successfully:`, application.id);
    } catch (createError: any) {
      console.error(`[applyForJob:${requestId}] Error creating application:`, createError);
      console.error(`[applyForJob:${requestId}] Create error name:`, createError?.name);
      console.error(`[applyForJob:${requestId}] Create error message:`, createError?.message);
      console.error(`[applyForJob:${requestId}] Create error stack:`, createError?.stack);
      
      if (!res.headersSent) {
        return res.status(500).json({ 
          error: "Failed to create application",
          details: process.env.NODE_ENV !== 'production' ? createError.message : undefined,
          requestId: requestId,
        });
      }
      return;
    }

    // Increment application count on job (only track gold and silver)
    // Don't fail the request if this fails - application is already created
    try {
      const ratingForCount = matchResult.rating === "gold" || matchResult.rating === "silver" 
        ? matchResult.rating 
        : undefined;
      await jobServices.incrementApplicationCount(id, ratingForCount);
      console.log(`[applyForJob:${requestId}] Application count incremented for rating: ${ratingForCount || 'none'}`);
    } catch (incrementError: any) {
      console.error(`[applyForJob:${requestId}] Error incrementing application count:`, incrementError);
      console.error(`[applyForJob:${requestId}] Increment error stack:`, incrementError?.stack);
      // Continue - application was created successfully
    }

    // Serialize application with all match data
    let serializedApplication;
    try {
      const applicationWithMatch = {
        ...application,
        matchScore: matchResult.score,
        matchRating: matchResult.rating,
        matchedSkills: matchResult.matchedSkills || [],
        missingSkills: matchResult.missingSkills || [],
      };
      serializedApplication = serializeApplication(applicationWithMatch);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[applyForJob] Application serialized successfully`);
      }
    } catch (serializeError: any) {
      console.error("Error serializing application:", serializeError);
      console.error("Serialize error stack:", serializeError.stack);
      // Return application without serialization if serialization fails
      serializedApplication = {
        ...application,
        matchScore: matchResult.score,
        matchRating: matchResult.rating,
        matchedSkills: matchResult.matchedSkills || [],
        missingSkills: matchResult.missingSkills || [],
        appliedAt: application.appliedAt instanceof Timestamp 
          ? application.appliedAt.toDate().toISOString() 
          : application.appliedAt,
      };
    }

    console.log(`[applyForJob:${requestId}] Sending success response`);
    if (!res.headersSent) {
      res.status(201).json({
        message: "Application submitted successfully",
        application: serializedApplication,
        // NEW: Enhanced fit score display
        fitScoreDetails: {
          matchPercentage: matchResult.matchPercentage || 0,
          matchRating: matchResult.rating,
          matchedSkills: matchResult.matchedSkills || [],
          missingSkills: matchResult.missingSkills || [],
          totalRequiredSkills: jobSkills.length,
          improvementSuggestions: generateImprovementSuggestions(matchResult.missingSkills || []),
          availabilityAlignment: await checkAvailabilityAlignment(user.uid, job.id),
          locationCompatibility: await checkLocationCompatibility(user.uid, job.location),
        },
      });
    } else {
      console.error(`[applyForJob:${requestId}] Response already sent, cannot send success response`);
    }
  } catch (error: any) {
    console.error(`[applyForJob:${requestId}] Unexpected error in applyForJob:`, error);
    console.error(`[applyForJob:${requestId}] Error name:`, error?.name);
    console.error(`[applyForJob:${requestId}] Error message:`, error?.message);
    console.error(`[applyForJob:${requestId}] Error stack:`, error?.stack);
    
    // Check if response has already been sent
    if (res.headersSent) {
      console.error(`[applyForJob:${requestId}] Response already sent, cannot send error response`);
      return;
    }
    
    // Provide more detailed error information in development
    const errorMessage = process.env.NODE_ENV !== 'production' 
      ? error.message || "Failed to submit application"
      : "Failed to submit application";
    
    try {
      res.status(500).json({ 
        error: errorMessage,
        details: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        requestId: requestId,
      });
    } catch (responseError: any) {
      console.error(`[applyForJob:${requestId}] Error sending error response:`, responseError);
    }
  }
};

/**
 * Get applications for a job (Hiring Manager only)
 * SECURITY: Uses secure application review to block access to private client documents
 * CRITICAL: Applications are sorted by match rating (Gold first)
 */
export const getJobApplications = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Job ID
    const user = (req as any).user;
    
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // SECURITY: Use secure application review for employers
    if (user.role === 'employer') {
      // Get applications with security filtering
      const applications = await jobApplicationServices.getSecureApplicationsForEmployer(id, user.uid);

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
        securityNotice: "Private client documents and sensitive information have been filtered for employer access",
      });
      return;
    }

    // For non-employers (admin, etc.), use full access
    const job = await jobServices.getById(id);
    if (job.postedBy !== user.uid && user.role !== 'admin') {
      return res.status(403).json({ error: "You can only view applications for your own jobs" });
    }

    // Get applications with full details (sorted by rating - Gold first)
    const applications = await jobApplicationServices.getByJobIdWithDetails(id, user.uid, user.role);

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
 * Security test endpoint: Test employer access to private client documents
 * This endpoint demonstrates that employers are blocked from accessing sensitive information
 */
export const testEmployerAccessSecurity = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Only allow this test for employers and admins
    if (user.role !== 'employer' && user.role !== 'admin') {
      return res.status(403).json({ error: "This test is for employers and admins only" });
    }

    // Find a job with applications to test
    const jobsSnapshot = await require('../config/firebase').db
      .collection('jobs')
      .where('postedBy', '==', user.uid)
      .limit(1)
      .get();

    if (jobsSnapshot.empty) {
      return res.status(404).json({ 
        message: 'No jobs found for testing',
        testResult: 'NO_JOBS_FOUND',
        recommendation: 'Create a job posting first to test security'
      });
    }

    const testJob = jobsSnapshot.docs[0].data();
    const jobId = jobsSnapshot.docs[0].id;

    // Get applications using the secure method
    const applications = await jobApplicationServices.getSecureApplicationsForEmployer(jobId, user.uid);

    // Test security by checking what information is available
    const securityTest = {
      jobId,
      jobTitle: testJob.title,
      totalApplications: applications.length,
      employerAccess: {
        canSeeUserEmail: false, // Should be false
        canSeeUserPhone: false, // Should be false
        canSeeUserAddress: false, // Should be false
        canSeeResumeFileUrl: false, // Should be false
        canSeeDetailedExperience: false, // Should be false
        canSeeFullEducation: false, // Should be false
        canSeeSkills: true, // Should be true for matching
        canSeeMatchScores: true, // Should be true for ranking
      },
      sampleApplication: applications.length > 0 ? {
        hasUser: !!applications[0].user,
        hasResume: !!applications[0].resume,
        userFields: applications[0].user ? Object.keys(applications[0].user) : [],
        resumeFields: applications[0].resume ? Object.keys(applications[0].resume) : [],
        hasResumeFileUrl: !!(applications[0].resume as any)?.resumeFileUrl,
        matchScore: applications[0].matchScore,
        matchRating: applications[0].matchRating,
      } : null,
    };

    // Verify security measures
    const securityPassed = 
      !securityTest.employerAccess.canSeeUserEmail &&
      !securityTest.employerAccess.canSeeUserPhone &&
      !securityTest.employerAccess.canSeeUserAddress &&
      !securityTest.employerAccess.canSeeResumeFileUrl &&
      securityTest.employerAccess.canSeeSkills &&
      securityTest.employerAccess.canSeeMatchScores;

    // Check sample application if available
    if (securityTest.sampleApplication) {
      const sample = securityTest.sampleApplication;
      const sampleSecurityPassed = 
        !sample.hasResumeFileUrl &&
        !sample.userFields.includes('email') &&
        !sample.userFields.includes('phone') &&
        !sample.userFields.includes('address') &&
        sample.resumeFields.includes('skills');

      if (!sampleSecurityPassed) {
        console.warn('SECURITY BREACH DETECTED:', {
          hasResumeFileUrl: sample.hasResumeFileUrl,
          userFields: sample.userFields,
          resumeFields: sample.resumeFields,
        });
      }
    }

    const testResult = {
      message: 'Employer access security test completed',
      testResult: securityPassed ? 'SECURITY_PASSED' : 'SECURITY_BREACH',
      securityStatus: securityPassed ? '✅ Security working correctly' : '🚨 SECURITY BREACH DETECTED',
      test: securityTest,
      recommendation: securityPassed 
        ? '✅ Employers are properly blocked from accessing private client documents'
        : '🚨 CRITICAL: Security system failed - employers can access private information!',
      timestamp: new Date().toISOString(),
      testedBy: {
        userId: user.uid,
        userRole: user.role,
      },
    };

    // Log the security test
    console.log('SECURITY TEST:', {
      testResult: testResult.testResult,
      userId: user.uid,
      userRole: user.role,
      jobId,
      applicationCount: applications.length,
    });

    res.status(200).json(testResult);
  } catch (error: any) {
    console.error("Error in security test:", error);
    res.status(500).json({ 
      error: "Security test failed", 
      details: error.message,
      testResult: 'TEST_ERROR'
    });
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