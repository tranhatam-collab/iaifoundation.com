import type { D1Database } from '@cloudflare/workers-types';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';

export interface CreateWorkspaceInput {
  tenant_id: string;
  name: string;
  slug: string;
  workspace_type?: string;
  default_policy_pack_id?: string;
}

export async function createWorkspaceService(
  db: D1Database,
  input: CreateWorkspaceInput,
  actorId: string,
  requestId: string,
) {
  const existing = await db.prepare(
    'SELECT id FROM workspaces WHERE tenant_id = ? AND slug = ?'
  ).bind(input.tenant_id, input.slug).first();

  if (existing) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Workspace slug already exists for this tenant');
  }

  const id = `wrk_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO workspaces (id, tenant_id, name, slug, workspace_type, status, default_policy_pack_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)
  `).bind(id, input.tenant_id, input.name, input.slug, input.workspace_type || null, input.default_policy_pack_id || null, now, now).run();

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: input.tenant_id,
    workspace_id: id,
    actor_id: actorId,
    action_type: 'workspace.created',
    resource_type: 'workspace',
    resource_id: id,
    before_json: null,
    after_json: JSON.stringify(input),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));

  return { id, name: input.name, slug: input.slug, tenant_id: input.tenant_id };
}

export async function listWorkspacesService(
  db: D1Database,
  tenantId: string,
): Promise<any[]> {
  const result = await db.prepare(
    'SELECT * FROM workspaces WHERE tenant_id = ? AND status = ? ORDER BY created_at DESC'
  ).bind(tenantId, 'active').all();
  return result.results || [];
}
