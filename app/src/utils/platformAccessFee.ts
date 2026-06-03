import PaymentService from '../services/payment.service';

/** Internal role keys — UI labels: student=Client, recruiter=Hiring Manager */
export const ACCESS_FEE_ROLES = ['student', 'consultant', 'recruiter'] as const;
export type AccessFeeRoleKey = (typeof ACCESS_FEE_ROLES)[number];

export const ACCESS_FEE_ROLE_LABELS: Record<AccessFeeRoleKey, string> = {
  student: 'Client',
  consultant: 'Consultant',
  recruiter: 'Hiring Manager',
};

export type PlatformAccessReturnTo = {
  screen: string;
  params?: Record<string, unknown>;
};

export function getAccessFeeRoleForActiveRole(activeRole: string | null): AccessFeeRoleKey | null {
  if (
    activeRole === 'student' ||
    activeRole === 'consultant' ||
    activeRole === 'recruiter'
  ) {
    return activeRole;
  }
  return null;
}

export function needsPlatformAccessFee(
  activeRole: string | null,
  _roles: string[],
): boolean {
  return getAccessFeeRoleForActiveRole(activeRole) !== null;
}

export async function checkPlatformAccessPaid(activeRole?: string | null): Promise<boolean> {
  try {
    const status = await PaymentService.getAccessFeeStatus(activeRole || undefined);
    return status.paid === true;
  } catch {
    return false;
  }
}

/**
 * Blocks flow until platform access fee is paid for the active role.
 */
export async function ensurePlatformAccessPaid(
  navigation: {
    navigate: (screen: string, params?: object) => void;
    replace?: (screen: string, params?: object) => void;
  },
  options?: {
    activeRole?: string | null;
    returnTo?: PlatformAccessReturnTo;
    useReplace?: boolean;
  },
): Promise<boolean> {
  const paid = await checkPlatformAccessPaid(options?.activeRole);
  if (paid) {
    return true;
  }

  const params = {
    required: true,
    returnTo: options?.returnTo,
    role: options?.activeRole,
  };

  if (options?.useReplace && navigation.replace) {
    navigation.replace('PlatformAccessPayment', params);
  } else {
    navigation.navigate('PlatformAccessPayment', params);
  }

  return false;
}
