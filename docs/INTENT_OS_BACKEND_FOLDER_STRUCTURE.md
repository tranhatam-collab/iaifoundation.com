# INTENT_OS_BACKEND_FOLDER_STRUCTURE
## Intent OS Backend Folder Structure (MVP)
## Version: 1.0
## Status: Build Ready
## Owner: IAI Foundation / Intent OS

## 1. Mục tiêu

Chuẩn hóa cấu trúc backend để team có thể build song song mà không phá contract giữa:

- Control Plane
- Runtime Engine
- Payment Rails
- Device Gateway

Thiết kế ưu tiên:
- domain isolation
- shared contracts rõ ràng
- dễ scale sang microservices sau MVP

## 2. Monorepo structure (recommended)

```txt
intent-os/
  apps/
    api/                      # Public/tenant API gateway + BFF-like handlers
    workers-runtime/          # Runtime orchestration workers
    workers-connectors/       # Connector and webhook workers
  packages/
    contracts/                # Shared types/enums/schemas/error-codes
    policy-engine/            # Policy evaluate core
    audit-sdk/                # Audit emit helpers
    idempotency/              # Idempotency guard utilities
    observability/            # Logs, metrics, tracing helpers
    db/                       # D1 client, query builders, repositories
  infrastructure/
    cloudflare/
      wrangler/
      queues/
      workflows/
      durable-objects/
  docs/
  scripts/
```

## 3. API app structure (`apps/api`)

```txt
apps/api/src/
  index.ts
  config/
    env.ts
    feature-flags.ts
  middleware/
    auth.ts
    tenant-scope.ts
    workspace-scope.ts
    idempotency.ts
    request-context.ts
    rate-limit.ts
  common/
    errors/
    response/
    validation/
  modules/
    auth/
    tenants/
    workspaces/
    users/
    roles/
    policy-packs/
    templates/
    connectors/
    runs/
    approvals/
    payments/
    beneficiaries/
    wallet-profiles/
    gateways/
    devices/
    audit/
    usage-billing/
  routes/
    v1.ts
  integrations/
    payments/
    devices/
    notifications/
  webhooks/
    payments/
    connectors/
    devices/
```

## 4. Domain module internal layout

Mỗi module trong `modules/*` dùng cùng layout:

```txt
modules/<domain>/
  controller.ts         # HTTP boundary only
  service.ts            # Use-case orchestration
  repository.ts         # D1 reads/writes
  schema.ts             # zod/validator schema
  mapper.ts             # entity <-> dto
  policy.ts             # domain policy hooks
  events.ts             # domain event emitters
  types.ts
```

## 5. Runtime workers structure (`apps/workers-runtime`)

```txt
apps/workers-runtime/src/
  index.ts
  intake/
    intake-handler.ts
  planner/
    planner-service.ts
  coordinator/
    run-coordinator.ts
    step-runner.ts
    retry-policy.ts
    timeout-policy.ts
  approvals/
    approval-coordinator.ts
  proof/
    proof-processor.ts
  reconciliation/
    reconciliation-engine.ts
  finalizer/
    finalizer.ts
  event-bus/
    event-publisher.ts
  workflows/
    run-workflow.ts
  durable/
    run-lock.do.ts
    approval-queue.do.ts
```

## 6. Connector workers structure (`apps/workers-connectors`)

```txt
apps/workers-connectors/src/
  index.ts
  adapters/
    payments/
      stripe.adapter.ts
      stablecoin.adapter.ts
    devices/
      matter.adapter.ts
      mqtt.adapter.ts
  inbound-webhooks/
    payment-webhook.ts
    device-webhook.ts
  outbound/
    connector-caller.ts
  health/
    connector-health-check.ts
  normalization/
    normalize-event.ts
    normalize-proof.ts
```

## 7. Shared package contracts (`packages/contracts`)

```txt
packages/contracts/src/
  enums/
    run-status.ts
    step-status.ts
    policy-decision.ts
    payment-status.ts
    device-status.ts
  api/
    envelope.ts
    errors.ts
    pagination.ts
  domains/
    run.ts
    policy.ts
    payment.ts
    device.ts
  events/
    runtime-events.ts
    payment-events.ts
    device-events.ts
```

## 8. Database package (`packages/db`)

```txt
packages/db/
  migrations/
    0001_foundation_control_plane.sql
    0002_runtime_engine.sql
    0003_payments.sql
    0004_device_gateway.sql
    0005_indexes_and_constraints.sql
  seeds/
    mvp-dev-seed.sql
  src/
    client.ts
    tx.ts
    repositories/
      tenants.repo.ts
      runs.repo.ts
      payments.repo.ts
      devices.repo.ts
    query-helpers/
      pagination.ts
      scoping.ts
```

## 9. Boundary rules (non-negotiable)

- `controller` không truy cập DB trực tiếp.
- `service` không parse HTTP request raw.
- Mọi DB query nghiệp vụ phải qua tenant/workspace scope guard.
- Mọi side-effect action phải đi qua idempotency middleware/util.
- Không import adapter implementation trực tiếp vào control modules; qua interface.

## 10. Suggested build sequence by folders

1. `packages/contracts`
2. `packages/db` + migrations
3. `apps/api/src/modules/{auth,tenants,workspaces,roles,policy-packs,templates}`
4. `apps/workers-runtime`
5. `apps/api/src/modules/{runs,approvals}`
6. `apps/api/src/modules/{payments,beneficiaries,wallet-profiles}`
7. `apps/api/src/modules/{gateways,devices}`
8. `apps/workers-connectors`
9. observability + hardening

## 11. CI/CD expectations

- Contract checks: shared types and OpenAPI diff check.
- Migration checks: apply migration on clean D1 + smoke query.
- Unit tests: service layer and policy decisions.
- Integration tests: runtime/payment/device happy + failure paths.
- Deploy order: migrations -> workers -> api.
