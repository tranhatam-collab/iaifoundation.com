import type { D1Database } from '@cloudflare/workers-types';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';

export interface CreateGatewayInput {
  tenant_id: string;
  workspace_id: string;
  gateway_type: string;
  provider: string;
  location_id?: string;
  auth_mode: string;
  config_ref?: string;
}

export async function createGatewayService(
  db: D1Database,
  input: CreateGatewayInput,
  actorId: string,
  requestId: string,
) {
  const id = `gtw_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO gateways (id, tenant_id, workspace_id, gateway_type, provider, location_id, status, health_status, auth_mode, config_ref, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', 'unknown', ?, ?, ?, ?)
  `).bind(id, input.tenant_id, input.workspace_id, input.gateway_type, input.provider, input.location_id || null, input.auth_mode, input.config_ref || null, now, now).run();

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: input.tenant_id,
    workspace_id: input.workspace_id,
    actor_id: actorId,
    action_type: 'gateway.created',
    resource_type: 'gateway',
    resource_id: id,
    before_json: null,
    after_json: JSON.stringify({ type: input.gateway_type, provider: input.provider }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));

  return { id, ...input, status: 'active', health_status: 'unknown' };
}

export async function testGatewayService(db: D1Database, gatewayId: string): Promise<{ health_status: string; latency_ms: number }> {
  const gateway = await db.prepare('SELECT * FROM gateways WHERE id = ?').bind(gatewayId).first();
  if (!gateway) {
    throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, 'Gateway not found');
  }

  // TODO: Implement actual gateway health check
  return { health_status: 'healthy', latency_ms: 45 };
}
