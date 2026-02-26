import { api } from '../lib/fetcher';

export type WorkEligibilitySectionKey =
  | 'drivingTransportation'
  | 'workAuthorizationDocumentation'
  | 'physicalWorkplaceRequirements'
  | 'schedulingWorkEnvironment'
  | 'drugTestingSafetyPolicies'
  | 'professionalLicensingCertifications'
  | 'roleBasedCompatibilitySensitive';

export type WorkEligibilityVerificationStatus =
  | 'self_reported'
  | 'pending'
  | 'verified'
  | 'rejected';

export interface WorkEligibilityEvidenceFile {
  section: WorkEligibilitySectionKey;
  fileUrl: string;
  publicId?: string;
  fileName: string;
  uploadedAt: string;
  status?: WorkEligibilityVerificationStatus;
  reviewNote?: string;
}

export interface WorkEligibilityChecklist {
  selfAttestationAccepted?: boolean;
  selfAttestationAcceptedAt?: string;
  selfAttestationSource?: 'ios' | 'android' | 'web' | 'unknown';
  verificationStatusBySection?: Partial<
    Record<WorkEligibilitySectionKey, WorkEligibilityVerificationStatus>
  >;
  evidenceFiles?: WorkEligibilityEvidenceFile[];
  drivingTransportation?: {
    hasValidDriversLicense?: boolean;
    canMeetMvrRequirements?: boolean;
    hasReliableTransportation?: boolean;
    canPerformDrivingDuties?: boolean;
  };
  workAuthorizationDocumentation?: {
    hasValidI9Identification?: boolean;
    canMeetEverifyRequirements?: boolean;
  };
  physicalWorkplaceRequirements?: {
    canPerformEssentialPhysicalFunctions?: boolean;
    mayRequestWorkplaceAccommodations?: boolean;
  };
  schedulingWorkEnvironment?: {
    canWorkNightsWeekendsRotating?: boolean;
    canWorkSafetySensitiveEnvironments?: boolean;
    canWorkRegulatedEnvironments?: boolean;
  };
  drugTestingSafetyPolicies?: {
    canPassDrugScreening?: boolean;
    canComplyRandomDrugTesting?: boolean;
  };
  professionalLicensingCertifications?: {
    eligibleToObtainRequiredLicenses?: boolean;
    currentlyHoldsRequiredLicensesCertifications?: boolean;
    licenseExamplesNote?: string;
  };
  roleBasedCompatibilitySensitive?: {
    noRestrictionsForWorkWithMinors?: boolean;
    noRestrictionsForVulnerableAdultsPatients?: boolean;
    noRestrictionsForFinancialHandlingRoles?: boolean;
    noRestrictionsForSecureFacilities?: boolean;
    hasPendingLegalMattersAffectingEmploymentTypes?: boolean;
  };
}

export interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    profileImage?: string;
  };
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduationYear?: number;
    gpa?: number;
  }>;
  backgroundInformation?: string;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  resumeFileUrl?: string;
  resumeFilePublicId?: string;
  industriesToAvoid?: string[];
  employmentGapExplanation?: string;
  picsAssessmentCompleted?: boolean;
  picsAssessmentCompletedAt?: string;
  picsAssessmentProof?: {
    fileUrl: string;
    publicId?: string;
    fileName: string;
    uploadedAt: string;
    mimeType?: string;
  };
  workEligibilityChecklist?: WorkEligibilityChecklist;
}

export const ResumeService = {
  /**
   * Create or update resume (Student)
   */
  async createOrUpdateResume(resumeData: ResumeData) {
    const response = await api.post('/resumes', resumeData);
    return response.data;
  },

  /**
   * Get my resume (Student)
   */
  async getMyResume() {
    try {
      const response = await api.get('/resumes/my');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw error; // Re-throw 404 as expected for new users
      }
      throw error;
    }
  },

  /**
   * Get profile completion status (Student) - NEW
   */
  async getProfileCompletionStatus() {
    try {
      const response = await api.get('/resumes/completion-status');
      return response.data;
    } catch (error: any) {
      // If resume not found (404), return default completion status
      if (error.response?.status === 404) {
        return { 
          status: {
            overallCompletion: 0,
            basicProfile: false,
            workPreferences: false,
            authorization: false,
            careerGoals: false,
            externalProfiles: false
          }
        };
      }
      throw error;
    }
  },

  /**
   * Update work preferences (Student) - NEW
   */
  async updateWorkPreferences(preferences: any) {
    const response = await api.put('/resumes/work-preferences', preferences);
    return response.data;
  },

  /**
   * Get work preferences (Student) - NEW
   */
  async getWorkPreferences() {
    const response = await api.get('/resumes/work-preferences');
    return response.data;
  },

  /**
   * Update authorization information (Student) - NEW
   */
  async updateAuthorization(authorization: any) {
    const response = await api.put('/resumes/authorization', authorization);
    return response.data;
  },

  /**
   * Get authorization information (Student) - NEW
   */
  async getAuthorization() {
    const response = await api.get('/resumes/authorization');
    return response.data;
  },

  /**
   * Update career goals (Student) - NEW
   */
  async updateCareerGoals(careerGoals: any) {
    const response = await api.put('/resumes/career-goals', careerGoals);
    return response.data;
  },

  /**
   * Get career goals (Student) - NEW
   */
  async getCareerGoals() {
    const response = await api.get('/resumes/career-goals');
    return response.data;
  },

  /**
   * Additional documents locker
   */
  async addAdditionalDocument(doc: { fileUrl: string; publicId?: string; fileName: string; mimeType?: string }) {
    const response = await api.post('/resumes/additional-documents', doc);
    return response.data;
  },

  async removeAdditionalDocument(criteria: { publicId?: string; fileUrl?: string }) {
    const response = await api.delete('/resumes/additional-documents', { data: criteria });
    return response.data;
  },

  /**
   * Update education (Student) - NEW
   */
  async updateEducation(education: any[]) {
    const response = await api.put('/resumes/education', { education });
    return response.data;
  },

  /**
   * Update certifications (Student) - NEW
   */
  async updateCertifications(certifications: any[]) {
    const response = await api.put('/resumes/certifications', { certifications });
    return response.data;
  },

  /**
   * Get resume by ID (for job applications)
   */
  async getResumeById(resumeId: string) {
    const response = await api.get(`/resumes/${resumeId}`);
    return response.data;
  },

  /**
   * Update resume (Student)
   */
  async updateResume(resumeData: Partial<ResumeData>) {
    const response = await api.put('/resumes', resumeData);
    return response.data;
  },

  /**
   * Update skills in resume (Student)
   */
  async updateSkills(skills: string[]) {
    const response = await api.put('/resumes/skills', { skills });
    return response.data;
  },

  /**
   * Delete resume (Student)
   */
  async deleteResume() {
    const response = await api.delete('/resumes');
    return response.data;
  },
};
