import type { D1Database } from '@cloudflare/workers-types';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';

export interface CreateRoleBindingInput {
  tenant_id: string;
  workspace_id?: string;
  role_id: string;
  user_id?: string;
  agent_id?: string;
  condition_json?: string;
}

export async function createRoleBindingService(
  db: D1Database,
  input: CreateRoleBindingInput,
  actorId: string,
  requestId: string,
) {
  if (!input.user_id && !input.agent_id) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Must provide user_id or agent_id');
  }

  const id = `rb_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO role_bindings (id, tenant_id, workspace_id, user_id, agent_id, role_id, condition_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, input.tenant_id, input.workspace_id || null, input.user_id || null, input.agent_id || null, input.role_id, input.condition_json || null, now, now).run();

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: input.tenant_id,
    workspace_id: input.workspace_id || null,
    actor_id: actorId,
    action_type: 'role_binding.created',
    resource_type: 'role_binding',
    resource_id: id,
    before_json: null,
    after_json: JSON.stringify(input),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));

  return { id, ...input };
}

export async function listRolesService(db: D1Database, tenantId: string, workspaceId?: string): Promise<any[]> {
  let sql = 'SELECT * FROM roles WHERE tenant_id = ? AND status = ?';
  const params: unknown[] = [tenantId, 'active'];

  if (workspaceId) {
    sql += ' AND (workspace_id = ? OR workspace_id IS NULL)';
    params.push(workspaceId);
  }

  sql += ' ORDER BY role_key ASC';
  const result = await db.prepare(sql).bind(...params).all();
  return result.results || [];
}
