import { describe, expect, test } from 'vitest';
import { loadConfig, isFeatureEnabled } from '../apps/api/src/config/env.js';
import { tenantScopeMiddleware } from '../apps/api/src/middleware/tenant-scope.js';
import { workspaceScopeMiddleware } from '../apps/api/src/middleware/workspace-scope.js';

function fakeContext(auth: unknown, headers: Record<string, string> = {}) {
  const state = new Map<string, unknown>([['auth', auth]]);
  return {
    req: { header: (name: string) => headers[name.toLowerCase()] },
    get: (k: string) => state.get(k),
    set: (k: string, v: unknown) => {
      state.set(k, v);
    },
  };
}

const next = async () => {};

describe('loadConfig', () => {
  test('applies development defaults', () => {
    const cfg = loadConfig({});
    expect(cfg.ENVIRONMENT).toBe('development');
    expect(cfg.LOG_LEVEL).toBe('debug');
    expect(cfg.JWT_SECRET).toBe('dev-secret-change-in-production');
    expect(cfg.JWT_EXPIRY_SECONDS).toBe(3600);
    expect(cfg.RATE_LIMIT_PER_MINUTE).toBe(60);
    expect(cfg.ENABLE_STABLECOIN).toBe(false);
  });

  test('honors explicit overrides', () => {
    const cfg = loadConfig({
      ENVIRONMENT: 'production',
      LOG_LEVEL: 'warn',
      JWT_EXPIRY_SECONDS: '7200',
      ENABLE_STABLECOIN: 'true',
    });
    expect(cfg.ENVIRONMENT).toBe('production');
    expect(cfg.LOG_LEVEL).toBe('warn');
    expect(cfg.JWT_EXPIRY_SECONDS).toBe(7200);
    expect(cfg.ENABLE_STABLECOIN).toBe(true);
  });
});

describe('isFeatureEnabled', () => {
  test('switches on the configured feature flags', () => {
    const cfg = loadConfig({ ENABLE_ADVANCED_DEVICE_GATEWAYS: 'true', ENABLE_AI_ASSIST: 'true' });
    expect(isFeatureEnabled(cfg, 'advanced_device_gateways')).toBe(true);
    expect(isFeatureEnabled(cfg, 'ai_assist')).toBe(true);
    expect(isFeatureEnabled(cfg, 'stablecoin')).toBe(false);
  });
});

describe('tenantScopeMiddleware', () => {
  test('blocks a mismatched tenant header', async () => {
    const c = fakeContext({ tenantId: 't1' }, { 'x-tenant-id': 't2' });
    await expect(tenantScopeMiddleware(c as never, next)).rejects.toMatchObject({
      code: 'TENANT_SCOPE_MISMATCH',
    });
  });

  test('allows a matching tenant header', async () => {
    const c = fakeContext({ tenantId: 't1' }, { 'x-tenant-id': 't1' });
    await expect(tenantScopeMiddleware(c as never, next)).resolves.toBeUndefined();
  });
});

describe('workspaceScopeMiddleware', () => {
  test('blocks a workspace outside the token scope', async () => {
    const c = fakeContext({ workspaceIds: ['ws1'] }, { 'x-workspace-id': 'ws2' });
    await expect(workspaceScopeMiddleware(c as never, next)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  test('allows a workspace inside the token scope', async () => {
    const c = fakeContext({ workspaceIds: ['ws1', 'ws2'] }, { 'x-workspace-id': 'ws2' });
    await expect(workspaceScopeMiddleware(c as never, next)).resolves.toBeUndefined();
  });
});
