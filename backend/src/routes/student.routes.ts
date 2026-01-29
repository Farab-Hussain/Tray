import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import { 
  getMyProfile, 
  updateProfile, 
  createProfile, 
  deleteProfile 
} from '../controllers/student.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticateUser());

router.get('/me', getMyProfile);
router.put('/me', updateProfile);
router.post('/me', createProfile);
router.delete('/me', deleteProfile);

export default router;