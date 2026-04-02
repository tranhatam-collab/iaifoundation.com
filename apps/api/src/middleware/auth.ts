import type { Context, MiddlewareHandler } from 'hono';
import type { Env } from '../index.js';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';

export interface AuthContext {
  userId: string;
  tenantId: string;
  workspaceIds: string[];
  roles: string[];
  isServiceToken: boolean;
}

export const authMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: { auth: AuthContext } }> = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Missing or invalid authorization header', undefined, 401);
  }

  const token = authHeader.slice(7);

  // TODO: Implement JWT verification with Cloudflare Access or custom JWT
  // For MVP skeleton, parse minimal claims from token
  const auth: AuthContext = {
    userId: 'usr_placeholder',
    tenantId: c.req.header('X-Tenant-Id') || '',
    workspaceIds: c.req.header('X-Workspace-Id') ? [c.req.header('X-Workspace-Id')!] : [],
    roles: [],
    isServiceToken: false,
  };

  if (!auth.tenantId) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, 'X-Tenant-Id header required', undefined, 401);
  }

  c.set('auth', auth);
  await next();
};
