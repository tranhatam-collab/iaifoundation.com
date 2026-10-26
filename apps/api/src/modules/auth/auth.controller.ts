import type { Context } from 'hono';
import type { Env } from '../../index.js';
import type { AuthContext } from '../../middleware/auth.js';
import { loginService, logoutService } from './auth.service.js';
import { okResponse, errorResponse } from '../../common/response/envelope.js';
import { AppError } from '@intent-os/contracts/api';

export async function handleLogin(c: Context<{ Bindings: Env; Variables: { auth: AuthContext; requestId: string } }>) {
  const body = await c.req.json();
  const requestId = c.get('requestId') || '';

  try {
    const result = await loginService(c.env.DB, body, requestId);
    return c.json(okResponse(result, requestId), 200);
  } catch (err) {
    if (err instanceof AppError) {
      return c.json(errorResponse(err.code, err.message, requestId, err.details), err.httpStatus as any);
    }
    return c.json(errorResponse('INTERNAL_ERROR', 'Login failed', requestId), 500);
  }
}

export async function handleLogout(c: Context<{ Bindings: Env; Variables: { auth: AuthContext; requestId: string } }>) {
  const auth = c.get('auth');
  const requestId = c.get('requestId') || '';

  try {
    await logoutService(c.env.DB, auth.userId, requestId);
    return c.json(okResponse({ message: 'Logged out' }, requestId));
  } catch (err) {
    if (err instanceof AppError) {
      return c.json(errorResponse(err.code, err.message, requestId, err.details), err.httpStatus as any);
    }
    return c.json(errorResponse('INTERNAL_ERROR', 'Logout failed', requestId), 500);
  }
}

export async function handleGetMe(c: Context<{ Bindings: Env; Variables: { auth: AuthContext; requestId: string } }>) {
  const auth = c.get('auth');
  const requestId = c.get('requestId') || '';
  return c.json(okResponse(auth, requestId));
}
