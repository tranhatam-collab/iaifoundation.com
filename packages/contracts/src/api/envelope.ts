import type { ErrorCode } from './errors.js';

export interface ApiResponse<T> {
  ok: true;
  data: T;
  meta: {
    request_id: string;
    next_cursor: string | null;
  };
}

export interface ApiError {
  ok: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    request_id: string;
  };
}

export type ApiResponseEnvelope<T> = ApiResponse<T> | ApiError;

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  next_cursor: string | null;
}
