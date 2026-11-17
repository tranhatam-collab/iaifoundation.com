# E2E Full Run — 2026-11-18 (bằng chứng từng hạng mục)

Thời điểm: 2026-11-18, Asia/Ho_Chi_Minh. Evidence dir: `reports/evidence/2026-11-18-e2e-full/`.

## Kết quả từng hạng mục (chạy lần lượt)

| # | Hạng mục | Kết quả | Evidence |
|---|---|---|---|
| 1 | Static Site — build | **PASS** (exit 0) | `01-build.log` |
| 2 | Static Site — typecheck (`tsc --noEmit`) | **PASS** (exit 0) | `02-typecheck.log` |
| 3 | Static Site — check-site (18 HTML) | **PASS** (exit 0) | `03-check-site.log` |
| 4 | Tests — vitest (unit + integration + E2E) | **236/236 PASS** (22 files) | `04-vitest.log` |
| 5 | Database — D1 (6 migrations, seed idempotent) | **PASS** | `05-d1.log` |
| 6 | Workers — bundle dry-run (api/runtime/connectors) | **3/3 PASS** | `06-workers.log` |
| 7 | Coverage — v8 (103 file nguồn) | **70.43% stmt / 71.6% lines / 56.04% branches** | `07-coverage.log` |
| 8 | Dependencies — `npm audit` | ⚠️ **7 HIGH** (picomatch, dev-only, no fix) | `08-audit.log` |
| 9 | Production smoke (10 route + 404 + asset + headers) | **PASS** | `09-smoke-production.log` |
| 10 | API containment smoke (health 200, /v1 503) | **PASS** | `10-smoke-api.log` |

## Trạng thái bề mặt leak (`11-leak-surfaces.txt`)

| URL | Status |
|---|---|
| `iaifoundation.com/` | 200 (site sống) |
| `iaifoundation.com/docs/root-relocated-2026-07-05/Founder_Onboarding_Script.md` | **200** (Pages Tiered Cache, TTL 1 tuần — tự hết) |
| `iaifoundation.com/docs/root-relocated-2026-07-05/iaifoundation.com-dev-pack.zip` | **200** (Pages Tiered Cache) |
| `www.iaifoundation.com/` | 301 → apex (redirect OK) |
| `a198b58a.iaifoundation-com.pages.dev/.../Founder_Onboarding_Script.md` | 404 (production sạch) |
| `0c773060.iaifoundation-com.pages.dev/.../Founder_Onboarding_Script.md` | 404 (đã xóa) |

## Phát hiện mới — picomatch (7 high, dev-only)

- Advisory `GHSA-fc5q-39xc-vjpf`: ReDoS qua single-branch repeated extglobs.
- Chuỗi phụ thuộc: `vitest → vite → tinyglobby → fdir → picomatch` (picomatch `4.0.7`, là bản mới nhất, **chưa có bản vá**).
- **Chỉ ảnh hưởng toolchain test (devDependency)**, KHÔNG ảnh hưởng site tĩnh, API worker (hono), hay runtime/connectors.
- Advisory xuất hiện sau 2026-11-17 (lần audit trước = 0 vuln sau khi vá hono). Đây là rủi ro dev-only cần theo dõi; không thể khắc phục ngay vì chưa có bản vá.
- Ghi chú: `npm audit --audit-level=high` hiện exit 1 — ảnh hưởng cổng CI/CD; cần acceptance có chủ đích cho dev-dependency này hoặc chờ bản vá picomatch.

## Kết luận

- Static site + toàn bộ test + D1 + worker bundle + coverage + smoke: **xanh**.
- Leak nội bộ: origin/deployment sạch; chỉ còn apex qua Pages Tiered Cache (tự hết ≤7 ngày, không purge được qua API).
- Backend: HOLD (fail-closed).
