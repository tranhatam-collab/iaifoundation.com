# INTENT_OS_RUN_DETAIL_PAGE_SPEC
## Intent OS Run Detail Page Specification
## Version: 1.0
## Status: Build Ready
## Owner: IAI Foundation / Intent OS

## 1. Mục tiêu

Run Detail là trang quan trọng nhất của Runtime UI.  
Nó phải cho operator/auditor thấy toàn bộ lifecycle của một run:

- intent context
- execution graph/steps
- approvals
- payments
- device actions
- proofs
- reconciliations
- audit references

## 2. Route

- `/app/runs/:runId`

Required query context:
- `tenantId`
- `workspaceId`

## 3. Primary use cases

- Operator debug run bị fail/stuck.
- Approver xem ngữ cảnh trước khi approve/reject.
- Finance đối soát payment status trong run.
- Auditor truy xuất evidence chain end-to-end.

## 4. Page layout

## 4.1 Header bar

Fields:
- run id
- template name/version
- status badge
- started_at / duration / ended_at
- created_by actor
- tenant/workspace tags

Actions (role-gated):
- cancel run
- retry run
- quarantine run
- export run bundle

## 4.2 Left column: lifecycle and steps

Widgets:
- run state timeline (created -> resolved -> planned -> ...)
- step tree view
- selected step detail card
- retry/timeout counters

## 4.3 Right column: evidence and domain panes

Tabs:
- approvals
- payments
- devices
- proofs
- reconciliation
- events raw
- audit links

## 5. Data sources and APIs

- `GET /v1/runs/:id`
- `GET /v1/runs/:id/events`
- `GET /v1/runs/:id/trace`
- `POST /v1/runs/:id/approve`
- `POST /v1/runs/:id/reject`
- `POST /v1/runs/:id/retry`
- `POST /v1/runs/:id/cancel`
- `POST /v1/runs/:id/proof`

Optional related fetches:
- payment intent by run
- device commands by run
- approval requests by run

## 6. Run summary data contract

```json
{
  "run_id": "run_1",
  "status": "running",
  "template": {"id":"tpl_1","name":"Pay Supplier","version":"1.0.0"},
  "policy_snapshot_id": "pol_snap_1",
  "created_by_actor_id": "usr_1",
  "started_at": "2026-03-31T10:00:00Z",
  "ended_at": null,
  "current_step": {
    "id": "step_4",
    "type": "approval_step",
    "state": "waiting"
  }
}
```

## 7. Timeline component requirements

- Hiển thị cả run state transitions và step events trên cùng trục thời gian.
- Có filters theo event type:
  - run.*
  - step.*
  - approval.*
  - payment.*
  - device.*
  - proof.*
- Cho phép copy `event_id` và mở raw payload ref.

## 8. Step detail panel

Mỗi step phải hiển thị:
- step type/name/order
- input/output refs
- attempts/max attempts
- timeout info
- policy decision ref (nếu có)
- proof status
- linked actions (payment/device/connector calls)

## 9. Approval tab

Show:
- approval requests list
- approver info
- reason/comment
- signature/session proof
- SLA timers + escalation state

Actions:
- approve/reject (nếu user có quyền và request pending)

## 10. Payments tab

Show:
- payment intents mapped theo step
- amount/asset/beneficiary
- settlement records
- reconciliation result
- idempotency keys (read-only)

Warnings:
- mismatched reconciliation
- duplicate attempt suspicion

## 11. Devices tab

Show:
- device commands with status timeline
- desired vs observed vs confirmed state
- gateway acknowledgements
- trust/risk indicators

Warnings:
- quarantined device
- state drift
- repeated command failures

## 12. Proof tab

Show:
- proof bundles grouped by step
- proof type/source
- validation status
- confidence score
- artifact preview links (R2 refs via signed URL)

Actions:
- upload supplemental proof (policy-gated)

## 13. Reconciliation tab

Show:
- expected vs actual summaries
- per-domain result:
  - payment
  - device
  - proof
- final consistency status

## 14. Actions and safety controls

### 14.1 Cancel run

- allowed only for non-terminal states
- mandatory reason
- confirm modal
- emit audit event

### 14.2 Retry run

- chỉ khi policy cho phép
- hiển thị step scope sẽ retry
- idempotency key required

### 14.3 Quarantine run

- high-risk action
- requires elevated role + optional step-up auth
- freeze further side effects

## 15. Realtime behavior

- SSE/WebSocket subscribe cho:
  - run state changes
  - step updates
  - approval updates
  - payment/device/proof events
- fallback polling mỗi 15-30s nếu realtime unavailable

## 16. Error and empty states

- `RESOURCE_NOT_FOUND`: show run not found or no tenant access.
- `TENANT_SCOPE_MISMATCH`: show scope mismatch guidance.
- connector/payment/device partial data fail: hiển thị panel-level warning, không crash cả page.

## 17. Performance requirements

- Initial run detail render p95 < 2s (without large artifact fetch).
- Event timeline incremental load bằng cursor.
- Tránh load full raw payload body ở lần đầu.

## 18. Audit requirements

Mọi action trên run detail (approve/reject/retry/cancel/quarantine/upload proof) phải:
- có `X-Request-Id`
- có `Idempotency-Key` nếu side-effect
- ghi audit reference trả ngược về UI

## 19. Done criteria

- Operator debug được failure path không cần rời page.
- Approver xử lý approval với đủ context evidence.
- Auditor truy xuất được chain policy -> action -> proof -> reconciliation -> audit.
- Không có action nào bypass role/policy guard.
