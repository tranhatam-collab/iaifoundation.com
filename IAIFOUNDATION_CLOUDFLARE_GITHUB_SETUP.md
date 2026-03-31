# IAIFoundation.com — Cloudflare + GitHub Setup

## Root repo structure

- `README.md`
- `AGENTS.md`
- `index.html`
- `style.css`
- `app.js`
- `_headers`
- `_redirects`
- `robots.txt`
- `sitemap.xml`
- `site.webmanifest`

## Cloudflare Pages recommendation

- Framework preset: None / static site
- Build command: empty
- Build output directory: `/`
- Production branch: `main`

## DNS recommendation

Canonical:
- `https://iaifoundation.com`

Redirect:
- `https://www.iaifoundation.com` → `https://iaifoundation.com`

## Security baseline

Use `_headers` to set:
- Content-Security-Policy
- Referrer-Policy
- X-Content-Type-Options
- X-Frame-Options
- Strict-Transport-Security
- Permissions-Policy
