// ============================================================
// src/services/api.admin.ts
// Full file — bulkCreateQuestions added at the bottom of
// the Bulk Operations section.  Everything else is unchanged.
// ============================================================

const BASE = import.meta.env.VITE_BACKEND_URL + "/api/v1";

async function request<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  params?: Record<string, string | number | undefined>
): Promise<{ data: T; message: string }> {
  const token = localStorage.getItem('admin_token');

  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    });
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? json.error ?? 'Request failed');
  }

  return json;
}

export const adminApi = {

  // ── Dashboard ───────────────────────────────────────────────

  getStats: () =>
    request('GET', '/admin/stats'),

  // ── Categories ──────────────────────────────────────────────

  getCategories: () =>
    request('GET', '/admin/categories'),

  createCategory: (payload: {
    name: string;
    icon?: string;
    description?: string;
    color?: string;
  }) => request('POST', '/admin/categories', payload),

  updateCategory: (
    id: string,
    payload: {
      name?: string;
      icon?: string;
      description?: string;
      color?: string;
      isActive?: boolean;
    }
  ) => request('PUT', `/admin/categories/${id}`, payload),

  deleteCategory: (id: string) =>
    request('DELETE', `/admin/categories/${id}`),

  // ── Questions ───────────────────────────────────────────────

  getQuestions: (params?: {
    categoryId?: string;
    difficulty?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => request('GET', '/admin/questions', undefined, params as any),

  createQuestion: (payload: {
    categoryId: string;
    question: string;
    options: [string, string, string, string];
    correctAnswer: 0 | 1 | 2 | 3;
    difficulty: 'easy' | 'medium' | 'hard';
  }) => request('POST', '/admin/questions', payload),

  updateQuestion: (
    id: string,
    payload: {
      categoryId?: string;
      question?: string;
      options?: [string, string, string, string];
      correctAnswer?: 0 | 1 | 2 | 3;
      difficulty?: 'easy' | 'medium' | 'hard';
    }
  ) => request('PUT', `/admin/questions/${id}`, payload),

  deleteQuestion: (id: string, categoryId?: string) => {
    const qs = categoryId ? `?categoryId=${categoryId}` : '';
    return request('DELETE', `/admin/questions/${id}${qs}`);
  },

  // ── Bulk Operations ─────────────────────────────────────────

  bulkDeleteQuestions: (payload: { questionIds: string[] }) =>
    request('DELETE', '/admin/questions/bulk', payload),

  bulkUpdateDifficulty: (payload: {
    questionIds: string[];
    difficulty: 'easy' | 'medium' | 'hard';
  }) => request('PATCH', '/admin/questions/bulk-difficulty', payload),

  /**
   * POST /api/v1/admin/questions/bulk-create
   * Import multiple questions (typically from an Excel upload).
   * correctAnswer is 0-indexed (convert from Excel's 1-indexed before calling).
   */
  bulkCreateQuestions: (payload: {
    questions: Array<{
      categoryId:    string;
      question:      string;
      options:       [string, string, string, string];
      correctAnswer: 0 | 1 | 2 | 3;
      difficulty:    'easy' | 'medium' | 'hard';
    }>;
  }) => request('POST', '/admin/questions/bulk-create', payload),
};