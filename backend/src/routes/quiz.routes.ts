import { Router } from 'express';
import { QuizController } from '../controllers/quiz.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { submitAttemptSchema, paginationSchema } from '../middlewares/schemas.js';

const router = Router();

// ── Public ────────────────────────────────────────────────────

/**
 * GET /api/v1/quiz/leaderboard
 * Query: ?categoryId=&difficulty=easy|medium|hard&page=1&limit=10
 */
router.get('/leaderboard', validate(paginationSchema, 'query'), QuizController.getLeaderboard);

// ── Private ───────────────────────────────────────────────────

/**
 * POST /api/v1/quiz/attempt
 * Body: { categoryId, difficulty, timeTaken, playerName?, categoryName?, score?, totalQuestions?, answers[] }
 */
router.post('/attempt', protect, validate(submitAttemptSchema), QuizController.submit);

/**
 * GET /api/v1/quiz/history
 * Query: ?categoryId=&difficulty=&page=&limit=
 */
router.get('/history', protect, validate(paginationSchema, 'query'), QuizController.getHistory);

/**
 * GET /api/v1/quiz/stats  – aggregate stats for the current user
 */
router.get('/stats', protect, QuizController.getMyStats);

/**
 * GET /api/v1/quiz/history/:id  – full attempt breakdown
 */
router.get('/history/:id', protect, QuizController.getAttemptById);

export default router;