import type { D1Database } from '@cloudflare/workers-types';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';
import { findDeviceById, findDevicesByWorkspace, insertDevice, updateDeviceStatus, insertDeviceCommand } from '@intent-os/db/repositories/devices.repo';

export interface CreateDeviceInput {
  tenant_id: string;
  workspace_id: string;
  gateway_id: string;
  device_type: string;
  device_protocol?: string;
  manufacturer?: string;
  model?: string;
  location_id?: string;
  policy_profile_id?: string;
}

export async function createDeviceService(
  db: D1Database,
  input: CreateDeviceInput,
  actorId: string,
  requestId: string,
) {
  const id = `dev_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();

  await insertDevice(db, {
    id,
    tenant_id: input.tenant_id,
    workspace_id: input.workspace_id,
    gateway_id: input.gateway_id,
    device_type: input.device_type,
    device_protocol: input.device_protocol,
    manufacturer: input.manufacturer,
    model: input.model,
    location_id: input.location_id,
    policy_profile_id: input.policy_profile_id,
    status: 'online',
    created_at: now,
    updated_at: now,
  });

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: input.tenant_id,
    workspace_id: input.workspace_id,
    actor_id: actorId,
    action_type: 'device.created',
    resource_type: 'device',
    resource_id: id,
    before_json: null,
    after_json: JSON.stringify({ type: input.device_type, gateway: input.gateway_id }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));

  return findDeviceById(db, id);
}

export interface SendDeviceCommandInput {
  run_id?: string;
  step_id?: string;
  device_id: string;
  command_type: string;
  payload_json: string;
  issued_by_actor_id: string;
  policy_decision_ref?: string;
  idempotency_key: string;
}

export async function sendDeviceCommandService(
  db: D1Database,
  input: SendDeviceCommandInput,
  requestId: string,
) {
  const device = await findDeviceById(db, input.device_id);
  if (!device) {
    throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, 'Device not found');
  }

  const d = device as any;
  if (d.status === 'quarantined') {
    throw new AppError(ERROR_CODES.DEVICE_QUARANTINED, 'Device is quarantined');
  }

  const id = `cmd_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();

  await insertDeviceCommand(db, {
    id,
    run_id: input.run_id,
    step_id: input.step_id,
    device_id: input.device_id,
    command_type: input.command_type,
    payload_json: input.payload_json,
    issued_by_actor_id: input.issued_by_actor_id,
    policy_decision_ref: input.policy_decision_ref,
    status: 'pending',
    requested_at: now,
    idempotency_key: input.idempotency_key,
  });

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: d.tenant_id,
    workspace_id: d.workspace_id,
    actor_id: input.issued_by_actor_id,
    action_type: 'device.command_sent',
    resource_type: 'device_command',
    resource_id: id,
    before_json: null,
    after_json: JSON.stringify({ device_id: input.device_id, command_type: input.command_type }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));

  return { command_id: id, accepted: true };
}

export async function quarantineDeviceService(
  db: D1Database,
  deviceId: string,
  actorId: string,
  requestId: string,
): Promise<void> {
  const device = await findDeviceById(db, deviceId);
  if (!device) {
    throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, 'Device not found');
  }

  const now = new Date().toISOString();
  await updateDeviceStatus(db, deviceId, 'quarantined', now);

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: (device as any).tenant_id,
    workspace_id: (device as any).workspace_id,
    actor_id: actorId,
    action_type: 'device.quarantined',
    resource_type: 'device',
    resource_id: deviceId,
    before_json: JSON.stringify({ status: (device as any).status }),
    after_json: JSON.stringify({ status: 'quarantined' }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));
}
