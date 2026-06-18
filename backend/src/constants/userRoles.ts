export enum UserRole {
  STUDENT = 'student',
  CONSULTANT = 'consultant',
  RECRUITER = 'recruiter',
  ADMIN = 'admin',
}

/** Account types accepted from public registration (mobile/web signup). */
export const PUBLIC_ACCOUNT_TYPES = [
  'student',
  'consultant',
  'hiring_manager',
] as const;

export type PublicAccountType = (typeof PUBLIC_ACCOUNT_TYPES)[number];

/** Maps public accountType to the internal role stored in Firestore. */
export const ACCOUNT_TYPE_TO_ROLE: Record<PublicAccountType, UserRole> = {
  student: UserRole.STUDENT,
  consultant: UserRole.CONSULTANT,
  hiring_manager: UserRole.RECRUITER,
};

export function resolveRoleFromAccountType(accountType: string): UserRole | null {
  if (!PUBLIC_ACCOUNT_TYPES.includes(accountType as PublicAccountType)) {
    return null;
  }
  return ACCOUNT_TYPE_TO_ROLE[accountType as PublicAccountType];
}
