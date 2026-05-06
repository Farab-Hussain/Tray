# Twilio TURN Setup Guide for Tray Mobile App

## Overview

Tray uses `react-native-webrtc` for audio and video calling. That means calls need ICE servers so devices can find a route through NATs, firewalls, and mobile carrier networks.

Twilio Network Traversal Service is a strong fit for this app because it gives us:

- Global STUN and TURN infrastructure
- Short-lived credentials instead of hardcoded TURN passwords in the app
- Better call reliability on restrictive Wi-Fi, mobile data, and enterprise networks
- A managed service that scales without us maintaining our own relay servers

This guide explains:

1. How to create a Twilio account
2. What you need before integrating Twilio
3. How to connect Twilio TURN to this app
4. Why Twilio is beneficial for Tray

## Why Twilio Is Useful For This App

Tray already supports:

- Audio calls
- Video calls
- Real-time signaling
- Recruiter, consultant, and student communication flows

In the current codebase, WebRTC setup is managed through:

- `app/src/config/webrtc.config.ts`
- `app/src/webrtc/peer.ts`
- `app/src/Screen/common/Calling/CallingScreen.tsx`
- `app/src/Screen/common/Calling/VideoCallingScreen.tsx`

For real-world users, a direct peer-to-peer connection does not always work. Common blockers include:

- Symmetric NAT
- Mobile carrier restrictions
- Public Wi-Fi firewalls
- Office or school network filtering

Twilio helps solve that by giving WebRTC a reliable relay path when direct media cannot connect.

## What You Need Before Starting

Before integrating Twilio, collect these items:

- A Twilio account
- Twilio `Account SID`
- Twilio `Auth Token`
- A backend server that Tray can call to request ICE servers
- A place to store environment variables securely on the backend
- Access to the mobile app codebase

Important:

- Do not put the Twilio `Auth Token` inside the mobile app
- The mobile app should only receive short-lived ICE server data from the backend

## Step 1: Create A Twilio Account

1. Go to the Twilio website and sign up for an account.
2. Verify your email and phone number.
3. Open the Twilio Console.
4. Copy your `Account SID` and `Auth Token`.
5. Keep those credentials private.

Recommended practice:

- Use a dedicated Twilio project for Tray
- Keep separate credentials for development and production

## Step 2: Decide What Twilio Will Do In Tray

For this app, Twilio should be used for:

- STUN lookup
- TURN relay for calls that cannot connect directly

That means Twilio is not replacing the whole calling stack. It only provides the network traversal layer while Tray keeps:

- Signaling
- Call UI
- Call state management
- Incoming/outgoing call logic

## Step 3: Add Backend Environment Variables

Twilio credentials belong on the backend, not in React Native.

Example backend `.env` values:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_TOKEN_TTL=3600
```

Recommended values:

- `TWILIO_TOKEN_TTL=3600` for a 1-hour token during early testing
- Lower the TTL later if you want stricter security

## Step 4: Create A Backend Endpoint For ICE Servers

Your backend should create a Twilio token and return the `ice_servers` array to the app.

Example Node.js endpoint:

```ts
import twilio from 'twilio';

app.get('/webrtc/ice-servers', async (_req, res) => {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!,
  );

  const token = await client.tokens.create({
    ttl: Number(process.env.TWILIO_TOKEN_TTL || 3600),
  });

  res.json({
    iceServers: token.ice_servers || token.iceServers || [],
    ttl: token.ttl,
  });
});
```

What the backend returns:

```json
{
  "iceServers": [
    { "urls": "stun:global.stun.twilio.com:3478" },
    {
      "urls": "turn:global.turn.twilio.com:3478?transport=udp",
      "username": "temporary-username",
      "credential": "temporary-password"
    }
  ]
}
```

Why the backend step matters:

- Twilio tokens are ephemeral
- Credentials should not be shipped in the mobile app
- The backend can refresh credentials whenever needed

## Step 5: Update The Mobile App To Fetch ICE Servers

Tray currently has a static WebRTC config in:

- `app/src/config/webrtc.config.ts`

And the peer connection is created in:

- `app/src/webrtc/peer.ts`

To integrate Twilio properly, the app should:

1. Request ICE servers from the backend
2. Wait for the response
3. Pass the returned `iceServers` into `RTCPeerConnection`

Example client flow:

```ts
const response = await fetcher('/webrtc/ice-servers');
const iceServers = response.iceServers || [];

const pc = new RTCPeerConnection({ iceServers });
```

### Files That Will Need Attention

- `app/src/config/webrtc.config.ts`
- `app/src/webrtc/peer.ts`
- `app/src/Screen/common/Calling/CallingScreen.tsx`
- `app/src/Screen/common/Calling/VideoCallingScreen.tsx`

### What To Change In The Current Setup

The current code uses fallback TURN servers for testing. For Twilio production usage:

- Keep fallback servers only for local testing
- Prefer dynamic Twilio ICE servers from the backend
- Remove any hardcoded production TURN credentials from the app

## Step 6: Test The Integration

After wiring the backend and mobile app together:

1. Test on iOS simulator
2. Test on Android emulator
3. Test on a real iPhone
4. Test on a real Android device
5. Test on home Wi-Fi
6. Test on mobile data
7. Test on a restricted office or campus network if possible

What to verify:

- Call can connect directly when possible
- Call still works when direct P2P fails
- ICE servers are being returned by the backend
- No Twilio secret is exposed in the app bundle

## Recommended Twilio Setup For Tray

For this app, the best starting setup is:

- Twilio Network Traversal Service
- Backend token endpoint
- Short token TTL
- STUN and TURN returned dynamically to the app

Suggested first configuration:

- TTL: `3600`
- Region pinning: off initially
- Fallback TURN servers: testing only

## Benefits For Tray

Twilio is helpful here because Tray is not a simple chat app. It has real-time communication between different user roles, and call reliability matters.

### Business Benefits

- Fewer failed calls
- Better experience on weak or restrictive networks
- Less maintenance than self-hosting TURN
- Faster production rollout
- Safer credential handling

### Technical Benefits

- Global NAT traversal support
- Managed infrastructure
- Short-lived credentials
- Better reliability than public fallback TURN servers
- Easier scaling as call usage grows

### Product Benefits

- Students can connect with consultants more reliably
- Recruiters can use calling features without random connection failures
- Admin and support teams spend less time troubleshooting call issues
- The app feels more polished and production-ready

## Common Mistakes To Avoid

- Putting Twilio `Auth Token` in `.env` for the mobile app
- Using public fallback TURN servers in production
- Creating `RTCPeerConnection` before ICE servers are loaded
- Forgetting to refresh short-lived tokens
- Not testing on real networks outside the office or emulator

## Troubleshooting

### Calls Do Not Connect

Check:

- Backend is returning `iceServers`
- Twilio credentials are valid on the backend
- The mobile app is using the backend response, not a stale static config

### Calls Work On Wi-Fi But Fail On Mobile Data

This usually means:

- TURN is not being used correctly
- The backend did not return valid relay servers
- The network is blocking direct peer-to-peer traffic

### No Relay Candidates Appear

Check:

- Twilio token response
- ICE server format
- Device connectivity
- Firewall restrictions

### Token Expires Too Quickly

Increase `TWILIO_TOKEN_TTL` on the backend, but keep it reasonably short for security.

## Summary

Twilio is a good fit for Tray because it gives the app reliable WebRTC traversal without requiring us to maintain our own TURN infrastructure.

The right integration pattern is:

1. Backend creates Twilio token
2. Backend returns ICE servers
3. Mobile app loads ICE servers before creating the peer connection
4. WebRTC calls use Twilio when direct connection is not possible

That approach is secure, scalable, and aligned with how this app already uses `react-native-webrtc`.
