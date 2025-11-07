/**
 * WebRTC Configuration Example
 * 
 * Copy this file to webrtc.config.ts and update with your Coturn server details
 * 
 * DO NOT commit webrtc.config.ts with real credentials to version control!
 */

import { TURN_SERVER } from './webrtc.config';

// Example: Configure your Coturn server
// Uncomment and update with your server details:

/*
export const TURN_SERVER = {
  // Your Coturn server URLs
  // Format: 'turn:hostname:port' or 'turns:hostname:port' (for TLS)
  urls: [
    'turn:your-turn-server.com:3478',
    'turns:your-turn-server.com:5349', // TLS (recommended for production)
  ],
  
  // Username configured in your Coturn server
  username: 'your-username',
  
  // Password configured in your Coturn server
  credential: 'your-secure-password',
  
  // Enable this TURN server
  enabled: true,
};
*/

// Example with multiple TURN servers for redundancy:
/*
export const TURN_SERVER = {
  urls: [
    'turn:turn1.yourdomain.com:3478',
    'turns:turn1.yourdomain.com:5349',
    'turn:turn2.yourdomain.com:3478', // Backup server
    'turns:turn2.yourdomain.com:5349',
  ],
  username: 'shared-username',
  credential: 'shared-password',
  enabled: true,
};
*/

