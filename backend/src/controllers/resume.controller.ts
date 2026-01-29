// src/controllers/resume.controller.ts
import { Request, Response } from "express";
import { resumeServices, WorkPreferences, AuthorizationInfo, CareerGoals, ExternalProfiles } from "../services/resume.service";
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

