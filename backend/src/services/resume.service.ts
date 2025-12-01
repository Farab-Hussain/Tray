import { db } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { Resume, ResumeInput } from "../models/resume.model";

const COLLECTION = "resumes";

export const resumeServices = {
  /**
   * Create or update resume (upsert)
   */
  async createOrUpdate(userId: string, data: ResumeInput): Promise<Resume> {
    // Check if resume exists
    const existingResume = await this.getByUserId(userId).catch(() => null);

    if (existingResume) {
      // Update existing resume
      return this.update(existingResume.id, data);
    } else {
      // Create new resume
      const resumeRef = db.collection(COLLECTION).doc();
      const now = Timestamp.now();

      const resumeData: Resume = {
        id: resumeRef.id,
        userId,
        ...data,
        createdAt: now,
        updatedAt: now,
      };

      await resumeRef.set(resumeData);
      return resumeData;
    }
  },

  /**
   * Get resume by user ID
   */
  async getByUserId(userId: string): Promise<Resume> {
    const snapshot = await db.collection(COLLECTION)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error("Resume not found");
    }

    const doc = snapshot.docs[0];
    const data = doc.data() as Resume;
    // Ensure required fields exist
    if (!data.id) {
      data.id = doc.id;
    }
    if (!data.skills) {
      data.skills = [];
    }
    if (!data.userId) {
      data.userId = userId;
    }
    return data;
  },

  /**
   * Get resume by ID
   */
  async getById(id: string): Promise<Resume> {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      throw new Error("Resume not found");
    }
    const data = doc.data() as Resume;
    // Ensure required fields exist
    if (!data.id) {
      data.id = doc.id;
    }
    if (!data.skills) {
      data.skills = [];
    }
    if (!data.userId) {
      throw new Error("Resume missing userId field");
    }
    return data;
  },

  /**
   * Update resume
   */
  async update(id: string, data: Partial<ResumeInput>): Promise<Resume> {
    const resumeRef = db.collection(COLLECTION).doc(id);
    const resumeDoc = await resumeRef.get();

    if (!resumeDoc.exists) {
      throw new Error("Resume not found");
    }

    await resumeRef.update({
      ...data,
      updatedAt: Timestamp.now(),
    });

    const updated = await resumeRef.get();
    return updated.data() as Resume;
  },

  /**
   * Delete resume
   */
  async delete(id: string): Promise<void> {
    const resumeRef = db.collection(COLLECTION).doc(id);
    const resumeDoc = await resumeRef.get();

    if (!resumeDoc.exists) {
      throw new Error("Resume not found");
    }

    await resumeRef.delete();
  },

  /**
   * Delete resume by user ID
   */
  async deleteByUserId(userId: string): Promise<void> {
    const snapshot = await db.collection(COLLECTION)
      .where("userId", "==", userId)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  },
};

