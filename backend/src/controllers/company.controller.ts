// src/controllers/company.controller.ts
import { Request, Response } from 'express';
import { CompanyService } from '../services/company.service';
import { Logger } from '../utils/logger';
import { FairChanceHiringSettings } from '../models/company.model';

/**
 * Create a new company profile
 */
export const createCompany = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      name,
      description,
      industry,
      website,
      size,
      foundedYear,
      locations,
      headquarters,
      contactInfo,
      socialLinks,
      fairChanceHiring,
    } = req.body;

    // Validate required fields
    if (!name || !industry || !locations || !headquarters || !contactInfo?.email) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, industry, locations, headquarters, contactInfo.email' 
      });
    }

    const companyData = {
      name,
      description,
      industry,
      website,
      size,
      foundedYear,
      locations,
      headquarters,
      contactInfo,
      socialLinks: socialLinks || {},
      fairChanceHiring: fairChanceHiring || {
        enabled: false,
        banTheBoxCompliant: false,
        felonyFriendly: false,
        caseByCaseReview: false,
        noBackgroundCheck: false,
        secondChancePolicy: '',
        backgroundCheckPolicy: '',
        rehabilitationSupport: false,
        reentryProgramPartnership: false,
      },
      postedBy: user.uid,
    };

    const company = await CompanyService.create(companyData);

    res.status(201).json({
      message: 'Company profile created successfully',
      company,
    });
  } catch (error: any) {
    Logger.error('Company', 'create', `Failed to create company: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to create company profile' });
  }
};

/**
 * Get company by ID
 */
export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const company = await CompanyService.getById(id);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check if user owns this company or is admin
    if (company.postedBy !== user.uid && user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.status(200).json({ company });
  } catch (error: any) {
    Logger.error('Company', 'get-by-id', `Failed to get company: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to get company' });
  }
};

/**
 * Get user's companies
 */
export const getUserCompanies = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const companies = await CompanyService.getByUserId(user.uid);

    res.status(200).json({ companies });
  } catch (error: any) {
    Logger.error('Company', 'get-user-companies', `Failed to get user companies: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to get companies' });
  }
};

/**
 * Update company profile
 */
export const updateCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user owns this company
    const existingCompany = await CompanyService.getById(id);
    if (!existingCompany) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (existingCompany.postedBy !== user.uid && user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = req.body;
    delete updates.id; // Prevent ID changes
    delete updates.postedBy; // Prevent ownership changes
    delete updates.createdAt; // Prevent creation date changes

    const updatedCompany = await CompanyService.update(id, updates);

    res.status(200).json({
      message: 'Company updated successfully',
      company: updatedCompany,
    });
  } catch (error: any) {
    Logger.error('Company', 'update', `Failed to update company: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to update company' });
  }
};

/**
 * Search companies (public)
 */
export const searchCompanies = async (req: Request, res: Response) => {
  try {
    const { q, industry, verificationStatus, limit } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const companies = await CompanyService.search(q, {
      industry: industry as string,
      verificationStatus: verificationStatus as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    // Only return public information for search results
    const publicCompanies = companies.map(company => ({
      id: company.id,
      name: company.name,
      description: company.description,
      industry: company.industry,
      size: company.size,
      locations: company.locations.map(loc => ({
        city: loc.city,
        state: loc.state,
        country: loc.country,
        locationType: loc.locationType,
      })),
      logoUrl: company.logoUrl,
      verificationStatus: company.verificationStatus,
      fairChanceHiring: {
        enabled: company.fairChanceHiring.enabled,
        banTheBoxCompliant: company.fairChanceHiring.banTheBoxCompliant,
        felonyFriendly: company.fairChanceHiring.felonyFriendly,
      },
    }));

    res.status(200).json({ companies: publicCompanies });
  } catch (error: any) {
    Logger.error('Company', 'search', `Failed to search companies: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to search companies' });
  }
};

/**
 * Submit company for verification
 */
export const submitForVerification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user owns this company
    const company = await CompanyService.getById(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.postedBy !== user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      businessRegistrationDocument,
      taxDocument,
      proofOfAddress,
      additionalDocuments,
    } = req.body;

    const verification = await CompanyService.submitForVerification(id, {
      businessRegistrationDocument,
      taxDocument,
      proofOfAddress,
      additionalDocuments,
    });

    res.status(200).json({
      message: 'Company submitted for verification',
      verification,
    });
  } catch (error: any) {
    Logger.error('Company', 'submit-verification', `Failed to submit for verification: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to submit for verification' });
  }
};

/**
 * Get company verification status
 */
export const getCompanyVerification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user owns this company or is admin
    const company = await CompanyService.getById(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.postedBy !== user.uid && user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const verification = await CompanyService.getVerification(id);

    res.status(200).json({ 
      verification,
      verificationStatus: company.verificationStatus,
    });
  } catch (error: any) {
    Logger.error('Company', 'get-verification', `Failed to get verification: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to get verification status' });
  }
};

/**
 * Update fair chance hiring settings
 */
export const updateFairChanceHiring = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user owns this company
    const company = await CompanyService.getById(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.postedBy !== user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const fairChanceSettings: FairChanceHiringSettings = req.body;

    const updatedCompany = await CompanyService.updateFairChanceHiring(id, fairChanceSettings);

    res.status(200).json({
      message: 'Fair chance hiring settings updated',
      fairChanceHiring: updatedCompany.fairChanceHiring,
    });
  } catch (error: any) {
    Logger.error('Company', 'update-fair-chance', `Failed to update fair chance settings: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to update fair chance hiring settings' });
  }
};

/**
 * Get company statistics
 */
export const getCompanyStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user owns this company
    const company = await CompanyService.getById(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.postedBy !== user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await CompanyService.getCompanyStats(id);

    res.status(200).json({ stats });
  } catch (error: any) {
    Logger.error('Company', 'get-stats', `Failed to get company stats: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to get company statistics' });
  }
};

/**
 * Get all companies (admin only)
 */
export const getAllCompanies = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { verificationStatus, industry, isActive, limit } = req.query;

    const companies = await CompanyService.getAll({
      verificationStatus: verificationStatus as string,
      industry: industry as string,
      isActive: isActive ? isActive === 'true' : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.status(200).json({ companies });
  } catch (error: any) {
    Logger.error('Company', 'get-all', `Failed to get all companies: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to get companies' });
  }
};

/**
 * Review company verification (admin only)
 */
export const reviewCompanyVerification = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { verificationId } = req.params;
    const { status, rejectionReason, adminNotes } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be approved or rejected' });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required when rejecting' });
    }

    const verification = await CompanyService.reviewVerification(verificationId, {
      status,
      rejectionReason,
      adminNotes,
      reviewedBy: user.uid,
    });

    res.status(200).json({
      message: `Company verification ${status}`,
      verification,
    });
  } catch (error: any) {
    Logger.error('Company', 'review-verification', `Failed to review verification: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to review verification' });
  }
};

/**
 * Get industries list
 */
export const getIndustries = async (req: Request, res: Response) => {
  try {
    const industries = await CompanyService.getIndustries();

    res.status(200).json({ industries });
  } catch (error: any) {
    Logger.error('Company', 'get-industries', `Failed to get industries: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to get industries' });
  }
};

/**
 * Deactivate company (admin or owner only)
 */
export const deactivateCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user owns this company or is admin
    const company = await CompanyService.getById(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.postedBy !== user.uid && user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await CompanyService.deactivate(id);

    res.status(200).json({
      message: 'Company deactivated successfully',
    });
  } catch (error: any) {
    Logger.error('Company', 'deactivate', `Failed to deactivate company: ${error.message}`, error);
    res.status(500).json({ error: error.message || 'Failed to deactivate company' });
  }
};
