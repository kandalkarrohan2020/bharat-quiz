// ============================================================
// Core Domain Types
// ============================================================

export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuizStatus = 'not_started' | 'in_progress' | 'completed';

export type UserRole = 'user' | 'admin';

// ============================================================
// API Response Types
// ============================================================

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

// ============================================================
// Quiz Domain Types
// ============================================================

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

// ============================================================
// Quiz Session Types
// ============================================================

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

// ============================================================
// Auth Types
// ============================================================

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
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ============================================================
// Leaderboard Types
// ============================================================

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