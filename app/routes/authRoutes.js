// app/routes/authRoutes.js
import express from 'express';
import { 
  login, 
  refreshToken, 
  getMe, 
  changePassword, 
  logout,
  logoutAll 
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/refresh-token', refreshToken);

// Protected routes (require authentication)
router.use(protect);
router.get('/me', getMe);
router.post('/change-password', changePassword);
router.post('/logout', logout);
router.post('/logout-all', logoutAll);

export default router;