// ============================================================
// src/services/api.ts  — admin section
// Add these exports alongside your existing authApi / quizApi.
// All paths match admin.routes.ts exactly.
// ============================================================

const BASE = 'http://localhost:8000/api/v1';

// ── shared fetch helper (reuse / replace with your own) ──────

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

  return json; // { success, message, data, meta? }
}

// ─────────────────────────────────────────────────────────────
// adminApi — mirrors every AdminController method
// ─────────────────────────────────────────────────────────────

export const adminApi = {

  // ── Dashboard ───────────────────────────────────────────────

  /** GET /api/v1/admin/stats */
  getStats: () =>
    request('GET', '/admin/stats'),

  // ── Categories ──────────────────────────────────────────────

  /** GET /api/v1/admin/categories */
  getCategories: () =>
    request('GET', '/admin/categories'),

  /** POST /api/v1/admin/categories */
  createCategory: (payload: {
    name: string;
    icon?: string;
    description?: string;
    color?: string;
  }) => request('POST', '/admin/categories', payload),

  /** PUT /api/v1/admin/categories/:id */
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

  /** DELETE /api/v1/admin/categories/:id */
  deleteCategory: (id: string) =>
    request('DELETE', `/admin/categories/${id}`),

  // ── Questions ───────────────────────────────────────────────

  /** GET /api/v1/admin/questions */
  getQuestions: (params?: {
    categoryId?: string;
    difficulty?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => request('GET', '/admin/questions', undefined, params as any),

  /** POST /api/v1/admin/questions */
  createQuestion: (payload: {
    categoryId: string;
    question: string;
    options: [string, string, string, string];
    correctAnswer: 0 | 1 | 2 | 3;
    difficulty: 'easy' | 'medium' | 'hard';
  }) => request('POST', '/admin/questions', payload),

  /** PUT /api/v1/admin/questions/:id */
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

  /**
   * DELETE /api/v1/admin/questions/:id
   * categoryId is passed as a query param to speed up subdoc lookup
   */
  deleteQuestion: (id: string, categoryId?: string) => {
    const qs = categoryId ? `?categoryId=${categoryId}` : '';
    return request('DELETE', `/admin/questions/${id}${qs}`);
  },

  // ── Bulk Operations ─────────────────────────────────────────

  /** DELETE /api/v1/admin/questions/bulk */
  bulkDeleteQuestions: (payload: { questionIds: string[] }) =>
    request('DELETE', '/admin/questions/bulk', payload),

  /** PATCH /api/v1/admin/questions/bulk-difficulty */
  bulkUpdateDifficulty: (payload: {
    questionIds: string[];
    difficulty: 'easy' | 'medium' | 'hard';
  }) => request('PATCH', '/admin/questions/bulk-difficulty', payload),
};
