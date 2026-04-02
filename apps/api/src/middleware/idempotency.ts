import type { MiddlewareHandler } from 'hono';
import type { Env } from '../index.js';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';

export const idempotencyMiddleware: MiddlewareHandler<{ Bindings: Env }> = (c, next) => {
  const idempotencyKey = c.req.header('Idempotency-Key');
  if (!idempotencyKey) return next();

  // TODO: Check if idempotency key already processed
  // For MVP, just pass through
  return next();
};
