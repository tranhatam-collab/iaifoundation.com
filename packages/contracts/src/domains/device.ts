export interface Device {
  id: string;
  tenant_id: string;
  workspace_id: string;
  gateway_id: string;
  device_type: string;
  device_protocol: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_hash: string | null;
  capability_profile_id: string | null;
  location_id: string | null;
  policy_profile_id: string | null;
  status: string;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceCommand {
  id: string;
  run_id: string | null;
  step_id: string | null;
  device_id: string;
  command_type: string;
  payload_json: string;
  issued_by_actor_id: string;
  policy_decision_ref: string | null;
  status: string;
  requested_at: string;
  acknowledged_at: string | null;
  completed_at: string | null;
  idempotency_key: string;
}

export interface DeviceEvent {
  id: string;
  device_id: string;
  gateway_id: string;
  event_type: string;
  raw_payload_ref: string | null;
  normalized_payload_json: string | null;
  event_time: string;
  trust_score: number | null;
  ingested_at: string;
  dedupe_key: string | null;
}

export interface Gateway {
  id: string;
  tenant_id: string;
  workspace_id: string;
  gateway_type: string;
  provider: string;
  location_id: string | null;
  status: string;
  health_status: string;
  auth_mode: string;
  config_ref: string | null;
  created_at: string;
  updated_at: string;
}
