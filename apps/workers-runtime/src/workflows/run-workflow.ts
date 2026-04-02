import type { D1Database } from '@cloudflare/workers-types';
import { RUN_STATUS, STEP_STATUS } from '@intent-os/contracts/enums';
import { resolveNextStep } from '../coordinator/run-coordinator.js';
import { runStep } from '../coordinator/step-runner.js';
import { finalizeRun } from '../finalizer/finalizer.js';
import { publishEvent } from '../event-bus/event-publisher.js';
import { getPendingApprovals } from '../approvals/approval-coordinator.js';

export interface WorkflowContext {
  db: D1Database;
  queue?: any;
}

export async function executeRunWorkflow(ctx: WorkflowContext, runId: string): Promise<void> {
  const now = new Date().toISOString();

  await publishEvent(ctx, 'run.state_changed', { from: 'created', to: 'running' }, runId);

  while (true) {
    const { step, canProceed } = await resolveNextStep(ctx.db, runId);

    if (!canProceed) {
      const pendingApprovals = await getPendingApprovals(ctx.db, runId);
      if (pendingApprovals.length > 0) {
        await publishEvent(ctx, 'run.state_changed', { status: 'awaiting_approval' }, runId);
        return;
      }

      await finalizeRun(ctx.db, runId, RUN_STATUS.SUCCEEDED);
      await publishEvent(ctx, 'run.succeeded', {}, runId);
      return;
    }

    if (!step) break;

    const result = await runStep({
      db: ctx.db,
      runId,
      stepId: step.id,
      stepType: step.type,
      config: step.config,
    });

    if (!result.success) {
      await finalizeRun(ctx.db, runId, RUN_STATUS.FAILED);
      await publishEvent(ctx, 'run.failed', { error: result.error }, runId);
      return;
    }

    if (step.type === 'approval') {
      await publishEvent(ctx, 'approval.requested', { step_id: step.id }, runId, step.id);
      return;
    }
  }
}
