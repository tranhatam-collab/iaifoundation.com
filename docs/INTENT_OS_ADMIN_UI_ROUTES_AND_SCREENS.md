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
