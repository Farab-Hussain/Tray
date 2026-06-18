export type AccountType = 'student' | 'consultant' | 'hiring_manager';

/** Maps internal app role (AsyncStorage/navigation) to public registration accountType. */
export function roleToAccountType(role: string): AccountType {
  if (role === 'recruiter') {
    return 'hiring_manager';
  }
  if (role === 'consultant' || role === 'student') {
    return role;
  }
  return 'student';
}
