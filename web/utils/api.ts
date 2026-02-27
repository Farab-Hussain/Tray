import { ConsultantProfileInput } from '@/types';
import axios from 'axios';

// Type definitions for API requests
interface ApplicationInput {
  consultantId: string;
  type: 'existing' | 'new' | 'update';
  serviceId?: string;
  customService?: {
    title: string;
    description: string;
    price: number;
  };
}

interface AvailabilitySchedule {
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
}

interface ServiceData {
  consultantId: string;
  title: string;
  description: string;
  price: number;
  availability?: AvailabilitySchedule;
  imageUrl?: string;
}

interface BookingData {
  consultantId: string;
  serviceId: string;
  scheduledAt: string;
  notes?: string;
}

interface ReviewData {
  consultantId: string;
  bookingId: string;
  rating: number;
  comment: string;
}

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning on free tier
    'Cache-Control': 'no-cache, no-store, must-revalidate', // Prevent caching
    'Pragma': 'no-cache', // HTTP 1.0 compatibility
  },
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ========== Authentication API ==========

export const authAPI = {
  login: (idToken: string) => api.post('/auth/login', { idToken }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: { name?: string; profileImage?: string }) => 
    api.put('/auth/profile', data),
  
  // Admin user management
  getAllUsers: () => api.get('/auth/admin/users'),
  updateUserStatus: (userId: string, status: 'active' | 'inactive' | 'suspended') =>
    api.put(`/auth/admin/users/${userId}/status`, { status }),
  adminDeleteUser: (userId: string) => api.delete(`/auth/admin/users/${userId}`),
  
  // Password management
  changePassword: (newPassword: string, currentPassword?: string) =>
    api.post('/auth/change-password', { newPassword, currentPassword }),
  
  // Admin user creation
  createAdminUser: (data: { email: string; password: string; name?: string }) =>
    api.post('/auth/admin/create-admin', data),
};

// ========== Consultant Flow API ==========

export const consultantFlowAPI = {
  // Status and Profile Management
  getMyStatus: () => api.get('/consultant-flow/status'),
  
  // Profile CRUD
  createProfile: (data: ConsultantProfileInput) => api.post('/consultant-flow/profiles', data),
  getProfile: (uid: string) => api.get(`/consultant-flow/profiles/${uid}`),
  updateProfile: (uid: string, data: ConsultantProfileInput) => api.put(`/consultant-flow/profiles/${uid}`, data),
  
  // Applications
  createApplication: (data: ApplicationInput) => api.post('/consultant-flow/applications', data),
  getMyApplications: () => api.get('/consultant-flow/applications/my'),
  getApplication: (id: string) => api.get(`/consultant-flow/applications/${id}`),
  deleteApplication: (id: string) => api.delete(`/consultant-flow/applications/${id}`),
  
  // Admin Routes
  getAllProfiles: (status?: 'pending' | 'approved' | 'rejected') => 
    api.get('/consultant-flow/profiles', { params: { status } }),
  approveProfile: (uid: string) => api.post(`/consultant-flow/profiles/${uid}/approve`),
  rejectProfile: (uid: string, reason?: string) => 
    api.post(`/consultant-flow/profiles/${uid}/reject`, { reason }),
  
  getAllApplications: (status?: 'pending' | 'approved' | 'rejected', consultantId?: string) =>
    api.get('/consultant-flow/applications', { params: { status, consultantId } }),
  approveApplication: (id: string, reviewNotes?: string) =>
    api.post(`/consultant-flow/applications/${id}/approve`, { reviewNotes }),
  rejectApplication: (id: string, reviewNotes?: string) =>
    api.post(`/consultant-flow/applications/${id}/reject`, { reviewNotes }),
  
  getDashboardStats: () => api.get('/consultant-flow/dashboard/stats'),
  getAnalytics: () => api.get('/consultant-flow/admin/analytics'),
};

// ========== Course Admin API ==========

export const courseAdminAPI = {
  getPendingCourses: () => api.get('/courses/admin/pending'),
  approveCourse: (courseId: string) => api.post(`/courses/${courseId}/approve`),
  rejectCourse: (courseId: string, reason: string) =>
    api.post(`/courses/${courseId}/reject`, { reason }),
};

// ========== Activity API ==========

export const activityAPI = {
  getRecentActivities: (limit?: number) => 
    api.get('/admin/activities/recent', { params: { limit } }),
};

export const uploadAdminAPI = {
  getFileAccessUrl: (publicId: string) =>
    api.get('/upload/file-access-url', { params: { publicId } }),
};

// ========== Resume Admin API ==========

export const resumeAdminAPI = {
  getResumeByUserId: (userId: string) => api.get(`/resumes/admin/by-user/${userId}`),
  reviewWorkEligibilitySection: (
    userId: string,
    data: {
      section:
        | 'drivingTransportation'
        | 'workAuthorizationDocumentation'
        | 'physicalWorkplaceRequirements'
        | 'schedulingWorkEnvironment'
        | 'drugTestingSafetyPolicies'
        | 'professionalLicensingCertifications'
        | 'roleBasedCompatibilitySensitive';
      status: 'pending' | 'verified' | 'rejected';
      reviewNote?: string;
    }
  ) => api.put(`/resumes/${userId}/work-eligibility/review`, data),
};

// ========== Consultant API ==========

export const consultantAPI = {
  getAll: () => api.get('/consultants'),
  getById: (uid: string) => api.get(`/consultants/${uid}`),
  getTop: () => api.get('/consultants/top'),
  setTopConsultant: (consultantId: string) => 
    api.post('/consultants/set-top', { consultantId }),
  
  // Services
  addService: (data: ServiceData) => api.post('/consultants/services', data),
  getDefaultServices: () => api.get('/consultants/services/default'),
  getAllServices: () => api.get('/consultants/services/all'),
  getConsultantServices: (consultantId: string) => 
    api.get(`/consultants/${consultantId}/services`),
  updateService: (serviceId: string, data: Partial<ServiceData>) => 
    api.put(`/consultants/services/${serviceId}`, data),
  deleteService: (serviceId: string) => 
    api.delete(`/consultants/services/${serviceId}`),
};

// ========== Company Admin API ==========
export const companyAdminAPI = {
  getAll: (params?: {
    verificationStatus?: string;
    industry?: string;
    isActive?: boolean;
    limit?: number;
  }) => api.get('/companies/admin/all', { params }),
  reviewVerification: (
    verificationId: string,
    data: { status: 'approved' | 'rejected'; rejectionReason?: string; adminNotes?: string }
  ) => api.put(`/companies/admin/verification/${verificationId}`, data),
};

// ========== Booking API ==========

export const bookingAPI = {
  create: (data: BookingData) => api.post('/bookings', data),
  getMyBookings: () => api.get('/bookings/my'),
  getConsultantBookings: (consultantId: string) => 
    api.get(`/bookings/consultant/${consultantId}`),
  getById: (id: string) => api.get(`/bookings/${id}`),
  updateStatus: (id: string, status: string) => 
    api.put(`/bookings/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/bookings/${id}`),
};

// ========== Review API ==========

export const reviewAPI = {
  create: (data: ReviewData) => api.post('/reviews', data),
  getConsultantReviews: (consultantId: string) => 
    api.get(`/reviews/consultant/${consultantId}`),
  update: (id: string, data: Partial<ReviewData>) => api.put(`/reviews/${id}`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

// ========== Admin AI API (proxied via backend, admin-auth protected) ==========
export const adminAIAPI = {
  generateInsights: (payload: unknown) => {
    return api.post('/consultant-flow/admin/ai-insights', payload);
  },
};

export default api;
