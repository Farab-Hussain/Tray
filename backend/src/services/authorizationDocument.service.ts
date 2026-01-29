// src/services/authorizationDocument.service.ts
import { db } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { resumeServices } from "./resume.service";

const COLLECTION = "authorizationDocuments";

export interface AuthorizationDocument {
  id: string;
  userId: string;
  documentType: 'work-permit' | 'visa' | 'residence-card' | 'other';
  fileName: string;
  fileUrl: string;
  filePublicId: string; // Cloudinary public ID
  fileSize: number;
  mimeType: string;
  uploadedAt: Timestamp;
  expiresAt?: Timestamp; // For documents with expiration dates
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  verifiedBy?: string; // Admin who verified
  verifiedAt?: Timestamp;
  rejectionReason?: string;
  notes?: string;
}

export interface AuthorizationDocumentInput {
  documentType: 'work-permit' | 'visa' | 'residence-card' | 'other';
  fileName: string;
  fileUrl: string;
  filePublicId: string;
  fileSize: number;
  mimeType: string;
  expiresAt?: Timestamp;
  notes?: string;
}

export const authorizationDocumentService = {
  /**
   * Upload authorization document for a user
   */
  async uploadDocument(userId: string, documentData: AuthorizationDocumentInput): Promise<AuthorizationDocument> {
    const docRef = db.collection(COLLECTION).doc();
    const now = Timestamp.now();

    const document: AuthorizationDocument = {
      id: docRef.id,
      userId,
      ...documentData,
      uploadedAt: now,
      status: 'pending',
    };

    await docRef.set(document);

    // Update user's resume with document reference
    const currentAuth = await resumeServices.getAuthorization(userId);
    const updatedDocuments = [...(currentAuth.authorizationDocuments || []), document.id];
    
    await resumeServices.updateAuthorization(userId, {
      workAuthorized: currentAuth.workAuthorized,
      authorizationDocuments: updatedDocuments,
      backgroundCheckRequired: currentAuth.backgroundCheckRequired,
    });

    return document;
  },

  /**
   * Get all authorization documents for a user
   */
  async getUserDocuments(userId: string): Promise<AuthorizationDocument[]> {
    const snapshot = await db
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .orderBy("uploadedAt", "desc")
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AuthorizationDocument[];
  },

  /**
   * Get document by ID
   */
  async getDocumentById(documentId: string): Promise<AuthorizationDocument> {
    const doc = await db.collection(COLLECTION).doc(documentId).get();
    if (!doc.exists) {
      throw new Error("Document not found");
    }
    return { id: doc.id, ...doc.data() } as AuthorizationDocument;
  },

  /**
   * Update document status (Admin only)
   */
  async updateDocumentStatus(
    documentId: string, 
    status: 'pending' | 'verified' | 'rejected' | 'expired',
    verifiedBy: string,
    rejectionReason?: string
  ): Promise<AuthorizationDocument> {
    const docRef = db.collection(COLLECTION).doc(documentId);
    const updateData: any = {
      status,
      verifiedBy,
      verifiedAt: Timestamp.now(),
    };

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as AuthorizationDocument;
  },

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    const doc = await db.collection(COLLECTION).doc(documentId).get();
    if (!doc.exists) {
      throw new Error("Document not found");
    }

    const document = doc.data() as AuthorizationDocument;

    // Remove document reference from user's resume
    const currentAuth = await resumeServices.getAuthorization(document.userId);
    const updatedDocuments = currentAuth.authorizationDocuments?.filter(id => id !== documentId) || [];
    
    await resumeServices.updateAuthorization(document.userId, {
      workAuthorized: currentAuth.workAuthorized,
      authorizationDocuments: updatedDocuments,
      backgroundCheckRequired: currentAuth.backgroundCheckRequired,
    });

    await db.collection(COLLECTION).doc(documentId).delete();
  },

  /**
   * Get all pending documents (Admin only)
   */
  async getPendingDocuments(): Promise<AuthorizationDocument[]> {
    const snapshot = await db
      .collection(COLLECTION)
      .where("status", "==", "pending")
      .orderBy("uploadedAt", "asc")
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AuthorizationDocument[];
  },

  /**
   * Check for expired documents and update status
   */
  async checkExpiredDocuments(): Promise<void> {
    const now = Timestamp.now();
    const snapshot = await db
      .collection(COLLECTION)
      .where("expiresAt", "<=", now)
      .where("status", "==", "verified")
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'expired',
        updatedAt: now,
      });
    });

    if (snapshot.size > 0) {
      await batch.commit();
      console.log(`Updated ${snapshot.size} expired documents`);
    }
  },

  /**
   * Get document statistics for a user
   */
  async getUserDocumentStats(userId: string): Promise<{
    total: number;
    pending: number;
    verified: number;
    rejected: number;
    expired: number;
  }> {
    const documents = await this.getUserDocuments(userId);
    
    return {
      total: documents.length,
      pending: documents.filter(doc => doc.status === 'pending').length,
      verified: documents.filter(doc => doc.status === 'verified').length,
      rejected: documents.filter(doc => doc.status === 'rejected').length,
      expired: documents.filter(doc => doc.status === 'expired').length,
    };
  }
};
