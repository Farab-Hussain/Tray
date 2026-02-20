import { api, fetcher } from '../lib/fetcher';
import { logger } from '../utils/logger';

export const JobService = {
  /**
   * Get all active jobs (paginated, filterable)
   */
  async getAllJobs(page: number = 1, limit: number = 20, filters?: {
    status?: string;
    jobType?: string;
    location?: string;
  }) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.jobType && { jobType: filters.jobType }),
      ...(filters?.location && { location: filters.location }),
    });
    
    return await fetcher(`/jobs?${params.toString()}`);
  },

  /**
   * Get job by ID
   */
  async getJobById(jobId: string) {
    return await fetcher(`/jobs/${jobId}`);
  },

  /**
   * Search jobs
   */
  async searchJobs(searchTerm: string, page: number = 1, limit: number = 20, status: string = 'active') {
    const params = new URLSearchParams({
      q: searchTerm,
      page: page.toString(),
      limit: limit.toString(),
      status,
    });
    
    return await fetcher(`/jobs/search?${params.toString()}`);
  },

  /**
   * Get match score for current user (before applying)
   */
  async getMatchScore(jobId: string) {
    const response = await api.get(`/jobs/${jobId}/match-score`);
    return response.data;
  },

  /**
   * Create a new job posting (Hiring Manager/Admin)
   */
  async createJob(jobData: {
    title: string;
    description: string;
    company: string;
    location: string;
    jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
    requiredSkills: string[];
    salaryRange?: {
      min: number;
      max: number;
      currency: string;
    };
    experienceRequired?: number;
    educationRequired?: string;
    status?: 'active' | 'closed' | 'draft';
  }) {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },

  /**
   * Get my posted jobs (Hiring Manager)
   */
  async getMyJobs() {
    const response = await api.get('/jobs/my');
    return response.data;
  },

  /**
   * Update job (Hiring Manager)
   */
  async updateJob(jobId: string, jobData: Partial<{
    title: string;
    description: string;
    company: string;
    location: string;
    jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
    requiredSkills: string[];
    salaryRange?: {
      min: number;
      max: number;
      currency: string;
    };
    status: 'active' | 'closed' | 'draft';
  }>) {
    const response = await api.put(`/jobs/${jobId}`, jobData);
    return response.data;
  },

  /**
   * Delete job (Hiring Manager)
   */
  async deleteJob(jobId: string) {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Apply for a job (Student)
   */
  async applyForJob(jobId: string, applicationData: {
    resumeId: string;
    coverLetter?: string;
  }) {
    // Ensure resumeId is a valid string (Android-specific fix)
    if (!applicationData || !applicationData.resumeId) {
      const error = new Error('Resume ID is required');
      if (__DEV__) {
        logger.error('[JobService] Missing resumeId:', {
          applicationData,
          resumeId: applicationData?.resumeId,
        });
      }
      throw error;
    }
    
    if (typeof applicationData.resumeId !== 'string') {
      const error = new Error('Resume ID must be a string');
      if (__DEV__) {
        logger.error('[JobService] Invalid resumeId type:', {
          type: typeof applicationData.resumeId,
          value: applicationData.resumeId,
        });
      }
      throw error;
    }
    
    // Clean the application data to ensure proper serialization
    const cleanData: any = {
      resumeId: String(applicationData.resumeId).trim(),
    };
    
    // Validate cleaned resumeId is not empty
    if (!cleanData.resumeId) {
      const error = new Error('Resume ID cannot be empty');
      if (__DEV__) {
        logger.error('[JobService] Empty resumeId after cleaning');
      }
      throw error;
    }
    
    // Only include coverLetter if it exists and is not empty
    if (applicationData.coverLetter && typeof applicationData.coverLetter === 'string' && applicationData.coverLetter.trim()) {
      cleanData.coverLetter = applicationData.coverLetter.trim();
    }
    
    if (__DEV__) {
      logger.debug('[JobService] Applying for job:', {
        jobId,
        resumeId: cleanData.resumeId,
        resumeIdLength: cleanData.resumeId.length,
        hasCoverLetter: !!cleanData.coverLetter,
        requestBody: JSON.stringify(cleanData),
      });
    }
    
    try {
      // For Android, ensure the request body is properly formatted
      const response = await api.post(`/jobs/${jobId}/apply`, cleanData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (__DEV__) {
        logger.debug('[JobService] Application successful:', {
          status: response.status,
          hasApplication: !!response.data?.application,
        });
      }
      
      return response.data;
    } catch (error: any) {
      if (__DEV__) {
        logger.error('[JobService] Application failed:', {
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          requestBody: JSON.stringify(cleanData),
        });
      }
      throw error;
    }
  },

  /**
   * Get applications for a job (Hiring Manager)
   * Returns applications sorted by match rating (Gold first)
   */
  async getJobApplications(jobId: string) {
    const response = await api.get(`/jobs/${jobId}/applications`);
    return response.data;
  },

  /**
   * Get my applications (Student)
   */
  async getMyApplications() {
    const response = await api.get('/jobs/applications/my');
    return response.data;
  },

  /**
   * Update application status (Hiring Manager)
   */
  async updateApplicationStatus(applicationId: string, statusData: {
    status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
    reviewNotes?: string;
  }) {
    const response = await api.put(`/jobs/applications/${applicationId}/status`, statusData);
    return response.data;
  },

  /**
   * Get application by ID
   */
  async getApplicationById(applicationId: string) {
    const response = await api.get(`/jobs/applications/${applicationId}`);
    return response.data;
  },

  /**
   * Save recruiter AI ranking/shortage snapshot for trend tracking
   */
  async saveAISnapshot(
    jobId: string,
    payload: {
      provider: 'openai' | 'claude' | 'local' | 'hybrid';
      trigger?: 'ai_ranking' | 'shortage_advice' | 'manual';
      ranking: Array<{
        applicationId: string;
        userId?: string;
        name?: string;
        skillMatchPercent?: number;
        availabilityMatch?: number;
        locationMatch?: number;
        compliancePass?: boolean;
        overallRankScore?: number;
        readyNow?: boolean;
        note?: string;
      }>;
      shortage: {
        detected: boolean;
        alerts?: string[];
        relaxNonEssentialRequirements?: string[];
        consultingServiceActions?: string[];
      };
      metadata?: Record<string, string | number | boolean | null>;
    },
  ) {
    const response = await api.post(`/jobs/${jobId}/ai-snapshots`, payload);
    return response.data;
  },

  /**
   * Get recruiter AI trend snapshots for a job
   */
  async getAISnapshots(jobId: string, limit: number = 20) {
    const response = await api.get(`/jobs/${jobId}/ai-snapshots`, {
      params: { limit },
    });
    return response.data;
  },
};
