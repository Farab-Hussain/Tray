/**
 * WebRTC Configuration
 * 
 * This file provides fallback STUN/TURN servers for WebRTC connections.
 * 
 * Production should load Twilio ICE servers from the backend endpoint
 * and use these values only as a development fallback.
 */

// TURN Server Configuration
// Set these values to your own fallback TURN server details if needed
export const TURN_SERVER = {
  // Your TURN server URL (e.g., 'turn:your-server.com:3478')
  // For TLS: 'turns:your-server.com:5349'
  urls: [
    // Add your TURN server URLs here
    // Example: 'turn:your-server.com:3478',
    // Example: 'turns:your-server.com:5349', // TLS
  ],
  
  // Username for TURN authentication
  username: '',
  
  // Credential/password for TURN authentication
  credential: '',
  
  // Enable/disable this TURN server
  enabled: false,
};

// STUN Servers (for NAT discovery)
// These are public STUN servers that don't require authentication
export const STUN_SERVERS = [
  { urls: ['stun:stun.l.google.com:19302'] },
  { urls: ['stun:stun1.l.google.com:19302'] },
  { urls: ['stun:stun2.l.google.com:19302'] },
  { urls: ['stun:stun.stunprotocol.org:3478'] },
];

// Fallback TURN servers (for testing only - unreliable)
// Remove these in production and prefer Twilio ICE servers from the backend
// These are free/public TURN servers that may be rate-limited or unreliable
export const FALLBACK_TURN_SERVERS = [
  // Metered.ca Open Relay Project (may be rate-limited)
  {
    urls: [
      'turn:global.relay.metered.ca:80',
      'turn:global.relay.metered.ca:443',
      'turns:global.relay.metered.ca:443',
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  // Alternative: Try without authentication (some servers allow this)
  // Note: Most production TURN servers require authentication
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turns:openrelay.metered.ca:443',
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

/**
 * Get ICE servers configuration
 * 
 * Priority:
 * 1. Custom TURN server (if configured and enabled)
 * 2. Environment variables (if set)
 * 3. Fallback TURN servers (for testing only)
 */
export function getIceServers(): any[] {
  const servers: any[] = [...STUN_SERVERS];

  // Try to get TURN server from environment variables first
  let useCustomTurn = false;
  try {
    // @ts-ignore - process.env may not be available in all React Native environments
    const envTurnUrls = typeof process !== 'undefined' && process.env 
      ? process.env.REACT_NATIVE_TURN_SERVER_URLS 
      : undefined;
    // @ts-ignore
    const envTurnUsername = typeof process !== 'undefined' && process.env 
      ? process.env.REACT_NATIVE_TURN_USERNAME 
      : undefined;
    // @ts-ignore
    const envTurnCredential = typeof process !== 'undefined' && process.env 
      ? process.env.REACT_NATIVE_TURN_CREDENTIAL 
      : undefined;

    if (envTurnUrls && envTurnUsername && envTurnCredential) {
      const urls = envTurnUrls.split(',').map((url: string) => url.trim());
      servers.push({
        urls,
        username: envTurnUsername,
        credential: envTurnCredential,
      });
      useCustomTurn = true;
      if (__DEV__) {
        console.log('🌐 [ICE] Using TURN server from environment variables');
      }
    }
  } catch {
    // Environment variable access failed, continue to check config
  }

  // Use configured TURN server if enabled and not using env vars
  if (!useCustomTurn && TURN_SERVER.enabled && TURN_SERVER.urls.length > 0 && TURN_SERVER.username && TURN_SERVER.credential) {
    servers.push({
      urls: TURN_SERVER.urls,
      username: TURN_SERVER.username,
      credential: TURN_SERVER.credential,
    });
    useCustomTurn = true;
    if (__DEV__) {
      console.log('🌐 [ICE] Using configured TURN server');
    }
  }

  // Use fallback TURN servers only if no custom server is configured
  // ⚠️ WARNING: These are unreliable and should only be used for testing
  if (!useCustomTurn) {
    if (__DEV__) {
      console.warn('⚠️ [ICE] No custom TURN server configured. Using fallback servers (unreliable).');
      console.warn('⚠️ [ICE] For production, use Twilio ICE servers from /webrtc/ice-servers');
    }
    servers.push(...FALLBACK_TURN_SERVERS);
  }

  return servers;
}
