-- 0002_runtime_engine.sql
-- Runs, run_steps, run_events, approval_requests, proof_bundles, reconciliations

CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  intent_instance_id TEXT NOT NULL,
  template_id TEXT,
  policy_snapshot_id TEXT,
  planner_manifest_ref TEXT,
  status TEXT NOT NULL,
  started_at TEXT,
  ended_at TEXT,
  created_by_actor_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS run_steps (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  parent_step_id TEXT,
  step_type TEXT NOT NULL,
  name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  state TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 0,
  timeout_at TEXT,
  input_ref TEXT,
  output_ref TEXT,
  proof_status TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(id)
);

CREATE TABLE IF NOT EXISTS run_events (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_id TEXT,
  event_type TEXT NOT NULL,
  payload_ref TEXT,
  event_time TEXT NOT NULL,
  sequence_no INTEGER NOT NULL,
  UNIQUE (run_id, sequence_no),
  FOREIGN KEY (run_id) REFERENCES runs(id)
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  approver_actor_id TEXT,
  approver_group_id TEXT,
  status TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  expires_at TEXT,
  decided_at TEXT,
  reason TEXT,
  signature_ref TEXT,
  FOREIGN KEY (run_id) REFERENCES runs(id)
);

CREATE TABLE IF NOT EXISTS proof_bundles (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_id TEXT,
  proof_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  artifact_ref TEXT NOT NULL,
  validation_status TEXT NOT NULL,
  confidence_score REAL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reconciliations (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  reconciliation_type TEXT NOT NULL,
  expected_json TEXT NOT NULL,
  actual_json TEXT NOT NULL,
  result_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(id)
);
