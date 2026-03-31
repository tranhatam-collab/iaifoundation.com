# INTENT_OS_MVP_BUILD_ORDER
## Intent OS MVP Build Order
## Version: 1.0
## Status: Execution Ready
## Owner: IAI Foundation / Intent OS

## 1. Mục tiêu

Tài liệu này chốt thứ tự build MVP theo dependency thực tế để:

- giảm rework
- khóa sớm core contracts
- có demo end-to-end sớm
- giữ hệ thống đúng hướng Intent OS (policy-first, proof-aware, multi-domain)

## 2. Nguyên tắc triển khai

- Build từ foundation contracts -> runtime loops -> domain rails -> dashboard.
- Mỗi phase phải có demo path chạy được, không build mù.
- Không mở rộng feature khi chưa đạt done criteria của phase trước.
- Mọi side effect endpoint phải idempotent trước khi đưa QA.

## 3. Build phases

## Phase 0: Foundation lock (Week 1)

Deliverables:
- Repo structure backend/frontend/workers
- Shared types package (IDs, enums, envelopes, error codes)
- OpenAPI skeleton + lint rules
- Auth baseline + tenant/workspace headers

Done criteria:
- API skeleton chạy local + staging
- Request/response envelopes thống nhất
- CI check pass

## Phase 1: Control Plane core (Week 2-3)

Deliverables:
- D1 migrations: tenants/workspaces/users/roles/role_bindings
- Policy packs CRUD + evaluate + publish
- Intent templates CRUD + publish lifecycle
- Connector registry CRUD + health test
- Audit events append-only

Done criteria:
- Tenant admin tạo được workspace, role binding, policy, template
- Policy evaluate endpoint trả decision đúng contract
- Audit log ghi đầy đủ mutation path

## Phase 2: Runtime vertical slice (Week 4-5)

Deliverables:
- Runtime intake `/v1/intents/execute`
- Run + step + event model
- Template-driven execution coordinator
- Approval wait/resume
- Basic retries + timeout handling
- Run detail APIs (`/runs/:id`, `/events`, `/trace`)

Done criteria:
- Demo flow: create intent -> approval -> run success
- Event sequence immutable, ordered
- Retry path không tạo side effect duplicate

## Phase 3: Payment rails MVP (Week 6-7)

Deliverables:
- Wallet profiles + beneficiaries
- Payment intents + authorize/capture/payout/refund
- Settlement records + reconciliation basic
- Payment policy gate + approval thresholds
- Proof-attached payment flow

Done criteria:
- Demo flow: pay supplier on verified proof
- Reconciliation states: matched/pending/mismatched
- Idempotency conflict được xử lý đúng 409

## Phase 4: Device gateway MVP (Week 8-9)

Deliverables:
- Gateway registry + test
- Device registry + capability profiles
- Command routing + state ingestion
- Device events ingest + dedupe + trust score basic
- Quarantine + kill switch basic

Done criteria:
- Demo flow: unlock door command with policy + proof
- Device event -> runtime trigger path chạy được
- Quarantine chặn command đúng policy

## Phase 5: Unified admin dashboard (Week 10-11)

Deliverables:
- Overview dashboard aggregates
- Screens: policy/templates/runs/approvals/payments/devices/audit/usage
- Role-gated navigation + page access
- Sensitive action confirmation + reason capture

Done criteria:
- Operator có thể xử lý full lifecycle từ 1 UI
- Auditor xem được trace + audit + reconciliation
- p95 dashboard load đạt target nội bộ

## Phase 6: Hardening + pilot (Week 12)

Deliverables:
- SLO instrumentation
- Alerting for stuck run / payment failure / connector degraded / device offline
- Backfill jobs + retention jobs
- Pilot tenant onboarding checklist

Done criteria:
- End-to-end smoke suite pass
- Incident runbook test pass (tabletop)
- Pilot tenant vận hành workflow thật đầu tiên

## 4. Recommended sprint backlog order

1. Shared contracts + auth scope
2. D1 schema + migrations
3. Control Plane APIs
4. Runtime run loop
5. Approval coordinator
6. Payment integration slice
7. Device integration slice
8. Dashboard + observability
9. Hardening and pilot

## 5. Critical dependency map

- Runtime phụ thuộc template + policy publish contract.
- Payments phụ thuộc approval + proof hooks từ runtime.
- Device commands phụ thuộc policy + run step model.
- Dashboard phụ thuộc API stability + audit coverage.

## 6. Test strategy by phase

- Phase 1: contract tests + authz tests + tenant isolation tests
- Phase 2: workflow state machine tests + idempotency tests
- Phase 3: payment sandbox integration tests + reconciliation tests
- Phase 4: adapter simulation tests + command safety tests
- Phase 5: role-based E2E UI tests
- Phase 6: chaos drills (connector down, policy engine down, delayed approval)

## 7. MVP demo scenarios bắt buộc

- Scenario A: Pay supplier on delivery proof
- Scenario B: Unlock facility for verified contractor
- Scenario C: Sensor-triggered reorder with approval threshold

Mỗi scenario phải có:
- policy decision log
- approval evidence
- execution trace
- payment/device proof
- reconciliation outcome
- audit bundle

## 8. Risks and mitigations

- **Policy drift** -> lock policy version snapshot vào run start.
- **Connector instability** -> health gating + degraded mode flags.
- **Duplicate side effects** -> idempotency everywhere.
- **Tenant data leaks** -> enforce scope at middleware + query layer.
- **Over-complex MVP** -> giữ strict phase gate, không mở adaptive planner sớm.

## 9. Team composition gợi ý

- 1 Tech Lead (architecture/contracts)
- 2 Backend engineers (control/runtime)
- 1 Backend engineer (payments/device adapters)
- 1 Frontend engineer (admin dashboard)
- 1 QA/SDET (contract + E2E + integration)
- 1 DevOps/SRE part-time (CI/CD, observability, runbooks)

## 10. Exit criteria MVP

MVP được xem là complete khi:

- 3 demo scenarios chạy production-like environment
- audit/proof/reconciliation truy xuất được xuyên suốt
- side effects không duplicate trong retry/failure paths
- tenant isolation verified
- pilot tenant có thể vận hành thực tế với human approvals
