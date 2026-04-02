import type { D1Database } from '@cloudflare/workers-types';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';

export interface CreateUserInput {
  tenant_id: string;
  primary_email: string;
  display_name?: string;
  auth_subject: string;
}

export async function createUserService(
  db: D1Database,
  input: CreateUserInput,
  actorId: string,
  requestId: string,
) {
  const existing = await db.prepare(
    'SELECT id FROM users WHERE tenant_id = ? AND primary_email = ?'
  ).bind(input.tenant_id, input.primary_email).first();

  if (existing) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'User email already exists for this tenant');
  }

  const id = `usr_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO users (id, tenant_id, primary_email, display_name, auth_subject, status, last_active_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'active', NULL, ?, ?)
  `).bind(id, input.tenant_id, input.primary_email, input.display_name || null, input.auth_subject, now, now).run();

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: input.tenant_id,
    workspace_id: null,
    actor_id: actorId,
    action_type: 'user.created',
    resource_type: 'user',
    resource_id: id,
    before_json: null,
    after_json: JSON.stringify({ email: input.primary_email, display_name: input.display_name }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));

  return { id, primary_email: input.primary_email, display_name: input.display_name, status: 'active' };
}

export async function updateUserService(
  db: D1Database,
  userId: string,
  updates: { display_name?: string; status?: string },
  actorId: string,
  requestId: string,
) {
  const existing = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  if (!existing) {
    throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, 'User not found');
  }

  const e = existing as any;
  const now = new Date().toISOString();
  const setClauses: string[] = [];
  const params: unknown[] = [];

  if (updates.display_name !== undefined) {
    setClauses.push('display_name = ?');
    params.push(updates.display_name);
  }

  if (updates.status !== undefined) {
    setClauses.push('status = ?');
    params.push(updates.status);
  }

  if (setClauses.length === 0) return { id: userId, ...updates };

  setClauses.push('updated_at = ?');
  params.push(now);
  params.push(userId);

  await db.prepare(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`).bind(...params).run();

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: e.tenant_id,
    workspace_id: null,
    actor_id: actorId,
    action_type: 'user.updated',
    resource_type: 'user',
    resource_id: userId,
    before_json: JSON.stringify({ display_name: e.display_name, status: e.status }),
    after_json: JSON.stringify(updates),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));

  return { id: userId, ...updates };
}
