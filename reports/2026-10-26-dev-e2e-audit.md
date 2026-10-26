# IAI Foundation public website dev and E2E audit

Date: 2026-10-26, Asia/Ho_Chi_Minh

Scope: `iaifoundation.com` public static site, local release candidate, and fail-closed boundaries for future private-runtime scaffolding

Candidate branch: `brand/v2.0-intent-sovereign` based on `562466104c8385d6ae92deaefc64bda6d2a20940`

Verdict: **PASS** for the public-site release candidate; **HOLD** for all private-runtime product capability

## P0/P1 disposition

- No open P0/P1 blocker was found for the public static website candidate.
- Private authentication, orchestration, notifications, payments, device control, connectors, and gateway health remain unavailable by design. They are not part of this public-site release.
- Runtime and connector Workers remain undeployed. The API Worker exposes health only and returns `503 SERVICE_UNAVAILABLE` for `/v1/*` in production.
- GitHub production CD cannot execute until the `CLOUDFLARE_PAGES_API_TOKEN` environment secret is configured directly in GitHub. Manual API containment uses a separate `CLOUDFLARE_WORKERS_API_TOKEN`. Preview CD also requires `CF_PREVIEW_ENABLED=true`; it defaults to disabled. No credential was copied from local Wrangler state.

## Fixed findings

- The default development, CI, and deployment path targets the generated Cloudflare Pages site; API deployment remains separate and explicit.
- Root HTML snapshots and the Pages artifact are generated from the same localized source. Fake waitlist and authentication forms were removed.
- The sign-in route clearly states that private runtime access is unavailable.
- API, runtime, and connector Workers fail closed unless an explicit unsafe local-development mode is enabled.
- Production API authentication cannot be bypassed with an arbitrary Bearer token.
- Payment and device webhook entry points enforce method, size, signature, and JSON validation. Stripe signatures enforce timestamp tolerance.
- Provider adapters, connector/gateway health checks, notifications, login, idempotent mutations, and runtime steps no longer fabricate success while unimplemented.
- CSP no longer needs inline executable scripts. Static validation checks metadata, internal links, locale parity, accessibility basics, image dimensions, and root-artifact parity.
- Hono, Vitest, Wrangler, and their transitive dependencies were updated after advisory review.
- CI, preview CD, production CD, manual API containment CD, CodeQL, and Dependabot definitions were added.

## Verified evidence

- Runtime: Node.js `22.23.4`, npm `12.2.0`.
- `npm audit --audit-level=high`: PASS, 0 vulnerabilities.
- `npm run check:release`: PASS.
  - TypeScript: PASS.
  - Static validation: 18 HTML files PASS.
  - Vitest 5.0.5: 44/44 tests PASS across contracts, generated-site E2E, HTTP boundaries, webhook signatures, provider fail-closed behavior, and private-service false-success regressions.
  - Fresh local D1: 6/6 migrations PASS; seed is stable across two executions.
  - Wrangler dry-run: API, runtime, and connector bundles PASS (3/3).
- `npm run smoke:production`: PASS for 10 public routes, 404 handling, security headers, containment copy, and hashed hero asset.
- `npm run smoke:api`: PASS for health and unauthenticated/arbitrary-token `/v1/*` containment.
- Workflow and Dependabot YAML: parser PASS.
- `git diff --check`: PASS.

## Evidence boundaries

- Local D1 checks are development evidence only; no remote or production database migration was run.
- OpenAPI files are marked `design-only`; they are not proof of implemented runtime behavior.
- GitHub environments `production` and `preview` exist with branch policies for `main` and same-repository feature/PR refs, respectively. Neither environment currently contains its Pages/Workers token; deployment credentials are split by target and scoped only to credential-check/deploy steps.
- A passing local gate is not a passing GitHub run. GitHub Actions evidence is produced only after the candidate is pushed.
- Current production deployment evidence is recorded separately in `reports/2026-10-26-production-release-receipt.md`.
