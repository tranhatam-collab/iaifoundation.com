import type { D1Database } from '@cloudflare/workers-types';
import { STEP_STATUS } from '@intent-os/contracts/enums';

export interface StepRunnerContext {
  db: D1Database;
  runId: string;
  stepId: string;
  stepType: string;
  config?: Record<string, unknown>;
}
export interface StepResult {
  success: boolean;
  output?: Record<string, unknown>;
  proofRef?: string;
  error?: string;
}

export async function runStep(ctx: StepRunnerContext): Promise<StepResult> {
  const now = new Date().toISOString();

  try {
    await ctx.db.prepare('UPDATE run_steps SET state = ?, updated_at = ? WHERE id = ?')
      .bind(STEP_STATUS.RUNNING, now, ctx.stepId).run();

    let result: StepResult;

    result = {
      success: false,
      error: `Runtime step execution is not implemented for type: ${ctx.stepType}`,
    };

    const finalStatus = result.success ? STEP_STATUS.SUCCEEDED : STEP_STATUS.FAILED;
    await ctx.db.prepare('UPDATE run_steps SET state = ?, updated_at = ? WHERE id = ?')
      .bind(finalStatus, new Date().toISOString(), ctx.stepId).run();

    return result;
  } catch (error) {
    await ctx.db.prepare('UPDATE run_steps SET state = ?, updated_at = ? WHERE id = ?')
      .bind(STEP_STATUS.FAILED, new Date().toISOString(), ctx.stepId).run();

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
