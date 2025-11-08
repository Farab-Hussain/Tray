import { fetcher, api }  from '../lib/fetcher';

export const ConsultantService = {
  // Fetch top consultant(s)
  async getTopConsultants() {
    return await fetcher('/consultants/top');
  },

  // Fetch all consultants
  async getAllConsultants() {
    return await fetcher('/consultants');
  },

  // Fetch consultant's services
  async getConsultantServices(consultantId: string) {
    return await fetcher(`/consultants/${consultantId}/services`);
  },

  async getServiceById(serviceId: string) {
    return await fetcher(`/consultants/services/${serviceId}`);
  },

  // Fetch all services from all consultants
  async getAllServices() {
    return await fetcher('/consultants/services/all');
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
          message: error?.response?.data?.error || 'Consultant availability not found',
        };
      }
      throw error;
    }
  },

  // Set consultant availability slots
  async setAvailabilitySlots(consultantId: string, availabilitySlots: any[]) {
    try {
      console.log('🔧 [ConsultantService] Setting availability slots...');
      console.log('📋 [ConsultantService] Consultant ID:', consultantId);
      console.log('📊 [ConsultantService] Availability slots count:', availabilitySlots.length);
      console.log('📅 [ConsultantService] Sample slots:', availabilitySlots.slice(0, 3));
      
      const response = await api.put(`/consultant-flow/profiles/${consultantId}/availability-slots`, {
        availabilitySlots
      });
      
      console.log('✅ [ConsultantService] Success response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [ConsultantService] Error setting availability slots:', error);
      throw error;
    }
  },

  // Delete a specific availability slot
  async deleteAvailabilitySlot(consultantId: string, date: string, timeSlot: string) {
    try {
      console.log('🗑️ [ConsultantService] Deleting availability slot...');
      console.log('📋 [ConsultantService] Consultant ID:', consultantId);
      console.log('📅 [ConsultantService] Date:', date);
      console.log('⏰ [ConsultantService] Time slot:', timeSlot);
      
      // Use axios params option for query parameters in React Native
      const response = await api.delete(`/consultant-flow/profiles/${consultantId}/availability-slots`, {
        params: {
          date,
          timeSlot
        }
      });
      
      console.log('✅ [ConsultantService] Success response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [ConsultantService] Error deleting availability slot:', error);
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
      console.error('❌ [ConsultantService] Error fetching consultant profile:', error);
      throw error;
    }
  },
};
