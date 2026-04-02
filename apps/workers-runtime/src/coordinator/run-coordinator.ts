import type { D1Database } from '@cloudflare/workers-types';
import { RUN_STATUS, STEP_STATUS } from '@intent-os/contracts/enums';
import type { RunRow } from '@intent-os/db/repositories/runs.repo';

export interface StepDefinition {
  id: string;
  type: 'approval' | 'payment' | 'device_command' | 'proof_collection' | 'verification' | 'notification' | 'custom';
  name: string;
  order: number;
  config?: Record<string, unknown>;
  retry_policy?: { max_attempts: number; backoff_ms: number };
  timeout_ms?: number;
}

export interface RunPlan {
  run_id: string;
  steps: StepDefinition[];
}

export async function resolveNextStep(
  db: D1Database,
  runId: string,
): Promise<{ step: StepDefinition | null; canProceed: boolean }> {
  const steps = await db.prepare(`
    SELECT * FROM run_steps WHERE run_id = ? ORDER BY step_order ASC
  `).bind(runId).all();

  if (!steps.results || steps.results.length === 0) {
    return { step: null, canProceed: false };
  }

  const pendingStep = steps.results.find(
    (s: any) => s.state === STEP_STATUS.PENDING || s.state === STEP_STATUS.RUNNING,
  );

  if (!pendingStep) {
    const allSucceeded = steps.results.every((s: any) => s.state === STEP_STATUS.SUCCEEDED || s.state === STEP_STATUS.SKIPPED);
    return { step: null, canProceed: allSucceeded };
  }

  return {
    step: pendingStep as unknown as StepDefinition,
    canProceed: true,
  };
}

export async function transitionRunStatus(
  db: D1Database,
  runId: string,
  fromStatus: string,
  toStatus: string,
  updatedAt: string,
): Promise<void> {
  const current = await db.prepare('SELECT status FROM runs WHERE id = ?').bind(runId).first<{ status: string }>();

  if (!current) {
    throw new Error(`Run ${runId} not found`);
  }

  if (current.status !== fromStatus) {
    throw new Error(`Invalid state transition: expected ${fromStatus}, got ${current.status}`);
  }

  await db.prepare('UPDATE runs SET status = ?, updated_at = ? WHERE id = ?')
    .bind(toStatus, updatedAt, runId).run();
}

export async function transitionStepStatus(
  db: D1Database,
  stepId: string,
  fromStatus: string,
  toStatus: string,
  updatedAt: string,
): Promise<void> {
  const current = await db.prepare('SELECT state FROM run_steps WHERE id = ?').bind(stepId).first<{ state: string }>();

  if (!current) {
    throw new Error(`Step ${stepId} not found`);
  }

  if (current.state !== fromStatus) {
    throw new Error(`Invalid step state transition: expected ${fromStatus}, got ${current.state}`);
  }

  await db.prepare('UPDATE run_steps SET state = ?, updated_at = ? WHERE id = ?')
    .bind(toStatus, updatedAt, stepId).run();
}
