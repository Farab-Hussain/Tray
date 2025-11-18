import { api } from '../lib/fetcher';

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
    const response = await api.get('/resumes/my');
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

