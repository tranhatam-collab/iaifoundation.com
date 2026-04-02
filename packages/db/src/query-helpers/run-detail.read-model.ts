import type { D1Database } from '@cloudflare/workers-types';

export async function getRunDetailReadModel(db: D1Database, runId: string): Promise<any> {
  const run = await db.prepare('SELECT * FROM runs WHERE id = ?').bind(runId).first();
  if (!run) return null;

  const r = run as any;

  const [template, steps, approvals, payments, proofs, deviceCommands] = await Promise.all([
    r.template_id ? db.prepare('SELECT id, name, version FROM intent_templates WHERE id = ?').bind(r.template_id).first() : Promise.resolve(null),
    db.prepare('SELECT id, name, step_type as type, state, step_order as "order", attempt_count as attempts FROM run_steps WHERE run_id = ? ORDER BY step_order ASC').bind(runId).all(),
    db.prepare('SELECT id, status, requested_at, expires_at, approver_actor_id as approver FROM approval_requests WHERE run_id = ? ORDER BY requested_at DESC').bind(runId).all(),
    db.prepare('SELECT pi.id, pi.amount, pi.currency_or_asset as currency, pi.status, b.name as beneficiary FROM payment_intents pi LEFT JOIN beneficiaries b ON pi.beneficiary_id = b.id WHERE pi.run_id = ?').bind(runId).all(),
    db.prepare('SELECT id, proof_type as type, validation_status, confidence_score as confidence FROM proof_bundles WHERE run_id = ?').bind(runId).all(),
    db.prepare('SELECT id, command_type as type, status FROM device_commands WHERE run_id = ?').bind(runId).all(),
  ]);

  const t = template as any;
  const s = (steps as any).results || [];
  const a = (approvals as any).results || [];
  const p = (payments as any).results || [];
  const pr = (proofs as any).results || [];
  const dc = (deviceCommands as any).results || [];

  return {
    run: {
      id: r.id,
      status: r.status,
      started_at: r.started_at,
      ended_at: r.ended_at,
      created_by_actor_id: r.created_by_actor_id,
      created_at: r.created_at,
      updated_at: r.updated_at,
    },
    template: {
      id: t?.id || null,
      name: t?.name || null,
      version: t?.version || null,
    },
    summary: {
      total_steps: s.length,
      completed_steps: s.filter((x: any) => x.state === 'succeeded').length,
      failed_steps: s.filter((x: any) => x.state === 'failed').length,
      pending_approvals: a.filter((x: any) => x.status === 'pending').length,
      linked_payments: p.length,
      linked_proofs: pr.length,
      linked_devices: dc.length,
    },
    steps: s,
    approvals: a,
    payments: p,
    proofs: pr,
  };
}
