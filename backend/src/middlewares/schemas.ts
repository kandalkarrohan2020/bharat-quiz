import { z } from 'zod';

// ============================================================
// SHARED
// ============================================================

export const difficultyEnum = z.enum(['easy', 'medium', 'hard']);

export const mongoId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid MongoDB ObjectId');

// ============================================================
// AUTH SCHEMAS
// ============================================================

export const registerSchema = z.object({
  name: z.string().min(2).max(60).trim(),

  email: z.string().email().toLowerCase().trim(),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ============================================================
// Save Result SCHEMAS
// ============================================================

export const saveResultSchema = z.object({
  playerName: z
    .string()
    .min(2, 'Player name must be at least 2 characters')
    .max(60)
    .trim(),
 
  playerEmail: z
    .string()
    .email('A valid email address is required')
    .toLowerCase()
    .trim(),
 
  playerContact: z
    .string()
    .max(20)
    .trim()
    .optional()
    .nullable(),
 
  categoryId: mongoId,
 
  categoryName: z.string().min(1).max(80).trim(),
 
  score: z.number().int().min(0),
 
  totalQuestions: z.number().int().min(1),
 
  percentage: z.number().min(0).max(100),
 
  difficulty: difficultyEnum,
 
  title: z.string().min(1).max(60).trim(),
 
  completedAt: z
    .string()
    .datetime({ message: 'completedAt must be a valid ISO date string' })
    .optional(),
});

// ============================================================
// CATEGORY SCHEMAS
// ============================================================

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100).trim(),

  icon: z.string().max(10).trim().default('📚'),

  description: z.string().max(300).trim().default(''),

  color: z.string().max(120).trim().default('from-blue-700 to-cyan-600'),
});

export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

// ============================================================
// QUESTION SCHEMAS
// ============================================================

export const createQuestionSchema = z.object({
  categoryId: mongoId,

  question: z.string().min(5).max(1000).trim(),

  options: z
    .array(z.string().min(1).max(500).trim())
    .length(4, 'Exactly 4 options are required'),

  correctAnswer: z
    .number()
    .int()
    .min(0)
    .max(3, 'correctAnswer must be between 0 and 3'),

  difficulty: difficultyEnum,
});

export const updateQuestionSchema = z
  .object({
    categoryId: mongoId.optional(),
    question: z.string().min(5).max(1000).trim().optional(),
    options: z
      .array(z.string().min(1).max(500).trim())
      .length(4)
      .optional(),
    correctAnswer: z.number().int().min(0).max(3).optional(),
    difficulty: difficultyEnum.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

// ============================================================
// BULK OPERATIONS
// ============================================================

export const bulkDeleteSchema = z.object({
  questionIds: z
    .array(mongoId)
    .min(1, 'At least one question ID is required'),
});

export const bulkDifficultySchema = z.object({
  questionIds: z
    .array(mongoId)
    .min(1, 'At least one question ID is required'),

  difficulty: difficultyEnum,
});

// ============================================================
// SETTINGS SCHEMAS
// ============================================================

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),

  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters'),
});

export const changeUsernameSchema = z.object({
  newUsername: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50),

  password: z.string().min(1, 'Password confirmation is required'),
});

export const changeEmailSchema = z.object({
  newEmail: z.string().email('Invalid email format'),

  password: z.string().min(1, 'Password confirmation is required'),
});

// ============================================================
// QUIZ ATTEMPT SCHEMA
// ============================================================

const answerSchema = z.object({
  questionId: z.string().min(1),

  selectedAnswer: z.number().int().min(0),

  correctAnswer: z.number().int().min(0).optional(),

  isCorrect: z.boolean().optional(),

  question: z.string().optional(),

  difficulty: difficultyEnum.optional(),

  timeTaken: z.number().min(0).default(0),
});

export const submitAttemptSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),

  difficulty: difficultyEnum,

  timeTaken: z.number().min(0).default(0),

  categoryName: z.string().optional(),

  playerName: z.string().optional(),

  score: z.number().int().min(0).optional(),

  totalQuestions: z.number().int().min(1).optional(),

  answers: z.array(answerSchema).default([]),
});

// ============================================================
// PAGINATION
// ============================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  sort: z.string().optional(),

  order: z.enum(['asc', 'desc']).optional(),

  search: z.string().optional(),

  difficulty: difficultyEnum.optional(),

  categoryId: z.string().optional(),
});

// ============================================================
// PARAM SCHEMAS
// ============================================================

export const mongoIdSchema = z.object({
  id: mongoId,
});

export const slugSchema = z.object({
  slug: z.string().min(1),
});