import express from 'express';
import { login, refresh, logout, perfil } from '../controllers/authController.js';
import { verificarAutenticacion } from '../middlewares/authMiddleware.js';
import { loginRateLimiter, refreshRateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/login', loginRateLimiter, login);
router.post('/refresh', refreshRateLimiter, refresh);
router.post('/logout', logout);
router.get('/perfil', verificarAutenticacion, perfil);

export default router;

