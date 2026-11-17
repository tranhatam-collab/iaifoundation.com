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
  const developmentToken = c.env.DEV_BEARER_TOKEN;
  if (c.env.ENVIRONMENT !== 'development' || !developmentToken) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Runtime authentication is unavailable', undefined, 401);
  }
  if (!timingSafeEqual(token, developmentToken)) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Invalid development token', undefined, 401);
  }

  const auth: AuthContext = {
    userId: 'usr_local_development',
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

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}
