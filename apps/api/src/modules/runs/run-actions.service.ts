import type { D1Database } from '@cloudflare/workers-types';
import { RUN_STATUS } from '@intent-os/contracts/enums';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';

export async function cancelRunService(
  db: D1Database,
  runId: string,
  actorId: string,
  requestId: string,
  reason: string,
): Promise<void> {
  const run = await db.prepare('SELECT * FROM runs WHERE id = ?').bind(runId).first();
  if (!run) {
    throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, 'Run not found');
  }

  const r = run as any;
  const terminalStates = [RUN_STATUS.SUCCEEDED, RUN_STATUS.FAILED, RUN_STATUS.CANCELLED, RUN_STATUS.QUARANTINED];
  if (terminalStates.includes(r.status)) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Cannot cancel run in terminal state: ${r.status}`);
  }

  const now = new Date().toISOString();
  await db.prepare('UPDATE runs SET status = ?, ended_at = ?, updated_at = ? WHERE id = ?')
    .bind(RUN_STATUS.CANCELLED, now, now, runId).run();

  await db.prepare(`
    INSERT INTO run_events (id, run_id, step_id, event_type, payload_ref, event_time, sequence_no)
    VALUES (?, ?, NULL, 'run.cancelled', ?, ?, COALESCE((SELECT MAX(sequence_no) FROM run_events WHERE run_id = ?), 0) + 1)
  `).bind(`evt_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`, runId, JSON.stringify({ reason }), now, runId).run();

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: r.tenant_id,
    workspace_id: r.workspace_id,
    actor_id: actorId,
    action_type: 'run.cancelled',
    resource_type: 'run',
    resource_id: runId,
    before_json: JSON.stringify({ status: r.status }),
    after_json: JSON.stringify({ status: RUN_STATUS.CANCELLED, reason }),
    reason,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));
}

export async function retryRunService(
  db: D1Database,
  runId: string,
  actorId: string,
  requestId: string,
): Promise<void> {
  const run = await db.prepare('SELECT * FROM runs WHERE id = ?').bind(runId).first();
  if (!run) {
    throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, 'Run not found');
  }

  const r = run as any;
  if (r.status !== RUN_STATUS.FAILED) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Can only retry failed runs. Current status: ${r.status}`);
  }

  const now = new Date().toISOString();
  await db.prepare('UPDATE runs SET status = ?, ended_at = NULL, updated_at = ? WHERE id = ?')
    .bind(RUN_STATUS.RUNNING, now, runId).run();

  await db.prepare(`
    INSERT INTO run_events (id, run_id, step_id, event_type, payload_ref, event_time, sequence_no)
    VALUES (?, ?, NULL, 'run.retried', NULL, ?, COALESCE((SELECT MAX(sequence_no) FROM run_events WHERE run_id = ?), 0) + 1)
  `).bind(`evt_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`, runId, now, runId).run();

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: r.tenant_id,
    workspace_id: r.workspace_id,
    actor_id: actorId,
    action_type: 'run.retried',
    resource_type: 'run',
    resource_id: runId,
    before_json: JSON.stringify({ status: r.status }),
    after_json: JSON.stringify({ status: RUN_STATUS.RUNNING }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));
}
