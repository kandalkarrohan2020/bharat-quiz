// ============================================================
// admin.controller.ts
// Thin layer — validates req, calls AdminService, sends response.
// Mirrors the style of quiz.controller.ts.
// ============================================================

import { Request, Response, NextFunction } from "express";
import { AdminService } from "../services/admin.service.js";
import { sendSuccess, sendCreated } from "../utils/response.helper.js";
import type {
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CreateQuestionPayload,
  UpdateQuestionPayload,
  QuestionQuery,
  BulkDeletePayload,
  BulkDifficultyPayload,
  ChangePasswordPayload,
  ChangeUsernamePayload,
  ChangeEmailPayload,
} from "../types/index.js";

// ── Extend Express Request (if not declared globally already) ─

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      role: string;
    };
  }
}

// ============================================================
// Admin Controller
// ============================================================

export const AdminController = {
  // ──────────────────────────────────────────────────────────
  // DASHBOARD
  // ──────────────────────────────────────────────────────────

  /**
   * GET /api/v1/admin/stats
   */
  getStats: async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const stats = await AdminService.getDashboardStats();
      sendSuccess(res, stats, "Dashboard stats fetched successfully");
    } catch (err) {
      next(err);
    }
  },

  // ──────────────────────────────────────────────────────────
  // CATEGORIES
  // ──────────────────────────────────────────────────────────

  /**
   * GET /api/v1/admin/categories
   */
  getAllCategories: async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const categories = await AdminService.getAllCategories();
      sendSuccess(res, categories, "Categories fetched successfully");
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/admin/categories
   * Body: { name, icon?, description?, color? }
   */
  createCategory: async (
    req: Request<{}, {}, CreateCategoryPayload>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const category = await AdminService.createCategory(req.body);
      sendCreated(res, category, "Category created successfully");
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/v1/admin/categories/:id
   * Body: { name?, icon?, description?, color?, isActive? }
   */
  updateCategory: async (
    req: Request<{ id: string }, {}, UpdateCategoryPayload>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const category = await AdminService.updateCategory(
        req.params.id,
        req.body,
      );
      sendSuccess(res, category, "Category updated successfully");
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/v1/admin/categories/:id
   */
  deleteCategory: async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await AdminService.deleteCategory(req.params.id);
      sendSuccess(res, null, "Category deleted successfully");
    } catch (err) {
      next(err);
    }
  },

  // ──────────────────────────────────────────────────────────
  // QUESTIONS
  // ──────────────────────────────────────────────────────────

  /**
   * GET /api/v1/admin/questions
   * Query: ?categoryId=&difficulty=&search=&page=&limit=
   */
  getAllQuestions: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { questions, meta } = await AdminService.getAllQuestions(
        req.query as unknown as QuestionQuery,
      );
      sendSuccess(res, questions, "Questions fetched successfully", 200, meta);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/admin/questions
   * Body: { categoryId, question, options, correctAnswer, difficulty }
   */
  createQuestion: async (
    req: Request<{}, {}, CreateQuestionPayload>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const question = await AdminService.createQuestion(req.body);
      sendCreated(res, question, "Question created successfully");
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/v1/admin/questions/:id
   * Body: { categoryId?, question?, options?, correctAnswer?, difficulty? }
   */
  updateQuestion: async (
    req: Request<{ id: string }, {}, UpdateQuestionPayload>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const question = await AdminService.updateQuestion(
        req.params.id,
        req.body,
      );
      sendSuccess(res, question, "Question updated successfully");
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/v1/admin/questions/:id
   * Query: ?categoryId=  (optional but improves performance)
   */
  deleteQuestion: async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await AdminService.deleteQuestion(
        req.params.id,
        req.query.categoryId as string | undefined,
      );
      sendSuccess(res, null, "Question deleted successfully");
    } catch (err) {
      next(err);
    }
  },

  // ──────────────────────────────────────────────────────────
  // BULK OPERATIONS
  // ──────────────────────────────────────────────────────────

  /**
   * DELETE /api/v1/admin/questions/bulk
   * Body: { questionIds: string[] }
   */
  bulkDeleteQuestions: async (
    req: Request<{}, {}, BulkDeletePayload>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { deletedCount } = await AdminService.bulkDeleteQuestions(
        req.body.questionIds,
      );
      sendSuccess(
        res,
        { deletedCount },
        `${deletedCount} question(s) deleted successfully`,
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/admin/questions/bulk-difficulty
   * Body: { questionIds: string[], difficulty: 'easy'|'medium'|'hard' }
   */
  bulkUpdateDifficulty: async (
    req: Request<{}, {}, BulkDifficultyPayload>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { modifiedCount } = await AdminService.bulkUpdateDifficulty(
        req.body.questionIds,
        req.body.difficulty,
      );
      sendSuccess(
        res,
        { modifiedCount },
        `${modifiedCount} question(s) updated to "${req.body.difficulty}"`,
      );
    } catch (err) {
      next(err);
    }
  },

  // ──────────────────────────────────────────────────────────
  // ACCOUNT SETTINGS
  // ──────────────────────────────────────────────────────────

  /**
   * PATCH /api/v1/admin/settings/password
   * Body: { currentPassword, newPassword }
   */
  changePassword: async (
    req: Request<{}, {}, ChangePasswordPayload>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) throw new Error("Unauthorized");

      await AdminService.changePassword(
        req.user.id,
        req.body.currentPassword,
        req.body.newPassword,
      );
      sendSuccess(res, null, "Password changed successfully");
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/admin/settings/username
   * Body: { newUsername, password }
   */
  changeUsername: async (
    req: Request<{}, {}, ChangeUsernamePayload>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) throw new Error("Unauthorized");

      const updated = await AdminService.changeUsername(
        req.user.id,
        req.body.newUsername,
        req.body.password,
      );
      sendSuccess(
        res,
        { username: updated.username },
        "Username changed successfully",
      );
    } catch (err) {
      next(err);
    }
  },

  changeEmail: async (
    req: Request<{}, {}, ChangeEmailPayload>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) throw new Error("Unauthorized");

      const updated = await AdminService.changeEmail(
        req.user.id,
        req.body.newEmail,
        req.body.password,
      );
      sendSuccess(
        res,
        { email: updated.email },
        "Email changed successfully",
      );
    } catch (err) {
      next(err);
    }
  },
};
