import { fetcher } from '../lib/fetcher';

export type PublicRole = 'student' | 'consultant' | 'recruiter';

export const PublicProfileService = {
  async getStudent(uid: string) {
    return fetcher(`/public/students/${uid}`);
  },

  async getConsultant(uid: string) {
    return fetcher(`/public/consultants/${uid}`);
  },

  async getRecruiter(uid: string) {
    return fetcher(`/public/recruiters/${uid}`);
  },
};

