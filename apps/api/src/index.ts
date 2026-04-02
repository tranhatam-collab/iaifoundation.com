import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';

export interface Env {
  DB: D1Database;
  ARTIFACTS: R2Bucket;
  ENVIRONMENT: string;
  LOG_LEVEL: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', requestId());
app.use('*', cors({
  origin: ['https://iaifoundation.com'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Tenant-Id', 'X-Workspace-Id', 'Idempotency-Key'],
  maxAge: 86400,
}));

app.get('/health', (c) => c.json({ ok: true, timestamp: new Date().toISOString() }));

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({
      ok: false,
      error: { code: err.code, message: err.message, details: err.details },
      meta: { request_id: c.get('requestId') || '' },
    }, err.httpStatus as any);
  }

  console.error('Unhandled error:', err);
  return c.json({
    ok: false,
    error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Internal server error' },
    meta: { request_id: c.get('requestId') || '' },
  }, 500);
});

app.notFound((c) => c.json({
  ok: false,
  error: { code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'Resource not found' },
  meta: { request_id: c.get('requestId') || '' },
}, 404));

import v1 from './routes/v1.js';

app.route('/v1', v1);

export default app;
