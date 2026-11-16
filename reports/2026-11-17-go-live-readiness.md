# IAIFoundation.com — GO-LIVE readiness receipt

Date: 2026-11-17, Asia/Ho_Chi_Minh

Verdict: **RELEASE-READY for the public static site.** Actual production deploy is
blocked only by external credentials/actions that are not available in this
session (no Cloudflare OAuth, no GitHub push). Backend remains **HOLD** per
`reports/2026-11-17-backend-coverage-independent-audit.md`.

## All E2E + release gates (fresh, 2026-11-17)

| Gate | Result |
|---|---|
| `npm run test:e2e` (site E2E + HTTP boundaries) | **38/38 PASS** |
| `npm run check:release` (build + typecheck + 18 HTML + 236 tests + D1 + workers) | **PASS** |
| Vitest total | **236/236 PASS** |
| D1 (fresh temp db, 6/6 migrations, idempotent seed) | PASS |
| Worker bundle dry-run (api / runtime / connectors) | 3/3 PASS |
| `npm run lint` (typecheck + static site checks) | PASS |
| `npm run smoke:production` (10 routes + 404 + asset + headers) | PASS |
| `npm run smoke:api` (fail-closed containment) | PASS |
| `npm audit --audit-level=high` | 0 high (1 moderate Hono, no fix — accepted) |

## Artifact cleanliness

- Build artifact `.wrangler/pages-build` contains **no** internal files
  (`root-relocated`, onboarding, `.zip`, `_internal`). Verified via
  `find .wrangler/pages-build -type f | grep -iE 'root-relocated|onboarding|\.zip|_internal'` → empty.
- Internal material moved to gitignored `_internal/` and excluded by
  `scripts/build-pages-static.mjs`.

## Coverage (honest denominator = 103 TypeScript source files)

- Statements **70.43%** · Lines **71.6%** · Functions **69.41%** · Branches **56.04%**.
- Remaining uncovered: ~17 barrel/type-only files (re-export/interface, no runtime)
  + 2 Durable Objects (`*.do.ts`, require Cloudflare runtime; covered by bundle dry-run).

## Why this session cannot execute the actual deploy

- `wrangler whoami` fails: no Cloudflare OAuth credentials (`~/.wrangler/config`
  and `~/.config/.wrangler` are absent); wrangler also cannot write its log file
  outside the workspace under the current sandbox.
- `origin` on GitHub does not yet contain the reconciled commits
  (`e5de5cb`, `7df1efa`, `c587515`); nothing has been pushed.

## Exact remaining GO-LIVE steps (human / out-of-repo)

1. **Push** the reconciled line to GitHub:
   `git push origin main brand/v2.0-intent-sovereign`
2. **Configure GitHub environment secrets** (least privilege, per README):
   - `production`: `CLOUDFLARE_PAGES_API_TOKEN` → auto Pages CD on main.
   - `production`: `CLOUDFLARE_WORKERS_API_TOKEN` → manual API-containment workflow only.
   - `preview`: set repository variable `CF_PREVIEW_ENABLED=true` to enable PR previews.
3. **www → apex redirect** at the Cloudflare zone/custom-domain layer (Pages
   `_redirects` cannot carry the host-level rule).
4. **Backend:** keep `HOLD`. Do not deploy `intent-os-runtime` / `intent-os-connectors`;
   the API Worker stays fail-closed. No release until real auth, orchestrators,
   persistent idempotency/rate-limit, verified providers, secret lifecycle,
   reconciliation/recovery/rollback, and staging soak evidence exist.

## Browser menu QA (remaining optional E2E)

- `scripts/run-menu-browser-qa.mjs` drives Safari via AppleScript. It requires a
  running local server and Safari → Develop → "Allow JavaScript from Apple Events".
  Not executed in this session (controls the host GUI).
- Structural menu/locale behavior is already covered by `tests/site.e2e.test.ts`
  and `scripts/check-static-site.mjs` (accessibility basics, locale parity,
  metadata, internal links).
