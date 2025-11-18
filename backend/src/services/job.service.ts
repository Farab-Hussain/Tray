import { db } from "../config/firebase";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { Job, JobInput, JobCard } from "../models/job.model";

const COLLECTION = "jobs";

export const jobServices = {
  /**
   * Create a new job posting
   */
  async create(data: JobInput, postedBy: string): Promise<Job> {
    const jobRef = db.collection(COLLECTION).doc();
    const now = Timestamp.now();
    
    const jobData: Job = {
      id: jobRef.id,
      postedBy,
      ...data,
      status: data.status || "active",
      applicationCount: 0,
      goldApplicantsCount: 0,
      silverApplicantsCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await jobRef.set(jobData);
    return jobData;
  },

  /**
   * Get all jobs with pagination and filtering
   */
  async getAll(filters?: {
    status?: "active" | "closed" | "draft";
    jobType?: string;
    location?: string;
    page?: number;
    limit?: number;
  }): Promise<{ jobs: Job[]; total: number }> {
    let query: FirebaseFirestore.Query = db.collection(COLLECTION);

    // Apply filters
    if (filters?.status) {
      query = query.where("status", "==", filters.status);
    }
    if (filters?.jobType) {
      query = query.where("jobType", "==", filters.jobType);
    }
    if (filters?.location) {
      query = query.where("location", "==", filters.location);
    }

    // Order by creation date (newest first)
    query = query.orderBy("createdAt", "desc");

    const snapshot = await query.get();
    const allJobs = snapshot.docs.map(doc => doc.data() as Job);

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedJobs = allJobs.slice(startIndex, endIndex);

    return {
      jobs: paginatedJobs,
      total: allJobs.length,
    };
  },

  /**
   * Get job by ID
   */
  async getById(id: string): Promise<Job> {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      throw new Error("Job not found");
    }
    return doc.data() as Job;
  },

  /**
   * Get jobs posted by a specific user
   */
  async getByPostedBy(postedBy: string): Promise<Job[]> {
    try {
      // Fetch all jobs by postedBy (without orderBy to avoid index requirement)
      const snapshot = await db.collection(COLLECTION)
        .where("postedBy", "==", postedBy)
        .get();

      // Sort in memory by createdAt (newest first)
      const jobs = snapshot.docs
        .map(doc => doc.data() as Job)
        .sort((a, b) => {
          // Handle Timestamp objects from Firestore Admin SDK
          let aTime = 0;
          let bTime = 0;
          
          if (a.createdAt) {
            if (a.createdAt instanceof Timestamp) {
              aTime = a.createdAt.toMillis();
            } else if ((a.createdAt as any)?._seconds) {
              aTime = (a.createdAt as any)._seconds * 1000 + ((a.createdAt as any)?._nanoseconds || 0) / 1000000;
            }
          }
          
          if (b.createdAt) {
            if (b.createdAt instanceof Timestamp) {
              bTime = b.createdAt.toMillis();
            } else if ((b.createdAt as any)?._seconds) {
              bTime = (b.createdAt as any)._seconds * 1000 + ((b.createdAt as any)?._nanoseconds || 0) / 1000000;
            }
          }
          
          return bTime - aTime; // Descending order (newest first)
        });

      return jobs;
    } catch (error: any) {
      console.error("Error in getByPostedBy:", error);
      // If the query fails, try without orderBy
      const snapshot = await db.collection(COLLECTION)
        .where("postedBy", "==", postedBy)
        .get();
      
      return snapshot.docs.map(doc => doc.data() as Job);
    }
  },

  /**
   * Update job
   */
  async update(id: string, data: Partial<JobInput>): Promise<Job> {
    const jobRef = db.collection(COLLECTION).doc(id);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      throw new Error("Job not found");
    }

    await jobRef.update({
      ...data,
      updatedAt: Timestamp.now(),
    });

    const updated = await jobRef.get();
    return updated.data() as Job;
  },

  /**
   * Delete job
   */
  async delete(id: string): Promise<void> {
    const jobRef = db.collection(COLLECTION).doc(id);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      throw new Error("Job not found");
    }

    await jobRef.delete();
  },

  /**
   * Increment application count
   */
  async incrementApplicationCount(id: string, rating?: "gold" | "silver"): Promise<void> {
    const jobRef = db.collection(COLLECTION).doc(id);
    const updateData: any = {
      applicationCount: FieldValue.increment(1),
    };

    if (rating === "gold") {
      updateData.goldApplicantsCount = FieldValue.increment(1);
    } else if (rating === "silver") {
      updateData.silverApplicantsCount = FieldValue.increment(1);
    }

    await jobRef.update(updateData);
  },

  /**
   * Search jobs by title, skills, or location
   */
  async search(searchTerm: string, filters?: {
    status?: "active" | "closed" | "draft";
    page?: number;
    limit?: number;
  }): Promise<{ jobs: Job[]; total: number }> {
    let query: FirebaseFirestore.Query = db.collection(COLLECTION);

    if (filters?.status) {
      query = query.where("status", "==", filters.status);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();
    const allJobs = snapshot.docs.map(doc => doc.data() as Job);

    // Client-side filtering for search (Firestore doesn't support full-text search)
    const searchLower = searchTerm.toLowerCase();
    const filteredJobs = allJobs.filter(job => {
      return (
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        job.requiredSkills.some(skill => skill.toLowerCase().includes(searchLower))
      );
    });

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

    return {
      jobs: paginatedJobs,
      total: filteredJobs.length,
    };
  },
};

