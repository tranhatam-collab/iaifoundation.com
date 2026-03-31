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

## 29. Naming conventions chuẩn

### 29.1 File naming

Dùng `kebab-case` cho tên file nếu framework không bắt buộc khác, hoặc giữ `.service.ts`, `.repository.ts` như chuẩn đã khóa.

Ví dụ:
- `payments.service.ts`
- `run-engine.ts`
- `approval-gate.ts`

Không dùng kiểu lẫn lộn:
- `PaymentsService.ts`
- `paymentService.ts`
- `runEngine.ts`

Nếu đã khóa theo kiểu suffix module như trên, giữ nhất quán toàn repo.

### 29.2 Function naming

- hành động service: `createPaymentIntent`, `executeRun`, `approveRequest`
- repository reads: `findById`, `findMany`, `findByRunId`
- repository writes: `insertOne`, `updateStatus`, `appendEvent`
- route handlers: `handleCreatePaymentIntent`, `handleGetRunDetail`

### 29.3 Type naming

- DTO: `CreatePaymentIntentInput`, `RunDetailResponse`
- DB row: `PaymentIntentRow`, `RunRow`
- Domain model: `PaymentIntent`, `RunSummary`
- enums as const maps nếu cần: `RUN_STATUS`, `APPROVAL_STATUS`

## 30. Domain boundaries phải giữ chặt

### 30.1 Payments domain không được tự sửa run state trực tiếp

Payments chỉ:
- tạo payment intent
- execute payment
- emit result
- trả reconciliation signal

Run state phải do runtime engine hoặc runs service xử lý.

### 30.2 Devices domain không được bypass policy

Mọi lệnh thiết bị phải đi qua:
- policy decision
- device command record
- orchestration layer

Không được có route "gửi thẳng command" mà không audit/policy.

### 30.3 Proofs domain không được coi artifact upload là proof valid

Artifact upload xong mới chỉ là file. Proof chỉ valid khi:
- attach đúng run/step
- có metadata đúng
- đi qua validation state

### 30.4 Approvals domain không tự finalize business outcome

Approval là gate. Sau approve/reject, runtime mới tiếp tục.

## 31. Repository rules

### 31.1 Mỗi repository chỉ thao tác một aggregate chính

Ví dụ:
- `payments.repository.ts` không query sâu audit + users + devices thành một mega query khó bảo trì
- nếu cần read model phức tạp, tạo file `*.read-model.ts`

### 31.2 Không nhét business policy vào repository

Sai:
- repository tự quyết định threshold approval
- repository tự reject payment do rule business

Đúng:
- repository chỉ đọc/ghi
- service/runtime quyết định logic

### 31.3 SQL phải được gom thành named functions

Không viết query raw khắp nơi.

## 32. Service rules

### 32.1 Service phải là nơi quyết định orchestration domain

Ví dụ `payments.service.ts`:
- validate semantic input
- call policy evaluator
- create payment intent
- write audit
- return DTO

### 32.2 Service không gọi HTTP provider trực tiếp nếu đã có integration adapter

Sai:
- `fetch("https://stripe...")` nằm trong service

Đúng:
- service gọi `stripePaymentAdapter.executePayout(...)`

### 32.3 Service phải trả object ổn định cho routes

Route không map lung tung thêm một lần nữa trừ response wrapper.

## 33. Route rules

### 33.1 Route chỉ làm 6 việc

1. đọc request
2. resolve context
3. validate input
4. gọi service
5. map sang response
6. handle error

### 33.2 Route không được chứa if/else business logic dài

Nếu route dài hơn khoảng hợp lý, đang sai cấu trúc.

### 33.3 Route side-effect phải có idempotency nếu cần

Áp dụng đặc biệt cho:
- execute run
- payment action
- device command
- approval decision

## 34. Runtime engine file responsibilities cụ thể

### 34.1 `run-engine.ts`

Điểm vào chính để:
- load run
- resolve current state
- dispatch next step
- persist transitions

### 34.2 `run-state-machine.ts`

Chỉ định nghĩa:
- state transitions hợp lệ
- invalid transition rules
- helper checks

### 34.3 `run-resolver.ts`

Resolve context của run:
- template
- policy snapshot
- actor
- linked resources

### 34.4 `run-finalizer.ts`

Đóng run:
- final status
- summary snapshot
- billing usage emit
- final audit refs

### 34.5 `run-compensator.ts`

Xử lý rollback logic có kiểm soát:
- payment refund/reverse request
- device safe-state action
- quarantine and notify

## 35. DTO layer khuyên dùng

Nên có DTO rõ cho các response lớn.

Ví dụ trong `runs.types.ts`:
- `RunListItemDto`
- `RunDetailDto`
- `RunTimelineItemDto`
- `RunStepDto`

Không trả raw DB rows ra API.

## 36. Read models nên tách riêng

Với các screen nặng như:
- run detail
- payment detail
- device detail
- overview dashboard

Nên có file:
- `runs.read-model.ts`
- `payments.read-model.ts`
- `devices.read-model.ts`

Lý do:
- read model thường aggregate nhiều bảng
- không muốn phá repository write model sạch

## 37. Audit instrumentation rule

Các domain sau bắt buộc có helper ghi audit:
- policies
- templates publish/edit
- approvals decision
- payments actions
- device command actions
- run cancel/retry/quarantine
- connector changes
- settings security changes

## 38. Error mapping chuẩn

Tất cả domain service nên throw `AppError` với:
- `code`
- `message`
- `details`
- `httpStatus`

Ví dụ:
- `POLICY_DENIED`
- `RUN_STATE_INVALID`
- `PAYMENT_PROVIDER_DEGRADED`
- `APPROVAL_ALREADY_DECIDED`
- `DEVICE_QUARANTINED`

## 39. Feature flag placement

Nếu một module chưa mở hoàn toàn:
- check ở service layer
- không rải check khắp UI và repository

Ví dụ:
- `stablecoin_enabled`
- `advanced_device_gateways_enabled`
- `ai_assist_enabled`

## 40. Provider interface contracts

Mỗi integration class nên bám interface.

Ví dụ payment:
- `PaymentProviderAdapter`
  - `createTransfer()`
  - `getTransferStatus()`
  - `refundTransfer()`
  - `verifyWebhook()`

Ví dụ device:
- `DeviceGatewayAdapter`
  - `discoverDevices()`
  - `sendCommand()`
  - `getState()`
  - `normalizeEvent()`

## 41. Testing targets theo module

### 41.1 Platform
- auth context
- tenant resolution
- workspace resolution

### 41.2 Policies
- policy evaluate
- deny/allow/approval_required

### 41.3 Runtime
- state transitions
- retries
- approval pause/resume

### 41.4 Payments
- idempotent payout
- reconcile result mapping
- beneficiary checks

### 41.5 Devices
- command record creation
- quarantine enforcement
- event normalization

### 41.6 Proofs
- artifact complete flow
- attach proof
- validation status update

## 42. Anti-patterns cần cấm

- route gọi DB trực tiếp
- service tự viết raw SQL khắp nơi
- provider SDK import vào mọi file
- JSON blob thay toàn bộ quan hệ
- raw event logs nhét hết vào D1 không index strategy
- UI logic quyết định business rule
- device command không audit
- payment không idempotency
- proof attach không run/step association
- approval decision không signature/comment metadata

## 43. MVP implementation checklist cho backend structure

- có shared error layer
- có request context chuẩn
- có auth + tenant + workspace middleware
- có repository/service/route rõ
- có runtime folder riêng
- có integrations folder riêng
- có audit logger dùng lại được
- có migrations folder và scripts migrate/seed
- có tests skeleton theo domain
- không có business logic dài trong route files

## 44. Kết luận bổ sung

Không chỉ cần "có cấu trúc thư mục". Cần giữ đúng kỷ luật:

- domain boundaries
- service/repository separation
- runtime tách riêng
- provider abstraction
- audit-first
- idempotent side effects

Nếu giữ đúng phần tiếp sâu này, team DEV sẽ không bị trượt từ một kiến trúc sạch sang một codebase chắp vá sau 2-4 tuần build.
