import type { D1Database } from '@cloudflare/workers-types';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';

export interface CreateConnectorInput {
  tenant_id: string;
  workspace_id?: string;
  connector_type: string;
  provider: string;
  config_ref: string;
  secret_ref: string;
}

export async function createConnectorService(
  db: D1Database,
  input: CreateConnectorInput,
  actorId: string,
  requestId: string,
) {
  const id = `con_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO connectors (id, tenant_id, workspace_id, connector_type, provider, config_ref, secret_ref, health_status, last_checked_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'unknown', NULL, ?, ?)
  `).bind(id, input.tenant_id, input.workspace_id || null, input.connector_type, input.provider, input.config_ref, input.secret_ref, now, now).run();

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: input.tenant_id,
    workspace_id: input.workspace_id || null,
    actor_id: actorId,
    action_type: 'connector.created',
    resource_type: 'connector',
    resource_id: id,
    before_json: null,
    after_json: JSON.stringify({ type: input.connector_type, provider: input.provider }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));

  return { id, ...input, health_status: 'unknown' };
}

export async function testConnectorService(
  db: D1Database,
  connectorId: string,
): Promise<{ health_status: string; latency_ms: number; quota_status: string; degraded_mode: boolean }> {
  const connector = await db.prepare('SELECT * FROM connectors WHERE id = ?').bind(connectorId).first();
  if (!connector) {
    throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, 'Connector not found');
  }

  // TODO: Implement actual health check against provider
  const result = {
    health_status: 'healthy',
    latency_ms: 120,
    quota_status: 'available',
    degraded_mode: false,
  };

  await db.prepare(`
    UPDATE connectors SET health_status = ?, last_checked_at = ?, updated_at = ? WHERE id = ?
  `).bind(result.health_status, new Date().toISOString(), new Date().toISOString(), connectorId).run();

  return result;
}
