import { auth } from '../lib/firebase';
import { api } from '../lib/fetcher';

export type VerificationStatusResponse = {
  success?: boolean;
  emailVerified?: boolean;
  email?: string;
};

/**
 * Check verification status without sending another email.
 * Use POST /auth/resend-verification-email only when the user taps "Resend".
 */
export const fetchEmailVerificationStatus = async (): Promise<VerificationStatusResponse | null> => {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  const token = await user.getIdToken();
  const response = await api.get<VerificationStatusResponse>('/auth/verification-status', {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 15000,
    __suppressErrorToast: true,
  } as Parameters<typeof api.get>[1]);

  return response.data ?? null;
};
