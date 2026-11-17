# IAI Foundation — repository reconciliation + release gate audit

Date: 2026-11-16, Asia/Ho_Chi_Minh

Scope: reconcile diverged Git branches, remove iCloud conflict artifacts, and
re-run the full local release gate for the public static foundation website.

Verdict: **PASS** for the public-site release gate. External production
automation (GitHub CD) and the private runtime remain out of repository scope,
unchanged from `reports/2026-10-26-dev-e2e-audit.md`.

## What was reconciled

### Git history

- `main` and `brand/v2.0-intent-sovereign` had diverged from `6a36941`
  (`v0.1.0-foundation`).
- `main` carried one extra commit, `e00cd83` ("feat(site): lock bilingual docs
  + production menu QA release", 2026-04-22).
- `brand/v2.0-intent-sovereign` carried thirteen later commits that
  re-implemented and superseded `e00cd83` (bilingual content, locales, brand
  v2.0, security hardening, and CI/CD gates through 2026-10-26).
- Verified that no file in `e00cd83` is absent from the brand branch, so the
  brand tree is a strict superset.
- Reconciled with an `ours`-strategy merge commit `be72d99` whose tree is
  identical to the pre-merge brand head `0d18379` (verified: empty diff).
- Fast-forwarded `main` to `be72d99`, so `main` and
  `brand/v2.0-intent-sovereign` now point to the same commit.

### iCloud conflict artifacts removed

Removed seven untracked iCloud conflict copies that were stale (older, smaller
than their canonical siblings, which are the 2026-10-26 releases):

- `README 2.md`
- `style 2.css`
- `wrangler 2.toml` (superseded by `apps/api/wrangler.toml`)
- `tests/integration.http.test 2.ts`
- `.github/workflows/ci 2.yml`
- `reports/2026-10-26-dev-e2e-audit 2.md`
- `reports/2026-10-26-production-release-receipt 2.md`

Removed one committed iCloud conflict copy with `git rm`:

- `reports/2026-04-21-menu-browser-qa-report 2.md` (stale; canonical
  `reports/2026-04-21-menu-browser-qa-report.md` is newer).

### `.gitignore`

Added a comment documenting the macOS iCloud conflict-copy convention
(`name 2.ext`, `name 3.ext`) and the deliberate decision not to add a broad
` 2.*` glob, which could hide legitimate files. Conflict copies are to be
reviewed and removed manually.

## Release gate evidence (fresh, 2026-11-16)

- Runtime: Node.js `22.23.4`, npm `12.2.0`.
- `npm run check:release`: PASS.
  - `npm run build`: PASS.
  - `tsc --noEmit`: PASS.
  - Static-site validation: 18 HTML files PASS.
  - Vitest 5.0.5: 44/44 tests PASS (contracts, generated-site E2E, HTTP
    boundaries, webhook signatures, worker fail-closed behavior).
  - Fresh local D1: 6/6 migrations PASS; seed stable across two runs.
  - Wrangler dry-run: api, runtime, connectors bundles PASS (3/3).
- `npm run smoke:production`: PASS — 10 public routes, 404 handling, and asset
  checks on `https://iaifoundation.com`.
- `npm run smoke:api`: PASS — health and unauthenticated/arbitrary-token
  `/v1/*` containment on `https://api.iaifoundation.com`.
- `npm audit --audit-level=high`: PASS (0 high-severity advisories).

## Accepted dependency advisory

`npm audit` reports one **moderate** advisory against `hono` with no fix
available (GHSA-4m76-xfj5-7975 and related mount/validator/`css` advisories).
Impact assessment:

- `hono` is used only by the fail-closed API Worker scaffold, not by the public
  static site.
- The API Worker exposes `/health` and returns `503` for `/v1/*` in production.
- The release gate's `--audit-level=high` policy is satisfied; this moderate,
  no-fix advisory is accepted and documented here for the current scaffold.

## Remaining out-of-repository items (unchanged)

- GitHub environment `production` still needs `CLOUDFLARE_PAGES_API_TOKEN` for
  automatic Pages CD; preview CD needs `CF_PREVIEW_ENABLED=true`; manual API
  containment uses a separate `CLOUDFLARE_WORKERS_API_TOKEN`.
- The `www` → apex host redirect must be configured at the Cloudflare zone or
  custom-domain layer, not in Pages `_redirects`.
- The private Intent OS runtime remains a 12–24 month product outside this
  static-first public repository per `AGENTS.md`.

## Note left for the owner

`docs/root-relocated-2026-07-05/` (contains a founder onboarding script and a
`iaifoundation.com-dev-pack.zip`) is untracked and was intentionally left
untouched. It is internal material, not part of the public site deliverable;
decide separately whether to commit, ignore, or remove it.
