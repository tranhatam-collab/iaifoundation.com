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

## 28. UI block order cố định cho MVP

Thứ tự block trên run detail phải là:

1. Breadcrumb
2. Page Header
3. Status + Action Bar
4. Summary Cards Row
5. Alerts Panel
6. Timeline
7. Steps
8. Approvals
9. Payments
10. Proofs
11. Devices
12. Reconciliation
13. Audit References
14. Internal Notes

Không đổi lung tung theo cảm hứng, vì run detail là screen trọng yếu.

## 29. Breadcrumb spec

Format:
- `Runs / {runId}`

Nếu có template readable:
- `Runs / {runId} / {templateName}` là optional

MVP chỉ cần:
- `Runs / run_123`

## 30. Header spec chi tiết

### 30.1 Left side
- Run ID
- Intent summary title
- subline: Template · Workspace · Initiator

### 30.2 Right side
- status badge
- risk badge
- created/started time
- overflow actions menu

### 30.3 Intent summary title source

Ưu tiên:
1. human-readable normalized title nếu runtime có
2. template name + key target
3. fallback `Run {id}`

## 31. Status bar spec chi tiết

Hiển thị theo 1 hàng hoặc 2 hàng compact:
- Current status
- Current step
- Awaiting approval
- Payment summary
- Proof summary
- Device summary

Ví dụ:
- Status: Awaiting Approval
- Current Step: approval_payment_release
- Approval: 1 pending
- Payment: 1 intent pending payout
- Proof: 2/2 required proofs present
- Devices: no device actions

## 32. Action button priority

### 32.1 Visible primary actions theo status

#### `awaiting_approval`
- Approve
- Reject

#### `failed`
- Retry Run
- Open Failed Step

#### `running` / `waiting_external`
- Cancel Run
- Quarantine Run

#### `quarantined`
- Review Quarantine
- Unquarantine nếu role phù hợp

#### `succeeded`
- Export Trace
- Open Reconciliation

### 32.2 Overflow menu actions
- Copy Run ID
- Open Events
- Open Trace
- Add Internal Note

## 33. Summary card exact fields

### 33.1 Execution card
- Status
- Started at
- Duration
- Total steps
- Failed steps

### 33.2 Approval card
- Pending
- Approved
- Rejected
- Next expiring approval time nếu có

### 33.3 Payment card
- Linked payments
- Total amount
- Latest payment status
- Reconciliation badge

### 33.4 Proof card
- Linked proofs
- Required proofs complete yes/no
- Lowest confidence proof
- Invalid proofs count

### 33.5 Device card
- Linked devices
- Commands count
- Last device event
- Device alerts count

## 34. Alerts panel spec

Alerts phải đứng cao, ngay dưới summary cards nếu có bất thường.

### Alert priorities
1. high risk / quarantined
2. overdue approval
3. failed payment
4. reconciliation mismatch
5. low proof confidence
6. device stale event
7. connector degraded during run

### Mỗi alert item gồm
- severity icon
- short text
- reason
- CTA

Ví dụ:
- `Approval overdue by 2h` -> Open Approval
- `Payment settlement mismatch` -> Open Reconciliation

## 35. Timeline spec cụ thể

### 35.1 Timeline grouping
- Today
- Yesterday
- Earlier

hoặc theo absolute timestamps nếu ngắn.

### 35.2 Timeline item format
- icon
- title
- short description
- timestamp
- actor chip
- open detail link

### 35.3 Timeline item examples
- Run created by Jane
- Policy allowed with approval
- Approval requested from Finance Manager
- Approval approved by Minh
- Payment intent created
- Proof validated with confidence 0.91
- Run succeeded

## 36. Steps section spec cụ thể

### 36.1 Default collapsed state
- collapsed by default
- current active step expanded
- failed step expanded automatically

### 36.2 Step row compact fields
- Step name
- Type
- State
- Attempts
- Duration
- Mini badges: proof/payment/device/approval

### 36.3 Expanded detail blocks
1. Input summary
2. Output summary
3. Policy decision
4. Linked approval
5. Linked payment
6. Linked proof
7. Linked device action
8. Error details

### 36.4 Step badges
- approval
- payment
- proof
- device
- retrying
- failed

## 37. Approvals panel spec cụ thể

### 37.1 If no approvals
Show:
- No approvals in this run

### 37.2 Approval row
- Approval ID
- Status
- Requested at
- Assigned to
- Expires at
- Reason

### 37.3 Inline approval card for pending

Nếu có approval pending và user có quyền, phải có sticky action card:
- reason summary
- triggered rule
- Approve
- Reject
- comment box

## 38. Payments panel spec cụ thể

### 38.1 No payments state
- No payment actions linked

### 38.2 Payment row fields
- Payment ID
- Type
- Amount
- Asset
- Beneficiary
- Provider
- Status
- Reconciliation

### 38.3 Expanded payment item
- attempts list
- settlement refs
- fee
- timestamps
- approval link
- proof link

### 38.4 CTA rules
- Failed payment -> Retry/Reconcile CTA
- Pending reconcile -> Open Reconciliation CTA

## 39. Proofs panel spec cụ thể

### 39.1 Required proof summary banner
Ví dụ:
- Required proofs: 2/2 complete
- Lowest confidence: 0.74
- Validation: 1 needs review

### 39.2 Proof row fields
- Proof ID
- Type
- Source
- Validation status
- Confidence
- Created at

### 39.3 Detail preview

Nếu image/video:
- thumbnail or preview

Nếu document:
- icon + metadata

### 39.4 Validation actions
- Validate
- Reject
- View full proof

## 40. Devices panel spec cụ thể

### 40.1 No devices state
- No device actions linked

### 40.2 Command rows
- Command ID
- Device
- Command type
- Status
- Requested at
- Acknowledged at
- Completed at

### 40.3 Event rows
- Event type
- Device
- Event time
- Trust score

### 40.4 Device risk UI
Nếu device quarantined hoặc stale:
- show warning chip ngay row level

## 41. Reconciliation block spec cụ thể

Dạng checklist 4 dòng:
- Payment reconciliation
- Proof reconciliation
- Device reconciliation
- Final outcome reconciliation

Mỗi dòng:
- status badge
- short explanation
- open detail link

Ví dụ:
- Payment reconciliation: matched
- Proof reconciliation: requires_review because confidence below threshold
- Final outcome: pending until approval

## 42. Audit references block spec cụ thể

Hiển thị 5-10 audit records gần nhất liên quan nhất:
- action
- actor
- timestamp
- resource

CTA:
- Open full audit record
- Open audit module filtered by run

## 43. Internal notes block spec cụ thể

### Fields
- note body
- author
- timestamp

### Actions
- add note
- edit own note nếu policy cho phép
- pin note later not required in MVP

## 44. API field mapping rules

Run detail frontend phải map từ API theo cấu trúc ổn định:
- `run`
- `intent`
- `template`
- `summary`
- `timeline`
- `steps`
- `approvals`
- `payments`
- `proofs`
- `devices.commands`
- `devices.events`
- `reconciliation`
- `audit_refs`
- `notes`

Không fetch từng panel một cách tùy tiện ở MVP nếu không cần. Ưu tiên 1 endpoint detail đầy đủ + lazy load trace/events phụ sau.

## 45. Performance rules

### 45.1 Tiered loading
- header + summary load first
- main blocks load second
- notes/audit refs load third if needed

### 45.2 Avoid giant raw payload rendering by default

Raw JSON chỉ hiện khi:
- user mở expand
- hoặc qua dedicated raw trace page

## 46. Error/degraded states cho run detail

### 46.1 Partial degradation

Nếu payments service tạm lỗi:
- run detail vẫn load
- payments block show degraded banner

### 46.2 Missing linked resource

Nếu linked proof bị thiếu artifact:
- show broken resource state
- vẫn giữ row record

### 46.3 Permission partial

Nếu user không có quyền xem payment detail:
- panel vẫn show summary limited
- CTA disabled/hidden

## 47. Role-specific emphasis

### Owner/Admin
Thấy full blocks và full actions.

### Approver
Approval panel nổi bật hơn. Approve/Reject sticky action hiển thị rõ.

### Finance
Payments + reconciliation block đẩy cao hơn bằng section priority hoặc quick jump.

### Auditor
Audit refs + timeline + steps mở rộng thuận tiện hơn, action destructive ẩn.

## 48. Quick jump nav trong page

Ở đầu phần content nên có jump links:
- Timeline
- Steps
- Approvals
- Payments
- Proofs
- Devices
- Reconciliation
- Audit

Rất hữu ích khi run dài.

## 49. Sticky side panel gợi ý

Desktop có thể có side panel sticky chứa:
- current status
- primary actions
- key metrics
- alerts

Điều này giúp operator không phải scroll lên lại để hành động.

## 50. MVP visual priorities

Không cần fancy. Cần:
- status rất rõ
- alerts rõ
- current step rõ
- pending approval rõ
- failed payment rõ
- proof completeness rõ

## 51. Anti-patterns cho run detail

- dump raw JSON ra màn hình chính
- current step không nổi bật
- approvals bị chôn sâu
- không link sang resources liên quan
- timeline chỉ có event codes khó hiểu
- actions phân tán nhiều chỗ
- không có reconciliation summary
- badge/status màu không nhất quán

## 52. Acceptance checklist cho run detail

Một run detail đạt yêu cầu khi operator có thể trả lời trong dưới 30 giây:
- Run này là gì
- Đang ở trạng thái nào
- Kẹt ở đâu
- Còn thiếu approval không
- Payment đã đi chưa
- Proof đã đủ chưa
- Có device nào liên quan không
- Có mismatch/risk nào không
- Tôi nên bấm gì tiếp theo

Nếu không trả lời nhanh được 9 câu này, screen chưa đạt.

## 53. Kết luận bổ sung

Run Detail không được thiết kế như trang kỹ thuật cho DEV xem log. Nó phải là màn hình vận hành cho người ra quyết định.

Tiêu chuẩn cuối cùng:
- hiểu nhanh
- tin được
- hành động được
- truy vết được
