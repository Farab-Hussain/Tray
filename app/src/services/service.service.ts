import { api } from '../lib/fetcher';

export interface ConsultantServiceInput {
  consultantId: string;
  title: string;
  description: string;
  details?: string;
  duration: number;
  price: number;
  imageUrl?: string;
  imagePublicId?: string | null;
  videoUrl?: string;
  availability?: {
    days?: string[];
    startTime?: string;
    endTime?: string;
    timezone?: string;
  };
  paymentOptions?: {
    type?: 'one_time' | 'package' | 'weekly' | 'monthly';
    sessionPrice?: number;
    packageSessions?: number;
    packagePrice?: number;
    weeklyPrice?: number;
    monthlyPrice?: number;
  };
  tags?: string[];
  category?: string;
}

export interface ConsultantServiceRecord extends ConsultantServiceInput {
  id: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface ServicePurchaseInput {
  consultantId: string;
  serviceId: string;
  date: string;
  time: string;
  amount: number;
  quantity?: number;
  status?: 'pending' | 'confirmed' | 'accepted' | 'approved' | 'completed';
  paymentStatus?: 'pending' | 'paid' | 'unpaid';
  paymentIntentId?: string;
}

class ServiceService {
  async createService(data: ConsultantServiceInput): Promise<{ message: string; service?: ConsultantServiceRecord }> {
    const response = await api.post('/consultants/services', data);
    return response.data;
  }

  async getConsultantServices(consultantId: string): Promise<{ services: ConsultantServiceRecord[] }> {
    const response = await api.get(`/consultants/${consultantId}/services`);
    return response.data;
  }

  async getServiceById(serviceId: string): Promise<{ service: ConsultantServiceRecord }> {
    const response = await api.get(`/consultants/services/${serviceId}`);
    return response.data;
  }

  async getAllServices(page: number = 1, limit: number = 20): Promise<{
    services: ConsultantServiceRecord[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const response = await api.get(`/consultants/services/all?page=${page}&limit=${limit}`);
    return response.data;
  }

  async updateService(serviceId: string, data: Partial<ConsultantServiceInput> & {
    cancelBookings?: boolean;
    adjustAvailability?: boolean;
  }): Promise<{
    message: string;
    serviceId: string;
    cancelledBookings?: Array<{ bookingId: string; message: string }>;
    availabilityUpdated?: { updated: boolean; count: number };
  }> {
    const response = await api.put(`/consultants/services/${serviceId}`, data);
    return response.data;
  }

  async deleteService(serviceId: string, options?: { cancelBookings?: boolean }): Promise<{
    message: string;
    serviceId: string;
    cancelledBookings?: Array<{ bookingId: string; message: string }>;
  }> {
    const response = await api.delete(`/consultants/services/${serviceId}`, {
      data: options,
      params: options,
    });
    return response.data;
  }

  async getServiceBookings(serviceId: string): Promise<{
    serviceId: string;
    count: number;
    bookings: any[];
  }> {
    const response = await api.get(`/consultants/services/${serviceId}/bookings`);
    return response.data;
  }

  async setAvailabilitySlots(
    consultantId: string,
    availabilitySlots: any[],
    availabilityWindows?: Array<{ date: string; startTime: string; endTime: string }>,
  ): Promise<any> {
    const response = await api.put(`/consultant-flow/profiles/${consultantId}/availability-slots`, {
      availabilitySlots,
      ...(Array.isArray(availabilityWindows) ? { availabilityWindows } : {}),
    });
    return response.data;
  }

  async getAvailability(consultantId: string): Promise<any> {
    const response = await api.get(`/consultant-flow/profiles/${consultantId}/availability`);
    return response.data;
  }

  async purchaseService(data: ServicePurchaseInput): Promise<{ message: string; bookingId: string }> {
    const payload = {
      ...data,
      quantity: data.quantity ?? 1,
      status: data.status ?? 'confirmed',
      paymentStatus: data.paymentStatus ?? 'paid',
    };
    const response = await api.post('/bookings', payload);
    return response.data;
  }

  async checkCommunicationAccess(consultantId: string): Promise<{ hasAccess: boolean; message: string }> {
    const response = await api.get(`/bookings/has-access/${consultantId}`);
    return response.data;
  }
}

export const serviceService = new ServiceService();
