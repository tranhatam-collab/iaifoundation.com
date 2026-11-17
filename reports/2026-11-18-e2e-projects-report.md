# E2E theo từng dự án — Kết quả 2026-11-18

Kế hoạch: `reports/2026-11-18-e2e-projects-plan.md`. Evidence: `reports/evidence/2026-11-18-e2e-projects/`.

## Kết quả theo dự án (workspace)

| # | Dự án | Test files | Tests | Kết quả | Evidence |
|---|---|---|---|---|---|
| 1 | packages/contracts | 2 | 18 | PASS | `p1-contracts.log` |
| 2 | packages/policy-engine | 1 | 9 | PASS | `p2-policy-engine.log` |
| 3 | packages/observability + audit-sdk + idempotency | 3 | 10 | PASS | `p3-observability-audit-idem.log` |
| 4 | packages/db | 3 | 31 | PASS | `p4-db.log` |
| 5 | packages/runtime-core | 1 | 6 | PASS | `p5-runtime-core.log` |
| 6 | apps/api | 7 | 98 | PASS | `p6-api.log` |
| 7 | apps/workers-runtime | 3 | 31 | PASS | `p7-workers-runtime.log` |
| 8 | apps/workers-connectors | 1 | 11 | PASS | `p8-workers-connectors.log` |
| 9 | Static site (root) | 1 | 22 | PASS | `p9-site.log` |
| — | **Tổng test** | **22** | **236** | **236/236 PASS** | — |

## Hạ tầng & live

| Hạng mục | Kết quả | Evidence |
|---|---|---|
| Database D1 (6 migrations + seed idempotent) | PASS (exit 0) | `p10-d1.log` |
| Worker bundle dry-run (api/runtime/connectors) | 3/3 PASS | `p11-workers.log` |
| Production smoke (10 route + 404 + asset + headers) | PASS | `p12-smoke-prod.log` |
| API containment smoke (health 200, /v1 503) | PASS | `p13-smoke-api.log` |

## Ghi chú

- `apps/api` gồm 7 file test (integration HTTP + common/middleware/config + 14 service module).
- `apps/workers-runtime` gồm coordinator/policies/engine (proof, reconciliation, event-bus, planner, workflow).
- `packages/db` gồm client/tx/pagination/scoping + 4 repository + 2 read-model.
- Phát hiện riêng (đã ghi ở `reports/2026-11-18-e2e-full-report.md`): advisory `picomatch` 7 high, dev-only (vitest→vite→tinyglobby→fdir→picomatch), chưa có bản vá.
