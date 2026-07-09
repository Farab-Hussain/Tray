import { getPricingSettings, PricingSettings } from './pricingSettings.service';

export type AccessFeeRoleKey = 'student' | 'consultant' | 'recruiter';

export const ACCESS_FEE_ROLE_LABELS: Record<AccessFeeRoleKey, string> = {
  student: 'Client',
  consultant: 'Consultant',
  recruiter: 'Hiring Manager',
};

export function resolveAccessFeeRole(
  activeRole?: string | null,
  roles: string[] = []
): AccessFeeRoleKey | null {
  const current = activeRole || roles[0];
  if (current === 'student' || current === 'consultant' || current === 'recruiter') {
    return current;
  }
  if (roles.includes('recruiter')) return 'recruiter';
  if (roles.includes('consultant')) return 'consultant';
  if (roles.includes('student')) return 'student';
  return null;
}

export function getAccessFeeAmountForRole(
  pricing: PricingSettings,
  role: AccessFeeRoleKey
): number {
  switch (role) {
    case 'student':
      return pricing.clientAccessFee;
    case 'consultant':
      return pricing.consultantAccessFee;
    case 'recruiter':
      return pricing.hiringManagerAccessFee;
    default:
      return 0;
  }
}

export function hasPaidAccessFeeForRole(
  userData: Record<string, unknown> | undefined,
  role: AccessFeeRoleKey
): boolean {
  if (!userData) return false;
  if (userData.accessFeeWaived === true) return true;

  const paidRoles = (userData.accessFeePaidRoles || {}) as Record<string, boolean>;
  if (paidRoles[role] === true) return true;

  // Legacy: single flag covered student + consultant access
  if (userData.hasPaidAccessFee === true && (role === 'student' || role === 'consultant')) {
    return true;
  }

  if (userData.hasPaidHiringManagerAccessFee === true && role === 'recruiter') {
    return true;
  }

  return false;
}

export async function isAccessFeeRequiredForRole(role: AccessFeeRoleKey): Promise<boolean> {
  const pricing = await getPricingSettings();
  return getAccessFeeAmountForRole(pricing, role) > 0;
}

export async function getAccessFeeStatusForUser(
  userData: Record<string, unknown>,
  role: AccessFeeRoleKey
) {
  const pricing = await getPricingSettings();
  const fee = getAccessFeeAmountForRole(pricing, role);
  const paid = fee <= 0 || hasPaidAccessFeeForRole(userData, role);

  return {
    role,
    roleLabel: ACCESS_FEE_ROLE_LABELS[role],
    paid,
    waived: userData.accessFeeWaived === true,
    fee,
    amountCents: Math.round(fee * 100),
    required: fee > 0 && !paid,
  };
}

export function buildAccessFeePaidUpdate(role: AccessFeeRoleKey, extra: Record<string, unknown> = {}) {
  const update: Record<string, unknown> = {
    [`accessFeePaidRoles.${role}`]: true,
    accessFeePaidAt: new Date().toISOString(),
    accessFeePaidForRole: role,
    updatedAt: new Date().toISOString(),
    ...extra,
  };

  if (role === 'student' || role === 'consultant') {
    update.hasPaidAccessFee = true;
  }
  if (role === 'recruiter') {
    update.hasPaidHiringManagerAccessFee = true;
  }

  return update;
}
