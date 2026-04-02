-- 0004_device_gateway.sql
-- Gateways, devices, device_capability_profiles, device_commands, device_events, telemetry_records

CREATE TABLE IF NOT EXISTS gateways (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  gateway_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  location_id TEXT,
  status TEXT NOT NULL,
  health_status TEXT NOT NULL,
  auth_mode TEXT NOT NULL,
  config_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  gateway_id TEXT NOT NULL,
  device_type TEXT NOT NULL,
  device_protocol TEXT,
  manufacturer TEXT,
  model TEXT,
  serial_hash TEXT,
  capability_profile_id TEXT,
  location_id TEXT,
  policy_profile_id TEXT,
  status TEXT NOT NULL,
  last_seen_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (gateway_id) REFERENCES gateways(id)
);

CREATE TABLE IF NOT EXISTS device_capability_profiles (
  id TEXT PRIMARY KEY,
  device_type TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  capabilities_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS device_commands (
  id TEXT PRIMARY KEY,
  run_id TEXT,
  step_id TEXT,
  device_id TEXT NOT NULL,
  command_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  issued_by_actor_id TEXT NOT NULL,
  policy_decision_ref TEXT,
  status TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  acknowledged_at TEXT,
  completed_at TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

CREATE TABLE IF NOT EXISTS device_events (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  gateway_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  raw_payload_ref TEXT,
  normalized_payload_json TEXT,
  event_time TEXT NOT NULL,
  trust_score REAL,
  ingested_at TEXT NOT NULL,
  dedupe_key TEXT,
  UNIQUE (device_id, dedupe_key)
);

CREATE TABLE IF NOT EXISTS telemetry_records (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  value NUMERIC NOT NULL,
  recorded_at TEXT NOT NULL,
  FOREIGN KEY (device_id) REFERENCES devices(id)
);
