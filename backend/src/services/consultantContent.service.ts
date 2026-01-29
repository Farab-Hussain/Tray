// src/services/consultantContent.service.ts
import { db } from "../config/firebase";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { ConsultantContent, ConsultantContentInput, ContentRating } from "../models/consultantContent.model";

const COLLECTION = "consultantContent";
const RATINGS_COLLECTION = "contentRatings";

export const consultantContentService = {
  /**
   * Create new content
   */
  async create(contentData: ConsultantContentInput, consultantId: string): Promise<ConsultantContent> {
    const contentRef = db.collection(COLLECTION).doc();
    const now = Timestamp.now();

    const content: ConsultantContent = {
      id: contentRef.id,
      consultantId,
      ...contentData,
      status: 'pending', // Requires admin approval
      viewCount: 0,
      downloadCount: 0,
      likeCount: 0,
      rating: 0,
      ratingCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await contentRef.set(content);
    return content;
  },

  /**
   * Get content by ID
   */
  async getById(contentId: string): Promise<ConsultantContent> {
    const doc = await db.collection(COLLECTION).doc(contentId).get();
    if (!doc.exists) {
      throw new Error("Content not found");
    }
    return { id: doc.id, ...doc.data() } as ConsultantContent;
  },

  /**
   * Get all content by consultant
   */
  async getByConsultant(consultantId: string, filters?: {
    status?: string;
    contentType?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{ content: ConsultantContent[]; total: number }> {
    let query: FirebaseFirestore.Query = db.collection(COLLECTION)
      .where("consultantId", "==", consultantId);

    // Apply filters
    if (filters?.status) {
      query = query.where("status", "==", filters.status);
    }
    if (filters?.contentType) {
      query = query.where("contentType", "==", filters.contentType);
    }
    if (filters?.category) {
      query = query.where("category", "==", filters.category);
    }

    // Order by creation date
    query = query.orderBy("createdAt", "desc");

    const snapshot = await query.get();
    const allContent = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ConsultantContent[];

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedContent = allContent.slice(startIndex, endIndex);

    return {
      content: paginatedContent,
      total: allContent.length,
    };
  },

  /**
   * Get published content (for students/public)
   */
  async getPublishedContent(filters?: {
    contentType?: string;
    category?: string;
    tags?: string[];
    isFree?: boolean;
    consultantId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ content: ConsultantContent[]; total: number }> {
    let query: FirebaseFirestore.Query = db.collection(COLLECTION)
      .where("status", "==", "published");

    // Apply filters
    if (filters?.contentType) {
      query = query.where("contentType", "==", filters.contentType);
    }
    if (filters?.category) {
      query = query.where("category", "==", filters.category);
    }
    if (filters?.isFree !== undefined) {
      query = query.where("isFree", "==", filters.isFree);
    }
    if (filters?.consultantId) {
      query = query.where("consultantId", "==", filters.consultantId);
    }

    // Order by rating and views
    query = query.orderBy("rating", "desc").orderBy("viewCount", "desc");

    const snapshot = await query.get();
    let allContent = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ConsultantContent[];

    // Filter by tags (client-side since Firestore doesn't support array contains with multiple values)
    if (filters?.tags && filters.tags.length > 0) {
      allContent = allContent.filter(content => 
        filters.tags!.some(tag => content.tags.includes(tag))
      );
    }

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedContent = allContent.slice(startIndex, endIndex);

    return {
      content: paginatedContent,
      total: allContent.length,
    };
  },

  /**
   * Update content
   */
  async update(contentId: string, consultantId: string, updates: Partial<ConsultantContentInput>): Promise<ConsultantContent> {
    const contentRef = db.collection(COLLECTION).doc(contentId);
    const contentDoc = await contentRef.get();

    if (!contentDoc.exists) {
      throw new Error("Content not found");
    }

    const content = contentDoc.data() as ConsultantContent;
    
    // Verify ownership
    if (content.consultantId !== consultantId) {
      throw new Error("Access denied");
    }

    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
      // If content was published and is being updated, set back to pending
      status: content.status === 'published' ? 'pending' : content.status,
    };

    await contentRef.update(updateData);

    const updatedDoc = await contentRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as ConsultantContent;
  },

  /**
   * Delete content
   */
  async delete(contentId: string, consultantId: string): Promise<void> {
    const contentRef = db.collection(COLLECTION).doc(contentId);
    const contentDoc = await contentRef.get();

    if (!contentDoc.exists) {
      throw new Error("Content not found");
    }

    const content = contentDoc.data() as ConsultantContent;
    
    // Verify ownership
    if (content.consultantId !== consultantId) {
      throw new Error("Access denied");
    }

    await contentRef.delete();
  },

  /**
   * Approve content (Admin only)
   */
  async approveContent(contentId: string, adminId: string): Promise<ConsultantContent> {
    const contentRef = db.collection(COLLECTION).doc(contentId);
    
    await contentRef.update({
      status: 'published',
      approvedBy: adminId,
      approvedAt: Timestamp.now(),
      publishedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const updatedDoc = await contentRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as ConsultantContent;
  },

  /**
   * Reject content (Admin only)
   */
  async rejectContent(contentId: string, adminId: string, reason: string): Promise<ConsultantContent> {
    const contentRef = db.collection(COLLECTION).doc(contentId);
    
    await contentRef.update({
      status: 'rejected',
      approvedBy: adminId,
      rejectionReason: reason,
      updatedAt: Timestamp.now(),
    });

    const updatedDoc = await contentRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as ConsultantContent;
  },

  /**
   * Get pending content (Admin only)
   */
  async getPendingContent(): Promise<ConsultantContent[]> {
    const snapshot = await db.collection(COLLECTION)
      .where("status", "==", "pending")
      .orderBy("createdAt", "asc")
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ConsultantContent[];
  },

  /**
   * Increment view count
   */
  async incrementViewCount(contentId: string): Promise<void> {
    await db.collection(COLLECTION).doc(contentId).update({
      viewCount: FieldValue.increment(1),
    });
  },

  /**
   * Increment download count
   */
  async incrementDownloadCount(contentId: string): Promise<void> {
    await db.collection(COLLECTION).doc(contentId).update({
      downloadCount: FieldValue.increment(1),
    });
  },

  /**
   * Add or update rating
   */
  async addRating(contentId: string, userId: string, rating: number, comment?: string): Promise<void> {
    const ratingRef = db.collection(RATINGS_COLLECTION).doc();
    const now = Timestamp.now();

    // Check if user already rated
    const existingRating = await db.collection(RATINGS_COLLECTION)
      .where("contentId", "==", contentId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (!existingRating.empty) {
      // Update existing rating
      const ratingDoc = existingRating.docs[0];
      await ratingDoc.ref.update({
        rating,
        comment,
        createdAt: now,
      });
    } else {
      // Create new rating
      await ratingRef.set({
        id: ratingRef.id,
        contentId,
        userId,
        rating,
        comment,
        createdAt: now,
      });
    }

    // Update content rating average
    await this.updateContentRating(contentId);
  },

  /**
   * Update content rating average
   */
  async updateContentRating(contentId: string): Promise<void> {
    const ratingsSnapshot = await db.collection(RATINGS_COLLECTION)
      .where("contentId", "==", contentId)
      .get();

    const ratings = ratingsSnapshot.docs.map(doc => doc.data() as ContentRating);
    
    if (ratings.length > 0) {
      const averageRating = ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length;
      
      await db.collection(COLLECTION).doc(contentId).update({
        rating: averageRating,
        ratingCount: ratings.length,
      });
    }
  },

  /**
   * Get content statistics for consultant
   */
  async getConsultantStats(consultantId: string): Promise<{
    totalContent: number;
    publishedContent: number;
    pendingContent: number;
    totalViews: number;
    totalDownloads: number;
    averageRating: number;
    totalRatingCount: number;
  }> {
    const snapshot = await db.collection(COLLECTION)
      .where("consultantId", "==", consultantId)
      .get();

    const content = snapshot.docs.map(doc => doc.data() as ConsultantContent);

    const publishedContent = content.filter(c => c.status === 'published');
    const pendingContent = content.filter(c => c.status === 'pending');

    const totalViews = content.reduce((sum, c) => sum + c.viewCount, 0);
    const totalDownloads = content.reduce((sum, c) => sum + c.downloadCount, 0);
    
    const ratedContent = publishedContent.filter(c => c.ratingCount > 0);
    const averageRating = ratedContent.length > 0 
      ? ratedContent.reduce((sum, c) => sum + c.rating, 0) / ratedContent.length 
      : 0;
    const totalRatingCount = publishedContent.reduce((sum, c) => sum + c.ratingCount, 0);

    return {
      totalContent: content.length,
      publishedContent: publishedContent.length,
      pendingContent: pendingContent.length,
      totalViews,
      totalDownloads,
      averageRating,
      totalRatingCount,
    };
  },
};
