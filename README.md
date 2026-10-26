# iaifoundation.com

Static-first public website for IAI Foundation. The deploy target is Cloudflare Pages at the repository root.

## Scope boundary

This repository publishes the foundation's public thesis, principles, architecture, roadmap, and documentation. It does not provide a production private runtime, customer sign-in, payment processing, device control, or connector service.

The `apps/`, `packages/`, `openapi/`, and `migrations/` directories contain future-runtime design and development scaffolding. All runtime workers fail closed by default. They can be exercised only in an explicitly enabled local-development mode and are not part of the default Pages build or deploy path.

## Public site

- Localized source content: `content/en.json`, `content/vi.json`
- Static generator: `scripts/build-pages-static.mjs`
- Generated deploy artifact: `.wrangler/pages-build/`
- Root-compatible HTML snapshots: refreshed by every `npm run build`
- Shared presentation and behavior: `style.css`, `app.js`
- Public documentation: `docs/`
- Security and routing: `_headers`, `_redirects`

Stable public routes include `/`, `/about/`, `/principles/`, `/architecture/`, `/roadmap/`, `/docs/`, `/contact/`, `/support/`, `/privacy/`, `/terms/`, `/sign-in/`, and their published Vietnamese equivalents.

## Development

Use Node.js 22 as declared in `.nvmrc`.

```sh
npm install
npm run dev
```

`npm run dev` rebuilds the static site and serves the Cloudflare Pages artifact. It does not start the private API worker.

Useful checks:

```sh
npm run build
npm run lint
npm run typecheck
npm run test
npm run check
npm run test:db
npm run check:workers
npm run check:release
npm run test:e2e
```

`npm run check:release` is the complete deterministic local gate. It validates the static site, TypeScript, tests, a fresh six-migration D1 database with an idempotent seed, and dry-run bundles for the API, runtime, and connector Workers. CI and CD also run `npm audit --audit-level=high` against the current registry before accepting a revision. The static-site checker validates required routes, internal links, language alternates, metadata, accessibility basics, content parity, image dimensions, and security headers.

## Deployment

```sh
npm run deploy
```

The default command builds, validates, and deploys `.wrangler/pages-build/` to Cloudflare Pages. A production deploy still requires current Cloudflare credentials and explicit release authorization.

Canonical `www` to apex host routing must be configured at the Cloudflare zone or custom-domain layer; Pages `_redirects` does not carry that host-level rule.

`npm run dev:api` and `npm run deploy:api` are intentionally separate commands for the future runtime scaffold. Do not use them for the public website.

Production verification is read-only:

```sh
npm run smoke:production
npm run smoke:api
```

## CI and CD

- `.github/workflows/ci.yml` runs the complete release gate on pull requests, `main`, and `brand/**`; it uploads the verified Pages artifact and checksum manifest.
- Same-repository pull requests can deploy a Pages preview through the protected `preview` GitHub environment. The job records a notice and remains non-blocking when its Cloudflare token is not configured.
- `.github/workflows/deploy.yml` deploys only a successful `main` CI revision through the serialized `production` environment, re-runs the release gate, and then smokes the public custom domain.
- `.github/workflows/api-containment.yml` is manual-only and requires the exact confirmation `DEPLOY CONTAINMENT`; it deploys only the fail-closed API boundary and verifies that private `/v1/*` routes remain unavailable.
- `.github/workflows/codeql.yml` scans JavaScript and TypeScript on changes and weekly. Dependabot covers npm and GitHub Actions updates.

Both the `preview` and `production` GitHub environments use an environment secret named `CLOUDFLARE_API_TOKEN`. The token must be created directly in GitHub with the minimum Cloudflare Pages/Workers permissions needed for the selected workflow; never commit or paste it into repository files. Production approvals and branch policies remain GitHub environment settings, not code defaults.

## Governance references

- `docs/AI_GOVERNANCE_INDEX.md`
- `docs/IAI_FOUNDATION_AI_SYSTEM.md`
- `docs/AI_PROMPT_TEMPLATES.md`
- `docs/IAIFOUNDATION_CONTEXT_MEMORY_SYSTEM.md`
- `docs/IAIFOUNDATION_AGENT_EXECUTION_SYSTEM.md`
- `docs/IAIFOUNDATION_MULTI_MODEL_ROUTER.md`
- `docs/IAIFOUNDATION_EXECUTION_ENGINE.md`
- `docs/IAIFOUNDATION_REALTIME_AGENT_SYSTEM.md`
- `docs/IAIFOUNDATION_DATA_INTELLIGENCE_LAYER.md`
