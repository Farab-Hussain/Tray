import { api } from '../lib/fetcher';

interface SupportPayload {
  name?: string;
  email: string;
  subject: string;
  message: string;
}

export const SupportService = {
  sendSupportRequest: async (payload: SupportPayload) => {
    try {
      const response = await api.post('/support/contact', payload);
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      const attemptedUrl = error?.config?.url;

      if (status === 404 && attemptedUrl?.includes('/support/contact')) {
        const fallbackResponse = await api.post('/support/submit', payload);
        return fallbackResponse.data;
      }

      throw error;
    }
  },
};

export default SupportService;

