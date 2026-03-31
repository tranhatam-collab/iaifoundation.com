# INTENT_OS_API_SPEC
## Intent OS Unified API Specification (MVP)
## Version: 1.0
## Status: Build Ready
## Owner: IAI Foundation / Intent OS

## 1. Mục tiêu

Định nghĩa API contract thống nhất cho:

- Control Plane
- Runtime Engine
- Payment Rails
- Device Gateway

Mục tiêu: frontend, backend, workflow workers, connector adapters dùng cùng một chuẩn request/response/error/idempotency/audit.

## 2. API conventions

- Base path: `/v1`
- Auth: Bearer token (tenant-scoped), service tokens cho machine calls.
- Content type: `application/json`
- Timestamps: ISO8601 UTC
- IDs: UUID/ULID string
- Pagination: cursor-based (`next_cursor`)

### 2.1 Standard headers

- `Authorization: Bearer <token>`
- `X-Request-Id: <uuid>`
- `X-Tenant-Id: <tenant_id>` (required for service/internal calls)
- `X-Workspace-Id: <workspace_id>` (required where resource scoped)
- `Idempotency-Key: <key>` (required cho side-effect endpoints)

### 2.2 Standard response envelope

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "request_id": "req_123",
    "next_cursor": null
  }
}
```

### 2.3 Standard error envelope

```json
{
  "ok": false,
  "error": {
    "code": "POLICY_DENIED",
    "message": "Action denied by policy.",
    "details": {
      "decision": "deny",
      "policy_pack_id": "pol_123"
    }
  },
  "meta": {
    "request_id": "req_123"
  }
}
```

## 3. Error codes (MVP)

- `UNAUTHORIZED`
- `FORBIDDEN`
- `TENANT_SCOPE_MISMATCH`
- `RESOURCE_NOT_FOUND`
- `VALIDATION_ERROR`
- `POLICY_DENIED`
- `APPROVAL_REQUIRED`
- `IDEMPOTENCY_CONFLICT`
- `CONNECTOR_UNAVAILABLE`
- `PAYMENT_RECONCILIATION_FAILED`
- `DEVICE_QUARANTINED`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

## 4. Auth & identity APIs

- `POST /v1/auth/login`
- `POST /v1/auth/logout`
- `GET /v1/auth/me`
- `GET /v1/users`
- `POST /v1/users`
- `PATCH /v1/users/:id`

### 4.1 POST `/v1/auth/login`

Request:
```json
{
  "email": "owner@tenant.com",
  "password_or_assertion": "..."
}
```

Response:
```json
{
  "ok": true,
  "data": {
    "access_token": "jwt_or_paseto",
    "refresh_token": "rt_...",
    "expires_in": 3600,
    "tenant_id": "ten_1",
    "workspace_ids": ["ws_finance"]
  }
}
```

## 5. Tenant & workspace APIs

- `GET /v1/tenants`
- `POST /v1/tenants`
- `GET /v1/workspaces`
- `POST /v1/workspaces`

### 5.1 POST `/v1/workspaces`

```json
{
  "tenant_id": "ten_1",
  "name": "Finance",
  "slug": "finance",
  "workspace_type": "finance"
}
```

## 6. Roles & access APIs

- `GET /v1/roles`
- `POST /v1/role-bindings`
- `DELETE /v1/role-bindings/:id`

### 6.1 POST `/v1/role-bindings`

```json
{
  "tenant_id": "ten_1",
  "workspace_id": "ws_ops",
  "role_id": "role_approver",
  "user_id": "usr_1",
  "condition_json": {
    "max_approve_amount": 10000
  }
}
```

## 7. Policy APIs

- `GET /v1/policy-packs`
- `POST /v1/policy-packs`
- `POST /v1/policy-evaluate`
- `POST /v1/policy-publish`

### 7.1 POST `/v1/policy-evaluate`

```json
{
  "actor": {"id":"usr_1","role":"finance_manager"},
  "resource": {"type":"payment_intent","id":"pay_1"},
  "action": "payments.payout",
  "context": {
    "amount": 1450,
    "currency": "USDC",
    "risk_score": 0.34,
    "proof_completeness": "sufficient"
  }
}
```

Response `data.decision`:
- `allow`
- `deny`
- `allow_with_approval`
- `allow_with_limits`
- `allow_with_additional_proof`
- `escalate_to_human`
- `quarantine`

## 8. Template APIs

- `GET /v1/templates`
- `POST /v1/templates`
- `PATCH /v1/templates/:id`
- `POST /v1/templates/:id/publish`

Template states:
- `draft`
- `review`
- `approved`
- `published`
- `deprecated`
- `archived`

## 9. Connector APIs

- `GET /v1/connectors`
- `POST /v1/connectors`
- `POST /v1/connectors/:id/test`
- `PATCH /v1/connectors/:id`

`POST /v1/connectors/:id/test` bắt buộc trả:
- auth validity
- latency
- quota status
- health status
- degraded mode capability

## 10. Runtime APIs

- `POST /v1/intents/execute`
- `POST /v1/runs/:id/cancel`
- `POST /v1/runs/:id/retry`
- `POST /v1/runs/:id/approve`
- `POST /v1/runs/:id/reject`
- `GET /v1/runs`
- `GET /v1/runs/:id`
- `GET /v1/runs/:id/events`
- `GET /v1/runs/:id/trace`
- `POST /v1/runs/:id/proof`
- `POST /v1/runs/:id/simulate`

### 10.1 POST `/v1/intents/execute`

```json
{
  "tenant_id": "ten_1",
  "workspace_id": "ws_ops",
  "template_id": "tpl_pay_supplier_v1",
  "inputs": {
    "supplier_id": "sup_1",
    "invoice_id": "inv_123",
    "amount": 2100
  },
  "mode": "template_driven"
}
```

Response includes:
- `run_id`
- `initial_status`
- `requires_approval`
- `next_action`

## 11. Payment APIs

- `POST /v1/payments/intents`
- `POST /v1/payments/intents/:id/authorize`
- `POST /v1/payments/intents/:id/capture`
- `POST /v1/payments/intents/:id/payout`
- `POST /v1/payments/intents/:id/refund`
- `GET /v1/payments/intents/:id`
- `GET /v1/payments/settlements/:id`
- `POST /v1/payments/reconcile`
- `GET /v1/beneficiaries`
- `POST /v1/beneficiaries`
- `POST /v1/wallet-profiles`
- `GET /v1/wallet-profiles`

### 11.1 Side-effect idempotency rules

Bắt buộc `Idempotency-Key` cho:
- create payment intent
- authorize/capture/payout/refund
- reconcile commit calls

Nếu key trùng nhưng payload khác: trả `409 IDEMPOTENCY_CONFLICT`.

## 12. Device APIs

- `GET /v1/gateways`
- `POST /v1/gateways`
- `POST /v1/gateways/:id/test`
- `GET /v1/devices`
- `POST /v1/devices`
- `GET /v1/devices/:id`
- `PATCH /v1/devices/:id`
- `POST /v1/devices/:id/commands`
- `GET /v1/devices/:id/state`
- `GET /v1/devices/:id/events`
- `POST /v1/device-events/ingest`
- `POST /v1/devices/:id/quarantine`
- `POST /v1/devices/:id/unquarantine`

### 12.1 POST `/v1/devices/:id/commands`

```json
{
  "run_id": "run_1",
  "step_id": "step_unlock_1",
  "command_type": "unlock",
  "payload_json": {"duration_seconds": 30},
  "policy_context": {"risk_class": "high"}
}
```

Response:
- `command_id`
- `accepted` boolean
- `policy_decision`
- `timeout_guard`

## 13. Usage & billing APIs

- `GET /v1/usage`
- `GET /v1/billing`
- `POST /v1/billing/portal`

Usage dimensions:
- intents created
- runs started
- step count
- approval requests
- payment attempts
- device commands
- proof bundles
- model tokens

## 14. Webhook contracts

### 14.1 Inbound webhooks

- `/v1/webhooks/payments/:provider`
- `/v1/webhooks/connectors/:id`
- `/v1/webhooks/device/:gateway_id`

Requirements:
- signature verification
- replay protection
- idempotent event processing
- raw payload lưu R2 + indexed ref D1

### 14.2 Outbound events (Queue/Webhook subscribers)

MVP event keys:
- `run.succeeded`
- `run.failed`
- `approval.requested`
- `payment.captured`
- `device.state.confirmed`
- `proof.verified`

## 15. Audit and observability contract

Mọi endpoint side-effect phải emit audit event tối thiểu:
- actor
- action_type
- resource_type/id
- before/after snapshot ref
- request_id
- tenant/workspace scope
- timestamp

## 16. Security requirements

- Default deny cho unclassified action.
- Tenant scope validation trước resource lookup.
- Signed service-to-service tokens cho runtime internal calls.
- Mask secrets ở logs và API responses.
- MFA/hardware key gate cho high-risk admin/payment/device actions.

## 17. OpenAPI deliverables (for backend team)

Dev cần tạo các file:
- `openapi/control-plane.yaml`
- `openapi/runtime.yaml`
- `openapi/payments.yaml`
- `openapi/device-gateway.yaml`
- `openapi/common-components.yaml`

Và sinh SDK nội bộ từ spec để tránh drift frontend/backend.
