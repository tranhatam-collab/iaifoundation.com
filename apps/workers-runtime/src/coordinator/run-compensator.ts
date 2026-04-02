import type { D1Database } from '@cloudflare/workers-types';
import { RUN_STATUS } from '@intent-os/contracts/enums';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';

export interface CompensatorContext {
  db: D1Database;
  runId: string;
  actorId: string;
  requestId: string;
}

export async function compensateRun(ctx: CompensatorContext): Promise<void> {
  const payments = await ctx.db.prepare(
    "SELECT * FROM payment_intents WHERE run_id = ? AND status IN ('captured', 'payout_sent', 'settled')"
  ).bind(ctx.runId).all();

  for (const payment of (payments.results || [])) {
    const p = payment as any;
    await ctx.db.prepare('UPDATE payment_intents SET status = ?, updated_at = ? WHERE id = ?')
      .bind('refunded', new Date().toISOString(), p.id).run();

    await emitAuditEvent(ctx.db, createAuditEvent({
      tenant_id: null,
      workspace_id: null,
      actor_id: ctx.actorId,
      action_type: 'payment.compensated',
      resource_type: 'payment_intent',
      resource_id: p.id,
      before_json: JSON.stringify({ status: p.status }),
      after_json: JSON.stringify({ status: 'refunded' }),
      reason: `Run ${ctx.runId} compensation`,
      request_id: ctx.requestId,
      source_ip: null,
      session_id: null,
    }));
  }

  const commands = await ctx.db.prepare(
    "SELECT * FROM device_commands WHERE run_id = ? AND status = 'completed'"
  ).bind(ctx.runId).all();

  for (const cmd of (commands.results || [])) {
    const c = cmd as any;
    await ctx.db.prepare('UPDATE device_commands SET status = ?, completed_at = NULL WHERE id = ?')
      .bind('compensated', c.id).run();

    await emitAuditEvent(ctx.db, createAuditEvent({
      tenant_id: null,
      workspace_id: null,
      actor_id: ctx.actorId,
      action_type: 'device.command_compensated',
      resource_type: 'device_command',
      resource_id: c.id,
      before_json: JSON.stringify({ status: c.status }),
      after_json: JSON.stringify({ status: 'compensated' }),
      reason: `Run ${ctx.runId} compensation`,
      request_id: ctx.requestId,
      source_ip: null,
      session_id: null,
    }));
  }
}

export async function quarantineRun(ctx: CompensatorContext): Promise<void> {
  const now = new Date().toISOString();

  await ctx.db.prepare('UPDATE runs SET status = ?, ended_at = ?, updated_at = ? WHERE id = ?')
    .bind(RUN_STATUS.QUARANTINED, now, now, ctx.runId).run();

  await emitAuditEvent(ctx.db, createAuditEvent({
    tenant_id: null,
    workspace_id: null,
    actor_id: ctx.actorId,
    action_type: 'run.quarantined',
    resource_type: 'run',
    resource_id: ctx.runId,
    before_json: null,
    after_json: JSON.stringify({ status: RUN_STATUS.QUARANTINED }),
    reason: 'Run quarantined by operator',
    request_id: ctx.requestId,
    source_ip: null,
    session_id: null,
  }));
}
