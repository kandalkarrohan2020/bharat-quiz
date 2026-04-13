import { Types } from "mongoose";
import { Category } from "../models/category.model.js";
import { NotFoundError, ConflictError, ValidationError, } from "../utils/app-error.js";
import { buildPaginationMeta, parsePaginationQuery, } from "../utils/response.helper.js";
// ============================================================
// Category Service
// ============================================================
export const CategoryService = {
    // ── Get all active categories (paginated) ──────────────────
    async getAll(query) {
        const { page, limit, skip } = parsePaginationQuery(query);
        const filter = { isActive: true };
        if (query.search) {
            filter.$text = { $search: String(query.search) };
        }
        const [categories, total] = await Promise.all([
            Category.find(filter)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
            Category.countDocuments(filter),
        ]);
        // Append virtual totalQuestions manually since lean() skips virtuals
        const enriched = categories.map((c) => ({
            ...c,
            totalQuestions: (c.questions ?? []).length,
        }));
        return {
            categories: enriched,
            meta: buildPaginationMeta(total, page, limit),
        };
    },
    // ── Get single category by ID ───────────────────────────────
    async getById(id) {
        if (!Types.ObjectId.isValid(id))
            throw new ValidationError("Invalid category ID");
        const category = await Category.findOne({ _id: id, isActive: true }).lean();
        if (!category)
            throw new NotFoundError("Category");
        return category;
    },
    // ── Get category by slug ────────────────────────────────────
    async getBySlug(slug) {
        const category = await Category.findOne({ slug, isActive: true }).lean();
        if (!category)
            throw new NotFoundError("Category");
        return category;
    },
    // ── Create category ─────────────────────────────────────────
    async create(payload) {
        const slug = payload.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-");
        const exists = await Category.findOne({ slug });
        if (exists)
            throw new ConflictError(`Category "${payload.name}" already exists`);
        const category = await Category.create({ ...payload, slug });
        return category;
    },
    // ── Update category ─────────────────────────────────────────
    async update(id, payload) {
        if (!Types.ObjectId.isValid(id))
            throw new ValidationError("Invalid category ID");
        const category = await Category.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true });
        if (!category)
            throw new NotFoundError("Category");
        return category;
    },
    // ── Soft delete category ────────────────────────────────────
    async delete(id) {
        if (!Types.ObjectId.isValid(id))
            throw new ValidationError("Invalid category ID");
        const category = await Category.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!category)
            throw new NotFoundError("Category");
        return category;
    },
    // ── Get questions by category ───────────────────────────────
    async getQuestions(id, difficulty) {
        if (!Types.ObjectId.isValid(id))
            throw new ValidationError("Invalid category ID");
        const category = await Category.findOne({ _id: id, isActive: true }).select("questions name");
        if (!category)
            throw new NotFoundError("Category");
        let questions = category.questions;
        if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
            questions = questions.filter((q) => q.difficulty === difficulty);
        }
        // Strip correct answers from response
        const sanitized = questions.map(({ _id, question, options, difficulty: d }) => ({
            _id,
            question,
            options,
            difficulty: d,
        }));
        return { categoryName: category.name, questions: sanitized };
    },
    // ── Add question to category ────────────────────────────────
    async addQuestion(categoryId, payload) {
        if (!Types.ObjectId.isValid(categoryId))
            throw new ValidationError("Invalid category ID");
        const category = await Category.findOneAndUpdate({ _id: categoryId, isActive: true }, { $push: { questions: payload } }, { new: true, runValidators: true });
        if (!category)
            throw new NotFoundError("Category");
        return category;
    },
    // ── Update a specific question ──────────────────────────────
    async updateQuestion(categoryId, questionId, payload) {
        if (!Types.ObjectId.isValid(categoryId) ||
            !Types.ObjectId.isValid(questionId)) {
            throw new ValidationError("Invalid ID provided");
        }
        const setPayload = {};
        for (const [k, v] of Object.entries(payload)) {
            setPayload[`questions.$.${k}`] = v;
        }
        const category = await Category.findOneAndUpdate({ _id: categoryId, "questions._id": questionId }, { $set: setPayload }, { new: true, runValidators: true });
        if (!category)
            throw new NotFoundError("Category or Question");
        return category;
    },
    // ── Delete a question ───────────────────────────────────────
    async deleteQuestion(categoryId, questionId) {
        if (!Types.ObjectId.isValid(categoryId) ||
            !Types.ObjectId.isValid(questionId)) {
            throw new ValidationError("Invalid ID provided");
        }
        const category = await Category.findOneAndUpdate({ _id: categoryId, isActive: true }, { $pull: { questions: { _id: questionId } } }, { new: true });
        if (!category)
            throw new NotFoundError("Category");
        return category;
    },
};
//# sourceMappingURL=category.service.js.map