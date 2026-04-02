import type { D1Database } from '@cloudflare/workers-types';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';

export interface CreatePolicyPackInput {
  tenant_id: string;
  workspace_id?: string;
  name: string;
  version: string;
  policy_json: string;
}

export async function createPolicyPackService(
  db: D1Database,
  input: CreatePolicyPackInput,
  actorId: string,
  requestId: string,
) {
  const existing = await db.prepare(
    'SELECT id FROM policy_packs WHERE tenant_id = ? AND workspace_id = ? AND name = ? AND version = ?'
  ).bind(input.tenant_id, input.workspace_id || null, input.name, input.version).first();

  if (existing) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Policy pack with this name and version already exists');
  }

  const id = `pol_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();
  const checksum = await computeChecksum(input.policy_json);

  await db.prepare(`
    INSERT INTO policy_packs (id, tenant_id, workspace_id, name, version, status, policy_json, checksum, published_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, NULL, ?, ?)
  `).bind(id, input.tenant_id, input.workspace_id || null, input.name, input.version, input.policy_json, checksum, now, now).run();

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: input.tenant_id,
    workspace_id: input.workspace_id || null,
    actor_id: actorId,
    action_type: 'policy_pack.created',
    resource_type: 'policy_pack',
    resource_id: id,
    before_json: null,
    after_json: JSON.stringify({ name: input.name, version: input.version }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));

  return { id, name: input.name, version: input.version, status: 'draft' };
}

export async function publishPolicyPackService(
  db: D1Database,
  policyPackId: string,
  actorId: string,
  requestId: string,
): Promise<void> {
  const pack = await db.prepare('SELECT * FROM policy_packs WHERE id = ?').bind(policyPackId).first();
  if (!pack) {
    throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, 'Policy pack not found');
  }

  const p = pack as any;
  if (p.status !== 'approved') {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Cannot publish policy pack in status: ${p.status}`);
  }

  await db.prepare('UPDATE policy_packs SET status = ?, published_at = ?, updated_at = ? WHERE id = ?')
    .bind('published', new Date().toISOString(), new Date().toISOString(), policyPackId).run();

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: p.tenant_id,
    workspace_id: p.workspace_id,
    actor_id: actorId,
    action_type: 'policy_pack.published',
    resource_type: 'policy_pack',
    resource_id: policyPackId,
    before_json: JSON.stringify({ status: p.status }),
    after_json: JSON.stringify({ status: 'published' }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));
}

async function computeChecksum(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
