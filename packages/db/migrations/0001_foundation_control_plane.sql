-- 0001_foundation_control_plane.sql
-- Tenants, workspaces, users, roles, role_bindings, policy_packs, intent_templates, connectors, usage_meters, audit_events

CREATE TABLE IF NOT EXISTS tenants (
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

CREATE TABLE IF NOT EXISTS workspaces (
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

CREATE TABLE IF NOT EXISTS users (
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

CREATE TABLE IF NOT EXISTS roles (
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

CREATE TABLE IF NOT EXISTS role_bindings (
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

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT,
  agent_type TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  capability_profile_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS policy_packs (
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

CREATE TABLE IF NOT EXISTS intent_templates (
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

CREATE TABLE IF NOT EXISTS connectors (
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

CREATE TABLE IF NOT EXISTS usage_meters (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT,
  meter_key TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
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
