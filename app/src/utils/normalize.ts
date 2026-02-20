export const asString = (value: any, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
};

export const normalizeAvatarUrl = (user: any): string => {
  const avatar =
    user?.profileImage ||
    user?.avatarUrl ||
    user?.avatar ||
    user?.photoURL ||
    '';
  return typeof avatar === 'string' ? avatar : '';
};

export const normalizeTimestampToDate = (value: any): Date | undefined => {
  if (!value) return undefined;

  if (typeof value?.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : undefined;
  }

  if (typeof value?._seconds === 'number') {
    const ms = value._seconds * 1000 + Math.floor((value._nanoseconds || 0) / 1_000_000);
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  if (typeof value?.seconds === 'number') {
    const ms = value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1_000_000);
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const normalizeTimestampToIso = (value: any): string | undefined => {
  return normalizeTimestampToDate(value)?.toISOString();
};

export const normalizeBookingStatus = (status: any): string => {
  const raw = asString(status).toLowerCase();
  if (raw === 'confirmed') return 'accepted';
  if (raw === 'approve') return 'approved';
  if (raw === 'decline' || raw === 'rejected') return 'declined';
  if (raw === 'canceled') return 'cancelled';
  return raw || 'pending';
};

