import { db } from "../config/firebase";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { Job, JobInput, JobCard } from "../models/job.model";
import {
  JobAISnapshot,
  JobAISnapshotInput,
  JobAISnapshotSummary,
} from "../models/jobAiSnapshot.model";

const COLLECTION = "jobs";
const SNAPSHOT_COLLECTION = "jobAiSnapshots";

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

  
    // Get all jobs with pagination and filtering

  async getAll(filters?: {
    status?: "active" | "closed" | "draft";
    jobType?: string;
    location?: string;
    page?: number;
    limit?: number;
  }): Promise<{ jobs: Job[]; total: number }> {
    try {
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


      try {
        query = query.orderBy("createdAt", "desc");
        const snapshot = await query.get();
        const allJobs = snapshot.docs
          .map(doc => {
            try {
              const data = doc.data() as Job;
              // Ensure required fields exist
              if (!data.id) {
                data.id = doc.id;
              }
              if (!data.requiredSkills) {
                data.requiredSkills = [];
              }
              return data;
            } catch (error) {
              console.error(`Error processing job document ${doc.id}:`, error);
              return null;
            }
          })
          .filter((job): job is Job => job !== null);


        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        const paginatedJobs = allJobs.slice(startIndex, endIndex);

        return {
          jobs: paginatedJobs,
          total: allJobs.length,
        };
      } catch (orderByError: any) {
        // If orderBy fails (likely due to missing index), fetch without orderBy and sort in memory
        console.warn("orderBy failed, sorting in memory:", orderByError.message);

        // Rebuild query without orderBy
        query = db.collection(COLLECTION);
        if (filters?.status) {
          query = query.where("status", "==", filters.status);
        }
        if (filters?.jobType) {
          query = query.where("jobType", "==", filters.jobType);
        }
        if (filters?.location) {
          query = query.where("location", "==", filters.location);
        }

        const snapshot = await query.get();
        const allJobs = snapshot.docs
          .map(doc => {
            try {
              const data = doc.data() as Job;
              // Ensure required fields exist
              if (!data.id) {
                data.id = doc.id;
              }
              if (!data.requiredSkills) {
                data.requiredSkills = [];
              }
              return data;
            } catch (error) {
              console.error(`Error processing job document ${doc.id}:`, error);
              return null;
            }
          })
          .filter((job): job is Job => job !== null) // Remove null entries
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
      }
    } catch (error: any) {
      console.error("Error in getAll jobs:", error);
      throw error;
    }
  },

  /**
   * Get job by ID
   */
  async getById(id: string): Promise<Job> {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      throw new Error("Job not found");
    }
    const data = doc.data() as Job;
    // Ensure required fields exist
    if (!data.id) {
      data.id = doc.id;
    }
    if (!data.requiredSkills) {
      data.requiredSkills = [];
    }
    if (!data.status) {
      data.status = "active";
    }
    return data;
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
    try {
      const jobRef = db.collection(COLLECTION).doc(id);
      // Verify job exists before updating
      const jobDoc = await jobRef.get();
      if (!jobDoc.exists) {
        console.warn(`Job ${id} not found when trying to increment application count`);
        return; // Don't throw - this is a non-critical operation
      }

      const updateData: any = {
        applicationCount: FieldValue.increment(1),
      };

      if (rating === "gold") {
        updateData.goldApplicantsCount = FieldValue.increment(1);
      } else if (rating === "silver") {
        updateData.silverApplicantsCount = FieldValue.increment(1);
      }

      await jobRef.update(updateData);
    } catch (error: any) {
      // Log error but don't throw - this is a non-critical operation
      console.error(`Error incrementing application count for job ${id}:`, error.message);
      // Don't throw - application was already created successfully
    }
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

  async saveAISnapshot(
    jobId: string,
    createdBy: string,
    data: JobAISnapshotInput,
  ): Promise<JobAISnapshot> {
    const now = Timestamp.now();
    const snapshotRef = db.collection(SNAPSHOT_COLLECTION).doc();
    const ranking = Array.isArray(data.ranking) ? data.ranking : [];
    const safeScores = ranking
      .map(item => item.overallRankScore)
      .filter((score): score is number => typeof score === "number");
    const readyNowCount = ranking.filter(item => item.readyNow).length;
    const averageRankScore = safeScores.length
      ? Math.round(
          safeScores.reduce((sum, score) => sum + score, 0) / safeScores.length,
        )
      : 0;
    const summary: JobAISnapshotSummary = {
      candidateCount: ranking.length,
      readyNowCount,
      averageRankScore,
      shortageDetected: !!data.shortage?.detected,
    };

    const snapshot: JobAISnapshot = {
      id: snapshotRef.id,
      jobId,
      createdBy,
      provider: data.provider,
      trigger: data.trigger || "manual",
      ranking,
      shortage: {
        detected: !!data.shortage?.detected,
        alerts: data.shortage?.alerts || [],
        relaxNonEssentialRequirements:
          data.shortage?.relaxNonEssentialRequirements || [],
        consultingServiceActions: data.shortage?.consultingServiceActions || [],
      },
      metadata: data.metadata || {},
      summary,
      createdAt: now,
      updatedAt: now,
    };

    await snapshotRef.set(snapshot);
    return snapshot;
  },

  async getAISnapshots(
    jobId: string,
    createdBy: string,
    limit: number = 20,
  ): Promise<{
    snapshots: JobAISnapshot[];
    trend: {
      totalSnapshots: number;
      latestReadyNowCount: number;
      previousReadyNowCount: number;
      readyNowDelta: number;
      latestAverageRankScore: number;
      previousAverageRankScore: number;
      averageRankScoreDelta: number;
      latestShortageDetected: boolean;
    };
  }> {
    const safeLimit = Math.max(1, Math.min(limit, 50));
    let snapshots: JobAISnapshot[] = [];

    try {
      const snapshot = await db
        .collection(SNAPSHOT_COLLECTION)
        .where("jobId", "==", jobId)
        .where("createdBy", "==", createdBy)
        .orderBy("createdAt", "desc")
        .limit(safeLimit)
        .get();
      snapshots = snapshot.docs.map(doc => doc.data() as JobAISnapshot);
    } catch (error: any) {
      console.warn("Falling back to in-memory snapshot sort:", error?.message);
      const fallback = await db
        .collection(SNAPSHOT_COLLECTION)
        .where("jobId", "==", jobId)
        .where("createdBy", "==", createdBy)
        .limit(safeLimit)
        .get();
      snapshots = fallback.docs
        .map(doc => doc.data() as JobAISnapshot)
        .sort((a, b) => {
          const aMs = a?.createdAt?.toMillis?.() || 0;
          const bMs = b?.createdAt?.toMillis?.() || 0;
          return bMs - aMs;
        });
    }

    const latest = snapshots[0];
    const previous = snapshots[1];

    const latestReadyNowCount = latest?.summary?.readyNowCount || 0;
    const previousReadyNowCount = previous?.summary?.readyNowCount || 0;
    const latestAverageRankScore = latest?.summary?.averageRankScore || 0;
    const previousAverageRankScore = previous?.summary?.averageRankScore || 0;

    return {
      snapshots,
      trend: {
        totalSnapshots: snapshots.length,
        latestReadyNowCount,
        previousReadyNowCount,
        readyNowDelta: latestReadyNowCount - previousReadyNowCount,
        latestAverageRankScore,
        previousAverageRankScore,
        averageRankScoreDelta:
          latestAverageRankScore - previousAverageRankScore,
        latestShortageDetected: !!latest?.summary?.shortageDetected,
      },
    };
  },

  // ==================== PAYMENT ENFORCEMENT METHODS ====================

  /**
   * Check if job posting payment is required for user
   */
  async checkJobPostingPayment(userId: string): Promise<{
    required: boolean;
    paid: boolean;
    amount?: number;
    paymentUrl?: string;
    subscriptionActive?: boolean;
  }> {
    try {
      console.log(`🔍 [Payment Check] Checking payment for user: ${userId}`);
      
      // Check if user has active subscription (Phase 2 feature - placeholder)
      const subscriptionActive = false; // TODO: Implement subscription check

      // Check if user already paid for this job posting
      // Note: Each job posting requires separate payment - no bulk payments
      const paymentSnapshot = await db
        .collection("jobPostingPayments")
        .where("userId", "==", userId)
        .where("status", "==", "paid")
        .where("expiresAt", ">", Timestamp.now())
        .limit(1)
        .get();

      // For now, always require payment for each job posting
      // TODO: Implement subscription-based or bulk payment options
      const hasValidPayment = false; // Force payment requirement for testing

      // Job posting fee: $1.00 per post
      const JOB_POSTING_FEE = 100; // $1.00 in cents

      const result = {
        required: !subscriptionActive, // Free for subscribers
        paid: hasValidPayment,
        amount: subscriptionActive ? 0 : JOB_POSTING_FEE,
        paymentUrl: hasValidPayment ? undefined : "/payment/job-posting",
        subscriptionActive,
      };

      console.log(`🔍 [Payment Check] Result:`, result);
      return result;
    } catch (error) {
      console.error("Error checking job posting payment:", error);
      // Default to requiring payment if check fails
      const fallbackResult = {
        required: true,
        paid: false,
        amount: 100,
        paymentUrl: "/payment/job-posting",
        subscriptionActive: false,
      };
      console.log(`🔍 [Payment Check] Fallback result:`, fallbackResult);
      return fallbackResult;
    }
  },

  /**
   * Record job posting payment
   */
  async recordJobPostingPayment(userId: string, paymentId: string, amount: number): Promise<void> {
    const paymentRef = db.collection("jobPostingPayments").doc();
    const now = Timestamp.now();

    // Payment valid for 30 days
    const expiresAt = new Timestamp(now.seconds + (30 * 24 * 60 * 60), now.nanoseconds);

    await paymentRef.set({
      id: paymentRef.id,
      userId,
      paymentId,
      amount,
      status: "paid",
      createdAt: now,
      expiresAt,
    });
  },

  /**
   * Get user's job posting payment history
   */
  async getJobPostingPaymentHistory(userId: string): Promise<{
    id: string;
    paymentId: string;
    amount: number;
    status: string;
    createdAt: Timestamp;
    expiresAt?: Timestamp;
  }[]> {
    const snapshot = await db
      .collection("jobPostingPayments")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
  },
};
