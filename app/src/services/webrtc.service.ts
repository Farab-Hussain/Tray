import { api } from '../lib/fetcher';
import { getIceServers as getFallbackIceServers } from '../config/webrtc.config';

export interface WebRTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

const normalizeIceServers = (servers: any[]): WebRTCIceServer[] =>
  servers
    .map(server => {
      if (!server || !server.urls) return null;

      return {
        urls: server.urls,
        username: server.username,
        credential: server.credential,
      } as WebRTCIceServer;
    })
    .filter(Boolean) as WebRTCIceServer[];

export const WebRTCService = {
  async getIceServers(): Promise<WebRTCIceServer[]> {
    try {
      const response = await api.get('/webrtc/ice-servers');
      const servers = response.data?.iceServers || response.data?.ice_servers || [];

      if (Array.isArray(servers) && servers.length > 0) {
        return normalizeIceServers(servers);
      }

      throw new Error('Backend returned no ICE servers');
    } catch (error) {
      if (__DEV__) {
        console.warn(
          '⚠️ [WebRTCService] Failed to load Twilio ICE servers. Falling back to local config for development.',
          error,
        );
        return getFallbackIceServers();
      }

      throw error;
    }
  },
};
