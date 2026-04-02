import type { MiddlewareHandler } from 'hono';
import type { Env } from '../index.js';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';

const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();

export const rateLimitMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const key = c.req.header('X-Forwarded-For') || c.req.header('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 60;

  const entry = RATE_LIMIT_MAP.get(key);

  if (entry && entry.resetAt > now) {
    if (entry.count >= maxRequests) {
      throw new AppError(ERROR_CODES.RATE_LIMITED, 'Rate limit exceeded', { retry_after: Math.ceil((entry.resetAt - now) / 1000) }, 429);
    }
    entry.count++;
  } else {
    RATE_LIMIT_MAP.set(key, { count: 1, resetAt: now + windowMs });
  }

  c.header('X-RateLimit-Limit', String(maxRequests));
  c.header('X-RateLimit-Remaining', String(maxRequests - (RATE_LIMIT_MAP.get(key)?.count || 0)));

  await next();
};
