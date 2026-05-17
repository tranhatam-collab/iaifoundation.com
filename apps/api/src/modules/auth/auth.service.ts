import type { D1Database } from '@cloudflare/workers-types';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';
import type { Env } from '../../index.js';
import { sendEmail } from '../../common/email.js';

export interface LoginInput {
  email: string;
  password_or_assertion: string;
}

export interface LoginResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  tenant_id: string;
  workspace_ids: string[];
}

export async function loginService(
  db: D1Database,
  input: LoginInput,
  requestId: string,
): Promise<LoginResult> {
  const user = await db.prepare(
    'SELECT * FROM users WHERE primary_email = ? AND status = ?'
  ).bind(input.email, 'active').first();

  if (!user) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Invalid credentials');
  }

  // TODO: Implement actual password/assertion verification
  // TODO: Generate JWT token with proper claims

  const workspaces = await db.prepare(
    'SELECT workspace_id FROM role_bindings WHERE user_id = ? AND workspace_id IS NOT NULL'
  ).bind((user as any).id).all();

  const workspaceIds = (workspaces.results || []).map((w: any) => w.workspace_id);

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: (user as any).tenant_id,
    workspace_id: null,
    actor_id: (user as any).id,
    action_type: 'auth.login',
    resource_type: 'user',
    resource_id: (user as any).id,
    before_json: null,
    after_json: JSON.stringify({ email: input.email }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));

  return {
    access_token: `jwt_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
    refresh_token: `rt_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
    expires_in: 3600,
    tenant_id: (user as any).tenant_id,
    workspace_ids: workspaceIds,
  };
}

export async function logoutService(
  db: D1Database,
  userId: string,
  requestId: string,
): Promise<void> {
  await emitAuditEvent(db, createAuditEvent({
    tenant_id: null,
    workspace_id: null,
    actor_id: userId,
    action_type: 'auth.logout',
    resource_type: 'user',
    resource_id: userId,
    before_json: null,
    after_json: null,
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));
}

// ── Registration ────────────────────────────────────────────────────────────

export interface RegisterInput {
  email: string;
  full_name: string;
  password: string;
  phone?: string;
  organization?: string;
  country?: string;
  role?: string;
}

async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.randomUUID().replace(/-/g, '');
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return { hash, salt };
}

export interface RegisterResult {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
}

export async function registerService(
  db: D1Database,
  input: RegisterInput,
  requestId: string,
): Promise<RegisterResult> {
  if (!input.email || !input.full_name || !input.password) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'email, full_name, and password are required');
  }
  if (input.password.length < 8) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'password must be at least 8 characters');
  }

  const existing = await db.prepare(
    'SELECT id FROM users WHERE primary_email = ?'
  ).bind(input.email).first();

  if (existing) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Email already registered');
  }

  const id = `usr_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const { hash, salt } = await hashPassword(input.password);
  const now = new Date().toISOString();
  const role = input.role || 'donor';

  // Provision a system tenant for this user (one-to-one for foundation donors)
  const tenantId = `tnt_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  await db.prepare(`
    INSERT INTO tenants (id, type, name, slug, owner_user_id, status, created_at, updated_at)
    VALUES (?, 'person', ?, ?, ?, 'active', ?, ?)
  `).bind(tenantId, input.full_name, id, id, now, now).run();

  await db.prepare(`
    INSERT INTO users (id, tenant_id, primary_email, display_name, auth_subject, status,
      password_hash, password_salt, full_name, role, phone, organization, country,
      is_verified, last_active_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)
  `).bind(
    id, tenantId, input.email, input.full_name, `email:${input.email}`,
    hash, salt, input.full_name, role,
    input.phone ?? null, input.organization ?? null, input.country ?? null,
    now, now,
  ).run();

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: tenantId,
    workspace_id: null,
    actor_id: id,
    action_type: 'auth.register',
    resource_type: 'user',
    resource_id: id,
    before_json: null,
    after_json: JSON.stringify({ email: input.email, full_name: input.full_name, role }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));

  return { user_id: id, email: input.email, full_name: input.full_name, role };
}

// ── Magic Link ───────────────────────────────────────────────────────────────

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function requestMagicLinkService(
  db: D1Database,
  env: Env,
  email: string,
  requestId: string,
): Promise<{ sent: boolean }> {
  if (!email) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'email is required');
  }

  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const tokenHash = await hashToken(token);
  const id = `ml_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min TTL
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO magic_link_tokens (id, email, token_hash, expires_at, used, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
  `).bind(id, email, tokenHash, expiresAt, now).run();

  const magicUrl = `https://iaifoundation.com/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;

  await sendEmail(env, {
    to: email,
    subject: 'Your IAI Foundation sign-in link',
    text: `Click this link to sign in (expires in 15 minutes):\n\n${magicUrl}\n\nIf you did not request this, ignore this email.`,
    html: `<p>Click the link below to sign in to IAI Foundation (expires in 15 minutes):</p>
<p><a href="${magicUrl}">Sign in to IAI Foundation</a></p>
<p>If you did not request this, ignore this email.</p>`,
    idempotencyKey: `magic-link-${id}`,
  });

  return { sent: true };
}

export async function verifyMagicLinkService(
  db: D1Database,
  token: string,
  email: string,
  requestId: string,
): Promise<{ access_token: string; user_id: string; email: string }> {
  if (!token || !email) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'token and email are required');
  }

  const tokenHash = await hashToken(token);
  const now = new Date().toISOString();

  const record = await db.prepare(`
    SELECT * FROM magic_link_tokens
    WHERE token_hash = ? AND email = ? AND used = 0 AND expires_at > ?
  `).bind(tokenHash, email, now).first();

  if (!record) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Invalid or expired magic link');
  }

  // Mark token as used
  await db.prepare('UPDATE magic_link_tokens SET used = 1 WHERE id = ?')
    .bind((record as any).id).run();

  // Get or create user
  let user = await db.prepare(
    'SELECT * FROM users WHERE primary_email = ?'
  ).bind(email).first();

  if (!user) {
    // Auto-register with magic link
    const userId = `usr_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const tenantId = `tnt_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const displayName = email.split('@')[0];
    const ts = new Date().toISOString();

    await db.prepare(`
      INSERT INTO tenants (id, type, name, slug, owner_user_id, status, created_at, updated_at)
      VALUES (?, 'person', ?, ?, ?, 'active', ?, ?)
    `).bind(tenantId, displayName, userId, userId, ts, ts).run();

    await db.prepare(`
      INSERT INTO users (id, tenant_id, primary_email, display_name, auth_subject, status,
        full_name, role, is_verified, last_active_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, 'donor', 1, NULL, ?, ?)
    `).bind(userId, tenantId, email, displayName, `email:${email}`, displayName, ts, ts).run();

    user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  } else {
    // Mark verified
    await db.prepare('UPDATE users SET is_verified = 1 WHERE id = ?')
      .bind((user as any).id).run();
  }

  // Create session
  const sessionId = `ses_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  await db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).bind(sessionId, (user as any).id, sessionExpiry, now).run();

  const accessToken = `ml_${sessionId}_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: (user as any).tenant_id,
    workspace_id: null,
    actor_id: (user as any).id,
    action_type: 'auth.magic_link_verify',
    resource_type: 'user',
    resource_id: (user as any).id,
    before_json: null,
    after_json: JSON.stringify({ email }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: sessionId,
  }));

  return {
    access_token: accessToken,
    user_id: (user as any).id,
    email: (user as any).primary_email,
  };
}
