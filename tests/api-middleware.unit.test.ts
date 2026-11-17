import { describe, expect, test } from 'vitest';
import { authMiddleware } from '../apps/api/src/middleware/auth.js';
import { requestContextMiddleware } from '../apps/api/src/middleware/request-context.js';
import { rateLimitMiddleware } from '../apps/api/src/middleware/rate-limit.js';

function fakeContext(headers: Record<string, string> = {}, env: Record<string, unknown> = {}) {
  const state = new Map<string, unknown>();
  const responseHeaders = new Map<string, string>();
  return {
    req: { header: (name: string) => headers[name.toLowerCase()] },
    env,
    set: (k: string, v: unknown) => {
      state.set(k, v);
    },
    get: (k: string) => state.get(k),
    header: (k: string, v: string) => {
      responseHeaders.set(k, v);
    },
    _state: state,
    _headers: responseHeaders,
  };
}

const next = async () => {};

describe('authMiddleware', () => {
  test('rejects a missing authorization header', async () => {
    const c = fakeContext(
      { 'x-tenant-id': 't1' },
      { ENVIRONMENT: 'development', DEV_BEARER_TOKEN: 'tok' },
    );
    await expect(authMiddleware(c as never, next)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      httpStatus: 401,
    });
  });

  test('rejects when the runtime is not in development', async () => {
    const c = fakeContext(
      { authorization: 'Bearer tok', 'x-tenant-id': 't1' },
      { ENVIRONMENT: 'production' },
    );
    await expect(authMiddleware(c as never, next)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      httpStatus: 401,
    });
  });

  test('rejects a wrong bearer token', async () => {
    const c = fakeContext(
      { authorization: 'Bearer wrong', 'x-tenant-id': 't1' },
      { ENVIRONMENT: 'development', DEV_BEARER_TOKEN: 'tok' },
    );
    await expect(authMiddleware(c as never, next)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      httpStatus: 401,
    });
  });

  test('requires the X-Tenant-Id header', async () => {
    const c = fakeContext(
      { authorization: 'Bearer tok' },
      { ENVIRONMENT: 'development', DEV_BEARER_TOKEN: 'tok' },
    );
    await expect(authMiddleware(c as never, next)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      httpStatus: 401,
    });
  });

  test('sets the auth context on success', async () => {
    const c = fakeContext(
      { authorization: 'Bearer tok', 'x-tenant-id': 't1', 'x-workspace-id': 'ws1' },
      { ENVIRONMENT: 'development', DEV_BEARER_TOKEN: 'tok' },
    );
    await authMiddleware(c as never, next);
    const auth = c._state.get('auth') as { userId: string; tenantId: string; workspaceIds: string[] };
    expect(auth.userId).toBe('usr_local_development');
    expect(auth.tenantId).toBe('t1');
    expect(auth.workspaceIds).toEqual(['ws1']);
  });
});

describe('requestContextMiddleware', () => {
  test('sets request id and response timing headers', async () => {
    const c = fakeContext({ 'x-request-id': 'req_123' }, {});
    await requestContextMiddleware(c as never, next);
    expect(c._state.get('requestId')).toBe('req_123');
    expect(c._headers.get('X-Request-Id')).toBe('req_123');
    expect(c._headers.get('X-Response-Time')).toMatch(/^\d+ms$/);
  });

  test('generates a request id when the header is absent', async () => {
    const c = fakeContext({}, {});
    await requestContextMiddleware(c as never, next);
    expect(c._state.get('requestId')).toBeTruthy();
  });
});

describe('rateLimitMiddleware', () => {
  test('adds rate limit headers and permits requests under the limit', async () => {
    const c = fakeContext({ 'cf-connecting-ip': `10.0.0.${Math.floor(Math.random() * 1_000_000)}` }, {});
    await rateLimitMiddleware(c as never, next);
    expect(c._headers.get('X-RateLimit-Limit')).toBe('60');
    expect(c._headers.get('X-RateLimit-Remaining')).toBe('59');
  });

  test('rejects once the limit is exceeded', async () => {
    const ip = `10.1.0.${Math.floor(Math.random() * 1_000_000)}`;
    let lastError: unknown = null;
    for (let i = 0; i < 61; i++) {
      const c = fakeContext({ 'cf-connecting-ip': ip }, {});
      try {
        await rateLimitMiddleware(c as never, next);
      } catch (error) {
        lastError = error;
        break;
      }
    }
    expect(lastError).toMatchObject({ code: 'RATE_LIMITED', httpStatus: 429 });
  });
});
