# INTENT_OS_ADMIN_UI_ROUTES_AND_SCREENS
## Intent OS Admin UI Routes and Screens
## Version: 1.0
## Status: Build Ready
## Owner: IAI Foundation / Intent OS

## 1. Mục tiêu

Định nghĩa routing + screen map cho Admin UI MVP để frontend team implement nhất quán với API và RBAC.

## 2. Route design principles

- Tất cả route nằm dưới `/app`.
- Context tenant/workspace là bắt buộc trong query or state.
- Route nhạy cảm cần guard theo role trước khi render.
- Deep-link support cho run/payment/device/audit investigations.

## 3. Top-level routes

- `/app/overview`
- `/app/tenants`
- `/app/workspaces`
- `/app/users`
- `/app/roles`
- `/app/policy-packs`
- `/app/templates`
- `/app/runs`
- `/app/approvals`
- `/app/payments`
- `/app/beneficiaries`
- `/app/wallet-profiles`
- `/app/gateways`
- `/app/devices`
- `/app/connectors`
- `/app/audit`
- `/app/usage-billing`
- `/app/settings`

## 4. Detail routes

- `/app/tenants/:tenantId`
- `/app/workspaces/:workspaceId`
- `/app/users/:userId`
- `/app/policy-packs/:policyPackId`
- `/app/templates/:templateId`
- `/app/runs/:runId`
- `/app/approvals/:approvalId`
- `/app/payments/:paymentIntentId`
- `/app/devices/:deviceId`
- `/app/gateways/:gatewayId`
- `/app/connectors/:connectorId`
- `/app/audit/:auditEventId`

## 5. Query params standard

- `tenantId`
- `workspaceId`
- `status`
- `from`
- `to`
- `q`
- `cursor`

Example:

`/app/runs?tenantId=ten_1&workspaceId=ws_ops&status=running`

## 6. Screen definitions (MVP)

## 6.1 Overview (`/app/overview`)

Sections:
- runtime health cards
- approval inbox summary
- payment and device alerts
- connector degraded list
- usage vs plan summary

APIs:
- `GET /v1/dashboard/overview`

## 6.2 Runs list (`/app/runs`)

Columns:
- run id
- template
- status
- created by
- started at
- duration
- approval state

Actions:
- open detail
- cancel (if allowed)
- retry (if allowed)
- quarantine (if allowed)

APIs:
- `GET /v1/runs`
- `POST /v1/runs/:id/cancel`
- `POST /v1/runs/:id/retry`

## 6.3 Approvals (`/app/approvals`)

Columns:
- approval id
- run id
- requester
- approval mode
- status
- requested at
- expires at

Actions:
- approve
- reject
- add comment

APIs:
- `POST /v1/runs/:id/approve`
- `POST /v1/runs/:id/reject`

## 6.4 Payments (`/app/payments`)

Columns:
- payment intent id
- run id
- amount/asset
- beneficiary
- status
- reconciliation status

Actions:
- open detail
- reconcile trigger
- refund (policy-gated)

APIs:
- `GET /v1/payments/intents/:id`
- `POST /v1/payments/reconcile`
- `POST /v1/payments/intents/:id/refund`

## 6.5 Devices (`/app/devices`)

Columns:
- device id/name
- gateway
- capability class
- status
- last seen
- risk class

Actions:
- open detail
- quarantine/unquarantine
- send command (scoped)

APIs:
- `GET /v1/devices`
- `POST /v1/devices/:id/commands`
- `POST /v1/devices/:id/quarantine`
- `POST /v1/devices/:id/unquarantine`

## 6.6 Audit (`/app/audit`)

Columns:
- timestamp
- actor
- action
- resource
- tenant/workspace
- request id

Actions:
- open event detail
- export range

## 7. Route guard matrix (baseline)

- `platform_admin`: all routes
- `tenant_admin`: all tenant routes except platform-only
- `workspace_admin`: workspace-scoped routes
- `approver`: `/app/approvals`, `/app/runs`, read-only others
- `finance_manager`: `/app/payments`, `/app/beneficiaries`, `/app/wallet-profiles`
- `auditor`: `/app/audit` + read-only run/payment/device
- `support_agent`: read-only limited routes

## 8. Navigation groups

- **Operations**: overview, runs, approvals, templates
- **Finance**: payments, beneficiaries, wallet profiles, usage-billing
- **Physical world**: gateways, devices
- **Governance**: policy-packs, roles, users, audit
- **System**: connectors, settings

## 9. UX requirements for mutating actions

- confirmation dialog bắt buộc
- reason required cho sensitive actions
- show policy decision preview nếu có
- gửi `Idempotency-Key` cho tất cả POST side-effects
- show audit reference sau thành công

## 10. Frontend folder map suggestion

```txt
apps/admin-ui/src/app/
  (app)/
    overview/page.tsx
    runs/page.tsx
    runs/[runId]/page.tsx
    approvals/page.tsx
    payments/page.tsx
    payments/[paymentIntentId]/page.tsx
    devices/page.tsx
    devices/[deviceId]/page.tsx
    policy-packs/page.tsx
    templates/page.tsx
    audit/page.tsx
```

## 11. Done criteria

- Route guards hoạt động đúng role matrix.
- Deep-link mở đúng context tenant/workspace.
- Mọi action side-effect có idempotency + success/error toasts.
- Không có screen nào gọi API ngoài scope đã chọn.

## 30. Sidebar information architecture chuẩn

Sidebar trái theo nhóm:

### Group 1 - Operate
- Overview
- Inbox
- Runs
- Approvals

### Group 2 - Configure
- Templates
- Policies
- Connectors

### Group 3 - Money
- Payments
- Wallets
- Beneficiaries

### Group 4 - Physical World
- Devices
- Gateways
- Proofs

### Group 5 - Control
- Audit
- Usage
- Settings

Platform-only:
- Platform Tenants
- Plans
- System Jobs
- Incidents

## 31. Topbar behavior

Topbar phải có:
- workspace selector
- global search
- quick actions
- notifications bell
- current user menu

### Workspace selector rule

Đổi workspace thì:
- route giữ nguyên nếu screen support workspace context
- filter data theo workspace mới
- nếu screen không phù hợp thì redirect về `/admin/overview`

## 32. Global search behavior

Global search nên tìm ít nhất:
- run id
- payment id
- device id
- template name
- beneficiary name
- connector id

Search result grouped:
- Runs
- Payments
- Devices
- Templates
- Beneficiaries

## 33. Quick action menu

Quick actions cố định:
- Create Template
- Create Intent
- Add Beneficiary
- Add Device
- Test Connector

Không nên đưa quá nhiều action vào đây ở MVP.

## 34. Table UX rules chung

Tất cả list pages phải có:
- sticky header
- selectable filters
- clear sort
- clickable primary column
- empty state
- loading skeleton
- pagination or load more

### Primary clickable column rule

- Runs: Run ID hoặc Intent Summary
- Payments: Payment ID
- Devices: Device ID hoặc Device Name
- Templates: Template Name
- Approvals: Approval ID

## 35. Filter bar standard

Mọi list module nên có filter bar cùng pattern:
- search box
- status dropdown
- workspace dropdown nếu cần
- date range
- advanced filters button
- clear filters button

## 36. Empty state copy logic

Empty state không được trống vô nghĩa.

### Runs empty state
- "No runs found for this filter"
- CTA: Clear filters

### Approvals empty state
- "No approvals pending"
- CTA: Back to Inbox

### Templates empty state
- "No templates yet"
- CTA: Create Template

### Devices empty state
- "No devices registered"
- CTA: Add Device

### Payments empty state
- "No payments recorded yet"
- CTA: Open Runs

## 37. Permission-aware UI rules

Nếu user không có quyền action:
- vẫn thấy detail nếu role cho phép read
- nút action disabled hoặc hidden theo policy UX quyết định
- nhưng không làm layout vỡ

Ví dụ: auditor thấy Approve panel ở read-only mode, không thấy nút Approve.

## 38. Runs list page spec bổ sung

### Default sort
- `created_at desc`

### Status colors
- succeeded = green-ish
- failed = red-ish
- awaiting_approval = amber
- running = blue
- quarantined = purple or danger-outline
- cancelled = neutral

### Row click

Click row mở detail. Action menu ở cuối row:
- Open
- Retry
- Cancel
- Quarantine

theo quyền.

## 39. Approvals list page spec bổ sung

### Tabs
- Pending
- Completed
- Expired

### Inline summary chips
- payment-related
- device-related
- proof-related

### Row priority highlight

Approval quá hạn hoặc sắp hết hạn phải nổi bật hơn.

## 40. Templates editor screen spec bổ sung

Editor chia 2 cột:

### Left
- form fields
- schema blocks
- rules sections

### Right
- preview summary
- validation warnings
- publish state
- version info

Footer sticky:
- Save Draft
- Validate
- Publish
- Cancel

## 41. Policy editor screen spec bổ sung

Không làm visual builder quá sớm. MVP editor nên là structured form + JSON advanced panel.

Sections:
- General
- Approval rules
- Payment rules
- Device rules
- Proof rules
- Risk rules

Right panel:
- affected resources
- simulation shortcut
- publish status

## 42. Payments list page spec bổ sung

### Summary chips đầu trang
- total volume
- failed today
- pending reconciliation
- beneficiaries pending verification

### Row badges
- rail/provider badge
- asset badge
- reconciliation badge

## 43. Payment detail navigation rule

Payment detail phải link ra được:
- run detail
- beneficiary detail
- wallet detail
- attempts subpage
- reconciliation subpage

Breadcrumb:
- `Payments / pay_123`

## 44. Devices list page spec bổ sung

### View modes
- table
- optional cards later

### Important columns
- Device
- Type
- Protocol
- Gateway
- Location
- Status
- Last Seen
- Risk

### Row actions
- Open
- Send Command
- Quarantine
- View Events

## 45. Device detail page bổ sung

Header:
- device id
- human label
- type
- protocol
- gateway
- location
- status
- last seen

Cards:
- current state
- health
- recent commands
- recent events
- linked proofs

Tabs:
- Overview
- Events
- Commands
- State
- Policy

## 46. Proofs list page bổ sung

### Thumbnail support

Nếu artifact là image/video thì có thumbnail cột đầu.

### Confidence rendering
- numeric + label
- low confidence nổi bật

### Validation badge
- pending
- valid
- invalid
- needs_review

## 47. Connectors list page bổ sung

### Health states
- healthy
- degraded
- failing
- disabled
- unknown

### Quick actions
- Test
- View Logs
- Disable
- Open

Connector degraded nên có badge dễ thấy vì ảnh hưởng toàn hệ.

## 48. Audit list page bổ sung

Audit table nên ưu tiên đọc nhanh:
- time
- actor
- action
- resource
- request id

Có side panel preview khi click row:
- before
- after
- reason
- context links

## 49. Usage page bổ sung

MVP usage page nên có:
- current plan
- usage by meter
- period start/end
- nearing limits alerts

Không cần chart quá đẹp lúc đầu. Ưu tiên rõ số liệu và nguy cơ chạm trần.

## 50. Settings screen structure cụ thể

### `/admin/settings`

Landing page với cards:
- Tenant
- Workspace
- Security
- API Tokens
- Notifications

### `/admin/settings/security`

Sections:
- MFA state
- active sessions
- token policy
- re-auth for sensitive actions

### `/admin/settings/api-tokens`

Table:
- token name
- scopes
- last used
- expires at
- status

Actions:
- create
- revoke

## 51. Breadcrumb rules

Mọi detail/edit page phải có breadcrumb.

Ví dụ:
- `Runs / run_123`
- `Templates / Pay Supplier on Delivery / Edit`
- `Devices / dev_123 / Events`

## 52. Modal vs full page rules

### Dùng full page cho
- run detail
- payment detail
- device detail
- template edit
- policy edit

### Dùng modal cho
- approve/reject
- retry run
- cancel run
- quick add beneficiary
- quick connector test

## 53. Responsive behavior cho admin

Desktop-first, nhưng vẫn cần usable ở width vừa.

### `< 1200px`
- right-side summary panels stack xuống dưới

### `< 900px`
- sidebar collapse icon mode
- tables horizontal scroll controlled

### `< 640px`
- chỉ cần usable, không cần hoàn hảo như mobile app

## 54. MVP screen priority order

FE nên build theo thứ tự:
1. Login
2. Admin shell
3. Overview
4. Runs list
5. Run detail
6. Approvals list/detail
7. Templates list/edit
8. Payments list/detail
9. Proofs list/detail
10. Devices list/detail
11. Connectors list
12. Audit list
13. Settings
14. Usage

## 55. Anti-patterns cho admin UI

- quá nhiều chart
- table thiếu filter/search
- detail page chỉ dump raw JSON
- thiếu breadcrumb
- nút action ẩn khó tìm
- empty state vô nghĩa
- status badge không nhất quán
- route param naming lộn xộn
- mỗi page một pattern UI khác nhau

## 56. Kết luận bổ sung

Admin UI đúng không nằm ở việc đẹp nhiều hiệu ứng. Nó nằm ở chỗ:
- route sạch
- module rõ
- list page lọc tốt
- detail page đọc hiểu nhanh
- action đúng chỗ
- permission rõ
- operator vào là làm việc được ngay

Đó là tiêu chuẩn phải khóa cho FE từ đầu.
