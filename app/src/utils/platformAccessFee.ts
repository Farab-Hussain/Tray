import PaymentService from '../services/payment.service';

export const ACCESS_FEE_ROLES = ['student', 'consultant'] as const;

export type PlatformAccessReturnTo = {
  screen: string;
  params?: Record<string, unknown>;
};

export function needsPlatformAccessFee(
  activeRole: string | null,
  roles: string[],
): boolean {
  const current = activeRole || (roles.length > 0 ? roles[0] : 'student');
  return (
    ACCESS_FEE_ROLES.includes(current as (typeof ACCESS_FEE_ROLES)[number]) ||
    roles.some((r) => ACCESS_FEE_ROLES.includes(r as (typeof ACCESS_FEE_ROLES)[number]))
  );
}

export async function checkPlatformAccessPaid(): Promise<boolean> {
  try {
    const status = await PaymentService.getAccessFeeStatus();
    return status.paid === true;
  } catch {
    return false;
  }
}

/**
 * Blocks flow until platform access fee is paid.
 * Navigates to mandatory paywall when unpaid.
 */
export async function ensurePlatformAccessPaid(
  navigation: {
    navigate: (screen: string, params?: object) => void;
    replace?: (screen: string, params?: object) => void;
  },
  options?: {
    returnTo?: PlatformAccessReturnTo;
    useReplace?: boolean;
  },
): Promise<boolean> {
  const paid = await checkPlatformAccessPaid();
  if (paid) {
    return true;
  }

  const params = {
    required: true,
    returnTo: options?.returnTo,
  };

  if (options?.useReplace && navigation.replace) {
    navigation.replace('PlatformAccessPayment', params);
  } else {
    navigation.navigate('PlatformAccessPayment', params);
  }

  return false;
}
