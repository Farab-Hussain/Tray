import { Router } from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import { getIceServers } from '../controllers/webrtc.controller';

const router = Router();

router.get('/ice-servers', authenticateUser(), getIceServers);

export default router;
