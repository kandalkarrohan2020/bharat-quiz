import { Types } from "mongoose";
import { Category } from "../models/category.model.js";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "../utils/app-error.js";
import {
  buildPaginationMeta,
  parsePaginationQuery,
} from "../utils/response.helper.js";
import { CategoryPayload, QuestionPayload } from "../types/index.js";

// ============================================================
// Category Service
// ============================================================

export const CategoryService = {
  // ── Get all active categories (paginated) ──────────────────

  async getAll(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const filter: Record<string, unknown> = { isActive: true };

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
    const enriched = categories.map((c: any) => ({
      ...c,
      totalQuestions: (c.questions ?? []).length,
    }));

    return {
      categories: enriched,
      meta: buildPaginationMeta(total, page, limit),
    };
  },

  // ── Get single category by ID ───────────────────────────────

  async getById(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new ValidationError("Invalid category ID");

    const category = await Category.findOne({ _id: id, isActive: true }).lean();
    if (!category) throw new NotFoundError("Category");
    return category;
  },

  // ── Get category by slug ────────────────────────────────────

  async getBySlug(slug: string) {
    const category = await Category.findOne({ slug, isActive: true }).lean();
    if (!category) throw new NotFoundError("Category");
    return category;
  },

  // ── Create category ─────────────────────────────────────────

  async create(payload: CategoryPayload) {
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

  async update(id: string, payload: Partial<CategoryPayload>) {
    if (!Types.ObjectId.isValid(id))
      throw new ValidationError("Invalid category ID");

    const category = await Category.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true },
    );
    if (!category) throw new NotFoundError("Category");
    return category;
  },

  // ── Soft delete category ────────────────────────────────────

  async delete(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new ValidationError("Invalid category ID");

    const category = await Category.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
    if (!category) throw new NotFoundError("Category");
    return category;
  },

  // ── Get questions by category ───────────────────────────────

  async getQuestions(id: string, difficulty?: string) {
    if (!Types.ObjectId.isValid(id))
      throw new ValidationError("Invalid category ID");

    const category = await Category.findOne({ _id: id, isActive: true }).select(
      "questions name",
    );
    if (!category) throw new NotFoundError("Category");

    let questions = category.questions;
    if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
      questions = questions.filter((q) => q.difficulty === difficulty);
    }

    // Strip correct answers from response
    const sanitized = questions.map(
      ({ _id, question, options, difficulty: d, correctAnswer }) => ({
        _id,
        question,
        options,
        difficulty: d,
        correctAnswer, 
      }),
    );

    return { categoryName: category.name, questions: sanitized };
  },

  // ── Add question to category ────────────────────────────────

  async addQuestion(categoryId: string, payload: QuestionPayload) {
    if (!Types.ObjectId.isValid(categoryId))
      throw new ValidationError("Invalid category ID");

    const category = await Category.findOneAndUpdate(
      { _id: categoryId, isActive: true },
      { $push: { questions: payload } },
      { new: true, runValidators: true },
    );
    if (!category) throw new NotFoundError("Category");
    return category;
  },

  // ── Update a specific question ──────────────────────────────

  async updateQuestion(
    categoryId: string,
    questionId: string,
    payload: Partial<QuestionPayload>,
  ) {
    if (
      !Types.ObjectId.isValid(categoryId) ||
      !Types.ObjectId.isValid(questionId)
    ) {
      throw new ValidationError("Invalid ID provided");
    }

    const setPayload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload)) {
      setPayload[`questions.$.${k}`] = v;
    }

    const category = await Category.findOneAndUpdate(
      { _id: categoryId, "questions._id": questionId },
      { $set: setPayload },
      { new: true, runValidators: true },
    );
    if (!category) throw new NotFoundError("Category or Question");
    return category;
  },

  // ── Delete a question ───────────────────────────────────────

  async deleteQuestion(categoryId: string, questionId: string) {
    if (
      !Types.ObjectId.isValid(categoryId) ||
      !Types.ObjectId.isValid(questionId)
    ) {
      throw new ValidationError("Invalid ID provided");
    }

    const category = await Category.findOneAndUpdate(
      { _id: categoryId, isActive: true },
      { $pull: { questions: { _id: questionId } } },
      { new: true },
    );
    if (!category) throw new NotFoundError("Category");
    return category;
  },
};
