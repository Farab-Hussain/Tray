// src/services/company.service.ts
import api from '../lib/api';
import { logger } from '../utils/logger';

export interface CompanyProfile {
  id?: string;
  name: string;
  description: string;
  industry: string;
  website: string;
  size: string;
  foundedYear?: string;
  locations: CompanyLocation[];
  headquarters: CompanyLocation;
  contactInfo: CompanyContactInfo;
  socialLinks: CompanySocialLinks;
  fairChanceHiring: FairChanceHiringSettings;
  verificationStatus?: 'pending' | 'verified' | 'rejected' | 'not_submitted';
  isActive?: boolean;
  postedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isHeadquarters: boolean;
  shiftTypes: string[];
  locationType: string;
}

export interface CompanyContactInfo {
  email: string;
  phone?: string;
  hrEmail?: string;
  careersEmail?: string;
  linkedinUrl?: string;
}

export interface CompanySocialLinks {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  website?: string;
}

export interface FairChanceHiringSettings {
  enabled: boolean;
  banTheBoxCompliant: boolean;
  felonyFriendly: boolean;
  caseByCaseReview: boolean;
  noBackgroundCheck: boolean;
  secondChancePolicy: string;
  backgroundCheckPolicy: string;
  rehabilitationSupport: boolean;
  reentryProgramPartnership: boolean;
}

export interface CompanyVerification {
  businessRegistrationDocument?: string;
  taxDocument?: string;
  proofOfAddress?: string;
  additionalDocuments?: string[];
}

class CompanyService {
  /**
   * Get current user's companies
   */
  async getMyCompanies(): Promise<{ companies: CompanyProfile[] }> {
    try {
      const response = await api.get('/companies/my');
      return response.data;
    } catch (error: any) {
      logger.error('Error getting companies:', error);
      throw error;
    }
  }

  /**
   * Create a new company profile
   */
  async createCompany(companyData: Omit<CompanyProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ company: CompanyProfile }> {
    try {
      const response = await api.post('/companies', companyData);
      return response.data;
    } catch (error: any) {
      logger.error('Error creating company:', error);
      throw error;
    }
  }

  /**
   * Update an existing company profile
   */
  async updateCompany(companyId: string, updates: Partial<CompanyProfile>): Promise<{ company: CompanyProfile }> {
    try {
      const response = await api.put(`/companies/${companyId}`, updates);
      return response.data;
    } catch (error: any) {
      logger.error('Error updating company:', error);
      throw error;
    }
  }

  /**
   * Get company by ID
   */
  async getCompanyById(companyId: string): Promise<{ company: CompanyProfile }> {
    try {
      const response = await api.get(`/companies/${companyId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error getting company:', error);
      throw error;
    }
  }

  /**
   * Submit company for verification
   */
  async submitForVerification(companyId: string, verificationData: CompanyVerification): Promise<{ verification: any }> {
    try {
      const response = await api.post(`/companies/${companyId}/verification`, verificationData);
      return response.data;
    } catch (error: any) {
      logger.error('Error submitting for verification:', error);
      throw error;
    }
  }

  /**
   * Get company verification status
   */
  async getCompanyVerification(companyId: string): Promise<{ 
    verification?: any; 
    verificationStatus: string;
  }> {
    try {
      const response = await api.get(`/companies/${companyId}/verification`);
      return response.data;
    } catch (error: any) {
      logger.error('Error getting verification status:', error);
      throw error;
    }
  }

  /**
   * Update fair chance hiring settings
   */
  async updateFairChanceHiring(companyId: string, fairChanceSettings: FairChanceHiringSettings): Promise<{ 
    fairChanceHiring: FairChanceHiringSettings;
  }> {
    try {
      const response = await api.put(`/companies/${companyId}/fair-chance`, fairChanceSettings);
      return response.data;
    } catch (error: any) {
      logger.error('Error updating fair chance settings:', error);
      throw error;
    }
  }

  /**
   * Get company statistics
   */
  async getCompanyStats(companyId: string): Promise<{ stats: any }> {
    try {
      const response = await api.get(`/companies/${companyId}/stats`);
      return response.data;
    } catch (error: any) {
      logger.error('Error getting company stats:', error);
      throw error;
    }
  }

  /**
   * Get industries list
   */
  async getIndustries(): Promise<{ industries: string[] }> {
    try {
      const response = await api.get('/companies/industries');
      return response.data;
    } catch (error: any) {
      logger.error('Error getting industries:', error);
      throw error;
    }
  }

  /**
   * Search companies
   */
  async searchCompanies(query: string, filters?: {
    industry?: string;
    verificationStatus?: string;
    limit?: number;
  }): Promise<{ companies: CompanyProfile[] }> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      
      if (filters?.industry) {
        params.append('industry', filters.industry);
      }
      if (filters?.verificationStatus) {
        params.append('verificationStatus', filters.verificationStatus);
      }
      if (filters?.limit) {
        params.append('limit', filters.limit.toString());
      }

      const response = await api.get(`/companies/search?${params}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error searching companies:', error);
      throw error;
    }
  }

  /**
   * Deactivate company
   */
  async deactivateCompany(companyId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/companies/${companyId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error deactivating company:', error);
      throw error;
    }
  }
}

export default new CompanyService();
