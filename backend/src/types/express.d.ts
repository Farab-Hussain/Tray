import { DecodedIdToken } from 'firebase-admin/auth';

declare global {
  namespace Express {
    interface AuthenticatedUser extends Partial<DecodedIdToken> {
      id?: string;
      role?: string;
      firstName?: string;
      lastName?: string;
    }

    interface Request {
      user?: AuthenticatedUser;
      userRole?: string;
    }
  }
}

export {};
