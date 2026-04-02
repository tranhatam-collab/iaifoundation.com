-- 0006_seed_minimum_reference_data.sql
-- DEV/STAGING ONLY - DO NOT RUN ON PRODUCTION

-- System roles
INSERT INTO roles (id, tenant_id, workspace_id, role_key, role_name, status, created_at, updated_at) VALUES
('rol_owner', 'ten_demo', NULL, 'owner', 'Owner', 'active', '2026-03-31T00:00:00Z', '2026-03-31T00:00:00Z'),
('rol_admin', 'ten_demo', NULL, 'admin', 'Admin', 'active', '2026-03-31T00:00:00Z', '2026-03-31T00:00:00Z'),
('rol_operator', 'ten_demo', NULL, 'operator', 'Operator', 'active', '2026-03-31T00:00:00Z', '2026-03-31T00:00:00Z'),
('rol_approver', 'ten_demo', NULL, 'approver', 'Approver', 'active', '2026-03-31T00:00:00Z', '2026-03-31T00:00:00Z'),
('rol_auditor', 'ten_demo', NULL, 'auditor', 'Auditor', 'active', '2026-03-31T00:00:00Z', '2026-03-31T00:00:00Z'),
('rol_finance_manager', 'ten_demo', NULL, 'finance_manager', 'Finance Manager', 'active', '2026-03-31T00:00:00Z', '2026-03-31T00:00:00Z');

-- Demo tenant
INSERT INTO tenants (id, type, name, slug, status, timezone, locale, created_at, updated_at) VALUES
('ten_demo', 'business', 'Intent Demo Co', 'intent-demo-co', 'active', 'Asia/Ho_Chi_Minh', 'vi', '2026-03-31T00:00:00Z', '2026-03-31T00:00:00Z');

-- Demo workspace
INSERT INTO workspaces (id, tenant_id, name, slug, workspace_type, status, created_at, updated_at) VALUES
('wrk_ops', 'ten_demo', 'Operations', 'operations', 'ops', 'active', '2026-03-31T00:00:00Z', '2026-03-31T00:00:00Z');

-- Demo user
INSERT INTO users (id, tenant_id, primary_email, display_name, status, created_at, updated_at) VALUES
('usr_owner', 'ten_demo', 'owner@intent-demo.local', 'Demo Owner', 'active', '2026-03-31T00:00:00Z', '2026-03-31T00:00:00Z');

-- Default usage meter keys
INSERT INTO usage_meters (id, tenant_id, workspace_id, meter_key, quantity, period_start, period_end, created_at) VALUES
('meter_intents_1', 'ten_demo', 'wrk_ops', 'intents_created', 0, '2026-03-01T00:00:00Z', '2026-04-01T00:00:00Z', '2026-03-31T00:00:00Z'),
('meter_runs_1', 'ten_demo', 'wrk_ops', 'runs_started', 0, '2026-03-01T00:00:00Z', '2026-04-01T00:00:00Z', '2026-03-31T00:00:00Z'),
('meter_steps_1', 'ten_demo', 'wrk_ops', 'step_count', 0, '2026-03-01T00:00:00Z', '2026-04-01T00:00:00Z', '2026-03-31T00:00:00Z');
