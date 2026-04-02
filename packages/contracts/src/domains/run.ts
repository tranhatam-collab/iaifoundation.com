export interface Run {
  id: string;
  tenant_id: string;
  workspace_id: string;
  intent_instance_id: string;
  template_id: string | null;
  policy_snapshot_id: string | null;
  planner_manifest_ref: string | null;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  created_by_actor_id: string;
  created_at: string;
  updated_at: string;
}

export interface RunStep {
  id: string;
  run_id: string;
  parent_step_id: string | null;
  step_type: string;
  name: string;
  step_order: number;
  state: string;
  attempt_count: number;
  max_attempts: number;
  timeout_at: string | null;
  input_ref: string | null;
  output_ref: string | null;
  proof_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface RunEvent {
  id: string;
  run_id: string;
  step_id: string | null;
  event_type: string;
  payload_ref: string | null;
  event_time: string;
  sequence_no: number;
}

export interface ApprovalRequest {
  id: string;
  run_id: string;
  step_id: string;
  approver_actor_id: string | null;
  approver_group_id: string | null;
  status: string;
  requested_at: string;
  expires_at: string | null;
  decided_at: string | null;
  reason: string | null;
  signature_ref: string | null;
}
