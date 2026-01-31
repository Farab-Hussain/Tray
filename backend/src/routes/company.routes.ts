// src/routes/company.routes.ts
import { Router } from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import { authorizeRole } from '../middleware/authMiddleware';
import {
  createCompany,
  getCompanyById,
  getUserCompanies,
  updateCompany,
  searchCompanies,
  submitForVerification,
  getCompanyVerification,
  updateFairChanceHiring,
  getCompanyStats,
  getAllCompanies,
  reviewCompanyVerification,
  getIndustries,
  deactivateCompany,
} from '../controllers/company.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticateUser());

/**
 * Public Company Routes
 */

// Search companies (publicly accessible for job seekers)
router.get('/search', searchCompanies);

// Get industries list (public)
router.get('/industries', getIndustries);

/**
 * Company Owner Routes
 */

// Create new company profile
router.post('/', createCompany);

// Get current user's companies
router.get('/my', getUserCompanies);

// Get specific company by ID (owner only)
router.get('/:id', getCompanyById);

// Update company profile (owner only)
router.put('/:id', updateCompany);

// Submit company for verification (owner only)
router.post('/:id/verification', submitForVerification);

// Get company verification status (owner only)
router.get('/:id/verification', getCompanyVerification);

// Update fair chance hiring settings (owner only)
router.put('/:id/fair-chance', updateFairChanceHiring);

// Get company statistics (owner only)
router.get('/:id/stats', getCompanyStats);

// Deactivate company (owner only)
router.delete('/:id', deactivateCompany);

/**
 * Admin Routes
 */

// Get all companies (admin only)
router.get('/admin/all', authorizeRole(['admin']), getAllCompanies);

// Review company verification (admin only)
router.put('/admin/verification/:verificationId', authorizeRole(['admin']), reviewCompanyVerification);

export default router;
