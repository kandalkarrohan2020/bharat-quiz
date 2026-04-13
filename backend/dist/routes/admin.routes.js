// ============================================================
// admin.routes.ts
// All /api/v1/admin/* endpoints.
// Every route is protected by `protect` + `requireAdmin`.
// ============================================================
import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createCategorySchema, updateCategorySchema, createQuestionSchema, updateQuestionSchema, bulkDeleteSchema, bulkDifficultySchema, changePasswordSchema, changeEmailSchema, questionQuerySchema, } from '../middlewares/admin.schemas.js';
const router = Router();
// ── Apply auth + role guard to every admin route ─────────────
router.use(protect, requireAdmin);
// ─────────────────────────────────────────────────────────────
// DASHBOARD
// GET /api/v1/admin/stats
// ─────────────────────────────────────────────────────────────
router.get('/stats', AdminController.getStats);
// ─────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────
router
    .route('/categories')
    /** GET /api/v1/admin/categories — list all with embedded questions */
    .get(AdminController.getAllCategories)
    /** POST /api/v1/admin/categories — { name, icon?, description?, color? } */
    .post(validate(createCategorySchema), AdminController.createCategory);
router
    .route('/categories/:id')
    /** PUT /api/v1/admin/categories/:id */
    .put(validate(updateCategorySchema), AdminController.updateCategory)
    /** DELETE /api/v1/admin/categories/:id  (also removes all its questions) */
    .delete(AdminController.deleteCategory);
// ─────────────────────────────────────────────────────────────
// BULK QUESTION OPERATIONS
// IMPORTANT: declared BEFORE /:id routes to avoid Express
// treating the literal strings "bulk" / "bulk-difficulty" as IDs.
// ─────────────────────────────────────────────────────────────
/**
 * DELETE /api/v1/admin/questions/bulk
 * Body: { questionIds: string[] }
 */
router.delete('/questions/bulk', validate(bulkDeleteSchema), AdminController.bulkDeleteQuestions);
/**
 * PATCH /api/v1/admin/questions/bulk-difficulty
 * Body: { questionIds: string[], difficulty: 'easy'|'medium'|'hard' }
 */
router.patch('/questions/bulk-difficulty', validate(bulkDifficultySchema), AdminController.bulkUpdateDifficulty);
// ─────────────────────────────────────────────────────────────
// QUESTIONS (single)
// ─────────────────────────────────────────────────────────────
router
    .route('/questions')
    /**
     * GET /api/v1/admin/questions
     * Query: ?categoryId=&difficulty=easy|medium|hard&search=&page=1&limit=20
     */
    .get(validate(questionQuerySchema, 'query'), AdminController.getAllQuestions)
    /**
     * POST /api/v1/admin/questions
     * Body: { categoryId, question, options[4], correctAnswer, difficulty }
     */
    .post(validate(createQuestionSchema), AdminController.createQuestion);
router
    .route('/questions/:id')
    /**
     * PUT /api/v1/admin/questions/:id
     * Body: { categoryId?, question?, options?, correctAnswer?, difficulty? }
     */
    .put(validate(updateQuestionSchema), AdminController.updateQuestion)
    /**
     * DELETE /api/v1/admin/questions/:id
     * Query: ?categoryId=  (optional — speeds up subdoc lookup)
     */
    .delete(AdminController.deleteQuestion);
// ─────────────────────────────────────────────────────────────
// ACCOUNT SETTINGS
// ─────────────────────────────────────────────────────────────
/**
 * PATCH /api/v1/admin/settings/password
 * Body: { currentPassword, newPassword }
 */
router.patch('/settings/password', validate(changePasswordSchema), AdminController.changePassword);
/**
 * PATCH /api/v1/admin/settings/email
 * Body: { newEmail, password }
 */
router.patch('/settings/email', validate(changeEmailSchema), AdminController.changeEmail);
export default router;
//# sourceMappingURL=admin.routes.js.map