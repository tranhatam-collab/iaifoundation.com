# INTENT_OS_ADMIN_DASHBOARD_SPEC
## Intent OS Admin Dashboard Specification
## Version: 1.0
## Status: Build Ready
## Owner: IAI Foundation / Intent OS

## 1. Mục tiêu

Admin Dashboard là bề mặt vận hành cho Control Plane + Runtime:

- quản trị tenant/workspace/identity
- theo dõi run/approval/payment/device/proof
- can thiệp có kiểm soát (override/quarantine/retry)
- quan sát audit/compliance/billing

Nguyên tắc: dashboard không chứa business truth; chỉ thao tác qua API + policy.

## 2. User personas

- Platform Admin (internal)
- Tenant Owner/Admin
- Workspace Operator
- Finance Manager
- Approver
- Auditor/Compliance
- Support Agent (restricted)

## 3. Information architecture

### 3.1 Primary sections

- Overview
- Tenants & Workspaces
- Identity & Access
- Policy Studio
- Template Studio
- Runtime Runs
- Approvals
- Payments
- Device Gateway
- Proof & Reconciliation
- Connector Hub
- Usage & Billing
- Audit Console
- Settings

### 3.2 Access boundaries

- Platform scope chỉ hiển thị cho internal ops.
- Tenant scope không thấy dữ liệu tenant khác.
- Workspace filters mặc định bắt buộc trên mọi screen nghiệp vụ.

## 4. Core screens (MVP)

## 4.1 Overview

Widgets:
- active runs
- runs stuck > SLA
- pending approvals
- payment failure rate
- device offline count
- proof rejection rate
- connector degraded count
- usage vs plan

## 4.2 Tenants & Workspaces

Capabilities:
- create/edit tenant
- create/edit workspace
- plan/billing plan assignment
- workspace default policy pack binding

## 4.3 Identity & Access

Capabilities:
- user list + status
- role catalog
- role bindings
- scoped permissions preview (effective permission check)
- suspicious access alerts (basic)

## 4.4 Policy Studio

Capabilities:
- policy pack CRUD
- JSON editor + schema validation
- dry-run evaluate (`/v1/policy-evaluate`)
- publish flow with approvals
- version diff

## 4.5 Template Studio

Capabilities:
- template CRUD/versioning
- manifest/ui schema editors
- policy & proof requirements binding
- lifecycle transitions: draft -> review -> approved -> published

## 4.6 Runtime Runs

Capabilities:
- run list + filters (status, template, tenant, workspace, time)
- run detail (step tree, event stream, handoff trace)
- actions: retry, cancel, quarantine, resume
- SLA breach indicators

## 4.7 Approvals

Capabilities:
- approval inbox
- approve/reject with reason
- escalation timers
- delegated approval route (if policy allows)
- approval evidence display

## 4.8 Payments

Capabilities:
- payment intents list/detail
- settlement and reconciliation status
- beneficiary registry management
- wallet profile management
- refund trigger (policy-gated)

## 4.9 Device Gateway

Capabilities:
- gateway registry + health
- device registry + capability + risk class
- command history and live state
- quarantine/unquarantine
- kill switch by gateway/device/risk class

## 4.10 Audit Console

Capabilities:
- append-only audit stream
- filters by actor/resource/action/tenant/time
- diff view before/after
- export signed audit bundle (async job)

## 5. UX patterns bắt buộc

- Multi-tenant banner luôn hiển thị tenant/workspace context hiện tại.
- Mọi action nhạy cảm có confirmation modal + lý do bắt buộc.
- High-risk actions yêu cầu step-up auth (MFA/hardware key policy-dependent).
- Async actions trả job id + progress (không block UI).
- Timeline view cho run/payment/device để debug cross-domain nhanh.

## 6. Data contracts cho frontend

### 6.1 Shared list response

```json
{
  "ok": true,
  "data": {
    "items": [],
    "next_cursor": "cur_123"
  },
  "meta": {
    "request_id": "req_123"
  }
}
```

### 6.2 Dashboard aggregate endpoint (recommended)

`GET /v1/dashboard/overview`

Return:
- run metrics
- approval metrics
- payment metrics
- device metrics
- connector health summary
- usage summary

## 7. Authorization matrix (MVP baseline)

- `platform_admin`: full platform scope
- `tenant_admin`: full within tenant
- `workspace_admin`: full within workspace
- `approver`: approval actions + run read
- `finance_manager`: payments/wallets/beneficiaries
- `auditor`: read-only audit + export
- `support_agent`: read-only limited, no payout/device sensitive actions

## 8. Security and compliance UX

- Không hiển thị secrets raw; chỉ show `secret_ref` + last rotated.
- Mask PII/sensitive refs theo role.
- Audit every button for side-effect actions.
- Session risk signals (IP shift, unusual geolocation) hiển thị warning badge.

## 9. Frontend architecture recommendation

- Stack: Next.js app router + server actions/APIs + typed client SDK.
- State: server-first fetching, cache by tenant/workspace keys.
- Charts: lightweight (no heavy BI suite in MVP).
- Realtime: WebSocket/SSE for run events + approvals inbox + device status.

## 10. MVP dashboard deliverables

- `/overview`
- `/tenants`
- `/workspaces`
- `/users`
- `/roles`
- `/policy-packs`
- `/templates`
- `/runs`
- `/approvals`
- `/payments`
- `/beneficiaries`
- `/wallet-profiles`
- `/gateways`
- `/devices`
- `/audit`
- `/usage-billing`

## 11. Post-MVP extensions

- policy simulation lab
- cross-tenant trust graph explorer
- AI copilot for policy/template drafting (review required)
- anomaly investigation workspace
- device digital twin view
- finance corridor optimization panel

## 12. Done criteria cho DEV

- Role-gated navigation + API guards đồng nhất.
- Tenant/workspace scoping enforced ở cả UI và backend.
- Full audit coverage cho mọi mutating action.
- Dashboard load < 2s ở p95 cho dữ liệu tenant trung bình.
- Không có action side-effect nào thiếu `Idempotency-Key`.
