// src/controllers/resume.controller.ts
import { Request, Response } from "express";
import { resumeServices } from "../services/resume.service";
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

