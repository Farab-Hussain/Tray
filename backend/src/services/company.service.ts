// src/services/company.service.ts
import { db } from '../config/firebase';
import { Logger } from '../utils/logger';
import { Company, CompanyVerification, CompanyStats, FairChanceHiringSettings } from '../models/company.model';

export class CompanyService {
  /**
   * Create a new company profile
   */
  static async create(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'verificationStatus' | 'isActive'>): Promise<Company> {
    try {
      const companyRef = db.collection('companies').doc();
      const company: Company = {
        ...companyData,
        id: companyRef.id,
        verificationStatus: 'not_submitted',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await companyRef.set(company);
      Logger.info('Company', company.id, `Company profile created: ${company.name}`);
      
      return company;
    } catch (error: any) {
      Logger.error('Company', 'create', `Failed to create company: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get company by ID
   */
  static async getById(companyId: string): Promise<Company | null> {
    try {
      const companyDoc = await db.collection('companies').doc(companyId).get();
      
      if (!companyDoc.exists) {
        return null;
      }

      return companyDoc.data() as Company;
    } catch (error: any) {
      Logger.error('Company', companyId, `Failed to get company: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Update company profile
   */
  static async update(companyId: string, updates: Partial<Company>): Promise<Company> {
    try {
      const companyRef = db.collection('companies').doc(companyId);
      
      await companyRef.update({
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      const updatedCompany = await this.getById(companyId);
      if (!updatedCompany) {
        throw new Error('Company not found after update');
      }

      Logger.info('Company', companyId, `Company profile updated: ${updatedCompany.name}`);
      
      return updatedCompany;
    } catch (error: any) {
      Logger.error('Company', companyId, `Failed to update company: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get companies by user (employer)
   */
  static async getByUserId(userId: string): Promise<Company[]> {
    try {
      try {
        const snapshot = await db.collection('companies')
          .where('postedBy', '==', userId)
          .orderBy('createdAt', 'desc')
          .get();

        return snapshot.docs.map(doc => doc.data() as Company);
      } catch (error: any) {
        const message = error?.message || '';
        const code = error?.code || '';
        const isMissingIndex =
          code === 9 ||
          code === '9' ||
          message.includes('FAILED_PRECONDITION') ||
          message.toLowerCase().includes('requires an index');

        if (!isMissingIndex) {
          throw error;
        }

        Logger.warn('Company', userId, 'Missing index for getByUserId ordered query; using fallback query');
        const fallbackSnapshot = await db.collection('companies')
          .where('postedBy', '==', userId)
          .get();
        const companies = fallbackSnapshot.docs.map(doc => doc.data() as Company);
        companies.sort((a, b) => {
          const aTime = new Date(a?.createdAt || 0).getTime();
          const bTime = new Date(b?.createdAt || 0).getTime();
          return bTime - aTime;
        });
        return companies;
      }
    } catch (error: any) {
      Logger.error('Company', userId, `Failed to get companies by user: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get all companies (for admin)
   */
  static async getAll(filters?: {
    verificationStatus?: string;
    industry?: string;
    isActive?: boolean;
    limit?: number;
  }): Promise<Company[]> {
    try {
      let query: any = db.collection('companies');

      if (filters?.verificationStatus) {
        query = query.where('verificationStatus', '==', filters.verificationStatus);
      }

      if (filters?.industry) {
        query = query.where('industry', '==', filters.industry);
      }

      if (filters?.isActive !== undefined) {
        query = query.where('isActive', '==', filters.isActive);
      }

      const limit = filters?.limit || 50;
      query = query.orderBy('createdAt', 'desc').limit(limit);

      const snapshot = await query.get();
      return snapshot.docs.map((doc: any) => doc.data() as Company);
    } catch (error: any) {
      Logger.error('Company', 'admin', `Failed to get all companies: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Search companies
   */
  static async search(searchTerm: string, filters?: {
    industry?: string;
    verificationStatus?: string;
    limit?: number;
  }): Promise<Company[]> {
    try {
      // For now, implement basic text search
      // In production, consider using Algolia or Elasticsearch
      const snapshot = await db.collection('companies')
        .where('isActive', '==', true)
        .orderBy('name')
        .limit(50)
        .get();

      const companies = snapshot.docs.map(doc => doc.data() as Company);
      
      // Filter by search term (case-insensitive)
      const filteredCompanies = companies.filter(company => 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Apply additional filters
      if (filters?.industry) {
        filteredCompanies.filter(company => company.industry === filters.industry);
      }

      if (filters?.verificationStatus) {
        filteredCompanies.filter(company => company.verificationStatus === filters.verificationStatus);
      }

      return filteredCompanies.slice(0, filters?.limit || 20);
    } catch (error: any) {
      Logger.error('Company', 'search', `Failed to search companies: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Submit company for verification
   */
  static async submitForVerification(companyId: string, verificationData: {
    businessRegistrationDocument?: string;
    taxDocument?: string;
    proofOfAddress?: string;
    additionalDocuments?: string[];
  }): Promise<CompanyVerification> {
    try {
      // Check if company exists
      const company = await this.getById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      const verificationRef = db.collection('companyVerifications').doc();
      const verificationDataClean = Object.fromEntries(
        Object.entries({
          businessRegistrationDocument: verificationData.businessRegistrationDocument,
          taxDocument: verificationData.taxDocument,
          proofOfAddress: verificationData.proofOfAddress,
          additionalDocuments: verificationData.additionalDocuments,
        }).filter(([, v]) => v !== undefined)
      ) as typeof verificationData;

      const verification: CompanyVerification = {
        id: verificationRef.id,
        companyId,
        ...verificationDataClean,
        submittedAt: new Date().toISOString(),
        status: 'pending',
      };

      await verificationRef.set(verification);

      // Update company verification status
      const verificationDocuments = [
        verificationData.businessRegistrationDocument,
        verificationData.taxDocument,
        verificationData.proofOfAddress,
        ...(verificationData.additionalDocuments || [])
      ].filter(Boolean) as string[];

      const companyUpdate = {
        verificationStatus: 'pending',
        verificationSubmittedAt: new Date().toISOString(),
        verificationDocuments: verificationDocuments.length ? verificationDocuments : undefined,
      };

      await this.update(companyId, Object.fromEntries(Object.entries(companyUpdate).filter(([, v]) => v !== undefined)));

      Logger.info('Company', companyId, `Company submitted for verification: ${company.name}`);
      
      return verification;
    } catch (error: any) {
      Logger.error('Company', companyId, `Failed to submit for verification: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Review company verification (admin only)
   */
  static async reviewVerification(
    verificationId: string, 
    reviewData: {
      status: 'approved' | 'rejected';
      rejectionReason?: string;
      adminNotes?: string;
      reviewedBy: string;
    }
  ): Promise<CompanyVerification> {
    try {
      const collection = db.collection('companyVerifications');
      let verificationRef = collection.doc(verificationId);
      let verificationDoc = await verificationRef.get();

      // Fallback: if doc doesn't exist with that id, look up by companyId == verificationId
      if (!verificationDoc.exists) {
        const query = await collection.where('companyId', '==', verificationId).limit(1).get();
        if (query.empty) {
          throw new Error('Verification document not found');
        }
        verificationRef = query.docs[0].ref;
        verificationDoc = query.docs[0];
      }

      const baseUpdate = {
        ...reviewData,
        reviewedAt: new Date().toISOString(),
      };
      const cleanedUpdate = Object.fromEntries(
        Object.entries(baseUpdate).filter(([, v]) => v !== undefined)
      );
      await verificationRef.update(cleanedUpdate);

      // Get updated verification
      const verification = verificationDoc.data() as CompanyVerification;
      const verificationStatus = reviewData.status;

      // Update company verification status
      const companyUpdate = {
        verificationStatus: verificationStatus === 'approved' ? 'verified' : verificationStatus,
        verifiedAt: verificationStatus === 'approved' ? new Date().toISOString() : undefined,
        rejectedReason: verificationStatus === 'rejected' ? reviewData.rejectionReason : undefined,
      };
      const cleanedCompanyUpdate = Object.fromEntries(
        Object.entries(companyUpdate).filter(([, v]) => v !== undefined)
      );
      await this.update(verification.companyId, cleanedCompanyUpdate);

      Logger.info('Company', verification.companyId, `Company verification ${verification.status}: ${verificationId}`);
      
      return verification;
    } catch (error: any) {
      Logger.error('Company', verificationId, `Failed to review verification: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get company verification status
   */
  static async getVerification(companyId: string): Promise<CompanyVerification | null> {
    try {
      const snapshot = await db.collection('companyVerifications')
        .where('companyId', '==', companyId)
        .orderBy('submittedAt', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as CompanyVerification;
    } catch (error: any) {
      Logger.error('Company', companyId, `Failed to get verification: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Update fair chance hiring settings
   */
  static async updateFairChanceHiring(
    companyId: string, 
    fairChanceSettings: FairChanceHiringSettings
  ): Promise<Company> {
    try {
      return await this.update(companyId, {
        fairChanceHiring: fairChanceSettings,
      });
    } catch (error: any) {
      Logger.error('Company', companyId, `Failed to update fair chance settings: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get company statistics
   */
  static async getCompanyStats(companyId: string): Promise<CompanyStats> {
    try {
      // Get job statistics
      const jobsSnapshot = await db.collection('jobs')
        .where('postedBy', '==', companyId)
        .get();

      const jobs = jobsSnapshot.docs.map(doc => doc.data());
      const totalJobsPosted = jobs.length;
      const activeJobs = jobs.filter(job => job.status === 'active').length;

      // Get application statistics
      const applicationsSnapshot = await db.collection('jobApplications')
        .where('companyId', '==', companyId)
        .get();

      const totalApplications = applicationsSnapshot.size;

      // Calculate average time to hire and hire rate
      const completedJobs = jobs.filter(job => job.status === 'closed');
      const averageTimeToHire = completedJobs.length > 0 
        ? completedJobs.reduce((sum, job) => {
            const created = new Date(job.createdAt);
            const closed = new Date(job.closedAt || job.updatedAt);
            return sum + Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          }, 0) / completedJobs.length
        : 0;

      const hiredApplications = applicationsSnapshot.docs.filter(doc => 
        doc.data().status === 'hired'
      ).length;
      
      const hireRate = totalApplications > 0 ? (hiredApplications / totalApplications) * 100 : 0;

      // Get last activity
      const lastJob = jobs.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];

      const stats: CompanyStats = {
        totalJobsPosted,
        activeJobs,
        totalApplications,
        averageTimeToHire,
        hireRate,
        lastActivity: lastJob?.updatedAt || new Date().toISOString(),
      };

      return stats;
    } catch (error: any) {
      Logger.error('Company', companyId, `Failed to get company stats: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Deactivate company (soft delete)
   */
  static async deactivate(companyId: string): Promise<void> {
    try {
      await this.update(companyId, {
        isActive: false,
      });

      // Also deactivate all jobs for this company
      const jobsSnapshot = await db.collection('jobs')
        .where('postedBy', '==', companyId)
        .where('status', '==', 'active')
        .get();

      const batch = db.batch();
      jobsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'closed' });
      });

      await batch.commit();
      
      Logger.info('Company', companyId, `Company and jobs deactivated`);
    } catch (error: any) {
      Logger.error('Company', companyId, `Failed to deactivate company: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get industries list for dropdown
   */
  static async getIndustries(): Promise<string[]> {
    try {
      // For now, return static list
      // In production, this could be dynamic based on existing companies
      return [
        'Technology',
        'Healthcare',
        'Finance',
        'Education',
        'Manufacturing',
        'Retail',
        'Hospitality',
        'Construction',
        'Transportation',
        'Energy',
        'Agriculture',
        'Government',
        'Non-profit',
        'Real Estate',
        'Media & Entertainment',
        'Telecommunications',
        'Consulting',
        'Legal',
        'Insurance',
        'Other',
      ];
    } catch (error: any) {
      Logger.error('Company', 'industries', `Failed to get industries: ${error.message}`, error);
      throw error;
    }
  }
}
