import { Request, Response, NextFunction } from 'express';
import { QuizService } from '../services/quiz.service.js';
import { sendSuccess, sendCreated } from '../utils/response.helper.js';
import { QuizAttemptPayload } from '../types/index.js';

// ============================================================
// Quiz Controller
// ============================================================

export const QuizController = {
  /**
   * POST /api/v1/quiz/attempt
   */
  submit: async (
    req: Request<{}, {}, QuizAttemptPayload>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) throw new Error('Unauthorized');

      const result = await QuizService.submitAttempt(
        req.user.id,
        req.body
      );

      sendCreated(res, result, 'Quiz submitted successfully');
    } catch (err) {
      next(err);
    }
  },

  // GET /quiz/history
  getHistory: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) throw new Error('Unauthorized');

      const { attempts, meta } = await QuizService.getUserHistory(
        req.user.id,
        req.query as Record<string, unknown>
      );

      sendSuccess(res, attempts, 'Quiz history fetched', 200, meta);
    } catch (err) {
      next(err);
    }
  },

  // GET /quiz/history/:id
  getAttemptById: async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) throw new Error('Unauthorized');

      const attempt = await QuizService.getAttemptById(
        req.params.id,
        req.user.id
      );

      sendSuccess(res, attempt, 'Attempt fetched successfully');
    } catch (err) {
      next(err);
    }
  },

  // GET /quiz/leaderboard
  getLeaderboard: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { leaderboard, meta } = await QuizService.getLeaderboard(
        req.query as Record<string, unknown>
      );

      sendSuccess(
        res,
        leaderboard,
        'Leaderboard fetched successfully',
        200,
        meta
      );
    } catch (err) {
      next(err);
    }
  },

  // GET /quiz/stats
  getMyStats: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) throw new Error('Unauthorized');

      const stats = await QuizService.getUserStats(req.user.id);

      sendSuccess(res, stats, 'User stats fetched successfully');
    } catch (err) {
      next(err);
    }
  },
};