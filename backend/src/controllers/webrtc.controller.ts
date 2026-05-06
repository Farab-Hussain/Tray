import { Request, Response } from 'express';
import { Logger } from '../utils/logger';
import { createTwilioIceServers } from '../services/webrtc.service';

export const getIceServers = async (_req: Request, res: Response) => {
  const route = 'GET /webrtc/ice-servers';

  try {
    const result = await createTwilioIceServers();

    Logger.success('GET', '/webrtc/ice-servers', 'Twilio ICE servers created');
    res.json(result);
  } catch (error: any) {
    Logger.error('GET', '/webrtc/ice-servers', 'Failed to create Twilio ICE servers', error);

    res.status(500).json({
      error: 'Failed to create ICE servers',
      message:
        error?.message ||
        'Unable to create Twilio ICE servers. Check backend environment variables.',
      route,
    });
  }
};
