import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes.js';
import adminRouter from './admin.routes.js';
import gameRouter from './game.routes.js';
import categoryRoutes from './category.routes.js';
import quizRoutes from './quiz.routes.js';
import { config } from '../config/app.config.js';

const router = Router();

// ── Health check ─────────────────────────────────────────────

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'India Quiz API is healthy 🇮🇳',
    environment: config.env,
    timestamp: new Date().toISOString(),
    version: config.server.apiVersion,
  });
});

// ── Mount route groups ────────────────────────────────────────

router.use('/auth', authRoutes);
router.use('/admin', adminRouter);
router.use('/game', gameRouter);
router.use('/categories', categoryRoutes);
router.use('/quiz', quizRoutes);

export default router;