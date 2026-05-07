# Backend Environment Setup for TURN Servers

## Required Environment Variables

Add these to your backend `.env` file:

```bash
# Twilio Configuration for WebRTC TURN Servers
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_TOKEN_TTL=3600
TWILIO_REGION=global
```

## Setup Instructions:

1. **Create Twilio Account**: Go to https://www.twilio.com and sign up
2. **Get Credentials**: From Twilio Console, copy Account SID and Auth Token
3. **Update Backend .env**: Add the Twilio credentials to your backend/.env file
4. **Restart Backend**: Restart your backend server to load new environment variables

## Testing:

After setup, test the endpoint:
```bash
curl http://localhost:5000/webrtc/ice-servers
```

Should return:
```json
{
  "iceServers": [
    { "urls": "stun:global.stun.twilio.com:3478" },
    {
      "urls": "turn:global.turn.twilio.com:3478?transport=udp",
      "username": "temporary-username",
      "credential": "temporary-password"
    }
  ],
  "ttl": 3600,
  "source": "twilio"
}
```
