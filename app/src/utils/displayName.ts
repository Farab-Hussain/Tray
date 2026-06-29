type DisplayNameSource = {
  name?: string | null;
  displayName?: string | null;
  email?: string | null;
  role?: string | null;
  uid?: string;
};

const clean = (value?: string | null): string =>
  typeof value === 'string' ? value.trim() : '';

export const formatNameFromEmail = (email?: string | null): string => {
  const local = clean(email).split('@')[0] || '';
  const formatted = local.replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return formatted;
};

/** Resolve a human-readable label for any user record or auth profile. */
export function resolveUserDisplayName(
  user?: DisplayNameSource | null,
  fallbackUid?: string,
): string {
  const directName = clean(user?.name) || clean(user?.displayName);
  if (directName) {
    return directName;
  }

  const fromEmail = formatNameFromEmail(user?.email);
  if (fromEmail) {
    return fromEmail;
  }

  const uid = clean(user?.uid) || clean(fallbackUid);
  if (uid) {
    return `User ${uid.slice(0, 8)}`;
  }

  return 'User';
}

export const resolveStudentDisplayName = (
  user?: DisplayNameSource | null,
  fallbackUid?: string,
): string => {
  const resolved = resolveUserDisplayName(user, fallbackUid);
  if (resolved.startsWith('User ') && user?.role === 'student') {
    return `Student ${(fallbackUid || user?.uid || '').slice(0, 8)}`;
  }
  return resolved;
};
