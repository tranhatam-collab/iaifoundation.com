# E2E theo từng dự án — Kế hoạch 2026-11-18

Chạy lần lượt, mỗi dự án (workspace) có bằng chứng riêng trong `reports/evidence/2026-11-18-e2e-projects/`.

## Danh sách dự án và phạm vi E2E

| # | Dự án (workspace) | Test files | Dự kiến |
|---|---|---|---|
| 1 | packages/contracts | `contracts.unit.test.ts`, `contracts.test.ts` | 18 |
| 2 | packages/policy-engine | `policy-engine.unit.test.ts` | 9 |
| 3 | packages/observability + audit-sdk + idempotency | `observability.unit.test.ts`, `audit-sdk.unit.test.ts`, `idempotency.unit.test.ts` | 10 |
| 4 | packages/db | `db.unit.test.ts`, `repositories.unit.test.ts`, `read-models.unit.test.ts` | 31 |
| 5 | packages/runtime-core | `runtime-core.unit.test.ts` | 6 |
| 6 | apps/api | `integration.http.test.ts`, `api-common`, `api-middleware`, `api-config-scope`, `api-more`, `api-services` | 92 |
| 7 | apps/workers-runtime | `runtime-policies`, `runtime-coordinator`, `runtime-engine` | 31 |
| 8 | apps/workers-connectors | `connectors.unit.test.ts` | 11 |
| 9 | Static site (root) | `site.e2e.test.ts` + build + check-site | 22 |
| 10 | Database (D1) | 6 migrations + seed idempotent | — |
| 11 | Worker bundles | dry-run api/runtime/connectors | 3 |
| 12 | Production + API | smoke live | — |

Tổng cộng: **236 unit/integration/E2E + 6 D1 migration + 3 bundle + 2 smoke**.
