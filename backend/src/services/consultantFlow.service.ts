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
      status: "approved",
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(PROFILES_COLLECTION).doc(data.uid).set(profile);
    
    // Auto-link approved consultant
    await this.linkApprovedConsultant(profile);
    
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
      
      console.log(`🔗 [linkApprovedConsultant] Starting for uid: ${profile.uid}`);
      console.log(`🔗 [linkApprovedConsultant] Profile data:`, JSON.stringify({
        uid: profile.uid,
        personalInfo: {
          fullName: profile.personalInfo?.fullName,
          email: profile.personalInfo?.email,
          bio: profile.personalInfo?.bio ? 'present' : 'missing',
          experience: profile.personalInfo?.experience,
        },
        professionalInfo: {
          category: profile.professionalInfo?.category,
          title: profile.professionalInfo?.title,
          specialties: profile.professionalInfo?.specialties,
        }
      }, null, 2));
      
      const consultantDoc = await db.collection(CONSULTANTS_COLLECTION).doc(profile.uid).get();
      const consultantExists = consultantDoc.exists;
      console.log(`🔗 [linkApprovedConsultant] Consultant exists: ${consultantExists}`);

      const existingData = consultantExists ? consultantDoc.data() as Consultant : null;
      
      // Check if user has a student profile image and use it if consultant profile image is not provided
      let profileImage = profile.personalInfo?.profileImage;
      if (!profileImage) {
        try {
          const userDoc = await db.collection("users").doc(profile.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            const studentProfileImage = userData?.profileImage;
            if (studentProfileImage && typeof studentProfileImage === 'string' && studentProfileImage.trim() !== '') {
              console.log(`🔗 [linkApprovedConsultant] Using student profile image for consultant: ${profile.uid}`);
              profileImage = studentProfileImage.trim();
            }
          }
        } catch (error: any) {
          console.warn(`🔗 [linkApprovedConsultant] Could not fetch student profile image:`, error.message);
          // Continue without student profile image
        }
      }
      
      // Build consultant data, but filter out undefined values
      const consultantData: any = {
        uid: profile.uid,
        name: profile.personalInfo?.fullName || "Unknown",
        email: profile.personalInfo?.email || "",
        category: profile.professionalInfo?.category || "General",
        rating: existingData?.rating ?? 0,
        totalReviews: existingData?.totalReviews ?? 0,
        profileImage: profileImage || null,
        availability: profile.professionalInfo?.availability || {},
        contactMethods: {
          chat: true,
          call: false,
          video: false,
        },
        specialties: profile.professionalInfo?.specialties || [],
        createdAt: existingData?.createdAt || now,
        updatedAt: now,
        isActive: true,
      };

      // Only add optional fields if they have values (not undefined)
      if (profile.personalInfo?.bio !== undefined && profile.personalInfo?.bio !== null) {
        consultantData.bio = profile.personalInfo.bio;
      }
      if (profile.personalInfo?.experience !== undefined && profile.personalInfo?.experience !== null) {
        consultantData.experience = profile.personalInfo.experience;
      }
      if (profile.professionalInfo?.hourlyRate !== undefined && profile.professionalInfo?.hourlyRate !== null) {
        consultantData.hourlyRate = profile.professionalInfo.hourlyRate;
      }
      if (profile.professionalInfo?.title !== undefined && profile.professionalInfo?.title !== null) {
        consultantData.title = profile.professionalInfo.title;
      }

      console.log(`🔗 [linkApprovedConsultant] Consultant data to save:`, JSON.stringify({
        ...consultantData,
        createdAt: consultantData.createdAt ? 'Timestamp' : null,
        updatedAt: consultantData.updatedAt ? 'Timestamp' : null,
      }, null, 2));

      await db.collection(CONSULTANTS_COLLECTION).doc(profile.uid).set(consultantData, { merge: true });
      
      console.log(`✅ [linkApprovedConsultant] Successfully linked consultant`);
      Logger.info("ConsultantFlow", profile.uid, `Auto-linked approved consultant to ${CONSULTANTS_COLLECTION} collection`);
    } catch (error: any) {
      console.error(`❌ [linkApprovedConsultant] Error details:`, error);
      console.error(`❌ [linkApprovedConsultant] Error message:`, error?.message);
      console.error(`❌ [linkApprovedConsultant] Error code:`, error?.code);
      console.error(`❌ [linkApprovedConsultant] Error stack:`, error?.stack);
      Logger.error("ConsultantFlow", profile.uid, "Failed to auto-link approved consultant", error);
      throw new Error(`Failed to link consultant to main collection: ${error?.message || 'Unknown error'}`);
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
    const application = doc.data() as ConsultantApplication;
    const populated = await this.populateConsultantNames([application]);
    return populated[0];
  },

  async getAllApplications(): Promise<ConsultantApplication[]> {
    const snapshot = await db.collection(APPLICATIONS_COLLECTION).get();
    const applications = snapshot.docs.map((doc) => doc.data() as ConsultantApplication);
    return this.populateConsultantNames(applications);
  },

  async getApplicationsByConsultant(consultantId: string): Promise<ConsultantApplication[]> {
    const snapshot = await db
      .collection(APPLICATIONS_COLLECTION)
      .where("consultantId", "==", consultantId)
      .get();
    const applications = snapshot.docs.map((doc) => doc.data() as ConsultantApplication);
    return this.populateConsultantNames(applications);
  },

  async getApplicationsByStatus(
    status: "pending" | "approved" | "rejected"
  ): Promise<ConsultantApplication[]> {
    const snapshot = await db
      .collection(APPLICATIONS_COLLECTION)
      .where("status", "==", status)
      .get();
    const applications = snapshot.docs.map((doc) => doc.data() as ConsultantApplication);
    return this.populateConsultantNames(applications);
  },

  async populateConsultantNames(applications: ConsultantApplication[]): Promise<ConsultantApplication[]> {
    // Get unique consultant IDs
    const consultantIds = [...new Set(applications.map(app => app.consultantId))];
    
    // Fetch all consultant profiles in parallel
    const consultantProfiles = await Promise.all(
      consultantIds.map(async (consultantId) => {
        try {
          const profileDoc = await db.collection(PROFILES_COLLECTION).doc(consultantId).get();
          if (profileDoc.exists) {
            const profile = profileDoc.data() as ConsultantProfile;
            return {
              id: consultantId,
              name: profile.personalInfo?.fullName || null
            };
          }
          
          // If profile doesn't exist, try the consultants collection
          const consultantDoc = await db.collection(CONSULTANTS_COLLECTION).doc(consultantId).get();
          if (consultantDoc.exists) {
            const consultant = consultantDoc.data() as Consultant;
            return {
              id: consultantId,
              name: consultant.name || null
            };
          }
          
          return { id: consultantId, name: null };
        } catch (error) {
          Logger.error("ConsultantFlow", consultantId, "Failed to fetch consultant name", error);
          return { id: consultantId, name: null };
        }
      })
    );

    // Create a map of consultantId -> name
    const nameMap = new Map(consultantProfiles.map(c => [c.id, c.name]));

    // Populate consultant names in applications
    return applications.map(app => ({
      ...app,
      consultantName: nameMap.get(app.consultantId) || undefined
    }));
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
