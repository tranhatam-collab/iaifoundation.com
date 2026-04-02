import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { RUN_STATUS } from '@intent-os/contracts/enums';
import type { IntakeInput, IntakeResult } from '../types/index.js';
import { getPendingApprovals } from '../approvals/index.js';

async function resolveRunContext(
  db: D1Database,
  templateId: string,
  actorId: string,
  inputs: Record<string, unknown>,
): Promise<void> {
  const template = await db.prepare(
    'SELECT * FROM intent_templates WHERE id = ? AND status = ?'
  ).bind(templateId, 'published').first();

  if (!template) {
    throw new Error(`Published template ${templateId} not found`);
  }

  const t = template as any;

  await db.prepare(
    'SELECT * FROM policy_packs WHERE tenant_id = ? AND workspace_id = ? AND status = ? ORDER BY published_at DESC LIMIT 1'
  ).bind(t.tenant_id, t.workspace_id, 'published').first();

  await db.prepare(`
    SELECT r.role_key FROM role_bindings rb
    JOIN roles r ON rb.role_id = r.id
    WHERE rb.user_id = ? AND (rb.workspace_id = ? OR rb.workspace_id IS NULL)
  `).bind(actorId, t.workspace_id).all();

  if (inputs.supplier_id) {
    await db.prepare('SELECT * FROM beneficiaries WHERE id = ?')
      .bind(inputs.supplier_id as string).first();
  }
}

async function buildRunPlan(db: D1Database, runId: string, templateId: string): Promise<void> {
  const template = await db.prepare(
    'SELECT manifest_json FROM intent_templates WHERE id = ?'
  ).bind(templateId).first<{ manifest_json: string }>();

  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  const manifest = JSON.parse(template.manifest_json) as { steps: Array<{ type: string; name: string }> };
  const now = new Date().toISOString();

  for (let i = 0; i < manifest.steps.length; i++) {
    const stepDef = manifest.steps[i];
    const stepId = `stp_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

    await db.prepare(`
      INSERT INTO run_steps (id, run_id, parent_step_id, step_type, name, step_order, state, attempt_count, max_attempts, timeout_at, input_ref, output_ref, proof_status, created_at, updated_at)
      VALUES (?, ?, NULL, ?, ?, ?, ?, 0, 0, NULL, NULL, NULL, NULL, ?, ?)
    `).bind(stepId, runId, stepDef.type, stepDef.name, i + 1, i === 0 ? 'running' : 'pending', now, now).run();
  }

  await db.prepare('UPDATE runs SET status = ?, updated_at = ? WHERE id = ?')
    .bind('planned', now, runId).run();
}

async function executeRunWorkflow(db: D1Database, runId: string): Promise<void> {
  await db.prepare('UPDATE runs SET status = ?, updated_at = ? WHERE id = ?')
    .bind('running', new Date().toISOString(), runId).run();

  const pendingApprovals = await getPendingApprovals(db, runId);
  if (pendingApprovals.length > 0) {
    await db.prepare('UPDATE runs SET status = ?, updated_at = ? WHERE id = ?')
      .bind('awaiting_approval', new Date().toISOString(), runId).run();
    return;
  }

  await db.prepare('UPDATE runs SET status = ?, ended_at = ?, updated_at = ? WHERE id = ?')
    .bind(RUN_STATUS.SUCCEEDED, new Date().toISOString(), new Date().toISOString(), runId).run();
}

export async function handleIntake(
  db: D1Database,
  artifacts: R2Bucket,
  input: IntakeInput,
): Promise<IntakeResult> {
  const runId = `run_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO runs (id, tenant_id, workspace_id, intent_instance_id, template_id, policy_snapshot_id, planner_manifest_ref, status, started_at, ended_at, created_by_actor_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, NULL, NULL, 'created', NULL, NULL, ?, ?, ?)
  `).bind(runId, input.tenant_id, input.workspace_id, runId, input.template_id, input.actor_id, now, now).run();

  await db.prepare(`
    INSERT INTO run_events (id, run_id, step_id, event_type, payload_ref, event_time, sequence_no)
    VALUES (?, ?, NULL, 'run.created', NULL, ?, 1)
  `).bind(`evt_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`, runId, now).run();

  try {
    await resolveRunContext(db, input.template_id, input.actor_id, input.inputs);

    await db.prepare('UPDATE runs SET status = ?, updated_at = ? WHERE id = ?')
      .bind('resolved', new Date().toISOString(), runId).run();

    await buildRunPlan(db, runId, input.template_id);

    await executeRunWorkflow(db, runId);

    const currentRun = await db.prepare('SELECT status FROM runs WHERE id = ?').bind(runId).first<{ status: string }>();
    const status = currentRun?.status || 'unknown';

    return {
      run_id: runId,
      initial_status: status,
      requires_approval: status === 'awaiting_approval',
      next_action: status === 'awaiting_approval' ? 'approve' : status === 'failed' ? 'investigate' : 'complete',
    };
  } catch (error) {
    await db.prepare('UPDATE runs SET status = ?, ended_at = ?, updated_at = ? WHERE id = ?')
      .bind('failed', new Date().toISOString(), new Date().toISOString(), runId).run();

    await db.prepare(`
      INSERT INTO run_events (id, run_id, step_id, event_type, payload_ref, event_time, sequence_no)
      VALUES (?, ?, NULL, 'run.failed', ?, ?, COALESCE((SELECT MAX(sequence_no) FROM run_events WHERE run_id = ?), 0) + 1)
    `).bind(`evt_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`, runId, JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown' }), new Date().toISOString(), runId).run();

    return {
      run_id: runId,
      initial_status: 'failed',
      requires_approval: false,
      next_action: 'investigate',
    };
  }
}
