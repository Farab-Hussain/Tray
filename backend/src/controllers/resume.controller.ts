// src/controllers/resume.controller.ts
import { Request, Response } from "express";
import {
  resumeServices,
  WorkPreferences,
  AuthorizationInfo,
  CareerGoals,
  ExternalProfiles,
} from "../services/resume.service";
import {
  WorkEligibilitySectionKey,
  WorkEligibilityVerificationStatus,
} from "../models/resume.model";
import { Resume, ResumeInput } from "../models/resume.model";

/**
 * Create or update resume (Student)
 */
export const createOrUpdateResume = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const resumeData: ResumeInput = req.body;
    const resume = await resumeServices.createOrUpdate(user.uid, resumeData);

    res.status(200).json({
      message: "Resume saved successfully",
      resume,
    });
  } catch (error: any) {
    console.error("Error saving resume:", error);
    res.status(500).json({ error: error.message || "Failed to save resume" });
  }
};

/**
 * Get current user's resume
 */
export const getMyResume = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const resume = await resumeServices.getByUserId(user.uid);
    res.status(200).json({ resume });
  } catch (error: any) {
    if (error.message === "Resume not found") {
      return res.status(404).json({ error: "Resume not found" });
    }
    console.error("Error fetching resume:", error);
    res.status(500).json({ error: error.message || "Failed to fetch resume" });
  }
};

// ==================== NEW FEATURE CONTROLLERS ====================

/**
 * Update work preferences
 */
export const updateWorkPreferences = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const preferences: WorkPreferences = req.body;
    const resume = await resumeServices.updateWorkPreferences(user.uid, preferences);

    res.status(200).json({
      message: "Work preferences updated successfully",
      resume,
    });
  } catch (error: any) {
    console.error("Error updating work preferences:", error);
    res.status(500).json({ error: error.message || "Failed to update work preferences" });
  }
};

/**
 * Get work preferences
 */
export const getWorkPreferences = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const preferences = await resumeServices.getWorkPreferences(user.uid);
    res.status(200).json({ preferences });
  } catch (error: any) {
    console.error("Error fetching work preferences:", error);
    res.status(500).json({ error: error.message || "Failed to fetch work preferences" });
  }
};

/**
 * Update authorization information
 */
export const updateAuthorization = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const authorization: AuthorizationInfo = req.body;
    const resume = await resumeServices.updateAuthorization(user.uid, authorization);

    res.status(200).json({
      message: "Authorization information updated successfully",
      resume,
    });
  } catch (error: any) {
    console.error("Error updating authorization:", error);
    res.status(500).json({ error: error.message || "Failed to update authorization" });
  }
};

/**
 * Get authorization information
 */
export const getAuthorization = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const authorization = await resumeServices.getAuthorization(user.uid);
    res.status(200).json({ authorization });
  } catch (error: any) {
    console.error("Error fetching authorization:", error);
    res.status(500).json({ error: error.message || "Failed to fetch authorization" });
  }
};

/**
 * Update career goals
 */
export const updateCareerGoals = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const goals: CareerGoals = req.body;
    const resume = await resumeServices.updateCareerGoals(user.uid, goals);

    res.status(200).json({
      message: "Career goals updated successfully",
      resume,
    });
  } catch (error: any) {
    console.error("Error updating career goals:", error);
    res.status(500).json({ error: error.message || "Failed to update career goals" });
  }
};

// Additional documents locker
export const addAdditionalDocument = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.uid) return res.status(401).json({ error: "Authentication required" });

    const doc = req.body; // { fileUrl, publicId?, fileName, mimeType }
    if (!doc?.fileUrl || !doc?.fileName) {
      return res.status(400).json({ error: "fileUrl and fileName are required" });
    }

    const resume = await resumeServices.addAdditionalDocument(user.uid, {
      fileUrl: doc.fileUrl,
      publicId: doc.publicId,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      uploadedAt: new Date().toISOString(),
    });

    res.status(200).json({ message: "Document added", resume });
  } catch (error: any) {
    console.error("Error adding additional document:", error);
    res.status(500).json({ error: error.message || "Failed to add document" });
  }
};

export const removeAdditionalDocument = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.uid) return res.status(401).json({ error: "Authentication required" });

    const { publicId, fileUrl } = req.body;
    if (!publicId && !fileUrl) {
      return res.status(400).json({ error: "publicId or fileUrl required" });
    }

    const resume = await resumeServices.removeAdditionalDocument(user.uid, { publicId, fileUrl });
    res.status(200).json({ message: "Document removed", resume });
  } catch (error: any) {
    console.error("Error removing additional document:", error);
    res.status(500).json({ error: error.message || "Failed to remove document" });
  }
};

/**
 * Get career goals
 */
export const getCareerGoals = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const goals = await resumeServices.getCareerGoals(user.uid);
    res.status(200).json({ goals });
  } catch (error: any) {
    console.error("Error fetching career goals:", error);
    res.status(500).json({ error: error.message || "Failed to fetch career goals" });
  }
};

/**
 * Update external profiles
 */
export const updateExternalProfiles = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const profiles: ExternalProfiles = req.body;
    const resume = await resumeServices.updateExternalProfiles(user.uid, profiles);

    res.status(200).json({
      message: "External profiles updated successfully",
      resume,
    });
  } catch (error: any) {
    console.error("Error updating external profiles:", error);
    res.status(500).json({ error: error.message || "Failed to update external profiles" });
  }
};

/**
 * Get external profiles
 */
export const getExternalProfiles = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const profiles = await resumeServices.getExternalProfiles(user.uid);
    res.status(200).json({ profiles });
  } catch (error: any) {
    console.error("Error fetching external profiles:", error);
    res.status(500).json({ error: error.message || "Failed to fetch external profiles" });
  }
};

/**
 * Update multiple sections at once
 */
export const updateMultipleSections = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const updates = req.body;
    const resume = await resumeServices.updateMultipleSections(user.uid, updates);

    res.status(200).json({
      message: "Multiple sections updated successfully",
      resume,
    });
  } catch (error: any) {
    console.error("Error updating multiple sections:", error);
    res.status(500).json({ error: error.message || "Failed to update multiple sections" });
  }
};

/**
 * Get profile completion status
 */
export const getProfileCompletionStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const status = await resumeServices.getProfileCompletionStatus(user.uid);
    res.status(200).json({ status });
  } catch (error: any) {
    console.error("Error fetching profile completion status:", error);
    res.status(500).json({ error: error.message || "Failed to fetch profile completion status" });
  }
};

/**
 * Admin: fetch resume by user ID.
 */
export const getResumeByUserIdAdmin = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const resume = await resumeServices.getByUserId(userId);
    res.status(200).json({ resume });
  } catch (error: any) {
    if (error.message === "Resume not found") {
      return res.status(404).json({ error: "Resume not found" });
    }
    console.error("Error fetching resume by userId (admin):", error);
    res.status(500).json({ error: error.message || "Failed to fetch resume" });
  }
};

/**
 * Admin: review a single work-eligibility section for a student.
 */
export const reviewWorkEligibilitySection = async (req: Request, res: Response) => {
  try {
    const reviewer = (req as any).user;
    if (!reviewer || !reviewer.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { userId } = req.params;
    const { section, status, reviewNote } = req.body as {
      section: WorkEligibilitySectionKey;
      status: WorkEligibilityVerificationStatus;
      reviewNote?: string;
    };

    const allowedSections: WorkEligibilitySectionKey[] = [
      "drivingTransportation",
      "workAuthorizationDocumentation",
      "physicalWorkplaceRequirements",
      "schedulingWorkEnvironment",
      "drugTestingSafetyPolicies",
      "professionalLicensingCertifications",
      "roleBasedCompatibilitySensitive",
    ];
    const allowedStatuses: WorkEligibilityVerificationStatus[] = [
      "pending",
      "verified",
      "rejected",
    ];

    if (!allowedSections.includes(section)) {
      return res.status(400).json({ error: "Invalid section" });
    }
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid review status" });
    }

    const resume = await resumeServices.reviewWorkEligibilitySection(
      userId,
      section,
      status as Exclude<WorkEligibilityVerificationStatus, "self_reported">,
      reviewer.uid,
      reviewNote
    );

    res.status(200).json({
      message: "Work eligibility section reviewed successfully",
      resume,
    });
  } catch (error: any) {
    if (
      error?.message?.includes("Evidence is required") ||
      error?.message?.includes("self-attestation")
    ) {
      return res.status(400).json({ error: error.message });
    }
    console.error("Error reviewing work eligibility section:", error);
    res.status(500).json({ error: error.message || "Failed to review work eligibility section" });
  }
};

/**
 * Get resume by ID (for job applications - hiring manager can view)
 */
export const getResumeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resume = await resumeServices.getById(id);
    res.status(200).json({ resume });
  } catch (error: any) {
    console.error("Error fetching resume:", error);
    res.status(404).json({ error: error.message || "Resume not found" });
  }
};

/**
 * Update resume (Student)
 */
export const updateResume = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const resume = await resumeServices.getByUserId(user.uid);
    const updatedResume = await resumeServices.update(resume.id, req.body);

    res.status(200).json({
      message: "Resume updated successfully",
      resume: updatedResume,
    });
  } catch (error: any) {
    if (error.message === "Resume not found") {
      return res.status(404).json({ error: "Resume not found. Please create a resume first." });
    }
    console.error("Error updating resume:", error);
    res.status(500).json({ error: error.message || "Failed to update resume" });
  }
};

/**
 * Delete resume (Student)
 */
export const deleteResume = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    await resumeServices.deleteByUserId(user.uid);
    res.status(200).json({ message: "Resume deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting resume:", error);
    res.status(500).json({ error: error.message || "Failed to delete resume" });
  }
};

/**
 * Update skills in resume (Student)
 */
export const updateResumeSkills = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { skills } = req.body;
    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: "Skills must be an array" });
    }

    const resume = await resumeServices.getByUserId(user.uid);
    const updatedResume = await resumeServices.update(resume.id, { skills });

    res.status(200).json({
      message: "Skills updated successfully",
      resume: updatedResume,
    });
  } catch (error: any) {
    if (error.message === "Resume not found") {
      return res.status(404).json({ error: "Resume not found. Please create a resume first." });
    }
    console.error("Error updating skills:", error);
    res.status(500).json({ error: error.message || "Failed to update skills" });
  }
};

/**
 * Update education (Student)
 */
export const updateEducation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { education } = req.body;
    if (!Array.isArray(education)) {
      return res.status(400).json({ error: "Education must be an array" });
    }

    const resume = await resumeServices.getByUserId(user.uid);
    const updatedResume = await resumeServices.update(resume.id, { education });

    res.status(200).json({
      message: "Education updated successfully",
      resume: updatedResume,
    });
  } catch (error: any) {
    if (error.message === "Resume not found") {
      return res.status(404).json({ error: "Resume not found. Please create a resume first." });
    }
    console.error("Error updating education:", error);
    res.status(500).json({ error: error.message || "Failed to update education" });
  }
};

/**
 * Get education (Student)
 */
export const getEducation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const resume = await resumeServices.getByUserId(user.uid);
    res.status(200).json({ education: resume.education || [] });
  } catch (error: any) {
    if (error.message === "Resume not found") {
      return res.status(404).json({ error: "Resume not found" });
    }
    console.error("Error fetching education:", error);
    res.status(500).json({ error: error.message || "Failed to fetch education" });
  }
};

/**
 * Update certifications (Student)
 */
export const updateCertifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { certifications } = req.body;
    if (!Array.isArray(certifications)) {
      return res.status(400).json({ error: "Certifications must be an array" });
    }

    const resume = await resumeServices.getByUserId(user.uid);
    const updatedResume = await resumeServices.update(resume.id, { certifications });

    res.status(200).json({
      message: "Certifications updated successfully",
      resume: updatedResume,
    });
  } catch (error: any) {
    if (error.message === "Resume not found") {
      return res.status(404).json({ error: "Resume not found. Please create a resume first." });
    }
    console.error("Error updating certifications:", error);
    res.status(500).json({ error: error.message || "Failed to update certifications" });
  }
};

/**
 * Get certifications (Student)
 */
export const getCertifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const resume = await resumeServices.getByUserId(user.uid);
    res.status(200).json({ certifications: resume.certifications || [] });
  } catch (error: any) {
    if (error.message === "Resume not found") {
      return res.status(404).json({ error: "Resume not found" });
    }
    console.error("Error fetching certifications:", error);
    res.status(500).json({ error: error.message || "Failed to fetch certifications" });
  }
};
