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

    switch (ctx.stepType) {
      case 'approval':
        result = await handleApprovalStep(ctx);
        break;
      case 'payment':
        result = await handlePaymentStep(ctx);
        break;
      case 'device_command':
        result = await handleDeviceCommandStep(ctx);
        break;
      case 'proof_collection':
        result = await handleProofCollectionStep(ctx);
        break;
      case 'verification':
        result = await handleVerificationStep(ctx);
        break;
      case 'notification':
        result = await handleNotificationStep(ctx);
        break;
      default:
        result = { success: false, error: `Unknown step type: ${ctx.stepType}` };
    }

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

async function handleApprovalStep(ctx: StepRunnerContext): Promise<StepResult> {
  return { success: true, output: { approval_status: 'pending' } };
}

async function handlePaymentStep(ctx: StepRunnerContext): Promise<StepResult> {
  return { success: true, output: { payment_status: 'initiated' } };
}

async function handleDeviceCommandStep(ctx: StepRunnerContext): Promise<StepResult> {
  return { success: true, output: { command_status: 'sent' } };
}

async function handleProofCollectionStep(ctx: StepRunnerContext): Promise<StepResult> {
  return { success: true, output: { proof_status: 'collected' } };
}

async function handleVerificationStep(ctx: StepRunnerContext): Promise<StepResult> {
  return { success: true, output: { verification_status: 'passed' } };
}

async function handleNotificationStep(ctx: StepRunnerContext): Promise<StepResult> {
  return { success: true, output: { notification_status: 'sent' } };
}
