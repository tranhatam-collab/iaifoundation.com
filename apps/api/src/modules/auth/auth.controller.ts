import type { Context } from 'hono';
import type { Env } from '../../index.js';
import type { AuthContext } from '../../middleware/auth.js';
import { loginService, logoutService, registerService, requestMagicLinkService, verifyMagicLinkService } from './auth.service.js';
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

export async function handleRegister(c: Context<{ Bindings: Env; Variables: { auth: AuthContext; requestId: string } }>) {
  const body = await c.req.json();
  const requestId = c.get('requestId') || '';

  try {
    const result = await registerService(c.env.DB, body, requestId);
    return c.json(okResponse(result, requestId), 201);
  } catch (err) {
    if (err instanceof AppError) {
      return c.json(errorResponse(err.code, err.message, requestId, err.details), err.httpStatus as any);
    }
    return c.json(errorResponse('INTERNAL_ERROR', 'Registration failed', requestId), 500);
  }
}

export async function handleMagicLinkRequest(c: Context<{ Bindings: Env; Variables: { auth: AuthContext; requestId: string } }>) {
  const body = await c.req.json();
  const requestId = c.get('requestId') || '';

  try {
    const result = await requestMagicLinkService(c.env.DB, c.env, body.email, requestId);
    return c.json(okResponse(result, requestId), 200);
  } catch (err) {
    if (err instanceof AppError) {
      return c.json(errorResponse(err.code, err.message, requestId, err.details), err.httpStatus as any);
    }
    return c.json(errorResponse('INTERNAL_ERROR', 'Magic link request failed', requestId), 500);
  }
}

export async function handleMagicLinkVerify(c: Context<{ Bindings: Env; Variables: { auth: AuthContext; requestId: string } }>) {
  const token = c.req.query('token') || '';
  const email = c.req.query('email') || '';
  const requestId = c.get('requestId') || '';

  try {
    const result = await verifyMagicLinkService(c.env.DB, token, email, requestId);
    return c.json(okResponse(result, requestId), 200);
  } catch (err) {
    if (err instanceof AppError) {
      return c.json(errorResponse(err.code, err.message, requestId, err.details), err.httpStatus as any);
    }
    return c.json(errorResponse('INTERNAL_ERROR', 'Magic link verification failed', requestId), 500);
  }
}
