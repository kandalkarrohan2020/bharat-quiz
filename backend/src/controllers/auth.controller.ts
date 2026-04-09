import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { sendSuccess, sendCreated } from '../utils/response.helper.js';
import { RegisterPayload, LoginPayload } from '../types/index.js'

// ============================================================
// Auth Controller
// ============================================================

export const AuthController = {
  // POST /auth/register
  register: async (
    req: Request<object, object, RegisterPayload>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await AuthService.register(req.body);
      sendCreated(res, result, 'Registration successful');
    } catch (err) {
      next(err);
    }
  },

  // POST /auth/login
  login: async (
    req: Request<object, object, LoginPayload>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await AuthService.login(req.body);
      sendSuccess(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  // POST /auth/refresh
  refresh: async (
    req: Request<object, object, { refreshToken: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await AuthService.refresh(req.body.refreshToken);
      sendSuccess(res, result, 'Token refreshed successfully');
    } catch (err) {
      next(err);
    }
  },

  // GET /auth/me
  me: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { user: req.user }, 'User profile fetched');
    } catch (err) {
      next(err);
    }
  },
};