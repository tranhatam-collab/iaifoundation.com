import type { D1Database } from '@cloudflare/workers-types';
import { STEP_STATUS } from '@intent-os/contracts/enums';

export async function buildRunPlan(
  db: D1Database,
  runId: string,
  templateId: string,
): Promise<void> {
  const template = await db.prepare(
    'SELECT manifest_json FROM intent_templates WHERE id = ?'
  ).bind(templateId).first<{ manifest_json: string }>();

  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  const manifest = JSON.parse(template.manifest_json) as { steps: Array<{ type: string; name: string; config?: Record<string, unknown> }> };
  const now = new Date().toISOString();

  for (let i = 0; i < manifest.steps.length; i++) {
    const stepDef = manifest.steps[i];
    const stepId = `stp_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

    await db.prepare(`
      INSERT INTO run_steps (id, run_id, parent_step_id, step_type, name, step_order, state, attempt_count, max_attempts, timeout_at, input_ref, output_ref, proof_status, created_at, updated_at)
      VALUES (?, ?, NULL, ?, ?, ?, ?, 0, 0, NULL, NULL, NULL, NULL, ?, ?)
    `).bind(stepId, runId, stepDef.type, stepDef.name, i + 1, i === 0 ? STEP_STATUS.RUNNING : STEP_STATUS.PENDING, now, now).run();
  }

  await db.prepare('UPDATE runs SET status = ?, updated_at = ? WHERE id = ?')
    .bind('planned', now, runId).run();
}
