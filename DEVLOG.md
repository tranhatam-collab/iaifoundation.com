# iaifoundation.com — Dev Log

Cập nhật mới nhất ở đầu file.

---

## 2026-11-16 (tiếp) — Backend + E2E: mở rộng test coverage

### Đã làm
- Sửa thiếu sót cấu hình: `vitest.config.ts` khai báo `coverage.provider: 'v8'`
  nhưng thiếu dependency `@vitest/coverage-v8` → đã cài (`^5.1.0`) và thêm
  `coverage/` vào `.gitignore`.
- Viết 13 file test mới + helper `tests/helpers/fake-d1.ts` (D1 in-memory fake
  ghi lại SQL + bind) phủ các phần backend chưa từng được test:
  - contracts: enums, ERROR_CODES/AppError, run state-machine, event constants
  - policy-engine, observability, audit-sdk, idempotency
  - db: client, tx, pagination, scoping, 4 repositories, 2 read-models
  - api: config/env, tenant/workspace scope, validators/envelope,
    auth/request-context/rate-limit middleware, tenants service
  - runtime-core: handleIntake (succeeded / awaiting_approval / failed) + approvals

### Kết quả
- `npx vitest run`: **140/140 PASS** (trước: 44).
- Coverage statements/lines: **49.13% / 48.99%** (trước khi viết test backend ≈ 0%).
- `npm run check:release`: PASS (build, typecheck, 18 HTML, 140 test, D1 6/6, 3 worker bundles).

---

## 2026-11-16 — Git reconcile + dọn file iCloud + chốt release gate

### Đã làm
- Hợp nhất 2 nhánh đã tách: `main` (commit cũ `e00cd83`, tháng 4) và
  `brand/v2.0-intent-sovereign` (13 commit mới hơn đến 26/10). Dùng merge
  `-s ours` tạo commit `be72d99` (cây giữ nguyên như head của brand), rồi
  fast-forward `main` về cùng commit. Giờ `main` = `brand/v2.0-intent-sovereign`.
- Xóa 8 file iCloud conflict (7 untracked `" 2"` + 1 committed
  `reports/2026-04-21-menu-browser-qa-report 2.md`). Bản canonical 26/10 là chuẩn.
- Thêm ghi chú quy ước iCloud vào `.gitignore` (không dùng glob rộng vì dễ
  ẩn nhầm file hợp lệ).

### Kết quả release gate (chạy lại 2026-11-16)
- `npm run check:release`: PASS (build, typecheck, 18 HTML, 44/44 test,
  D1 6/6 migrations, 3/3 worker bundles).
- `npm run smoke:production` + `smoke:api`: PASS.
- `npm audit --audit-level=high`: PASS (0 high).

### Còn treo (ngoài repo — cần làm thủ công)
- Bí mật GitHub: `CLOUDFLARE_PAGES_API_TOKEN` (production), `CF_PREVIEW_ENABLED`
  (preview), `CLOUDFLARE_WORKERS_API_TOKEN` (API containment).
- Redirect `www` → apex ở tầng Cloudflare zone.
- 1 advisory **moderate** Hono (no fix) — chỉ ảnh hưởng API worker fail-closed,
  đã chấp nhận và ghi nhận trong `reports/2026-11-16-repo-reconciliation-audit.md`.

---

## 2026-05-18 — MAIL_API_KEY set + Google OAuth live

### Đã làm
- **`MAIL_API_KEY`** — set trên `intent-os-api` worker (account 93112cc). Magic-link và auth email sẽ gửi được sau bước này.
- `MAIL_API_WORKSPACE_ID = "iaifoundation.com"` đã có sẵn trong `apps/api/wrangler.toml` (non-secret var).

### Worker
- **API Worker**: `intent-os-api` → `api.iaifoundation.com`
- **Config**: `/Users/tranhatam/Documents/Devnewproject/iaifoundation.com/apps/api/wrangler.toml`
- **Account**: 93112cc89181e75335cbd7ef7e392ba3

### Secrets trên `intent-os-api`
| Secret | Status |
|--------|--------|
| MAIL_API_KEY | ✅ set 2026-05-18 ← MỚI |
| GOOGLE_CLIENT_ID | ✅ set |
| GOOGLE_CLIENT_SECRET | ✅ set |
| GOOGLE_REDIRECT_URI | ✅ `https://api.iaifoundation.com/v1/auth/google/callback` |

### Google Console
- Redirect URI `https://api.iaifoundation.com/v1/auth/google/callback` ✅ đã đăng ký (IAI ONE client URI #10, added 2026-05-18).

### Email flows
| Flow | Route | Status |
|------|-------|--------|
| Magic link | `/v1/auth/magic-link/request` | ✅ Live (cần test) |
| Google OAuth | `/v1/auth/google/start` | ✅ Live |

### Còn lại
- iaifoundation.com là admin-only — không cần frontend Google button trên public page.
- Test magic-link end-to-end.
