// ============================================================
// admin.schemas.ts
// Zod validation schemas for every admin route
// ============================================================

import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────

export const difficulty = z.enum(["easy", "medium", "hard"], {
  errorMap: () => ({ message: "difficulty must be easy, medium, or hard" }),
});

export const mongoId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Must be a valid MongoDB ObjectId");

/** Exactly 4 non-empty option strings */
export const optionsSchema = z
  .array(z.string().trim().min(1).max(500))
  .length(4, { message: "Exactly 4 options are required" });

// ─────────────────────────────────────────────────────────────
// CATEGORY SCHEMAS
// ─────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name cannot be empty").max(100),
  icon: z.string().trim().max(10).default("📚"),
  description: z.string().trim().max(255).optional().default(""),
  color: z
    .string()
    .trim()
    .max(120)
    .optional()
    .default("from-blue-700 to-cyan-600"),
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    icon: z.string().trim().max(10).optional(),
    description: z.string().trim().max(255).optional(),
    color: z.string().trim().max(120).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// ─────────────────────────────────────────────────────────────
// QUESTION SCHEMAS
// ─────────────────────────────────────────────────────────────

export const createQuestionSchema = z.object({
  categoryId: mongoId,
  question: z
    .string()
    .trim()
    .min(5, "Question must be at least 5 characters")
    .max(1000),
  options: optionsSchema,
  correctAnswer: z
    .number()
    .int()
    .min(0, "correctAnswer must be between 0 and 3")
    .max(3, "correctAnswer must be between 0 and 3"),
  difficulty,
});

export const updateQuestionSchema = z
  .object({
    categoryId: mongoId.optional(),
    question: z.string().trim().min(5).max(1000).optional(),
    options: optionsSchema.optional(),
    correctAnswer: z.number().int().min(0).max(3).optional(),
    difficulty: difficulty.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const questionQuerySchema = z.object({
  categoryId: mongoId.optional(),
  difficulty: difficulty.optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─────────────────────────────────────────────────────────────
// BULK OPERATION SCHEMAS
// ─────────────────────────────────────────────────────────────

export const bulkCreateSchema = z.object({
  questions: z
    .array(
      z.object({
        categoryId: z.string().min(1, "categoryId is required"),
        question: z.string().min(1, "question is required"),
        options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
        correctAnswer: z.union([
          z.literal(0),
          z.literal(1),
          z.literal(2),
          z.literal(3),
        ]),
        difficulty: z.enum(["easy", "medium", "hard"]),
      }),
    )
    .min(1, "questions array must not be empty")
    .max(500, "Maximum 500 questions per import"),
});

export const bulkDeleteSchema = z.object({
  questionIds: z.array(mongoId).min(1, "At least one question ID is required"),
});

export const bulkDifficultySchema = z.object({
  questionIds: z.array(mongoId).min(1, "At least one question ID is required"),
  difficulty,
});

// ─────────────────────────────────────────────────────────────
// SETTINGS SCHEMAS
// ─────────────────────────────────────────────────────────────

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password cannot be empty"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .max(128),
});

export const changeUsernameSchema = z.object({
  newUsername: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50),
  password: z.string().min(1, "Password cannot be empty"),
});

export const changeEmailSchema = z.object({
  newEmail: z.string().trim().email("Invalid email format").max(50),
  password: z.string().min(1, "Password cannot be empty"),
});
