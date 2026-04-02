import type { MiddlewareHandler } from 'hono';
import type { Env } from '../index.js';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';

export const workspaceScopeMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: { auth: any } }> = async (c, next) => {
  const auth = c.get('auth');
  const requestedWorkspaceId = c.req.header('X-Workspace-Id');

  if (requestedWorkspaceId && !auth.workspaceIds.includes(requestedWorkspaceId)) {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'Workspace not accessible');
  }

  await next();
};
