# IAIFoundation.com production release receipt

Released at: 2026-10-26, Asia/Ho_Chi_Minh

Cloudflare account: `93112cc89181e75335cbd7ef7e392ba3`

Release scope: public static foundation website plus API containment; no private-runtime product release

## Public website

Status: **RELEASED**, custom-domain smoke verified

- Pages project: `iaifoundation-com`
- Production deployment: `0c773060-f2a7-4d94-b955-b302216bc752`
- Immutable URL: `https://0c773060.iaifoundation-com.pages.dev`
- Custom domains verified: `https://iaifoundation.com`, `https://www.iaifoundation.com`
- Previous production deployment and rollback target: `a13bdbee-3a22-4c0d-956e-d1674cea9e49`
- Aggregate build checksum at deployment: `28b4b5ba8c397fc400558a031090de9de30e12d6c7f13eca9d65f4bcda8b20d4`

Verified production behavior:

- Ten expected public routes return HTTP 200; an unknown route returns HTTP 404.
- The home marker, hashed hero image, and public containment copy are present.
- The public site contains no fake sign-in or waitlist form and exposes no private API endpoint.
- CSP, HSTS, Permissions Policy, Referrer Policy, and content-type protection are present.
- Desktop and 390 by 844 mobile browser checks showed no horizontal overflow; mobile navigation and Docs routing worked; the checked browser console had no warnings or errors.

Known non-blocking issue: `www.iaifoundation.com` serves the same content with an apex canonical tag instead of issuing a host-level redirect.

Source boundary: this deployment was produced from the reviewed working tree before the Git branch/index reconciliation. The GitHub CI artifact will bind subsequent releases to an exact `github.sha` and checksum manifest; automatic CD remains gated by the missing GitHub environment secret described below.

## API Worker

Status: **SECURED / HOLD**, not a product release

- Worker: `intent-os-api`
- Containment version: `a280b50a-e8c7-4df5-a804-fc8934dab794`
- Custom domain: `https://api.iaifoundation.com`
- `/health`: HTTP 200 with JSON health response.
- `/v1/tenants`: HTTP 503 without credentials.
- `/v1/tenants`: HTTP 503 with an arbitrary Bearer token.

The production API fails closed because this public foundation repository does not contain a release-ready private runtime.

## Runtime and connector Workers

Status: **NOT DEPLOYED / HOLD**

- `intent-os-runtime`: no Worker deployment exists in the account.
- `intent-os-connectors`: no Worker deployment exists in the account.
- Both configurations use production-disabled modes, `workers_dev = false`, and no public routes.
- API, runtime, and connector bundles pass current Wrangler dry-run checks.

The private runtime remains blocked by absent production authentication, real orchestration executors, persistent idempotency/rate limiting, implemented and verified providers, secret lifecycle, reconciliation, recovery, rollback, and staging soak evidence.

## Current release gates

- Node.js 22 release environment: PASS.
- TypeScript, static validation, and 44/44 automated tests: PASS.
- Fresh local D1, 6/6 migrations, and idempotent seed: PASS (development evidence only).
- Three Worker dry-run bundles: PASS.
- Production website smoke: PASS.
- Production API containment smoke: PASS.
- npm advisory audit: PASS, 0 vulnerabilities after dependency upgrades.
- Workflow YAML and diff whitespace checks: PASS.

## CI/CD control status

- GitHub Actions definitions exist for CI, preview Pages CD, production Pages CD, manual API containment CD, and CodeQL.
- Dependabot is configured for npm and GitHub Actions.
- GitHub environment `production` accepts only `main`; `preview` accepts only `brand/*`.
- Blocker: neither environment currently has `CLOUDFLARE_API_TOKEN`. Automatic preview and production deployment therefore remain unavailable until that secret is configured directly in GitHub.
- No DNS, remote D1 migration, runtime/connector deployment, payment action, or production data mutation was performed as part of post-release hardening.
