# Menu Browser QA Report

- Initial report date: 2026-04-21
- Final verification update: 2026-04-22
- Scope: Header menu, locale switcher, bilingual Pages output, `/docs/` HTML pages
- Local preview target: `http://127.0.0.1:4173/vi/`
- Production target: `https://iaifoundation.com/vi/`
- Final Pages deployment: `https://39a63bff.iaifoundation-com.pages.dev`

---

## 1. Issues Found And Fixed

1. `scripts/build-pages-static.mjs` had a syntax error in the `relatedLinks` renderer.
2. Public copy in generated article pages still contained hard-coded English labels such as `Next step`, `Related`, and `Open page`.
3. Vietnamese menu copy still exposed `Menu` instead of localized Vietnamese labels.
4. Pages build output was missing `app.js` and `style.css`, which would have broken menu behavior and styling on the live site.
5. Breadcrumb schema logic incorrectly treated non-doc routes as if they belonged under `Docs`.
6. Safari production QA on April 22, 2026 exposed a live regression where the left-side menu links leaked into the header area even when the menu should have been closed.
7. The production regression was traced to stale browser assets after deploy, so the HTML and the cached CSS/JS were not always in sync during visual verification.

---

## 2. Release Outcome

- `content/en.json` and `content/vi.json` are the active public content sources for the generated Pages output.
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
- `site:deploy` now selects a working Wrangler binary automatically, preferring a healthy global install when the local `node_modules` copy is unstable.
- Static HTML now fingerprints `style.css` and `app.js` with content hashes so production browsers fetch fresh assets after each deploy.
- The mobile menu is now rendered with a safe hidden default state directly in HTML, plus a localized default button label, so production does not leak stale menu content during cache transitions.

---

## 3. Browser QA Matrix

| Browser | Environment | Locale | Viewport | Result | Evidence |
|---|---|---|---|---|---|
| Safari | Local preview | `vi` | Desktop | Pass | Computer Use visual check after menu hardening fix |
| Safari | Local preview | `vi` | Tablet | Pass | Menu opens cleanly and closes on menu-link click |
| Safari | Local preview | `vi` | Mobile | Pass | Menu opens cleanly with localized copy and intact layout |
| Safari | Production | `vi` | Mobile/narrow | Failed on first deploy | Computer Use screenshot on `https://iaifoundation.com/vi/?qa=20260422-menu` showed leaked left-side menu links while closed |
| Safari | Production | `vi` | Mobile/narrow | Pass after second deploy | Computer Use screenshot on `https://iaifoundation.com/vi/?qa=20260422-menu-v2` showed clean hero header with closed localized `Trình đơn` button and no leaked links |

Production checks confirmed on the final deploy:

- Closed-state header no longer leaks menu links on the left.
- Menu toggle shows localized Vietnamese text instead of a blank button.
- HTML references cache-busted assets:
  - `/style.css?v=d92f67243fe4`
  - `/app.js?v=e96445a6e48c`
- Final production verification used a fresh cache-busting page URL on April 22, 2026:
  - `https://iaifoundation.com/vi/?qa=20260422-menu-v2`

---

## 4. Technical Fixes Applied

1. Hardened `app.js` menu state management:
   - `js-ready` body class
   - explicit `is-open` class on the mobile menu
   - close on route click
   - close on `Escape`
   - close on outside click
   - close on resize back to desktop breakpoint
2. Hardened `style.css` responsive behavior:
   - mobile menu defaults to hidden
   - mobile menu opens only via `.js-ready .mobile-menu.is-open`
   - desktop nav and mobile toggle are scoped behind `js-ready`
   - open-state menu display now overrides the inline safe-hidden default with `!important`
3. Hardened static HTML generation:
   - localized default menu button text
   - localized menu `aria-label`
   - inline hidden default on `#mobile-menu`
   - versioned CSS/JS asset URLs generated from content hashes
4. Hardened deploy workflow:
   - `site:deploy` now runs through `scripts/site-deploy.mjs`
   - deploy script auto-discovers a working Wrangler binary instead of assuming the local package is always healthy

---

## 5. Automation Notes

- Build: `npm run site:build`
- Preview: `npm run site:preview`
- Menu QA script: `npm run site:qa:menu -- http://127.0.0.1:4173/vi/`
- Deploy: `npm run site:deploy`

Current environment note:

- Safari Apple Events automation remained inconsistent in shell during this QA pass, so final visual confirmation relied on Codex Computer Use screenshots and live page interaction instead of the AppleScript-only menu QA path.

---

## 6. Release Decision

- Build: Passed
- Deploy: Passed
- Menu regression found during production QA: Fixed
- Cache-related asset mismatch risk: Fixed with asset fingerprinting
- Vietnamese localized menu UI: Passed
- Final production visual verification: Passed
- Decision: Approved for live
