import type { D1Database } from '@cloudflare/workers-types';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';

export async function approveRunService(
  db: D1Database,
  runId: string,
  approvalId: string,
  actorId: string,
  requestId: string,
  reason: string,
): Promise<void> {
  const approval = await db.prepare('SELECT * FROM approval_requests WHERE id = ? AND run_id = ?').bind(approvalId, runId).first();
  if (!approval) {
    throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, 'Approval request not found');
  }

  const a = approval as any;
  if (a.status !== 'pending') {
    throw new AppError(ERROR_CODES.APPROVAL_ALREADY_DECIDED, `Approval already ${a.status}`);
  }

  await db.prepare(`
    UPDATE approval_requests SET status = ?, decided_at = ?, reason = ? WHERE id = ? AND status = 'pending'
  `).bind('approved', new Date().toISOString(), reason, approvalId).run();

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: null,
    workspace_id: null,
    actor_id: actorId,
    action_type: 'approval.approved',
    resource_type: 'approval_request',
    resource_id: approvalId,
    before_json: JSON.stringify({ status: 'pending' }),
    after_json: JSON.stringify({ status: 'approved', reason }),
    reason,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));
}

export async function rejectRunService(
  db: D1Database,
  runId: string,
  approvalId: string,
  actorId: string,
  requestId: string,
  reason: string,
): Promise<void> {
  const approval = await db.prepare('SELECT * FROM approval_requests WHERE id = ? AND run_id = ?').bind(approvalId, runId).first();
  if (!approval) {
    throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, 'Approval request not found');
  }

  const a = approval as any;
  if (a.status !== 'pending') {
    throw new AppError(ERROR_CODES.APPROVAL_ALREADY_DECIDED, `Approval already ${a.status}`);
  }

  await db.prepare(`
    UPDATE approval_requests SET status = ?, decided_at = ?, reason = ? WHERE id = ? AND status = 'pending'
  `).bind('rejected', new Date().toISOString(), reason, approvalId).run();

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: null,
    workspace_id: null,
    actor_id: actorId,
    action_type: 'approval.rejected',
    resource_type: 'approval_request',
    resource_id: approvalId,
    before_json: JSON.stringify({ status: 'pending' }),
    after_json: JSON.stringify({ status: 'rejected', reason }),
    reason,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));
}

export async function listApprovalsService(db: D1Database, runId?: string, status?: string): Promise<any[]> {
  let sql = 'SELECT * FROM approval_requests WHERE 1=1';
  const params: unknown[] = [];

  if (runId) {
    sql += ' AND run_id = ?';
    params.push(runId);
  }

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY requested_at DESC';
  const result = await db.prepare(sql).bind(...params).all();
  return result.results || [];
}
