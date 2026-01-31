import { db } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { Resume, ResumeInput } from "../models/resume.model";

const COLLECTION = "resumes";

// Types for new features
export interface WorkPreferences {
  workRestrictions?: string[];
  transportationStatus?: 'own-car' | 'public-transport' | 'none';
  shiftFlexibility?: {
    days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[];
    shifts: ('morning' | 'evening' | 'night')[];
  };
  preferredWorkTypes?: ('full-time' | 'part-time' | 'contract' | 'internship')[];
  jobsToAvoid?: string[];
}

export interface AuthorizationInfo {
  workAuthorized: boolean;
  authorizationDocuments?: string[];
  backgroundCheckRequired?: boolean;
}

export interface CareerGoals {
  careerInterests?: string[];
  targetIndustries?: string[];
  salaryExpectation?: {
    min: number;
    max: number;
  };
}

export interface ExternalProfiles {
  linkedIn?: string;
  portfolio?: string;
  github?: string;
}

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

  // ==================== NEW FEATURE METHODS ====================

  /**
   * Update work preferences
   */
  async updateWorkPreferences(uid: string, preferences: WorkPreferences): Promise<Resume> {
    try {
      const existingResume = await this.getByUserId(uid);
      
      const updateData = {
        workRestrictions: preferences.workRestrictions,
        transportationStatus: preferences.transportationStatus,
        shiftFlexibility: preferences.shiftFlexibility,
        preferredWorkTypes: preferences.preferredWorkTypes,
        jobsToAvoid: preferences.jobsToAvoid,
      };

      return this.update(existingResume.id, updateData);
    } catch (error: any) {
      // If no resume exists, create one with just the work preferences
      if (error.message === "Resume not found") {
        const resumeRef = db.collection(COLLECTION).doc();
        const now = Timestamp.now();

        const resumeData: Resume = {
          id: resumeRef.id,
          userId: uid,
          personalInfo: {
            name: '',
            email: '',
          },
          skills: [],
          experience: [],
          education: [],
          workRestrictions: preferences.workRestrictions,
          transportationStatus: preferences.transportationStatus,
          shiftFlexibility: preferences.shiftFlexibility,
          preferredWorkTypes: preferences.preferredWorkTypes,
          jobsToAvoid: preferences.jobsToAvoid,
          createdAt: now,
          updatedAt: now,
        };

        await resumeRef.set(resumeData);
        return resumeData;
      }
      throw error;
    }
  },

  /**
   * Get work preferences
   */
  async getWorkPreferences(uid: string): Promise<WorkPreferences> {
    try {
      const resume = await this.getByUserId(uid);
      
      return {
        workRestrictions: resume.workRestrictions || [],
        transportationStatus: resume.transportationStatus || 'none',
        shiftFlexibility: resume.shiftFlexibility || { days: [], shifts: [] },
        preferredWorkTypes: resume.preferredWorkTypes || [],
        jobsToAvoid: resume.jobsToAvoid || [],
      };
    } catch (error: any) {
      // If no resume exists, return default preferences
      if (error.message === "Resume not found") {
        return {
          workRestrictions: [],
          transportationStatus: 'none',
          shiftFlexibility: { days: [], shifts: [] },
          preferredWorkTypes: [],
          jobsToAvoid: [],
        };
      }
      throw error;
    }
  },

  /**
   * Update authorization information
   */
  async updateAuthorization(uid: string, authorization: AuthorizationInfo): Promise<Resume> {
    const existingResume = await this.getByUserId(uid);
    
    const updateData = {
      workAuthorized: authorization.workAuthorized,
      authorizationDocuments: authorization.authorizationDocuments,
      backgroundCheckRequired: authorization.backgroundCheckRequired,
    };

    return this.update(existingResume.id, updateData);
  },

  /**
   * Get authorization information
   */
  async getAuthorization(uid: string): Promise<AuthorizationInfo> {
    const resume = await this.getByUserId(uid);
    
    return {
      workAuthorized: resume.workAuthorized || false,
      authorizationDocuments: resume.authorizationDocuments || [],
      backgroundCheckRequired: resume.backgroundCheckRequired || false,
    };
  },

  /**
   * Update career goals
   */
  async updateCareerGoals(uid: string, goals: CareerGoals): Promise<Resume> {
    try {
      const existingResume = await this.getByUserId(uid);
      
      const updateData = {
        careerInterests: goals.careerInterests,
        targetIndustries: goals.targetIndustries,
        salaryExpectation: goals.salaryExpectation,
      };

      return this.update(existingResume.id, updateData);
    } catch (error: any) {
      // If no resume exists, create one with just the career goals
      if (error.message === "Resume not found") {
        const resumeRef = db.collection(COLLECTION).doc();
        const now = Timestamp.now();

        const resumeData: Resume = {
          id: resumeRef.id,
          userId: uid,
          personalInfo: {
            name: '',
            email: '',
          },
          skills: [],
          experience: [],
          education: [],
          careerInterests: goals.careerInterests,
          targetIndustries: goals.targetIndustries,
          salaryExpectation: goals.salaryExpectation,
          createdAt: now,
          updatedAt: now,
        };

        await resumeRef.set(resumeData);
        return resumeData;
      }
      throw error;
    }
  },

  /**
   * Get career goals
   */
  async getCareerGoals(uid: string): Promise<CareerGoals> {
    try {
      const resume = await this.getByUserId(uid);
      
      return {
        careerInterests: resume.careerInterests || [],
        targetIndustries: resume.targetIndustries || [],
        salaryExpectation: resume.salaryExpectation || { min: 0, max: 0 },
      };
    } catch (error: any) {
      // If no resume exists, return default career goals
      if (error.message === "Resume not found") {
        return {
          careerInterests: [],
          targetIndustries: [],
          salaryExpectation: { min: 0, max: 0 },
        };
      }
      throw error;
    }
  },

  /**
   * Update external profiles
   */
  async updateExternalProfiles(uid: string, profiles: ExternalProfiles): Promise<Resume> {
    const existingResume = await this.getByUserId(uid);
    
    const updateData = {
      externalProfiles: profiles,
    };

    return this.update(existingResume.id, updateData);
  },

  /**
   * Get external profiles
   */
  async getExternalProfiles(uid: string): Promise<ExternalProfiles> {
    const resume = await this.getByUserId(uid);
    
    return {
      linkedIn: resume.externalProfiles?.linkedIn,
      portfolio: resume.externalProfiles?.portfolio,
      github: resume.externalProfiles?.github,
    };
  },

  /**
   * Update multiple sections at once
   */
  async updateMultipleSections(
    uid: string, 
    updates: {
      workPreferences?: WorkPreferences;
      authorization?: AuthorizationInfo;
      careerGoals?: CareerGoals;
      externalProfiles?: ExternalProfiles;
    }
  ): Promise<Resume> {
    const existingResume = await this.getByUserId(uid);
    
    const updateData: Partial<Resume> = {
      updatedAt: Timestamp.now(),
    };

    // Add work preferences
    if (updates.workPreferences) {
      updateData.workRestrictions = updates.workPreferences.workRestrictions;
      updateData.transportationStatus = updates.workPreferences.transportationStatus;
      updateData.shiftFlexibility = updates.workPreferences.shiftFlexibility;
      updateData.preferredWorkTypes = updates.workPreferences.preferredWorkTypes;
      updateData.jobsToAvoid = updates.workPreferences.jobsToAvoid;
    }

    // Add authorization info
    if (updates.authorization) {
      updateData.workAuthorized = updates.authorization.workAuthorized;
      updateData.authorizationDocuments = updates.authorization.authorizationDocuments;
      updateData.backgroundCheckRequired = updates.authorization.backgroundCheckRequired;
    }

    // Add career goals
    if (updates.careerGoals) {
      updateData.careerInterests = updates.careerGoals.careerInterests;
      updateData.targetIndustries = updates.careerGoals.targetIndustries;
      updateData.salaryExpectation = updates.careerGoals.salaryExpectation;
    }

    // Add external profiles
    if (updates.externalProfiles) {
      updateData.externalProfiles = updates.externalProfiles;
    }

    return this.update(existingResume.id, updateData);
  },

  /**
   * Check if student has completed new feature sections
   */
  async getProfileCompletionStatus(uid: string): Promise<{
    basicProfile: boolean;
    workPreferences: boolean;
    authorization: boolean;
    careerGoals: boolean;
    externalProfiles: boolean;
    overallCompletion: number;
  }> {
    const resume = await this.getByUserId(uid);
    
    const basicProfile = !!(resume.personalInfo && resume.skills && resume.experience);
    const workPreferences = !!(
      resume.workRestrictions || 
      resume.transportationStatus || 
      resume.shiftFlexibility ||
      resume.preferredWorkTypes ||
      resume.jobsToAvoid
    );
    const authorization = !!(
      resume.workAuthorized !== undefined || 
      resume.authorizationDocuments ||
      resume.backgroundCheckRequired !== undefined
    );
    const careerGoals = !!(
      resume.careerInterests || 
      resume.targetIndustries || 
      resume.salaryExpectation
    );
    const externalProfiles = !!(
      resume.externalProfiles?.linkedIn || 
      resume.externalProfiles?.portfolio || 
      resume.externalProfiles?.github
    );

    const completedSections = [
      basicProfile,
      workPreferences,
      authorization,
      careerGoals,
      externalProfiles
    ].filter(Boolean).length;

    return {
      basicProfile,
      workPreferences,
      authorization,
      careerGoals,
      externalProfiles,
      overallCompletion: (completedSections / 5) * 100
    };
  }
};

