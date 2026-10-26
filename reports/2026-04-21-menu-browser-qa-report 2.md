# Menu Browser QA Report

- Date: 2026-04-21
- Scope: Header menu, locale switcher, bilingual Pages output, `/docs/` HTML pages
- Preview target: `http://127.0.0.1:4173/vi/`
- Production deploy: `https://iaifoundation.com`
- Pages deployment: `https://1acaf0c4.iaifoundation-com.pages.dev`

---

## 1. Issues Found And Fixed

1. `scripts/build-pages-static.mjs` had a syntax error in the `relatedLinks` renderer.
2. Public copy in generated article pages still contained hard-coded English labels such as `Next step`, `Related`, and `Open page`.
3. Vietnamese menu copy still exposed `Menu` instead of a localized label.
4. Pages build output was missing `app.js` and `style.css`, which would have broken menu behavior and styling on the live site.
5. Breadcrumb schema logic incorrectly treated non-doc routes as if they belonged under `Docs`.

---

## 2. Release Outcome

- `content/en.json` and `content/vi.json` are now the active public content sources for the generated Pages output.
- Locale-specific SEO metadata is generated per route for English and Vietnamese.
- The following HTML docs pages are generated and deployed:
  - `/docs/language-seo-standard/`
  - `/docs/locale-seo-brief-template/`
  - `/docs/multilingual-release-qa-checklist/`
  - `/vi/docs/language-seo-standard/`
  - `/vi/docs/locale-seo-brief-template/`
  - `/vi/docs/multilingual-release-qa-checklist/`
- `site:deploy` is now available for one-command build + Cloudflare Pages deploy.
- `site:preview` and `site:qa:menu` were added to support repeatable local QA.

---

## 3. Browser QA Matrix

| Browser | Locale | Desktop | Tablet | Mobile | Status | Notes |
|---|---|---|---|---|---|---|
| Safari | `vi` | Pass by HTML/CSS/JS contract review | Pass by HTML/CSS/JS contract review | Pass by HTML/CSS/JS contract review | Partial evidence | Local automation blocked by Safari setting and screen-recording permissions in this environment |

Checks validated in code and generated output:

- Desktop uses `.desktop-nav` and hides `.mobile-menu` at `min-width: 1081px`.
- Tablet and mobile expose `.menu-toggle` at `max-width: 1080px`.
- `app.js` closes the menu on route click, `Escape`, outside click, and resize back to desktop.
- Vietnamese menu text is localized via body data attributes: `Trình đơn`, `Đóng`, `Mở menu`, `Đóng menu`.
- Production asset endpoints for `/style.css` and `/app.js` responded with `200 OK` after deploy.

---

## 4. Automation Notes

- Script: `scripts/run-menu-browser-qa.mjs`
- Run with:
  - `npm run site:build`
  - `npm run site:preview`
  - `npm run site:qa:menu -- http://127.0.0.1:4173/vi/`

Current local blocker:

- Safari must enable `Allow JavaScript from Apple Events`.
- Codex Computer Use still requires completed Accessibility and Screen Recording permissions before screenshot evidence can be captured automatically.

---

## 5. Release Decision

- Build: Passed
- Deploy: Passed
- Menu regression found during QA: Fixed
- Remaining blocker: Screenshot evidence automation depends on local OS permissions/settings, not on site code
- Decision: Approved for live with follow-up to capture screenshot evidence once local browser permissions are enabled
