import type { D1Database } from '@cloudflare/workers-types';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';

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
