// Base types for the application
export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

// Form related types
export interface FormData {
  name: string;
  surname: string;
  education: string;
  gender: string;
  headquarters: string;
  email: string;
  phone: string;
  fairChance: boolean;
  commitment: boolean;
}

export interface FormErrors {
  name?: string;
  surname?: string;
  education?: string;
  gender?: string;
  headquarters?: string;
  email?: string;
  phone?: string;
  fairChance?: string;
  commitment?: string;
}

// Service related types
export interface Service extends BaseEntity {
  icon: string;
  title: string;
  description: string;
  tags?: string[];
  rating: number;
  isVerified: boolean;
  proposalsCount: string;
  status?: ServiceStatus;
  appliedDate?: string;
  consultant?: {
    uid: string;
    name: string;
    category: string;
    rating: number;
    totalReviews: number;
    profileImage?: string;
  };
  isDefault?: boolean;
}

export type ServiceStatus = "available" | "applied" | "bookmarked";

// Backend Service API response types
export interface BackendService {
  id: string;
  title: string;
  description: string;
  duration?: number;
  price?: number;
  isDefault?: boolean;
  consultant?: {
    uid: string;
    name: string;
    category: string;
    rating: number;
    totalReviews: number;
    profileImage?: string;
  };
  createdAt?: string;
}

export interface BackendApplication {
  id: string;
  consultantId: string;
  consultantName?: string; // Added for display purposes
  type: 'existing' | 'new';
  serviceId?: string;
  customService?: {
    title: string;
    description: string;
    duration: number;
    price: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface ServiceAPIResponse {
  services: BackendService[];
}

export interface ApplicationAPIResponse {
  message: string;
  application: BackendApplication;
}

export interface MyApplicationsResponse {
  applications: BackendApplication[];
}

export interface ServiceCardProps {
  id: string;
  icon: string;
  title: string;
  description: string;
  tags?: string[];
  rating: number;
  isVerified: boolean;
  proposalsCount: string;
  isBookmarked: boolean;
  onBookmark: (id: string) => void;
  onClick: (id: string) => void;
  className?: string;
}

// Client related types
export interface Client extends BaseEntity {
  name: string;
  profilePic?: string;
  email?: string;
  status?: ClientStatus;
}

export type ClientStatus = "online" | "offline" | "busy";

export interface ClientListProps {
  clients: Client[];
  onClientClick?: (client: Client) => void;
  className?: string;
}

// Booking related types
export interface Booking extends BaseEntity {
  clientName: string;
  consultantName: string;
  date: string;
  time: string;
  status: BookingStatus;
  amount: string;
  serviceId?: string;
}

export type BookingStatus = "completed" | "in-progress" | "pending" | "cancelled";

export interface BookingRowProps {
  clientName: string;
  consultantName: string;
  date: string;
  status: BookingStatus;
  onViewDetails?: (clientName: string, consultantName: string) => void;
  className?: string;
}

// Payment related types
export interface ConsultantPayout extends BaseEntity {
  consultantName: string;
  totalEarned: string;
  platformCommission: string;
  payoutStatus: PayoutStatus;
}

export type PayoutStatus = "paid" | "pending" | "failed";

export interface ConsultantPayoutRowProps {
  consultantName: string;
  totalEarned: string;
  platformCommission: string;
  payoutStatus: PayoutStatus;
  onConsultantClick?: (consultantName: string) => void;
  className?: string;
}

// Statistics related types
export interface StatCardData {
  title: string;
  value: string;
  percentage: string;
  trend: TrendDirection;
  variant: StatVariant;
}

export type TrendDirection = "up" | "down";
export type StatVariant = "success" | "warning" | "error" | "info";

export interface StatCardProps {
  title: string;
  value: string;
  percentage: string;
  trend: TrendDirection;
  variant: StatVariant;
  className?: string;
}

// UI Component types
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface StatusBadgeProps {
  status: BadgeStatus;
  children: React.ReactNode;
  className?: string;
}

export type BadgeStatus = "paid" | "pending" | "failed" | "completed" | "in-progress" | "cancelled";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Navigation types
export interface NavigationItem {
  name: string;
  href: string;
  icon: string;
}

export interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPath: string;
}

// Filter and search types
export interface FilterOptions {
  searchTerm: string;
  status: FilterStatus;
  dateRange?: DateRange;
}

export type FilterStatus = "all" | "available" | "applied" | "bookmarked";

export interface DateRange {
  start: string;
  end: string;
}

// API related types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Local storage types
export interface LocalStorageKeys {
  CONSULTANT_PROFILE: string;
  SERVICES: string;
  BOOKMARKED_SERVICES: string;
  APPLIED_SERVICES: string;
  CLIENTS: string;
  BOOKINGS: string;
  PAYOUTS: string;
}

// Theme and styling types
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// Error handling types
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
}

//  Consultant Flow Types

// Consultant Profile Types
export interface ConsultantProfileInput {
  uid: string;
  personalInfo: PersonalInfo;
  professionalInfo: ProfessionalInfo;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  bio: string;
  experience: number; // years of experience
  profileImage?: string;
  qualifications: string[]; // e.g., ["Bachelor's Degree", "Certified Coach"]
}

export interface ProfessionalInfo {
  title?: string; // Professional title (e.g., "Senior Career Consultant")
  category: string; // Career Counseling, Academic Guidance, Business Consulting
  specialties: string[]; // e.g., ["Career Planning", "Resume Review", "Interview Preparation"]
  hourlyRate: number;
  availability: Record<string, string[]>; // e.g., { monday: ["09:00", "10:00"], tuesday: ["14:00", "15:00"] }
}

export interface ConsultantProfile extends ConsultantProfileInput {
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// Consultant Application Types
export interface ConsultantApplicationInput {
  consultantId: string;
  type: 'existing' | 'new';
  serviceId?: string; // for existing service
  customService?: CustomService; // for new service
}

export interface CustomService {
  title: string;
  description: string;
  duration: number; // in minutes
  price: number;
  imageUrl?: string;
  imagePublicId?: string;
}

export interface ConsultantApplication extends ConsultantApplicationInput {
  id: string;
  consultantName?: string; // Added for display purposes
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt: string | null;
  reviewNotes?: string;
}

// Dashboard Stats Types
export interface DashboardStats {
  profiles: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  applications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  summary: {
    totalPendingReviews: number;
    totalApproved: number;
    totalRejected: number;
  };
}

// Status Types
export type ProfileStatus = 'pending' | 'approved' | 'rejected';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

// Form Step Types
export interface ProfileFormStep {
  id: number;
  title: string;
  description: string;
  fields: string[];
}

// Consultant Category Options (matching backend)
export type ConsultantCategory = 
  | 'Career Counseling'
  | 'Academic Guidance'
  | 'Business Consulting'
  | 'Financial Consulting'
  | 'Marketing Consulting'
  | 'Legal Consulting'
  | 'Technical Consulting'
  | 'Other';

export const CONSULTANT_CATEGORIES: ConsultantCategory[] = [
  'Career Counseling',
  'Academic Guidance',
  'Business Consulting',
  'Financial Consulting',
  'Marketing Consulting',
  'Legal Consulting',
  'Technical Consulting',
  'Other',
];
