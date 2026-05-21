import { Router } from 'express';
import { getPricingSettings, updatePricingSettings } from '../controllers/settings.controller';
import { authenticateUser, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// GET is public so mobile app can fetch it easily
router.get('/pricing', getPricingSettings);

// PUT is protected and only for admins
router.put('/pricing', authenticateUser(), authorizeRole(['admin']), updatePricingSettings);

export default router;
