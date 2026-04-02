import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

export interface RuntimeContext {
  db: D1Database;
  artifacts?: R2Bucket;
  queue?: unknown;
}

export interface IntakeInput {
  tenant_id: string;
  workspace_id: string;
  template_id: string;
  inputs: Record<string, unknown>;
  actor_id: string;
  mode?: string;
}

export interface IntakeResult {
  run_id: string;
  initial_status: string;
  requires_approval: boolean;
  next_action: string;
}

export interface WorkflowContext {
  db: D1Database;
  queue?: unknown;
}
