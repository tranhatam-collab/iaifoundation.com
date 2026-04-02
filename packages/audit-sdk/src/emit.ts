import type { D1Database } from '@cloudflare/workers-types';

export interface AuditEventInput {
  id: string;
  tenant_id: string | null;
  workspace_id: string | null;
  actor_id: string | null;
  action_type: string;
  resource_type: string;
  resource_id: string | null;
  before_json: string | null;
  after_json: string | null;
  reason: string | null;
  request_id: string | null;
  source_ip: string | null;
  session_id: string | null;
  created_at: string;
}

export async function emitAuditEvent(db: D1Database, event: AuditEventInput): Promise<void> {
  await db.prepare(`
    INSERT INTO audit_events (id, tenant_id, workspace_id, actor_id, action_type, resource_type, resource_id, before_json, after_json, reason, request_id, source_ip, session_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    event.id,
    event.tenant_id,
    event.workspace_id,
    event.actor_id,
    event.action_type,
    event.resource_type,
    event.resource_id,
    event.before_json,
    event.after_json,
    event.reason,
    event.request_id,
    event.source_ip,
    event.session_id,
    event.created_at,
  ).run();
}

export function createAuditEvent(input: Omit<AuditEventInput, 'id' | 'created_at'>): AuditEventInput {
  return {
    ...input,
    id: `aud_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
    created_at: new Date().toISOString(),
  };
}
