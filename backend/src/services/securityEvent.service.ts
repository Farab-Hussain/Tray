import { db, admin } from '../config/firebase';
import { Logger } from '../utils/logger';

export type SecurityEventType =
  | 'auth_failure'
  | 'auth_success'
  | 'login_failure'
  | 'login_success'
  | 'otp_lockout'
  | 'rate_limit_exceeded'
  | 'access_denied'
  | 'suspicious_request';

export type SecurityEventPayload = {
  type: SecurityEventType;
  route?: string;
  ip?: string;
  userId?: string;
  email?: string;
  message?: string;
  metadata?: Record<string, unknown>;
};

const sanitizeEmail = (email?: string): string | undefined => {
  if (!email || !email.includes('@')) return undefined;
  const [local, domain] = email.split('@');
  if (!local || !domain) return undefined;
  const maskedLocal = local.length <= 2 ? '**' : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
};

export const recordSecurityEvent = async (payload: SecurityEventPayload): Promise<void> => {
  try {
    const doc = {
      type: payload.type,
      route: payload.route || null,
      ip: payload.ip || null,
      userId: payload.userId || null,
      email: sanitizeEmail(payload.email) || null,
      message: payload.message || null,
      metadata: payload.metadata || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('securityEvents').add(doc);

    if (payload.type === 'auth_failure' || payload.type === 'login_failure' || payload.type === 'access_denied') {
      Logger.warn(
        'Security',
        payload.userId || payload.ip || 'unknown',
        `${payload.type}: ${payload.message || payload.route || 'event'}`,
      );
    }
  } catch (error) {
    Logger.error('Security', '', 'Failed to record security event', error);
  }
};

export const getClientIp = (req: { ip?: string; headers?: Record<string, unknown> }): string | undefined => {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim();
  }
  return req.ip;
};
