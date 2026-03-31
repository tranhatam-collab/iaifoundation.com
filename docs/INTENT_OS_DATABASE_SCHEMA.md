# INTENT_OS_DATABASE_SCHEMA
## Intent OS Database Schema (MVP Foundation)
## Version: 1.0
## Status: Build Ready
## Owner: IAI Foundation / Intent OS

## 1. Mục tiêu

Tài liệu này chốt schema dữ liệu cho giai đoạn build MVP, nhất quán với:

- Control Plane spec
- Runtime Engine spec
- Payment Rails spec
- Device Gateway spec

Mục tiêu: dev có thể tạo migration ngay trên Cloudflare D1, đồng thời map rõ phần nào nằm ở D1, Durable Objects, R2.

## 2. Nguyên tắc schema

- Multi-tenant strict isolation: mọi bảng nghiệp vụ phải có `tenant_id` (trừ bảng platform catalog).
- Workspace-aware: resource domain-level phải có `workspace_id`.
- Immutable audit-first: thay đổi nhạy cảm phải ghi append-only vào audit tables.
- Versioned definitions: policy/template/connector contract phải có version + status.
- Idempotent execution/payment/device actions: có key hoặc unique constraint chống double side effect.

## 3. Storage mapping

### 3.1 D1 (source of truth cho metadata + index)

- Tenants, workspaces, users, roles, bindings
- Policy packs, template registry, connector registry
- Runs, run steps, approval requests, reconciliation indexes
- Wallet profiles, beneficiaries, payment intents, settlements
- Gateways, devices, commands, normalized events index
- Usage meters, billing indexes, audit indexes

### 3.2 Durable Objects (hot state)

- Active run lock/state
- Approval queue state
- Live device session state
- Command locks per device

### 3.3 R2 (artifacts lớn)

- Proof artifacts (image/video/receipt/raw payloads)
- Plan snapshots
- Audit exports
- Signed result bundles

## 4. Naming conventions

- Table name: `snake_case`, số nhiều (`tenants`, `run_steps`).
- ID: `TEXT` UUID/ULID.
- Timestamp: `TEXT` ISO8601 UTC.
- JSON payload: `TEXT` lưu JSON string.
- Status/state dùng enum qua `CHECK` constraint.

## 5. Core D1 tables (DDL skeleton)

```sql
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('person','family','business','enterprise','partner','platform_internal')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_user_id TEXT,
  billing_plan_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  timezone TEXT,
  locale TEXT,
  country_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  workspace_type TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  default_policy_pack_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, slug),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  primary_email TEXT NOT NULL,
  display_name TEXT,
  auth_subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  last_active_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, primary_email),
  UNIQUE (tenant_id, auth_subject),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT,
  role_key TEXT NOT NULL,
  role_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, workspace_id, role_key)
);

CREATE TABLE role_bindings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT,
  user_id TEXT,
  agent_id TEXT,
  role_id TEXT NOT NULL,
  condition_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

```sql
CREATE TABLE policy_packs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','review','approved','published','deprecated','archived')),
  policy_json TEXT NOT NULL,
  checksum TEXT NOT NULL,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, workspace_id, name, version)
);

CREATE TABLE intent_templates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  workspace_id TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  intent_category TEXT NOT NULL,
  version TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  ui_schema_json TEXT,
  policy_requirements_json TEXT,
  proof_requirements_json TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft','review','approved','published','deprecated','archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, workspace_id, slug, version)
);

CREATE TABLE connectors (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT,
  connector_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  config_ref TEXT NOT NULL,
  secret_ref TEXT NOT NULL,
  health_status TEXT NOT NULL DEFAULT 'unknown',
  last_checked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

```sql
CREATE TABLE runs (
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

CREATE TABLE run_steps (
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

CREATE TABLE run_events (
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

CREATE TABLE approval_requests (
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
```

```sql
CREATE TABLE wallet_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  wallet_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  custody_mode TEXT NOT NULL,
  supported_assets_json TEXT,
  settlement_currency TEXT,
  status TEXT NOT NULL,
  policy_profile_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE beneficiaries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  country_code TEXT,
  payout_method_ref TEXT,
  wallet_address_ref TEXT,
  verification_status TEXT NOT NULL,
  risk_score REAL,
  created_at TEXT NOT NULL
);

CREATE TABLE payment_intents (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency_or_asset TEXT NOT NULL,
  beneficiary_id TEXT NOT NULL,
  funding_source_id TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE settlement_records (
  id TEXT PRIMARY KEY,
  payment_intent_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_txn_ref TEXT NOT NULL,
  network_ref TEXT,
  amount NUMERIC NOT NULL,
  asset TEXT NOT NULL,
  status TEXT NOT NULL,
  fee_amount NUMERIC,
  settled_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (provider, provider_txn_ref),
  FOREIGN KEY (payment_intent_id) REFERENCES payment_intents(id)
);
```

```sql
CREATE TABLE gateways (
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

CREATE TABLE devices (
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

CREATE TABLE device_commands (
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

CREATE TABLE device_events (
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
```

```sql
CREATE TABLE proof_bundles (
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

CREATE TABLE reconciliations (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  reconciliation_type TEXT NOT NULL,
  expected_json TEXT NOT NULL,
  actual_json TEXT NOT NULL,
  result_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(id)
);

CREATE TABLE usage_meters (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT,
  meter_key TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  workspace_id TEXT,
  actor_id TEXT,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  before_json TEXT,
  after_json TEXT,
  reason TEXT,
  request_id TEXT,
  source_ip TEXT,
  session_id TEXT,
  created_at TEXT NOT NULL
);
```

## 6. Indexes bắt buộc MVP

```sql
CREATE INDEX idx_runs_tenant_workspace_status ON runs(tenant_id, workspace_id, status);
CREATE INDEX idx_run_events_run_seq ON run_events(run_id, sequence_no);
CREATE INDEX idx_approvals_run_status ON approval_requests(run_id, status);
CREATE INDEX idx_payments_run_status ON payment_intents(run_id, status);
CREATE INDEX idx_settlements_payment ON settlement_records(payment_intent_id, status);
CREATE INDEX idx_devices_workspace_status ON devices(workspace_id, status);
CREATE INDEX idx_device_events_device_time ON device_events(device_id, event_time);
CREATE INDEX idx_audit_tenant_time ON audit_events(tenant_id, created_at);
CREATE INDEX idx_usage_tenant_meter_period ON usage_meters(tenant_id, meter_key, period_start);
```

## 7. Data retention (MVP)

- `run_events`: giữ đầy đủ 18 tháng, sau đó archive R2.
- `audit_events`: immutable, giữ tối thiểu 7 năm (compliance-friendly baseline).
- `device_events`: raw payload archive sang R2 theo batch (hàng ngày/tuần).
- `proof_bundles`: artifact lưu R2 theo policy tenant/workspace.

## 8. Migration strategy

- `0001_foundation_control_plane.sql`
- `0002_runtime_engine.sql`
- `0003_payments.sql`
- `0004_device_gateway.sql`
- `0005_indexes_and_constraints.sql`

Mọi migration phải có rollback strategy ở mức ứng dụng (không dựa vào destructive down migration trên production).

## 9. Non-negotiables cho DEV

- Không merge logic tenant vào global query nếu thiếu `tenant_id`.
- Không ghi secret plaintext trong D1 (chỉ lưu `secret_ref`).
- Không cho phép update/overwrite `run_events` và `audit_events`.
- Mọi external side effect table (`payment_attempts`, `device_commands`) bắt buộc có idempotency key.
- Schema thay đổi liên quan policy/payment/device phải bump version docs + migration notes.
