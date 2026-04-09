import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service.js';
import { sendSuccess, sendCreated } from '../utils/response.helper.js';
import { CategoryPayload, QuestionPayload } from '../types/index.js';

// ============================================================
// Category Controller
// ============================================================

export const CategoryController = {
  // GET /categories
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { categories, meta } = await CategoryService.getAll(
        req.query as Record<string, unknown>
      );
      sendSuccess(res, categories, 'Categories fetched successfully', 200, meta);
    } catch (err) {
      next(err);
    }
  },

  // GET /categories/:id
  getById: async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await CategoryService.getById(req.params.id);
      sendSuccess(res, category, 'Category fetched successfully');
    } catch (err) {
      next(err);
    }
  },

  // GET /categories/slug/:slug
  getBySlug: async (
    req: Request<{ slug: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const category = await CategoryService.getBySlug(req.params.slug);
      sendSuccess(res, category, 'Category fetched successfully');
    } catch (err) {
      next(err);
    }
  },

  // POST /categories  [admin]
  create: async (
    req: Request<object, object, CategoryPayload>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const category = await CategoryService.create(req.body);
      sendCreated(res, category, 'Category created successfully');
    } catch (err) {
      next(err);
    }
  },

  // PATCH /categories/:id  [admin]
  update: async (
    req: Request<{ id: string }, object, Partial<CategoryPayload>>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const category = await CategoryService.update(req.params.id, req.body);
      sendSuccess(res, category, 'Category updated successfully');
    } catch (err) {
      next(err);
    }
  },

  // DELETE /categories/:id  [admin]
  delete: async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await CategoryService.delete(req.params.id);
      sendSuccess(res, null, 'Category deleted successfully');
    } catch (err) {
      next(err);
    }
  },

  // GET /categories/:id/questions
  getQuestions: async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await CategoryService.getQuestions(
        req.params.id,
        req.query.difficulty as string | undefined
      );
      sendSuccess(res, result, 'Questions fetched successfully');
    } catch (err) {
      next(err);
    }
  },

  // POST /categories/:id/questions  [admin]
  addQuestion: async (
    req: Request<{ id: string }, object, QuestionPayload>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const category = await CategoryService.addQuestion(req.params.id, req.body);
      sendCreated(res, category, 'Question added successfully');
    } catch (err) {
      next(err);
    }
  },

  // PATCH /categories/:id/questions/:questionId  [admin]
  updateQuestion: async (
    req: Request<{ id: string; questionId: string }, object, Partial<QuestionPayload>>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const category = await CategoryService.updateQuestion(
        req.params.id,
        req.params.questionId,
        req.body
      );
      sendSuccess(res, category, 'Question updated successfully');
    } catch (err) {
      next(err);
    }
  },

  // DELETE /categories/:id/questions/:questionId  [admin]
  deleteQuestion: async (
    req: Request<{ id: string; questionId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const category = await CategoryService.deleteQuestion(req.params.id, req.params.questionId);
      sendSuccess(res, category, 'Question deleted successfully');
    } catch (err) {
      next(err);
    }
  },
};