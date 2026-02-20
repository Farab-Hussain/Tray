// src/services/jobApplication.service.ts
import api from '../lib/api';
import { logger } from '../utils/logger';

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  resumeId: string;
  coverLetter?: string;
  matchScore: number;
  matchRating: 'gold' | 'silver' | 'bronze' | 'basic';
  matchedSkills: string[];
  missingSkills: string[];
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';
  appliedAt: string;
  user?: {
    uid: string;
    name: string;
    // Note: Private information like email, phone, address are filtered out for employers
  };
  resume?: {
    id: string;
    skills: string[];
    experience: Array<{
      title: string;
      company: string;
      duration: string;
      // Note: Detailed descriptions, achievements, references are filtered out
    }>;
    education: Array<{
      degree: string;
      field: string;
      institution: string;
      // Note: Graduation year, GPA, achievements are filtered out
    }>;
    // Note: resumeFileUrl is filtered out for security
  };
  job?: {
    id: string;
    title: string;
    company: string;
    requiredSkills: string[];
  };
}

export interface ApplicationsSummary {
  total: number;
  gold: number;
  silver: number;
  bronze: number;
  basic: number;
}

class JobApplicationService {
  /**
   * Get applications for a specific job (employer view with security filtering)
   */
  async getJobApplications(jobId: string): Promise<{ 
    applications: JobApplication[];
    summary: ApplicationsSummary;
    securityNotice?: string;
  }> {
    try {
      const response = await api.get(`/jobs/${jobId}/applications`);
      return response.data;
    } catch (error: any) {
      logger.error('Error getting job applications:', error);
      throw error;
    }
  }

  /**
   * Get application by ID
   */
  async getApplicationById(applicationId: string): Promise<{ application: JobApplication }> {
    try {
      const response = await api.get(`/jobs/applications/${applicationId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error getting application:', error);
      throw error;
    }
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(applicationId: string, status: string): Promise<{ 
    application: JobApplication;
    message: string;
  }> {
    try {
      const response = await api.put(`/jobs/applications/${applicationId}/status`, { status });
      return response.data;
    } catch (error: any) {
      logger.error('Error updating application status:', error);
      throw error;
    }
  }

  /**
   * Get my applications (student view)
   */
  async getMyApplications(): Promise<{ applications: JobApplication[] }> {
    try {
      const response = await api.get('/jobs/applications/my');
      return response.data;
    } catch (error: any) {
      logger.error('Error getting my applications:', error);
      throw error;
    }
  }

  /**
   * Apply for a job
   */
  async applyForJob(jobId: string, applicationData: {
    resumeId: string;
    coverLetter?: string;
  }): Promise<{ 
    application: JobApplication;
    fitScoreDetails: any;
  }> {
    try {
      const response = await api.post(`/jobs/${jobId}/apply`, applicationData);
      return response.data;
    } catch (error: any) {
      logger.error('Error applying for job:', error);
      throw error;
    }
  }

  /**
   * Test employer access security (for demo purposes)
   */
  async testEmployerAccessSecurity(): Promise<{
    message: string;
    testResult: 'SECURITY_PASSED' | 'SECURITY_BREACH' | 'NO_JOBS_FOUND' | 'TEST_ERROR';
    securityStatus: string;
    test: any;
    recommendation: string;
    timestamp: string;
    testedBy: {
      userId: string;
      userRole: string;
    };
  }> {
    try {
      const response = await api.post('/jobs/security/test-employer-access');
      return response.data;
    } catch (error: any) {
      logger.error('Error testing employer access security:', error);
      throw error;
    }
  }
}

export default new JobApplicationService();
