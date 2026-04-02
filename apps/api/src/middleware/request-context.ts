import type { MiddlewareHandler } from 'hono';
import type { Env } from '../index.js';

export const requestContextMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: { requestId: string; startTime: number } }> = async (c, next) => {
  c.set('requestId', c.req.header('X-Request-Id') || crypto.randomUUID());
  c.set('startTime', Date.now());

  await next();

  const duration = Date.now() - (c.get('startTime') || 0);
  c.header('X-Request-Id', c.get('requestId'));
  c.header('X-Response-Time', `${duration}ms`);
};
