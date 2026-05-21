import http2 from 'http2';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebase';

const VOIP_TOPIC_SUFFIX = '.voip';

const getApnsAuthToken = (): string | null => {
  const key = process.env.APNS_KEY?.replace(/\\n/g, '\n');
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  if (!key || !keyId || !teamId) return null;
  return jwt.sign({ iss: teamId, iat: Math.floor(Date.now() / 1000) }, key, {
    algorithm: 'ES256',
    header: { alg: 'ES256', kid: keyId },
  });
};

const sendVoipToDevice = (
  deviceToken: string,
  payload: Record<string, string>,
): Promise<boolean> =>
  new Promise(resolve => {
    const auth = getApnsAuthToken();
    if (!auth) {
      resolve(false);
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

    req.on('response', headers => {
      const status = headers[':status'];
      client.close();
      resolve(status === 200);
    });
    req.on('error', () => {
      client.close();
      resolve(false);
    });
    req.write(body);
    req.end();
  });

export const sendVoipCallPush = async (
  receiverId: string,
  data: { callId: string; callerId: string; receiverId: string; callType: string; callerName?: string },
): Promise<number> => {
  if (!getApnsAuthToken()) return 0;

  const snap = await db.collection('users').doc(receiverId).collection('voipTokens').get();
  if (snap.empty) return 0;

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
      const ok = await sendVoipToDevice(token, payload);
      if (ok) sent += 1;
      else if (
        process.env.NODE_ENV !== 'production'
      ) {
        console.log('⚠️ VoIP push failed for token doc:', doc.id);
      }
    }),
  );
  return sent;
};
