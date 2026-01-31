// src/models/company.model.ts
export interface Company {
  id: string;
  name: string;
  description?: string;
  industry: string;
  website?: string;
  logoUrl?: string;
  logoPublicId?: string;
  size: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
  foundedYear?: number;
  locations: CompanyLocation[];
  headquarters: CompanyLocation;
  contactInfo: CompanyContactInfo;
  socialLinks: CompanySocialLinks;
  fairChanceHiring: FairChanceHiringSettings;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'not_submitted';
  verificationDocuments?: string[];
  verificationSubmittedAt?: string;
  verifiedAt?: string;
  rejectedReason?: string;
  subscriptionTier?: 'free' | 'basic' | 'premium';
  subscriptionExpiresAt?: string;
  isActive: boolean;
  postedBy: string; // User ID who created the company profile
  createdAt: string;
  updatedAt: string;
}

export interface CompanyLocation {
  id: string;
  name: string; // e.g., "Headquarters", "New York Office"
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isHeadquarters: boolean;
  shiftTypes: string[]; // Available shift types at this location
  locationType: 'office' | 'remote' | 'hybrid';
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
  id: string;
  companyId: string;
  businessRegistrationDocument?: string;
  taxDocument?: string;
  proofOfAddress?: string;
  additionalDocuments?: string[];
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  adminNotes?: string;
}

export interface CompanyStats {
  totalJobsPosted: number;
  activeJobs: number;
  totalApplications: number;
  averageTimeToHire: number; // in days
  hireRate: number; // percentage
  lastActivity: string;
}
