import type { D1Database } from '@cloudflare/workers-types';
import type { R2Bucket } from '@cloudflare/workers-types';
import { handleIntake } from '@intent-os/runtime-core/orchestration';

export interface ExecuteIntentInput {
  tenant_id: string;
  workspace_id: string;
  template_id: string;
  inputs: Record<string, unknown>;
  actor_id: string;
  mode?: string;
}

export async function executeIntentService(
  db: D1Database,
  artifacts: R2Bucket,
  input: ExecuteIntentInput,
  requestId: string,
): Promise<{ run_id: string; initial_status: string }> {
  const result = await handleIntake(db, artifacts, input);
  return { run_id: result.run_id, initial_status: result.initial_status };
}
