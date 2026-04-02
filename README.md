# iaifoundation.com

Public website for IAI Foundation — Intent OS / Universal Intent Infrastructure.

## Current scope

This repository is a static, Cloudflare Pages-friendly public website that defines the thesis, architecture, roadmap, and early direction for **Intent OS / Universal Intent Infrastructure**.

## AI Governance

- Index: `docs/AI_GOVERNANCE_INDEX.md`
- System rules: `docs/IAI_FOUNDATION_AI_SYSTEM.md`
- Prompt templates: `docs/AI_PROMPT_TEMPLATES.md`
- Context memory: `docs/IAIFOUNDATION_CONTEXT_MEMORY_SYSTEM.md`
- Agent execution: `docs/IAIFOUNDATION_AGENT_EXECUTION_SYSTEM.md`
- Multi-model router: `docs/IAIFOUNDATION_MULTI_MODEL_ROUTER.md`
- Execution Engine (Level 3): `docs/IAIFOUNDATION_EXECUTION_ENGINE.md`
- Realtime agent system: `docs/IAIFOUNDATION_REALTIME_AGENT_SYSTEM.md`
- Data intelligence layer: `docs/IAIFOUNDATION_DATA_INTELLIGENCE_LAYER.md`

## Site structure

### Pages
- `/` — Homepage (thesis, architecture, use cases, principles, roadmap, contact)
- `/docs/` — Public documentation and spec index
- `/partners/` — Partner types and collaboration info
- `/404.html` — Not found page

### Root files
- `index.html` — Main homepage
- `style.css` — Global styles
- `app.js` — Client-side interactions (mobile menu, waitlist form)
- `_headers` — Cloudflare Pages security headers
- `_redirects` — HTTP-to-HTTPS and www-to-naked redirects
- `robots.txt` — Search engine directives
- `sitemap.xml` — Sitemap for all public pages
- `site.webmanifest` — PWA manifest
- `favicon.svg` — Site favicon
- `og-image.svg` — Open Graph image
- `404.html` — Custom 404 page

### Documentation
- `IAIFOUNDATION_MASTER_SPEC.md` — Core product and platform spec
- `IAIFOUNDATION_INFORMATION_ARCHITECTURE.md` — Site IA and content tone
- `IAIFOUNDATION_PRODUCT_ARCHITECTURE.md` — Cloudflare mapping and runtime flow
- `IAIFOUNDATION_DATA_MODEL.md` — Core entities and data design rules
- `IAIFOUNDATION_POLICY_ENGINE.md` — Policy domains and safety principles
- `IAIFOUNDATION_ROADMAP_12_24_MONTHS.md` — Build timeline
- `IAIFOUNDATION_WEB_CONTENT_AND_COPY.md` — Website copy reference
- `IAIFOUNDATION_CLOUDFLARE_GITHUB_SETUP.md` — Deployment guide
- `README_MASTER_HANDOFF.md` — Master handoff document

### Technical specs (`docs/`)
- `INTENT_OS_MVP_BUILD_ORDER.md` — Phase-by-phase build plan
- `INTENT_OS_DATABASE_SCHEMA.md` — Full D1 schema for MVP
- `INTENT_OS_API_SPEC.md` — Unified API contract
- `INTENT_OS_ADMIN_DASHBOARD_SPEC.md` — Admin UI screen map
- `INTENT_OS_ADMIN_UI_ROUTES_AND_SCREENS.md` — Detailed route definitions
- `INTENT_OS_RUN_DETAIL_PAGE_SPEC.md` — Run detail page spec
- `INTENT_OS_D1_SQL_MIGRATIONS_V1.md` — Migration plan and runbook
- `INTENT_OS_BACKEND_FOLDER_STRUCTURE.md` — Monorepo layout and conventions

## Deploy target

- Cloudflare Pages
- production branch: `main`
- root deployment
- Domain: `https://iaifoundation.com`

## Development

No build step required. Edit files and deploy directly.

## AI Working Rules

- Primary system rule file: `docs/IAI_FOUNDATION_AI_SYSTEM.md`
- Always start AI tasks with: `Follow docs/IAI_FOUNDATION_AI_SYSTEM.md strictly.`
- Recommended first step for any non-trivial task: `Start with ANALYZE only.`

### Quick prompt format

```text
Follow docs/IAI_FOUNDATION_AI_SYSTEM.md strictly.

Start with ANALYZE only.

Task:
[describe your task]
```
