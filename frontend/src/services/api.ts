// ============================================================
// src/services/api.ts
// ============================================================

const BASE = import.meta.env.VITE_BACKEND_URL + "/api/v1";

// ─────────────────────────────────────────────────────────────
// Shared fetch helper
// ─────────────────────────────────────────────────────────────

async function request<T = unknown>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  params?: Record<string, string | number | undefined>,
  token?: string | null,
): Promise<{ data: T; message: string }> {
  const authToken = token ?? localStorage.getItem("admin_token");

  const url = new URL(`${BASE}${path}`);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") {
        url.searchParams.set(k, String(v));
      }
    });
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? json.error ?? "Request failed");
  }

  return json;
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  playerEmail?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  difficulty: string;
  categoryName?: string;
  title: string;
  completedAt: string;
}

export interface SaveResultPayload {
  playerName: string;
  playerEmail: string;
  playerContact?: string;
  categoryId: string;
  categoryName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  difficulty: "easy" | "medium" | "hard";
  title: string;
  completedAt: string;
}

export interface AdminCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: any;
}

// Questions fetched from backend for a category+difficulty
export interface FetchedQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface CategoryQuestionsResponse {
  categoryId: string;
  categoryName: string;
  icon: string;
  description: string;
  color: string;
  difficulty: string;
  totalFetched: number;
  totalAvailable: number;
  questions: FetchedQuestion[];
}

// ─────────────────────────────────────────────────────────────
// gameApi — public game endpoints
// ─────────────────────────────────────────────────────────────

export const gameApi = {
  /**
   * GET /api/v1/categories
   * Fetches all active categories with their questions.
   * Used by CategorySelect to replace static quizData.
   */
  getCategories: (): Promise<any[]> =>
    request<any[]>("GET", "/categories", undefined, undefined, null).then(
      (res) =>
        (res.data ?? []).map((c: any) => ({
          ...c,
          id: c._id ?? c.id,
          questions: (c.questions ?? []).map((q: any) => ({
            ...q,
            id: q._id ?? q.id,
          })),
        })),
    ),

  /**
   * GET /api/v1/categories/:id/questions?difficulty=easy|medium|hard
   * Returns randomly selected questions for the chosen category + difficulty.
   * Count: easy=10, medium=15, hard=20 (enforced server-side).
   */
  getCategoryQuestions: (
    categoryId: string,
    difficulty: "easy" | "medium" | "hard",
  ): Promise<CategoryQuestionsResponse> =>
    request<CategoryQuestionsResponse>(
      "GET",
      `/categories/${categoryId}/questions`,
      undefined,
      { difficulty },
      null,
    ).then((res) => res.data),

  saveResult: (payload: SaveResultPayload) =>
    request("POST", "/game/results", payload, undefined, null),

  getLeaderboard: (
    categoryId?: string,
    difficulty?: string,
    limit = 50,
  ): Promise<LeaderboardEntry[]> =>
    request<LeaderboardEntry[]>(
      "GET",
      "/game/leaderboard",
      undefined,
      { categoryId, difficulty, limit },
      null,
    ).then((res) => res.data),

  getLeaderboardAdmin: (
    categoryId?: string,
    difficulty?: string,
    limit = 50,
  ): Promise<LeaderboardEntry[]> =>
    request<LeaderboardEntry[]>("GET", "/game/leaderboard", undefined, {
      categoryId,
      difficulty,
      limit,
      showEmail: 1,
    }).then((res) => res.data),
};

// ─────────────────────────────────────────────────────────────
// authApi — authentication endpoints
// ─────────────────────────────────────────────────────────────

export const authApi = {
  // FIXED LOGIN
  login: async (creds: AdminCredentials): Promise<AuthResponse> => {
    const res = await request<any>(
      "POST",
      "/auth/login",
      {
        email: creds.email,
        password: creds.password,
      },
      undefined,
      null, // no token for login
    );

    return {
      token: res.data.tokens.accessToken,
      refreshToken: res.data.tokens.refreshToken,
      user: res.data.user,
    };
  },

  // FIX METHOD (should be PATCH not POST)
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request("PATCH", "/admin/settings/password", payload),

  changeEmail: (payload: { newEmail: string; password: string }) =>
    request("PATCH", "/admin/settings/email", payload),
};
