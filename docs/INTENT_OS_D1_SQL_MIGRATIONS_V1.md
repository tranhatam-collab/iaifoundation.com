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

## 12. Migration execution order chi tiết (extended)

DEV phải chạy theo đúng thứ tự:

1. `0001_core_identity_and_control_plane.sql`
2. `0002_runtime_and_approvals.sql`
3. `0003_payments.sql`
4. `0004_devices_and_proofs.sql`
5. `0005_connectors_billing_audit_indexes.sql`

Không chạy nhảy cóc, vì có foreign key dependencies.

## 13. Safe alter strategy cho D1

D1/SQLite có giới hạn alter so với PostgreSQL. Khi cần đổi schema về sau:

### 13.1 Thêm cột

```sql
ALTER TABLE table_name ADD COLUMN new_column TEXT;
```

### 13.2 Đổi cấu trúc lớn

Nên dùng pattern:
1. tạo bảng mới
2. copy data
3. drop bảng cũ
4. rename bảng mới

### 13.3 Không rename bừa các cột cốt lõi ở giai đoạn đầu

IDs, foreign keys, timestamps nên khóa sớm và ít đổi.

## 14. Timestamp rules

Tất cả `created_at`, `updated_at`, `event_time`, `requested_at` dùng Unix seconds hoặc milliseconds phải thống nhất ngay.

Khuyến nghị:
- dùng milliseconds toàn hệ cho app/runtime
- nếu migration hiện dùng INTEGER thì DEV phải thống nhất tất cả service/repository dùng cùng chuẩn đó

Quan trọng nhất: không được chỗ này seconds, chỗ kia milliseconds.

## 15. ID prefix rules

Khuyến nghị prefix thống nhất:
- `ten_` tenants
- `wrk_` workspaces
- `usr_` users
- `act_` actors
- `rol_` roles
- `pol_` policy packs
- `tpl_` templates
- `int_` intent instances
- `run_` runs
- `stp_` run steps
- `apr_` approval requests
- `apd_` approval decisions
- `pay_` payment intents
- `set_` settlement records
- `wal_` wallet profiles
- `ben_` beneficiaries
- `gtw_` gateways
- `dev_` devices
- `cmd_` device commands
- `evt_` device events
- `art_` artifacts
- `prf_` proof bundles
- `aud_` audit logs
- `con_` connectors

## 16. Foreign key discipline

Mặc dù SQLite hỗ trợ foreign keys, DEV phải nhớ:
- luôn bật `PRAGMA foreign_keys = ON;`
- không giả định môi trường local tự bật sẵn
- test delete/update flows với FK thật

## 17. Delete strategy

### 17.1 Không hard delete với bảng vận hành

Không xóa thật:
- runs
- run_steps
- approvals
- payments
- proofs
- device_events
- audit_logs

### 17.2 Có thể soft-disable thay vì delete

- connectors
- devices
- beneficiaries
- wallets
- templates

Dùng status:
- active
- disabled
- archived
- deprecated

## 18. Status validation rule

Do D1 không có enum mạnh như Postgres, DEV phải validate ở app layer. Không để status text tùy tiện.

Cần shared constants:
- `RUN_STATUSES`
- `APPROVAL_STATUSES`
- `PAYMENT_STATUSES`
- `DEVICE_COMMAND_STATUSES`
- `PROOF_VALIDATION_STATUSES`

## 19. JSON column rules

Các cột JSON hiện có:
- `policy_json`
- `manifest_json`
- `capabilities_json`
- `normalized_input_json`
- `context_json`
- `payload_json`
- `metadata_json`
- `pricing_json`
- `limits_json`

Quy tắc:
- luôn stringify có kiểm soát
- parse ở service/repository layer
- không lưu JSON malformed
- schema validation trước khi insert/update

## 20. Index strategy cụ thể cho MVP load

Các query nặng nhất của MVP:
- list runs theo tenant/workspace/status
- load run detail theo run id
- list approvals pending
- list payments theo status
- list devices/events theo device/time
- list proofs theo run
- audit by resource/time

Indexes trong V1 đã bám trục này. DEV không nên thêm index tràn lan quá sớm, tránh write overhead vô ích.

## 21. Migration for seed execution

Sau khi migrate, chạy seed tối thiểu:

### 21.1 System roles
- owner
- admin
- operator
- approver
- auditor

### 21.2 Billing plan
- free

### 21.3 Optional sample template
- pay-supplier-on-delivery

### 21.4 Optional sample policy
- finance base threshold approval

## 22. Sample DEV tenant seed gợi ý

```sql
INSERT INTO tenants (
  id, type, name, slug, status, timezone, locale, created_at, updated_at
) VALUES (
  'ten_demo',
  'business',
  'Intent Demo Co',
  'intent-demo-co',
  'active',
  'Asia/Ho_Chi_Minh',
  'vi',
  1743390000000,
  1743390000000
);

INSERT INTO workspaces (
  id, tenant_id, name, slug, workspace_type, status, created_at, updated_at
) VALUES (
  'wrk_ops',
  'ten_demo',
  'Operations',
  'operations',
  'ops',
  'active',
  1743390000000,
  1743390000000
);

INSERT INTO users (
  id, tenant_id, primary_email, display_name, status, created_at, updated_at
) VALUES (
  'usr_owner',
  'ten_demo',
  'owner@intent-demo.local',
  'Demo Owner',
  'active',
  1743390000000,
  1743390000000
);
```

## 23. App-level constraints không ghi bằng SQL ở V1

Một số ràng buộc phải enforce ở app layer:
- một run chỉ được approve nếu approval còn pending
- một payment không được payout hai lần với cùng semantic intent
- device quarantined không nhận command mới
- proof invalid không được tính complete
- beneficiary unverified không được dùng ở rail yêu cầu verification
- template archived không được execute mới

## 24. Optional unique constraints DEV có thể thêm sau

Tùy nhu cầu thực tế, có thể thêm:
- `UNIQUE (tenant_id, name)` cho beneficiaries nếu business muốn
- `UNIQUE (payment_intent_id, provider_txn_ref)` cho settlement records
- `UNIQUE (device_id, event_time, event_type)` nếu adapter normalize đủ tốt

Không nên ép quá sớm nếu chưa rõ provider data quality.

## 25. DB access conventions

### 25.1 Không query `SELECT *`

Luôn chọn explicit columns ở repository.

### 25.2 Pagination query phải có stable sort

Ví dụ:
- `ORDER BY created_at DESC, id DESC`

### 25.3 Reads nặng cho dashboard nên tách read-model query

Không reuse write repository queries một cách ép buộc.

## 26. Backup và export rules

Dù D1 là managed, DEV vẫn nên có:
- migration source control
- periodic export strategy cho audit/runs nếu cần
- không phụ thuộc "platform sẽ tự lo tất cả"

## 27. Migration review checklist

Trước khi merge một migration mới:
- có backward-safe không
- có cần data backfill không
- repository/service đã cập nhật chưa
- indexes có đủ không
- có phá seed/local dev không
- có test run detail / list view query không

## 28. MVP data integrity checklist

- tenant -> workspace FK hoạt động
- run -> steps -> events liên kết đúng
- payment -> settlement link đúng
- device -> events/commands link đúng
- proof -> artifact link đúng
- audit vẫn ghi dù action fail ở giữa nếu phù hợp
- policy decision record có thể truy ngược run/step

## 29. Kết luận bổ sung

Migration V1 không chỉ là tạo bảng. Nó phải là nền kỷ luật dữ liệu cho toàn hệ.

Nếu giữ đúng:
- timestamps thống nhất
- ids có prefix
- FK bật thật
- soft-disable đúng chỗ
- status validate ở app layer
- seed tối thiểu rõ ràng

thì D1 sẽ đủ tốt để đỡ MVP và giai đoạn tăng trưởng đầu mà không phải đập lại schema sớm.
