// ============================================================
// src/types/index.ts
// Single source of truth for all domain types.
// ============================================================

// ─────────────────────────────────────────────────────────────
// CORE DOMAIN PRIMITIVES
// ─────────────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuizStatus = 'not_started' | 'in_progress' | 'completed';

export type UserRole = 'user' | 'admin';

// ─────────────────────────────────────────────────────────────
// API RESPONSE TYPES
// ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// ─────────────────────────────────────────────────────────────
// AUTH TYPES
// ─────────────────────────────────────────────────────────────

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  isAdmin?: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─────────────────────────────────────────────────────────────
// QUIZ DOMAIN TYPES
// ─────────────────────────────────────────────────────────────

export interface IQuestion {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: Difficulty;
}

export interface QuestionPayload {
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: Difficulty;
  explanation?: string;
}

export interface CategoryPayload {
  name: string;
  icon: string;
  description: string;
  color: string;
  questions?: QuestionPayload[];
}

// ─────────────────────────────────────────────────────────────
// QUIZ SESSION TYPES
// ─────────────────────────────────────────────────────────────

export interface QuizAttemptPayload {
  categoryId: string;
  answers: AnswerPayload[];
  timeTaken: number;
}

export interface AnswerPayload {
  questionId: string;
  selectedAnswer: number;
  timeTaken: number;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  percentage: number;
  timeTaken: number;
  title: string;
  titleEmoji: string;
  motivationalMessage: string;
  questionBreakdown: QuestionBreakdown[];
}

export interface QuestionBreakdown {
  questionId: string;
  question: string;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  difficulty: Difficulty;
  timeTaken: number;
}

// ─────────────────────────────────────────────────────────────
// LEADERBOARD TYPES
// ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  categoryId: string;
  categoryName: string;
  score: number;
  percentage: number;
  timeTaken: number;
  achievedAt: Date;
}

// ─────────────────────────────────────────────────────────────
// ADMIN — CATEGORY TYPES
// ─────────────────────────────────────────────────────────────

export interface CreateCategoryPayload {
  name: string;
  icon?: string;          // defaults to '📚' in service
  description?: string;   // defaults to ''
  color?: string;         // defaults to 'from-blue-700 to-cyan-600'
}

export interface UpdateCategoryPayload {
  name?: string;
  icon?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

// ─────────────────────────────────────────────────────────────
// ADMIN — QUESTION TYPES
// ─────────────────────────────────────────────────────────────

export interface CreateQuestionPayload {
  categoryId: string;
  question: string;
  options: [string, string, string, string]; // exactly 4
  correctAnswer: 0 | 1 | 2 | 3;
  difficulty: Difficulty;
}

export interface UpdateQuestionPayload {
  categoryId?: string; // present when moving to a different category
  question?: string;
  options?: [string, string, string, string];
  correctAnswer?: 0 | 1 | 2 | 3;
  difficulty?: Difficulty;
}

export interface QuestionQuery {
  categoryId?: string;
  difficulty?: Difficulty;
  search?: string;
  page?: number;
  limit?: number;
}

// ─────────────────────────────────────────────────────────────
// ADMIN — BULK OPERATION TYPES
// ─────────────────────────────────────────────────────────────

export interface BulkCreatePayload {
  questions: CreateQuestionPayload[];
}
 
export interface BulkCreateResult {
  totalInserted:       number;
  insertedByCategory:  Record<string, number>;
}

export interface BulkDeletePayload {
  questionIds: string[];
}

export interface BulkDifficultyPayload {
  questionIds: string[];
  difficulty: Difficulty;
}

// ─────────────────────────────────────────────────────────────
// ADMIN — SETTINGS TYPES
// ─────────────────────────────────────────────────────────────

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeUsernamePayload {
  newUsername: string;
  password: string;
}

export interface ChangeEmailPayload {
  newEmail: string;
  password: string;
}

// ─────────────────────────────────────────────────────────────
// ADMIN — SERVICE RETURN TYPES
// ─────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalQuestions: number;
  totalCategories: number;
  byDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface BulkResult {
  modifiedCount?: number;
  deletedCount?: number;
}