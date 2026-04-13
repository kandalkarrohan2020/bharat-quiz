import { CategoryService } from '../services/category.service.js';
import { sendSuccess, sendCreated } from '../utils/response.helper.js';
// ============================================================
// Category Controller
// ============================================================
export const CategoryController = {
    // GET /categories
    getAll: async (req, res, next) => {
        try {
            const { categories, meta } = await CategoryService.getAll(req.query);
            sendSuccess(res, categories, 'Categories fetched successfully', 200, meta);
        }
        catch (err) {
            next(err);
        }
    },
    // GET /categories/:id
    getById: async (req, res, next) => {
        try {
            const category = await CategoryService.getById(req.params.id);
            sendSuccess(res, category, 'Category fetched successfully');
        }
        catch (err) {
            next(err);
        }
    },
    // GET /categories/slug/:slug
    getBySlug: async (req, res, next) => {
        try {
            const category = await CategoryService.getBySlug(req.params.slug);
            sendSuccess(res, category, 'Category fetched successfully');
        }
        catch (err) {
            next(err);
        }
    },
    // POST /categories  [admin]
    create: async (req, res, next) => {
        try {
            const category = await CategoryService.create(req.body);
            sendCreated(res, category, 'Category created successfully');
        }
        catch (err) {
            next(err);
        }
    },
    // PATCH /categories/:id  [admin]
    update: async (req, res, next) => {
        try {
            const category = await CategoryService.update(req.params.id, req.body);
            sendSuccess(res, category, 'Category updated successfully');
        }
        catch (err) {
            next(err);
        }
    },
    // DELETE /categories/:id  [admin]
    delete: async (req, res, next) => {
        try {
            await CategoryService.delete(req.params.id);
            sendSuccess(res, null, 'Category deleted successfully');
        }
        catch (err) {
            next(err);
        }
    },
    // GET /categories/:id/questions
    getQuestions: async (req, res, next) => {
        try {
            const result = await CategoryService.getQuestions(req.params.id, req.query.difficulty);
            sendSuccess(res, result, 'Questions fetched successfully');
        }
        catch (err) {
            next(err);
        }
    },
    // POST /categories/:id/questions  [admin]
    addQuestion: async (req, res, next) => {
        try {
            const category = await CategoryService.addQuestion(req.params.id, req.body);
            sendCreated(res, category, 'Question added successfully');
        }
        catch (err) {
            next(err);
        }
    },
    // PATCH /categories/:id/questions/:questionId  [admin]
    updateQuestion: async (req, res, next) => {
        try {
            const category = await CategoryService.updateQuestion(req.params.id, req.params.questionId, req.body);
            sendSuccess(res, category, 'Question updated successfully');
        }
        catch (err) {
            next(err);
        }
    },
    // DELETE /categories/:id/questions/:questionId  [admin]
    deleteQuestion: async (req, res, next) => {
        try {
            const category = await CategoryService.deleteQuestion(req.params.id, req.params.questionId);
            sendSuccess(res, category, 'Question deleted successfully');
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=category.controller.js.map