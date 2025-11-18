import { db } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { JobApplication, JobApplicationInput, JobApplicationWithDetails } from "../models/jobApplication.model";
import { getRatingPriority } from "../utils/skillMatching";

const COLLECTION = "jobApplications";

export const jobApplicationServices = {
  /**
   * Create a new job application
   */
  async create(data: JobApplicationInput, userId: string, matchResult: {
    score: number;
    rating: "gold" | "silver" | "bronze" | "basic";
    matchedSkills: string[];
    missingSkills: string[];
  }): Promise<JobApplication> {
    const applicationRef = db.collection(COLLECTION).doc();
    const now = Timestamp.now();

    const applicationData: JobApplication = {
      id: applicationRef.id,
      jobId: data.jobId,
      userId,
      resumeId: data.resumeId,
      coverLetter: data.coverLetter,
      matchScore: matchResult.score,
      matchRating: matchResult.rating,
      matchedSkills: matchResult.matchedSkills,
      missingSkills: matchResult.missingSkills,
      status: "pending",
      appliedAt: now,
    };

    await applicationRef.set(applicationData);
    return applicationData;
  },

  /**
   * Get applications for a specific job (sorted by match rating - Gold first)
   * CRITICAL: Applications are sorted by matchRating priority
   */
  async getByJobId(jobId: string): Promise<JobApplication[]> {
    const snapshot = await db.collection(COLLECTION)
      .where("jobId", "==", jobId)
      .get();

    const applications = snapshot.docs.map(doc => doc.data() as JobApplication);

    // Sort by match rating: Gold first, then Silver, then Bronze, then Basic
    applications.sort((a, b) => {
      const priorityA = getRatingPriority(a.matchRating);
      const priorityB = getRatingPriority(b.matchRating);
      
      // If same rating, sort by match score (higher first), then by applied date (newest first)
      if (priorityA === priorityB) {
        if (a.matchScore !== b.matchScore) {
          return b.matchScore - a.matchScore; // Higher score first
        }
        // Newest first
        return b.appliedAt.toMillis() - a.appliedAt.toMillis();
      }
      
      return priorityA - priorityB; // Lower priority number = higher priority
    });

    return applications;
  },

  /**
   * Get applications with populated user and resume data (for hiring manager view)
   */
  async getByJobIdWithDetails(jobId: string): Promise<JobApplicationWithDetails[]> {
    const applications = await this.getByJobId(jobId);

    // Populate user and resume data
    const applicationsWithDetails = await Promise.all(
      applications.map(async (app) => {
        try {
          // Get user data
          const userDoc = await db.collection("users").doc(app.userId).get();
          const userData = userDoc.exists ? userDoc.data() : null;

          // Get resume data
          const resumeDoc = await db.collection("resumes").doc(app.resumeId).get();
          const resumeData = resumeDoc.exists ? resumeDoc.data() : null;

          // Get job data
          const jobDoc = await db.collection("jobs").doc(app.jobId).get();
          const jobData = jobDoc.exists ? jobDoc.data() : null;

          const details: JobApplicationWithDetails = {
            ...app,
            user: userData ? {
              uid: userData.uid || app.userId,
              name: userData.name || "",
              email: userData.email || "",
              profileImage: userData.profileImage,
            } : undefined,
            resume: resumeData ? {
              id: resumeData.id || app.resumeId,
              skills: resumeData.skills || [],
              experience: resumeData.experience || [],
              education: resumeData.education || [],
              resumeFileUrl: resumeData.resumeFileUrl,
            } : undefined,
            job: jobData ? {
              id: jobData.id || app.jobId,
              title: jobData.title || "",
              company: jobData.company || "",
              requiredSkills: jobData.requiredSkills || [],
            } : undefined,
          };

          return details;
        } catch (error) {
          console.error(`Error populating application ${app.id}:`, error);
          return { ...app } as JobApplicationWithDetails;
        }
      })
    );

    return applicationsWithDetails;
  },

  /**
   * Get applications by user ID
   */
  async getByUserId(userId: string): Promise<JobApplication[]> {
    const snapshot = await db.collection(COLLECTION)
      .where("userId", "==", userId)
      .orderBy("appliedAt", "desc")
      .get();

    return snapshot.docs.map(doc => doc.data() as JobApplication);
  },

  /**
   * Get application by ID
   */
  async getById(id: string): Promise<JobApplication> {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      throw new Error("Application not found");
    }
    return doc.data() as JobApplication;
  },

  /**
   * Update application status
   */
  async updateStatus(
    id: string,
    status: "pending" | "reviewed" | "shortlisted" | "rejected" | "hired",
    reviewNotes?: string
  ): Promise<JobApplication> {
    const applicationRef = db.collection(COLLECTION).doc(id);
    const applicationDoc = await applicationRef.get();

    if (!applicationDoc.exists) {
      throw new Error("Application not found");
    }

    const updateData: any = {
      status,
      reviewedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    if (reviewNotes) {
      updateData.reviewNotes = reviewNotes;
    }

    await applicationRef.update(updateData);

    const updated = await applicationRef.get();
    return updated.data() as JobApplication;
  },

  /**
   * Check if user has already applied to a job
   */
  async hasUserApplied(jobId: string, userId: string): Promise<boolean> {
    const snapshot = await db.collection(COLLECTION)
      .where("jobId", "==", jobId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    return !snapshot.empty;
  },
};

