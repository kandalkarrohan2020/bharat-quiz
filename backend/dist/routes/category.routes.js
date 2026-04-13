import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createCategorySchema, updateCategorySchema, createQuestionSchema, updateQuestionSchema, paginationSchema, } from '../middlewares/schemas.js';
const router = Router();
// ──────────────────────────────────────────────────────────────
// Public Routes
// ──────────────────────────────────────────────────────────────
/**
 * @route   GET /api/v1/categories
 * @desc    Get all active categories (paginated)
 * @access  Public
 * @query   page, limit, search
 */
router.get('/', validate(paginationSchema, 'query'), CategoryController.getAll);
/**
 * @route   GET /api/v1/categories/slug/:slug
 * @desc    Get category by slug
 * @access  Public
 */
router.get('/slug/:slug', CategoryController.getBySlug);
/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get category by ID (full with questions)
 * @access  Public
 */
router.get('/:id', CategoryController.getById);
/**
 * @route   GET /api/v1/categories/:id/questions
 * @desc    Get questions for a category (answers hidden)
 * @access  Public
 * @query   difficulty (easy|medium|hard)
 */
router.get('/:id/questions', CategoryController.getQuestions);
// ──────────────────────────────────────────────────────────────
// Admin-only Routes
// ──────────────────────────────────────────────────────────────
/**
 * @route   POST /api/v1/categories
 * @desc    Create a new category
 * @access  Private [admin]
 */
router.post('/', protect, authorize('admin'), validate(createCategorySchema), CategoryController.create);
/**
 * @route   PATCH /api/v1/categories/:id
 * @desc    Update a category
 * @access  Private [admin]
 */
router.patch('/:id', protect, authorize('admin'), validate(updateCategorySchema), CategoryController.update);
/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Soft-delete a category
 * @access  Private [admin]
 */
router.delete('/:id', protect, authorize('admin'), CategoryController.delete);
/**
 * @route   POST /api/v1/categories/:id/questions
 * @desc    Add a question to a category
 * @access  Private [admin]
 */
router.post('/:id/questions', protect, authorize('admin'), validate(createQuestionSchema), CategoryController.addQuestion);
/**
 * @route   PATCH /api/v1/categories/:id/questions/:questionId
 * @desc    Update a question
 * @access  Private [admin]
 */
router.patch('/:id/questions/:questionId', protect, authorize('admin'), validate(updateQuestionSchema), CategoryController.updateQuestion);
/**
 * @route   DELETE /api/v1/categories/:id/questions/:questionId
 * @desc    Remove a question from a category
 * @access  Private [admin]
 */
router.delete('/:id/questions/:questionId', protect, authorize('admin'), CategoryController.deleteQuestion);
export default router;
//# sourceMappingURL=category.routes.js.map