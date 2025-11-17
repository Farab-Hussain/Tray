import { api } from '../lib/fetcher';

// Types
export interface ConsultantProfile {
  uid: string;
  personalInfo: {
    fullName: string;
    email: string;
    bio: string;
    experience: number;
    profileImage?: string;
  };
  professionalInfo: {
    category: string;
    title?: string;
    specialties?: string[];
  };
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultantProfileInput {
  uid: string;
  personalInfo: {
    fullName: string;
    email: string;
    bio: string;
    experience: number;
    profileImage?: string;
    profileImagePublicId?: string;
  };
  professionalInfo: {
    category: string;
    title?: string;
    specialties?: string[];
  };
}

export interface ConsultantApplication {
  id: string;
  consultantId: string;
  type: 'new' | 'existing' | 'update';
  serviceId?: string;
  customService?: {
    title: string;
    description: string;
    duration: number;
    price: number;
    imageUrl?: string;
    // VIDEO UPLOAD CODE - COMMENTED OUT
    // videoUrl?: string;
    imagePublicId?: string;
    // videoPublicId?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultantApplicationInput {
  consultantId: string;
  type: 'new' | 'existing' | 'update';
  serviceId?: string;
  customService?: {
    title: string;
    description: string;
    duration: number;
    price: number;
    imageUrl?: string;
    // VIDEO UPLOAD CODE - COMMENTED OUT
    // videoUrl?: string;
    imagePublicId?: string;
    // videoPublicId?: string;
  };
}


export const setDemoToken = async () => {
  console.log('Using Firebase authentication tokens');
};

// Profile APIs
export const createConsultantProfile = async (
  profileData: ConsultantProfileInput
): Promise<ConsultantProfile> => {
  const response = await api.post('/consultant-flow/profiles', profileData);
  return response.data;
};

export const getConsultantProfile = async (
  uid: string
): Promise<ConsultantProfile> => {
  const response = await api.get(`/consultant-flow/profiles/${uid}`);
  return response.data.profile;  
};

export const updateConsultantProfile = async (
  uid: string,
  profileData: ConsultantProfileInput
): Promise<ConsultantProfile> => {
  const response = await api.put(`/consultant-flow/profiles/${uid}`, profileData);
  return response.data;
};

// Application APIs
export const createConsultantApplication = async (
  applicationData: ConsultantApplicationInput
): Promise<ConsultantApplication> => {
  const response = await api.post('/consultant-flow/applications', applicationData);
  return response.data;
};

export const getConsultantApplications = async (): Promise<ConsultantApplication[]> => {
  // Use the consultant-specific endpoint that doesn't require admin role
  // The backend automatically uses the authenticated user's uid
  const response = await api.get('/consultant-flow/applications/my');
  return response.data.applications || response.data;
};

export const deleteConsultantApplication = async (
  applicationId: string
): Promise<void> => {
  await api.delete(`/consultant-flow/applications/${applicationId}`);
};

export const updateConsultantApplication = async (
  applicationId: string,
  data: {
    type?: 'new' | 'existing' | 'update';
    serviceId?: string;
    customService?: {
      title: string;
      description: string;
      duration: number;
      price: number;
      imageUrl?: string | null;
      imagePublicId?: string | null;
    };
  }
) => {
  const response = await api.put(`/consultant-flow/applications/${applicationId}`, data);
  return response.data;
};

// Get consultant verification status
export const getConsultantVerificationStatus = async (): Promise<{
  hasProfile: boolean;
  status: string;
  message: string;
  nextStep: string;
  profile?: any;
  applications?: any;
}> => {
  const response = await api.get('/consultant-flow/status');
  return response.data;
};
