import { DecodedIdToken } from 'firebase-admin/auth';

declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
      userRole?: string;
      rateLimit?: {
        limit: number;
        remaining: number;
        resetTime: Date;
      };
    }
  }
}

export {};

