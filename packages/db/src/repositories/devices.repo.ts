import type { D1Database } from '@cloudflare/workers-types';
import { queryOne, queryMany, queryRun } from '../client.js';

export interface DeviceRow {
  id: string;
  tenant_id: string;
  workspace_id: string;
  gateway_id: string;
  device_type: string;
  device_protocol: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_hash: string | null;
  capability_profile_id: string | null;
  location_id: string | null;
  policy_profile_id: string | null;
  status: string;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function findDeviceById(db: D1Database, id: string): Promise<DeviceRow | null> {
  return queryOne<DeviceRow>(db, 'SELECT * FROM devices WHERE id = ?', [id]);
}

export async function findDevicesByWorkspace(db: D1Database, workspaceId: string, status?: string): Promise<DeviceRow[]> {
  let sql = 'SELECT * FROM devices WHERE workspace_id = ?';
  const params: unknown[] = [workspaceId];
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY last_seen_at DESC';
  return queryMany<DeviceRow>(db, sql, params);
}

export async function insertDevice(db: D1Database, device: {
  id: string;
  tenant_id: string;
  workspace_id: string;
  gateway_id: string;
  device_type: string;
  device_protocol?: string;
  manufacturer?: string;
  model?: string;
  serial_hash?: string;
  capability_profile_id?: string;
  location_id?: string;
  policy_profile_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}): Promise<D1Result> {
  return queryRun(db, `
    INSERT INTO devices (id, tenant_id, workspace_id, gateway_id, device_type, device_protocol, manufacturer, model, serial_hash, capability_profile_id, location_id, policy_profile_id, status, last_seen_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
  `, [device.id, device.tenant_id, device.workspace_id, device.gateway_id, device.device_type, device.device_protocol || null, device.manufacturer || null, device.model || null, device.serial_hash || null, device.capability_profile_id || null, device.location_id || null, device.policy_profile_id || null, device.status, device.created_at, device.updated_at]);
}

export async function updateDeviceStatus(db: D1Database, id: string, status: string, updated_at: string): Promise<D1Result> {
  return queryRun(db, 'UPDATE devices SET status = ?, updated_at = ? WHERE id = ?', [status, updated_at, id]);
}

export async function insertDeviceCommand(db: D1Database, cmd: {
  id: string;
  run_id?: string;
  step_id?: string;
  device_id: string;
  command_type: string;
  payload_json: string;
  issued_by_actor_id: string;
  policy_decision_ref?: string;
  status: string;
  requested_at: string;
  idempotency_key: string;
}): Promise<D1Result> {
  return queryRun(db, `
    INSERT INTO device_commands (id, run_id, step_id, device_id, command_type, payload_json, issued_by_actor_id, policy_decision_ref, status, requested_at, acknowledged_at, completed_at, idempotency_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)
  `, [cmd.id, cmd.run_id || null, cmd.step_id || null, cmd.device_id, cmd.command_type, cmd.payload_json, cmd.issued_by_actor_id, cmd.policy_decision_ref || null, cmd.status, cmd.requested_at, cmd.idempotency_key]);
}

export async function insertDeviceEvent(db: D1Database, event: {
  id: string;
  device_id: string;
  gateway_id: string;
  event_type: string;
  raw_payload_ref?: string;
  normalized_payload_json?: string;
  event_time: string;
  trust_score?: number;
  ingested_at: string;
  dedupe_key?: string;
}): Promise<D1Result> {
  return queryRun(db, `
    INSERT INTO device_events (id, device_id, gateway_id, event_type, raw_payload_ref, normalized_payload_json, event_time, trust_score, ingested_at, dedupe_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [event.id, event.device_id, event.gateway_id, event.event_type, event.raw_payload_ref || null, event.normalized_payload_json || null, event.event_time, event.trust_score || null, event.ingested_at, event.dedupe_key || null]);
}
