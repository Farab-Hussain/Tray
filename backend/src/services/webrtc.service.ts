import axios from 'axios';

export interface TwilioIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface TwilioIceServerResponse {
  iceServers: TwilioIceServer[];
  ttl: number;
  source: 'twilio';
}

interface TwilioTokenApiResponse {
  username?: string;
  password?: string;
  ttl?: number | string;
  ice_servers?: TwilioIceServer[];
  iceServers?: TwilioIceServer[];
}

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01';

const normalizeIceServerUrls = (urls: string | string[], region?: string) => {
  const replacements = (value: string) =>
    region ? value.replace(/^([a-z0-9-]+\.)?global\./i, `${region}.`) : value;

  if (Array.isArray(urls)) {
    return urls.map(url => replacements(url));
  }

  return replacements(urls);
};

const applyRegionPinning = (servers: TwilioIceServer[], region?: string) => {
  if (!region) return servers;

  return servers.map(server => ({
    ...server,
    urls: normalizeIceServerUrls(server.urls, region),
  }));
};

export const createTwilioIceServers = async (): Promise<TwilioIceServerResponse> => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const ttl = Number(process.env.TWILIO_TOKEN_TTL || 3600);
  const region = process.env.TWILIO_REGION?.trim();

  if (!accountSid) {
    throw new Error('TWILIO_ACCOUNT_SID is missing in backend/.env');
  }

  if (!authToken) {
    throw new Error('TWILIO_AUTH_TOKEN is missing in backend/.env');
  }

  if (!Number.isFinite(ttl) || ttl <= 0) {
    throw new Error('TWILIO_TOKEN_TTL must be a positive number');
  }

  const endpoint = `${TWILIO_API_BASE}/Accounts/${accountSid}/Tokens.json`;
  const body = new URLSearchParams({ Ttl: ttl.toString() });

  try {
    const response = await axios.post<TwilioTokenApiResponse>(
      endpoint,
      body.toString(),
      {
        auth: {
          username: accountSid,
          password: authToken,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000,
      },
    );

    const rawServers =
      response.data.ice_servers || response.data.iceServers || [];
    const iceServers = applyRegionPinning(rawServers, region);

    if (!Array.isArray(iceServers) || iceServers.length === 0) {
      throw new Error('Twilio returned no ICE servers');
    }

    return {
      iceServers,
      ttl: Number(response.data.ttl || ttl),
      source: 'twilio',
    };
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('❌ [Twilio Service] API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Twilio API Error: ${error.response?.status} - ${JSON.stringify(error.response?.data) || error.message}`);
    }
    throw error;
  }
};
