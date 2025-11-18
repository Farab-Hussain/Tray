import { api, fetcher } from '../lib/fetcher';

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
    const response = await api.post(`/jobs/${jobId}/apply`, applicationData);
    return response.data;
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
};

