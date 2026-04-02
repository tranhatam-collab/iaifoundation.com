export function okResponse<T>(data: T, requestId: string, nextCursor?: string | null) {
  return {
    ok: true,
    data,
    meta: {
      request_id: requestId,
      next_cursor: nextCursor ?? null,
    },
  };
}

export function errorResponse(code: string, message: string, requestId: string, details?: Record<string, unknown>) {
  return {
    ok: false,
    error: { code, message, details },
    meta: { request_id: requestId },
  };
}
