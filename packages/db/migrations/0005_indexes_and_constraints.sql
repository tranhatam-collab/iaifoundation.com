-- 0005_indexes_and_constraints.sql
-- Performance indexes for MVP queries

CREATE INDEX IF NOT EXISTS idx_runs_tenant_workspace_status ON runs(tenant_id, workspace_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_run_events_run_seq ON run_events(run_id, sequence_no);
CREATE INDEX IF NOT EXISTS idx_approvals_run_status ON approval_requests(run_id, status, requested_at);
CREATE INDEX IF NOT EXISTS idx_payments_run_status ON payment_intents(run_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_settlements_payment ON settlement_records(payment_intent_id, status);
CREATE INDEX IF NOT EXISTS idx_devices_workspace_status ON devices(workspace_id, status, last_seen_at);
CREATE INDEX IF NOT EXISTS idx_device_events_device_time ON device_events(device_id, event_time);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_time ON audit_events(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_tenant_meter_period ON usage_meters(tenant_id, meter_key, period_start);
