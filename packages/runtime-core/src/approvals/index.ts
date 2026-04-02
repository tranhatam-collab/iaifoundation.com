import type { D1Database } from '@cloudflare/workers-types';

export interface ApprovalCoordinatorContext {
  db: D1Database;
  runId: string;
  stepId: string;
}

export async function requestApproval(
  ctx: ApprovalCoordinatorContext,
  approverActorId: string,
  expiresAt: string,
): Promise<string> {
  const id = `apr_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();

  await ctx.db.prepare(`
    INSERT INTO approval_requests (id, run_id, step_id, approver_actor_id, approver_group_id, status, requested_at, expires_at, decided_at, reason, signature_ref)
    VALUES (?, ?, ?, ?, NULL, 'pending', ?, ?, NULL, NULL, NULL)
  `).bind(id, ctx.runId, ctx.stepId, approverActorId, now, expiresAt).run();

  return id;
}

export async function decideApproval(
  ctx: ApprovalCoordinatorContext,
  approvalId: string,
  decision: 'approved' | 'rejected',
  reason: string,
): Promise<void> {
  const now = new Date().toISOString();

  await ctx.db.prepare(`
    UPDATE approval_requests SET status = ?, decided_at = ?, reason = ? WHERE id = ? AND status = 'pending'
  `).bind(decision, now, reason, approvalId).run();
}

export async function getPendingApprovals(db: D1Database, runId: string): Promise<any[]> {
  const result = await db.prepare(
    "SELECT * FROM approval_requests WHERE run_id = ? AND status = 'pending' ORDER BY requested_at ASC"
  ).bind(runId).all();
  return result.results || [];
}
