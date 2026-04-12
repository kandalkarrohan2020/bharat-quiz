import { Router, Request, Response, NextFunction } from 'express';
import { GameController } from '../controllers/game.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { paginationSchema } from '../middlewares/schemas.js';
import { saveResultSchema } from '../middlewares/schemas.js';
import jwt from 'jsonwebtoken';

const router = Router();

// ─────────────────────────────────────────────────────────────
// optionalAdminAuth
//
// Does NOT block the request if no token / invalid token.
// Only sets req.isAdmin = true when a valid admin JWT is found.
// This lets the leaderboard endpoint remain fully public while
// still granting the email field to admins.
// ─────────────────────────────────────────────────────────────

const optionalAdminAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const secret = process.env.JWT_SECRET ?? 'fallback_secret';
      const decoded = jwt.verify(token, secret) as any;
      if (decoded?.role === 'admin' || decoded?.isAdmin === true) {
        req.isAdmin = true;
      }
    }
  } catch {
    // Invalid / expired token — just continue as public visitor
  }
  next();
};

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/game/results
 * Save a completed game result (guest, no auth needed).
 * Body: { playerName, playerEmail, playerContact?, categoryId,
 *         categoryName, score, totalQuestions, percentage,
 *         difficulty, title, completedAt }
 */
router.post(
  '/results',
  validate(saveResultSchema),
  GameController.saveResult
);

/**
 * GET /api/v1/game/leaderboard
 * Public leaderboard.  Email field included only for admins
 * who pass a valid admin JWT + ?showEmail=1.
 *
 * Query params:
 *   categoryId  – filter by category ObjectId
 *   difficulty  – easy | medium | hard
 *   page        – default 1
 *   limit       – default 50
 *   showEmail   – 1  (admin only; ignored for non-admins)
 */
router.get(
  '/leaderboard',
  optionalAdminAuth,
  validate(paginationSchema, 'query'),
  GameController.getLeaderboard
);

export default router;