// src/services/review.service.ts
import { db } from "../config/firebase";
import { Review } from "../models/review.model";

const COLLECTION = "reviews";

export const reviewServices = {
  // Create a new review
  async create(reviewData: Omit<Review, "id" | "createdAt" | "updatedAt">) {
    const reviewRef = db.collection(COLLECTION).doc();
    const now = new Date().toISOString();

    const newReview = {
      id: reviewRef.id,
      ...reviewData,
      createdAt: now,
      updatedAt: now,
    };

    await reviewRef.set(newReview);
    return newReview;
  },

  // Get review by ID
  async getById(id: string) {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      throw new Error("Review not found");
    }
    return doc.data() as Review;
  },

  // Get all reviews for a consultant
  async getByConsultantId(consultantId: string) {
    const snapshot = await db
      .collection(COLLECTION)
      .where("consultantId", "==", consultantId)
      .get();

    // Sort in memory instead of Firestore (to avoid index requirement)
    const reviews = snapshot.docs.map((doc) => doc.data() as Review);
    return reviews.sort((a, b) => {
      const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt.toDate().getTime();
      const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt.toDate().getTime();
      return dateB - dateA; // Descending order
    });
  },

  // Get all reviews by a student
  async getByStudentId(studentId: string) {
    const snapshot = await db
      .collection(COLLECTION)
      .where("studentId", "==", studentId)
      .get();

    // Sort in memory instead of Firestore
    const reviews = snapshot.docs.map((doc) => doc.data() as Review);
    return reviews.sort((a, b) => {
      const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt.toDate().getTime();
      const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt.toDate().getTime();
      return dateB - dateA;
    });
  },

  // Get review by student and consultant (to check if already reviewed)
  async getByStudentAndConsultant(studentId: string, consultantId: string) {
    const snapshot = await db
      .collection(COLLECTION)
      .where("studentId", "==", studentId)
      .where("consultantId", "==", consultantId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }
    return snapshot.docs[0].data() as Review;
  },

  // Update a review
  async update(id: string, updates: Partial<Review>) {
    await db
      .collection(COLLECTION)
      .doc(id)
      .update({
        ...updates,
        updatedAt: new Date().toISOString(),
      });

    return this.getById(id);
  },

  // Delete a review
  async delete(id: string) {
    await db.collection(COLLECTION).doc(id).delete();
  },

  // Get all reviews (for admin)
  async getAll() {
    const snapshot = await db
      .collection(COLLECTION)
      .get();

    // Sort in memory instead of Firestore
    const reviews = snapshot.docs.map((doc) => doc.data() as Review);
    return reviews.sort((a, b) => {
      const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt.toDate().getTime();
      const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt.toDate().getTime();
      return dateB - dateA;
    });
  },
};

