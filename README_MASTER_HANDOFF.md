# IAIFoundation.com — Master DEV Handoff

## What this pack is

This pack turns the core concept of **Intent OS / Universal Intent Infrastructure** into a buildable website and product foundation for **iaifoundation.com**.

It assumes:

- Cloudflare is the primary edge, DNS, hosting, security, and runtime control plane.
- GitHub is the source of truth for code and documentation.
- The current repository is empty and should be initialized from this pack.
- The public site starts as a **clarity-first foundation website**, not a bloated product dashboard.
- The long-term product direction is **Intent-to-Outcome infrastructure**: turning human intent into verified real-world outcomes.

## Ground truth checked

- The GitHub repository `tranhatam-collab/iaifoundation.com` is public and currently empty.
- OpenAI’s current stack includes the Responses API, built-in tools, and the Agents SDK for agent orchestration.
- Cloudflare provides Workflows, Durable Objects, D1, and Queues for durable orchestration patterns.
- Stripe currently documents stablecoin payments and stablecoin payouts for Connect in supported scenarios.
- Matter remains an IP-based interoperability standard for smart devices, and recent releases have expanded capabilities.

## What is included

### Strategy and architecture
1. `IAIFOUNDATION_MASTER_SPEC.md`
2. `IAIFOUNDATION_INFORMATION_ARCHITECTURE.md`
3. `IAIFOUNDATION_PRODUCT_ARCHITECTURE.md`
4. `IAIFOUNDATION_DATA_MODEL.md`
5. `IAIFOUNDATION_POLICY_ENGINE.md`
6. `IAIFOUNDATION_ROADMAP_12_24_MONTHS.md`

### Delivery and operations
7. `IAIFOUNDATION_CLOUDFLARE_GITHUB_SETUP.md`

### Website content and launch copy
8. `IAIFOUNDATION_WEB_CONTENT_AND_COPY.md`

### Initial static repo bootstrap
9. `README.md`
10. `index.html`
11. `style.css`
12. `app.js`
13. `_headers`
14. `_redirects`
15. `robots.txt`
16. `sitemap.xml`
17. `site.webmanifest`
18. `AGENTS.md`

## First build sequence for DEV

### Phase 0
- Create the GitHub repo root exactly from these files.
- Connect the repo to Cloudflare Pages.
- Point `iaifoundation.com` and `www.iaifoundation.com` to Cloudflare.
- Deploy the static root site first.

### Phase 1
- Publish the public foundation site.
- Keep messaging clear:
  - What IAIF Foundation is
  - Why Intent OS matters
  - What layers exist
  - What is being built now
  - What is not promised yet
- Add waitlist / contact / builder interest capture.

### Phase 2
- Split the repo into:
  - `/public-site`
  - `/docs`
  - `/product-specs`
  - later `/apps/web`, `/workers/api`, `/workers/runtime`
- Do not overengineer before messaging is locked.

### Phase 3
- Start private runtime repos only after:
  - identity model
  - policy model
  - proof model
  - audit scope
  - payment rail boundaries
  are clearly approved.

## Non-negotiable product rule

This system is **not**:
- another AI chat app
- another crypto wallet
- another IoT dashboard
- another generic automation builder

This system **is**:
- a trustable runtime that converts intent into outcome
- with policy, orchestration, payments, device actions, human approvals, and proof in one loop

## Public positioning sentence

**IAI Foundation is building the trust layer that turns human and business intent into real-world outcomes with AI, workflows, payments, devices, approvals, and proof.**

## Founder note for DEV

Do not design the website like a technical admin panel.

The website must feel:
- calm
- credible
- future-facing
- governance-first
- infrastructure-level
- human-readable

The product can be complex under the hood. The public surface must stay clear.
