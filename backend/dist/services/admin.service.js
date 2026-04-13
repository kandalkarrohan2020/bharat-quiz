import { Types } from "mongoose";
import bcrypt from "bcryptjs";
import { Category } from "../models/category.model.js";
import { User } from "../models/user.model.js";
import { NotFoundError, ValidationError, UnauthorizedError, } from "../utils/app-error.js";
import { buildPaginationMeta, parsePaginationQuery, } from "../utils/response.helper.js";
export const AdminService = {
    // ─────────────────────────────────────────
    // DASHBOARD
    // ─────────────────────────────────────────
    async getDashboardStats() {
        const categories = await Category.find({ isActive: true })
            .select("questions.difficulty")
            .lean();
        let easy = 0;
        let medium = 0;
        let hard = 0;
        let totalQuestions = 0;
        for (const cat of categories) {
            for (const q of cat.questions) {
                totalQuestions++;
                if (q.difficulty === "easy")
                    easy++;
                else if (q.difficulty === "medium")
                    medium++;
                else if (q.difficulty === "hard")
                    hard++;
            }
        }
        return {
            totalQuestions,
            totalCategories: categories.length,
            byDifficulty: { easy, medium, hard },
        };
    },
    // ─────────────────────────────────────────
    // CATEGORIES
    // ─────────────────────────────────────────
    async getAllCategories() {
        return Category.find({ isActive: true }).sort({ createdAt: 1 }).lean();
    },
    async createCategory(payload) {
        const { name, icon = "📚", description = "", color = "from-blue-700 to-cyan-600", } = payload;
        const existing = await Category.findOne({
            name: { $regex: new RegExp(`^${name}$`, "i") },
        });
        if (existing) {
            throw new ValidationError(`Category "${name}" already exists`);
        }
        return Category.create({
            name,
            icon,
            description,
            color,
            questions: [],
            isActive: true,
        });
    },
    async updateCategory(categoryId, payload) {
        if (!Types.ObjectId.isValid(categoryId)) {
            throw new ValidationError("Invalid category ID");
        }
        if (payload.name) {
            const duplicate = await Category.findOne({
                _id: { $ne: categoryId },
                name: { $regex: new RegExp(`^${payload.name}$`, "i") },
            });
            if (duplicate) {
                throw new ValidationError(`Category "${payload.name}" already exists`);
            }
        }
        const category = await Category.findByIdAndUpdate(categoryId, { $set: payload }, { new: true, runValidators: true }).lean();
        if (!category)
            throw new NotFoundError("Category");
        return category;
    },
    async deleteCategory(categoryId) {
        if (!Types.ObjectId.isValid(categoryId)) {
            throw new ValidationError("Invalid category ID");
        }
        const result = await Category.findByIdAndDelete(categoryId);
        if (!result)
            throw new NotFoundError("Category");
    },
    // ─────────────────────────────────────────
    // QUESTIONS
    // ─────────────────────────────────────────
    async getAllQuestions(query) {
        const { page, limit, skip } = parsePaginationQuery(query);
        const { categoryId, difficulty, search } = query;
        const matchCategory = { isActive: true };
        if (categoryId && Types.ObjectId.isValid(categoryId)) {
            matchCategory._id = new Types.ObjectId(categoryId);
        }
        const matchQuestion = {};
        if (difficulty)
            matchQuestion["questions.difficulty"] = difficulty;
        if (search) {
            matchQuestion["questions.question"] = {
                $regex: search,
                $options: "i",
            };
        }
        const pipeline = [
            { $match: matchCategory },
            { $unwind: "$questions" },
            ...(Object.keys(matchQuestion).length ? [{ $match: matchQuestion }] : []),
            {
                $project: {
                    _id: 0,
                    categoryId: "$_id",
                    categoryName: "$name",
                    categoryIcon: "$icon",
                    id: "$questions._id",
                    question: "$questions.question",
                    options: "$questions.options",
                    correctAnswer: "$questions.correctAnswer",
                    difficulty: "$questions.difficulty",
                },
            },
            { $sort: { categoryName: 1, difficulty: 1 } },
        ];
        const [countResult, questions] = await Promise.all([
            Category.aggregate([...pipeline, { $count: "total" }]),
            Category.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
        ]);
        const total = countResult[0]?.total ?? 0;
        return {
            questions,
            meta: buildPaginationMeta(total, page, limit),
        };
    },
    async createQuestion(payload) {
        const { categoryId, question, options, correctAnswer, difficulty } = payload;
        if (!Types.ObjectId.isValid(categoryId)) {
            throw new ValidationError("Invalid category ID");
        }
        const newQuestion = {
            _id: new Types.ObjectId(),
            question,
            options,
            correctAnswer,
            difficulty,
        };
        const category = await Category.findByIdAndUpdate(categoryId, { $push: { questions: newQuestion } }, { new: true, runValidators: true }).lean();
        if (!category)
            throw new NotFoundError("Category");
        return {
            ...newQuestion,
            categoryId,
            categoryName: category.name,
            categoryIcon: category.icon,
        };
    },
    async updateQuestion(questionId, payload) {
        if (!Types.ObjectId.isValid(questionId)) {
            throw new ValidationError("Invalid question ID");
        }
        const { categoryId: newCategoryId, ...fields } = payload;
        const currentCategory = await Category.findOne({
            "questions._id": new Types.ObjectId(questionId),
        });
        if (!currentCategory)
            throw new NotFoundError("Question");
        const isMoving = newCategoryId && newCategoryId !== String(currentCategory._id);
        // ───────────── MOVE QUESTION ─────────────
        if (isMoving) {
            if (!Types.ObjectId.isValid(newCategoryId)) {
                throw new ValidationError("Invalid target category ID");
            }
            const existingQ = currentCategory.questions.find((q) => String(q._id) === questionId);
            if (!existingQ)
                throw new NotFoundError("Question");
            const updatedQ = {
                ...existingQ,
                ...fields,
                _id: existingQ._id, // IMPORTANT: keep same ID
            };
            await Promise.all([
                Category.findByIdAndUpdate(currentCategory._id, {
                    $pull: { questions: { _id: existingQ._id } },
                }),
                Category.findByIdAndUpdate(newCategoryId, {
                    $push: { questions: updatedQ },
                }),
            ]);
            return {
                ...updatedQ,
                categoryId: newCategoryId,
            };
        }
        // ───────────── NORMAL UPDATE ─────────────
        const updateFields = {};
        for (const [key, value] of Object.entries(fields)) {
            updateFields[`questions.$.${key}`] = value;
        }
        const updated = await Category.findOneAndUpdate({ "questions._id": new Types.ObjectId(questionId) }, { $set: updateFields }, { new: true }).lean();
        if (!updated)
            throw new NotFoundError("Question");
        const updatedQ = updated.questions.find((q) => String(q._id) === questionId);
        return {
            ...updatedQ,
            categoryId: String(updated._id),
            categoryName: updated.name,
            categoryIcon: updated.icon,
        };
    },
    async deleteQuestion(questionId, categoryId) {
        if (!Types.ObjectId.isValid(questionId)) {
            throw new ValidationError("Invalid question ID");
        }
        const filter = categoryId && Types.ObjectId.isValid(categoryId)
            ? { _id: categoryId }
            : { "questions._id": new Types.ObjectId(questionId) };
        const result = await Category.findOneAndUpdate(filter, {
            $pull: { questions: { _id: new Types.ObjectId(questionId) } },
        });
        if (!result)
            throw new NotFoundError("Question");
    },
    // ─────────────────────────────────────────
    // BULK
    // ─────────────────────────────────────────
    async bulkUpdateDifficulty(questionIds, difficulty) {
        if (!questionIds?.length) {
            throw new ValidationError("No question IDs provided");
        }
        const validDifficulties = ["easy", "medium", "hard"];
        if (!validDifficulties.includes(difficulty)) {
            throw new ValidationError(`difficulty must be one of: ${validDifficulties.join(", ")}`);
        }
        const objectIds = questionIds.map((id) => {
            if (!Types.ObjectId.isValid(id)) {
                throw new ValidationError(`Invalid question ID: ${id}`);
            }
            return new Types.ObjectId(id);
        });
        const result = await Category.updateMany({ "questions._id": { $in: objectIds } }, {
            $set: {
                "questions.$[elem].difficulty": difficulty,
            },
        }, {
            arrayFilters: [{ "elem._id": { $in: objectIds } }],
        });
        return {
            modifiedCount: result.modifiedCount,
        };
    },
    async bulkDeleteQuestions(questionIds) {
        if (!questionIds?.length) {
            throw new ValidationError("No question IDs provided");
        }
        const objectIds = questionIds.map((id) => {
            if (!Types.ObjectId.isValid(id)) {
                throw new ValidationError(`Invalid question ID: ${id}`);
            }
            return new Types.ObjectId(id);
        });
        const result = await Category.updateMany({ "questions._id": { $in: objectIds } }, { $pull: { questions: { _id: { $in: objectIds } } } });
        return { deletedCount: result.modifiedCount };
    },
    // ─────────────────────────────────────────
    // ACCOUNT SETTINGS
    // ─────────────────────────────────────────
    async changePassword(userId, currentPassword, newPassword) {
        if (!Types.ObjectId.isValid(userId)) {
            throw new ValidationError("Invalid user ID");
        }
        const user = await User.findById(userId).select("+password");
        if (!user)
            throw new NotFoundError("User");
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            throw new UnauthorizedError("Current password is incorrect");
        }
        if (newPassword.length < 6) {
            throw new ValidationError("New password must be at least 6 characters");
        }
        user.password = newPassword;
        await user.save();
    },
    async changeEmail(userId, newEmail, password) {
        if (!Types.ObjectId.isValid(userId)) {
            throw new ValidationError("Invalid user ID");
        }
        const user = await User.findById(userId).select("+password");
        if (!user)
            throw new NotFoundError("User");
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedError("Password is incorrect");
        }
        const taken = await User.findOne({
            email: { $regex: new RegExp(`^${newEmail}$`, "i") },
            _id: { $ne: userId },
        });
        if (taken) {
            throw new ValidationError(`Email "${newEmail}" is already taken`);
        }
        user.email = newEmail;
        await user.save();
        return { email: user.email };
    },
};
//# sourceMappingURL=admin.service.js.map