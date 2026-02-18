import { fetcher, api }  from '../lib/fetcher';

export const ConsultantService = {
  // Fetch top consultant(s)
  async getTopConsultants() {
    // Add cache busting to ensure fresh data (especially for updated profile images)
    return await fetcher(`/consultants/top?t=${Date.now()}`);
  },

  // Fetch all consultants with pagination
  async getAllConsultants(page: number = 1, limit: number = 20) {
    // Add cache busting to ensure fresh data (especially for updated profile images)
    return await fetcher(`/consultants?page=${page}&limit=${limit}&t=${Date.now()}`);
  },

  // Fetch consultant's services
  async getConsultantServices(consultantId: string) {
    return await fetcher(`/consultants/${consultantId}/services`);
  },

  async getServiceById(serviceId: string) {
    return await fetcher(`/consultants/services/${serviceId}`);
  },

  // Fetch all services from all consultants with pagination
  async getAllServices(page: number = 1, limit: number = 20) {
    return await fetcher(`/consultants/services/all?page=${page}&limit=${limit}`);
  },

  async getServiceBookings(serviceId: string) {
    const response = await api.get(`/consultants/services/${serviceId}/bookings`);
    return response.data;
  },

  async updateService(serviceId: string, data: any) {
    const response = await api.put(`/consultants/services/${serviceId}`, data);
    return response.data;
  },

  async deleteService(serviceId: string, options?: { cancelBookings?: boolean }) {
    const response = await api.delete(`/consultants/services/${serviceId}`, {
      data: options,
      params: options,
    });
    return response.data;
  },

  // Get consultant availability (gracefully handle 404 as no availability)
  async getConsultantAvailability(consultantId: string) {
    try {
      const response = await api.get(`/consultant-flow/profiles/${consultantId}/availability`);
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) {
        // Normalize a friendly empty availability response
        return {
          available: false,
          availability: {},
          availabilitySlots: [],
          availabilityWindows: [],
          message: error?.response?.data?.error || 'Consultant availability not found',
        };
      }
      throw error;
    }
  },

  // Set consultant availability slots
  async setAvailabilitySlots(
    consultantId: string,
    availabilitySlots: any[],
    availabilityWindows?: Array<{ date: string; startTime: string; endTime: string }>,
  ) {
    try {
            if (__DEV__) {
        console.log('🔧 [ConsultantService] Setting availability slots...')
      };
            if (__DEV__) {
        console.log('📋 [ConsultantService] Consultant ID:', consultantId)
      };
            if (__DEV__) {
        console.log('📊 [ConsultantService] Availability slots count:', availabilitySlots.length)
      };
            if (__DEV__) {
        console.log('📅 [ConsultantService] Sample slots:', availabilitySlots.slice(0, 3))
      };
      
      const response = await api.put(
        `/consultant-flow/profiles/${consultantId}/availability-slots`,
        {
          availabilitySlots,
          ...(Array.isArray(availabilityWindows)
            ? { availabilityWindows }
            : {}),
        },
      );
      
            if (__DEV__) {
        console.log('✅ [ConsultantService] Success response:', response.data)
      };
      return response.data;
    } catch (error) {
            if (__DEV__) {
        console.error('❌ [ConsultantService] Error setting availability slots:', error)
      };
      throw error;
    }
  },

  // Delete a specific availability slot
  async deleteAvailabilitySlot(consultantId: string, date: string, timeSlot: string) {
    try {
            if (__DEV__) {
        console.log('🗑️ [ConsultantService] Deleting availability slot...')
      };
            if (__DEV__) {
        console.log('📋 [ConsultantService] Consultant ID:', consultantId)
      };
            if (__DEV__) {
        console.log('📅 [ConsultantService] Date:', date)
      };
            if (__DEV__) {
        console.log('⏰ [ConsultantService] Time slot:', timeSlot)
      };
      
      // Use axios params option for query parameters in React Native
      const response = await api.delete(`/consultant-flow/profiles/${consultantId}/availability-slots`, {
        params: {
          date,
          timeSlot
        }
      });
      
            if (__DEV__) {
        console.log('✅ [ConsultantService] Success response:', response.data)
      };
      return response.data;
    } catch (error: any) {
            if (__DEV__) {
        console.error('❌ [ConsultantService] Error deleting availability slot:', error)
      };
      // Re-throw the error to let the caller handle it
      throw error;
    }
  },

  // Get consultant profile (gracefully handle 404 as not a consultant)
  async getConsultantProfile(consultantId: string) {
    try {
      const response = await api.get(`/consultant-flow/profiles/${consultantId}`);
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) {
        // Expected - user is not a consultant, return null instead of error
        return null;
      }
      // Only log unexpected errors
            if (__DEV__) {
        console.error('❌ [ConsultantService] Error fetching consultant profile:', error)
      };
      throw error;
    }
  },
};
