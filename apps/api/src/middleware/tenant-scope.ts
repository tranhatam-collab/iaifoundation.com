import type { MiddlewareHandler } from 'hono';
import type { Env } from '../index.js';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';

export const tenantScopeMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: { auth: any } }> = async (c, next) => {
  const auth = c.get('auth');
  const requestedTenantId = c.req.header('X-Tenant-Id');

  if (requestedTenantId && requestedTenantId !== auth.tenantId) {
    throw new AppError(ERROR_CODES.TENANT_SCOPE_MISMATCH, 'Tenant ID does not match token scope');
  }

  await next();
};
