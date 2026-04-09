import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types/index.js';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: PaginationMeta
): Response<ApiResponse<T>> => {
  const response: ApiResponse<T> = { success: true, message, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message = 'Resource created successfully'
): Response<ApiResponse<T>> => sendSuccess(res, data, message, 201);

export const sendError = (
  res: Response,
  message = 'Something went wrong',
  statusCode = 500,
  error?: string
): Response<ApiResponse<never>> => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(error && { error }),
  });
};

export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export const parsePaginationQuery = (
  query: Record<string, unknown>
): { page: number; limit: number; skip: number } => {
  const page = Math.max(1, parseInt(String(query.page ?? 1), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 10), 10)));
  return { page, limit, skip: (page - 1) * limit };
};