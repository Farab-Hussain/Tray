import { db } from "../config/firebase";
import { ConsultantProfile, ConsultantProfileInput } from "../models/consultantProfile.model";
import { ConsultantApplication, ConsultantApplicationInput } from "../models/consultantApplication.model";
import { Consultant } from "../models/consultant.model";
import { Timestamp } from "firebase-admin/firestore";
import { Logger } from "../utils/logger";

const PROFILES_COLLECTION = "consultantProfiles";
const APPLICATIONS_COLLECTION = "consultantApplications";
const CONSULTANTS_COLLECTION = "consultants";

export const consultantFlowService = {
  
  async createProfile(data: ConsultantProfileInput): Promise<ConsultantProfile> {
    const now = Timestamp.now();
    const profile: ConsultantProfile = {
      ...data,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(PROFILES_COLLECTION).doc(data.uid).set(profile);
    return profile;
  },

  async getProfileByUid(uid: string): Promise<ConsultantProfile> {
    const doc = await db.collection(PROFILES_COLLECTION).doc(uid).get();
    if (!doc.exists) {
      throw new Error("Consultant profile not found");
    }
    return doc.data() as ConsultantProfile;
  },

  async getAllProfiles(): Promise<ConsultantProfile[]> {
    const snapshot = await db.collection(PROFILES_COLLECTION).get();
    return snapshot.docs.map((doc) => doc.data() as ConsultantProfile);
  },

  async getProfilesByStatus(status: "pending" | "approved" | "rejected"): Promise<ConsultantProfile[]> {
    const snapshot = await db
      .collection(PROFILES_COLLECTION)
      .where("status", "==", status)
      .get();
    return snapshot.docs.map((doc) => doc.data() as ConsultantProfile);
  },

  async updateProfile(uid: string, data: Partial<ConsultantProfileInput>): Promise<ConsultantProfile> {
    const updateData = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    await db.collection(PROFILES_COLLECTION).doc(uid).update(updateData);
    return this.getProfileByUid(uid);
  },

  async updateProfileStatus(
    uid: string, 
    status: "pending" | "approved" | "rejected"
  ): Promise<ConsultantProfile> {
    await db.collection(PROFILES_COLLECTION).doc(uid).update({
      status,
      updatedAt: Timestamp.now(),
    });
    
    const profile = await this.getProfileByUid(uid);
    

    if (status === "approved") {
      await this.linkApprovedConsultant(profile);
    }
    
    return profile;
  },

  async linkApprovedConsultant(profile: ConsultantProfile): Promise<void> {
    try {
      const now = Timestamp.now();
      
      const consultantDoc = await db.collection(CONSULTANTS_COLLECTION).doc(profile.uid).get();
      const consultantExists = consultantDoc.exists;

      const consultantData: Consultant = {
        uid: profile.uid,
        name: profile.personalInfo?.fullName || "Unknown",
        email: profile.personalInfo?.email || "",
        category: profile.professionalInfo?.category || "General",
        bio: profile.personalInfo?.bio,
        experience: profile.personalInfo?.experience,
        rating: consultantExists ? (consultantDoc.data() as Consultant).rating : 0,
        totalReviews: consultantExists ? (consultantDoc.data() as Consultant).totalReviews : 0,
        hourlyRate: profile.professionalInfo?.hourlyRate,
        profileImage: profile.personalInfo?.profileImage || null,
        availability: profile.professionalInfo?.availability || {},
        contactMethods: {
          chat: true,
          call: false,
          video: false,
        },
        title: profile.professionalInfo?.title,
        specialties: profile.professionalInfo?.specialties || [],
        createdAt: consultantExists ? (consultantDoc.data() as Consultant).createdAt : now,
        updatedAt: now,
        isActive: true,
      };


      await db.collection(CONSULTANTS_COLLECTION).doc(profile.uid).set(consultantData, { merge: true });
      
      Logger.info("ConsultantFlow", profile.uid, `Auto-linked approved consultant to ${CONSULTANTS_COLLECTION} collection`);
    } catch (error) {
      Logger.error("ConsultantFlow", profile.uid, "Failed to auto-link approved consultant", error);
      throw new Error("Failed to link consultant to main collection");
    }
  },


  async createApplication(data: ConsultantApplicationInput): Promise<ConsultantApplication> {
    const applicationRef = db.collection(APPLICATIONS_COLLECTION).doc();
    const now = Timestamp.now();
    
    const application: ConsultantApplication = {
      id: applicationRef.id,
      ...data,
      status: "pending",
      submittedAt: now,
      reviewedAt: null,
    };

    await applicationRef.set(application);
    return application;
  },

  async getApplicationById(id: string): Promise<ConsultantApplication> {
    const doc = await db.collection(APPLICATIONS_COLLECTION).doc(id).get();
    if (!doc.exists) {
      throw new Error("Application not found");
    }
    return doc.data() as ConsultantApplication;
  },

  async getAllApplications(): Promise<ConsultantApplication[]> {
    const snapshot = await db.collection(APPLICATIONS_COLLECTION).get();
    return snapshot.docs.map((doc) => doc.data() as ConsultantApplication);
  },

  async getApplicationsByConsultant(consultantId: string): Promise<ConsultantApplication[]> {
    const snapshot = await db
      .collection(APPLICATIONS_COLLECTION)
      .where("consultantId", "==", consultantId)
      .get();
    return snapshot.docs.map((doc) => doc.data() as ConsultantApplication);
  },

  async getApplicationsByStatus(
    status: "pending" | "approved" | "rejected"
  ): Promise<ConsultantApplication[]> {
    const snapshot = await db
      .collection(APPLICATIONS_COLLECTION)
      .where("status", "==", status)
      .get();
    return snapshot.docs.map((doc) => doc.data() as ConsultantApplication);
  },

  async updateApplicationStatus(
    id: string,
    status: "pending" | "approved" | "rejected",
    reviewNotes?: string
  ): Promise<ConsultantApplication> {
    const updateData: any = {
      status,
      reviewedAt: Timestamp.now(),
    };

    if (reviewNotes) {
      updateData.reviewNotes = reviewNotes;
    }

    await db.collection(APPLICATIONS_COLLECTION).doc(id).update(updateData);
    return this.getApplicationById(id);
  },

  async deleteApplication(id: string): Promise<void> {
    await db.collection(APPLICATIONS_COLLECTION).doc(id).delete();
  },
};