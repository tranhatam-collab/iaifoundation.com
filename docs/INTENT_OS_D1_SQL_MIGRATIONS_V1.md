# INTENT_OS_D1_SQL_MIGRATIONS_V1
## Intent OS D1 SQL Migrations V1
## Version: 1.0
## Status: Build Ready
## Owner: IAI Foundation / Intent OS

## 1. Mục tiêu

Chốt migration plan V1 cho Cloudflare D1, tương thích với:

- `INTENT_OS_DATABASE_SCHEMA.md`
- `INTENT_OS_API_SPEC.md`
- `INTENT_OS_MVP_BUILD_ORDER.md`

Tài liệu này là runbook để backend team tạo SQL migration files theo thứ tự chuẩn.

## 2. Migration file order

1. `0001_foundation_control_plane.sql`
2. `0002_runtime_engine.sql`
3. `0003_payments.sql`
4. `0004_device_gateway.sql`
5. `0005_indexes_and_constraints.sql`
6. `0006_seed_minimum_reference_data.sql` (dev/staging only)

## 3. `0001_foundation_control_plane.sql`

### Create tables

- `tenants`
- `workspaces`
- `users`
- `roles`
- `role_bindings`
- `agents`
- `policy_packs`
- `intent_templates`
- `connectors`
- `usage_meters`
- `audit_events`

### Required constraints

- unique tenant slug
- unique workspace slug per tenant
- unique user email/auth subject per tenant
- unique policy/template version keys

### Sample command

```bash
wrangler d1 execute <DB_NAME> --file=packages/db/migrations/0001_foundation_control_plane.sql
```

## 4. `0002_runtime_engine.sql`

### Create tables

- `runs`
- `run_steps`
- `run_events`
- `approval_requests`
- `proof_bundles`
- `reconciliations`

### Required constraints

- `UNIQUE (run_id, sequence_no)` trên `run_events`
- foreign keys đến `runs` cho tables phụ
- run/step status check constraints

## 5. `0003_payments.sql`

### Create tables

- `wallet_profiles`
- `funding_sources`
- `beneficiaries`
- `payment_intents`
- `payment_attempts`
- `settlement_records`
- `payment_reconciliations`
- `balance_snapshots`

### Required constraints

- provider txn ref unique theo provider
- idempotency key unique trên `payment_attempts`
- logical enum checks cho payment statuses

## 6. `0004_device_gateway.sql`

### Create tables

- `gateways`
- `devices`
- `device_capability_profiles`
- `device_commands`
- `device_events`
- `telemetry_records`

### Required constraints

- idempotency unique trên `device_commands`
- dedupe unique key trên `device_events`
- FK từ `devices.gateway_id -> gateways.id`

## 7. `0005_indexes_and_constraints.sql`

### Create performance indexes

- `runs(tenant_id, workspace_id, status, created_at)`
- `run_events(run_id, sequence_no)`
- `approval_requests(run_id, status, requested_at)`
- `payment_intents(run_id, status, created_at)`
- `settlement_records(payment_intent_id, status)`
- `devices(workspace_id, status, last_seen_at)`
- `device_events(device_id, event_time)`
- `audit_events(tenant_id, created_at)`
- `usage_meters(tenant_id, meter_key, period_start)`

### Add/verify check constraints

- run states/step states
- policy decision values
- payment status values
- device command status values

## 8. `0006_seed_minimum_reference_data.sql` (non-prod)

Seed:
- baseline roles (`owner`, `admin`, `operator`, `approver`, `auditor`)
- default policy pack placeholder
- sample template categories
- default usage meter keys

Không chạy seed này ở production.

## 9. D1 execution strategy

## 9.1 Environments

- local
- staging
- production

## 9.2 Rules

- chạy tuần tự từng migration file
- migration fail thì dừng pipeline
- không sửa migration đã apply production; tạo migration mới để patch

## 9.3 Suggested commands

```bash
# list migrations
wrangler d1 migrations list <DB_NAME>

# apply pending
wrangler d1 migrations apply <DB_NAME>

# execute one-off verify query
wrangler d1 execute <DB_NAME> --command="SELECT name FROM sqlite_master WHERE type='table';"
```

## 10. Verification checklist per migration

- Table created đúng tên và columns.
- Foreign keys hợp lệ.
- Unique/index hiện diện.
- Enum/check constraints hoạt động.
- Query smoke test chạy pass.
- API module liên quan chạy integration test pass.

## 11. Roll-forward policy

Không dùng destructive rollback trên production.

Khi lỗi:
- tạo hotfix migration mới (`00xx_hotfix_*.sql`)
- migrate dữ liệu cần thiết bằng script idempotent
- ghi incident + migration note vào changelog

## 12. Data safety rules

- Tuyệt đối không lưu plaintext secrets trong D1.
- Audit tables append-only.
- Không update `run_events.sequence_no`.
- Không xoá hard-delete records nhạy cảm trong MVP (ưu tiên soft status + archived flags).

## 13. Deliverables cho backend team

- SQL files trong `packages/db/migrations/`
- migration README với apply order
- automated migration test trong CI
- baseline dashboards query pack (runs/payments/devices/audit)
