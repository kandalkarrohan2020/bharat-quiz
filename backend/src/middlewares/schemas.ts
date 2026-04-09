import { z } from 'zod';

// ============================================================
// Auth Schemas
// ============================================================

export const registerSchema = z.object({
  name:     z.string().min(2).max(60).trim(),
  email:    z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});

export const loginSchema = z.object({
  email:    z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ============================================================
// Category Schemas
// ============================================================

export const createCategorySchema = z.object({
  name:        z.string().min(2).max(100).trim(),
  icon:        z.string().min(1).trim(),
  description: z.string().min(5).max(300).trim(),
  color:       z.string().min(1).trim(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ============================================================
// Question Schemas
// ============================================================

export const createQuestionSchema = z.object({
  question:      z.string().min(10).max(500).trim(),
  options:       z.array(z.string().min(1).trim()).min(2, 'At least 2 options').max(6, 'At most 6 options'),
  correctAnswer: z.number().int().min(0),
  difficulty:    z.enum(['easy', 'medium', 'hard']),
  explanation:   z.string().max(1000).trim().optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial();

// ============================================================
// Quiz Submit Schema
// Matches the payload shape sent by the React frontend:
//   ResultsScreen / QuizScreen → POST /api/v1/quiz/attempt
// ============================================================

const answerSchema = z.object({
  questionId:     z.string().min(1),
  selectedAnswer: z.number().int().min(0),
  correctAnswer:  z.number().int().min(0).optional(),
  isCorrect:      z.boolean().optional(),
  question:       z.string().optional(),
  difficulty:     z.enum(['easy', 'medium', 'hard']).optional(),
  timeTaken:      z.number().min(0).default(0),
});

export const submitAttemptSchema = z.object({
  // Required
  categoryId:   z.string().min(1, 'Category ID is required'),
  difficulty:   z.enum(['easy', 'medium', 'hard']),
  timeTaken:    z.number().min(0).default(0),

  // Optional enrichment from frontend
  categoryName:   z.string().optional(),
  playerName:     z.string().optional(),
  score:          z.number().int().min(0).optional(),   // fallback if answers array absent
  totalQuestions: z.number().int().min(1).optional(),   // fallback if answers array absent

  // Per-question breakdown (preferred – used to re-verify correctness server-side)
  answers: z.array(answerSchema).default([]),
});

// ============================================================
// Pagination Schema
// ============================================================

export const paginationSchema = z.object({
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(100).default(10),
  sort:       z.string().optional(),
  order:      z.enum(['asc', 'desc']).optional(),
  search:     z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  categoryId: z.string().optional(),
});

export const mongoIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid MongoDB ObjectId'),
});

export const slugSchema = z.object({
  slug: z.string().min(1),
});