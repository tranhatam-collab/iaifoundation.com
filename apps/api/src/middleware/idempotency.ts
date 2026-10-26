import type { MiddlewareHandler } from 'hono';
import type { Env } from '../index.js';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';

export const idempotencyMiddleware: MiddlewareHandler<{ Bindings: Env }> = (c) => {
  const idempotencyKey = c.req.header('Idempotency-Key');
  throw new AppError(
    ERROR_CODES.IDEMPOTENCY_CONFLICT,
    idempotencyKey
      ? 'Idempotent mutations are not implemented in the public foundation project'
      : 'Idempotency-Key is required and idempotent mutations are not implemented',
    undefined,
    503,
  );
};
