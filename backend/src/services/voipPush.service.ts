import fs from 'fs';
import http2 from 'http2';
import path from 'path';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebase';
import { devLog, devWarn } from '../utils/sanitizeLog';

const VOIP_TOPIC_SUFFIX = '.voip';

let cachedPrivateKey: string | null | undefined;

const normalizePemKey = (raw: string): string => {
  let key = raw.trim().replace(/\\n/g, '\n');
  if (key.includes('\n')) {
    return key.endsWith('\n') ? key : `${key}\n`;
  }

  const match = key.match(/-----BEGIN PRIVATE KEY-----(.*?)-----END PRIVATE KEY-----/s);
  if (!match) {
    return key;
  }

  const body = match[1].replace(/\s+/g, '');
  const lines = body.match(/.{1,64}/g) || [body];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`;
};

const resolveApnsPrivateKey = (): string | null => {
  if (cachedPrivateKey !== undefined) {
    return cachedPrivateKey;
  }

  const candidates = [
    process.env.APNS_AUTH_KEY_PATH,
    path.resolve(process.cwd(), 'AuthKey.p8'),
  ].filter(Boolean) as string[];

  for (const filePath of candidates) {
    try {
      const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);
      if (fs.existsSync(resolvedPath)) {
        cachedPrivateKey = fs.readFileSync(resolvedPath, 'utf8').trim();
        return cachedPrivateKey;
      }
    } catch {
      // try next candidate
    }
  }

  if (process.env.APNS_KEY) {
    cachedPrivateKey = normalizePemKey(process.env.APNS_KEY);
    return cachedPrivateKey;
  }

  cachedPrivateKey = null;
  return null;
};

export const isVoipPushConfigured = (): boolean =>
  Boolean(resolveApnsPrivateKey() && process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID);

const getApnsAuthToken = (): string | null => {
  const key = resolveApnsPrivateKey();
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;

  if (!key || !keyId || !teamId) {
    return null;
  }

  try {
    return jwt.sign({ iss: teamId, iat: Math.floor(Date.now() / 1000) }, key, {
      algorithm: 'ES256',
      header: { alg: 'ES256', kid: keyId },
    });
  } catch (error) {
    console.warn('⚠️ [VoIP] Failed to sign APNS JWT — check APNS_KEY formatting:', error);
    return null;
  }
};

const sendVoipToDevice = (
  deviceToken: string,
  payload: Record<string, string>,
): Promise<{ ok: boolean; status?: number; reason?: string }> =>
  new Promise(resolve => {
    const auth = getApnsAuthToken();
    if (!auth) {
      resolve({ ok: false, reason: 'APNS not configured' });
      return;
    }

    const bundleId = process.env.APNS_BUNDLE_ID || 'app.tray.com';
    const host =
      process.env.APNS_PRODUCTION === 'true'
        ? 'api.push.apple.com'
        : 'api.sandbox.push.apple.com';

    const client = http2.connect(`https://${host}`);
    const body = JSON.stringify({ aps: { 'content-available': 1 }, ...payload });

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${deviceToken}`,
      authorization: `bearer ${auth}`,
      'apns-topic': `${bundleId}${VOIP_TOPIC_SUFFIX}`,
      'apns-push-type': 'voip',
      'apns-priority': '10',
    });

    let responseBody = '';
    req.on('response', headers => {
      const status = headers[':status'];
      req.on('data', chunk => {
        responseBody += chunk;
      });
      req.on('end', () => {
        client.close();
        const statusCode = typeof status === 'number' ? status : Number(status);
        resolve({
          ok: statusCode === 200,
          status: statusCode,
          reason: statusCode === 200 ? undefined : responseBody || `HTTP ${statusCode}`,
        });
      });
    });
    req.on('error', err => {
      client.close();
      resolve({ ok: false, reason: err.message });
    });
    req.write(body);
    req.end();
  });

export const sendVoipCallPush = async (
  receiverId: string,
  data: { callId: string; callerId: string; receiverId: string; callType: string; callerName?: string },
): Promise<number> => {
  if (!getApnsAuthToken()) {
    console.warn('⚠️ [VoIP] APNS credentials invalid or missing — iOS killed-app CallKit will not ring');
    return 0;
  }

  const snap = await db.collection('users').doc(receiverId).collection('voipTokens').get();
  if (snap.empty) {
    devWarn(`⚠️ [VoIP] No voipTokens for receiver ${receiverId}`);
    return 0;
  }

  const payload: Record<string, string> = {
    callId: data.callId,
    callerId: data.callerId,
    receiverId: data.receiverId,
    callType: data.callType,
    type: 'call',
    callerName: data.callerName || 'Someone',
  };

  let sent = 0;
  await Promise.all(
    snap.docs.map(async doc => {
      const token = doc.data()?.voipToken as string | undefined;
      if (!token) return;
      const result = await sendVoipToDevice(token, payload);
      if (result.ok) {
        sent += 1;
        devLog(`✅ [VoIP] Push sent to receiver ${receiverId} (token doc ${doc.id})`);
      } else {
        devWarn('⚠️ [VoIP] Push failed for token doc:', doc.id, result.reason);
        if (result.status === 410 || result.status === 400) {
          await doc.ref.delete().catch(() => {});
        }
      }
    }),
  );
  return sent;
};
