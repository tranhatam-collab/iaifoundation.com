# Multilingual Release QA Checklist

- Status: Active checklist
- Scope: Any release touching language, localization, metadata, `hreflang`, sitemap, or locale routing
- Users: Dev, Content, QA, SEO, AI agents
- Related standard: `IAIFOUNDATION_LANGUAGE_AND_MULTILINGUAL_SEO_STANDARD.md`

---

## 0. Release Identity

- Release date:
- Release owner:
- Deployment target:
- Locales affected:
- Routes affected:
- Preview URL:
- Production URL:

---

## 1. Preflight

- [ ] Scope is locked and matches the release note.
- [ ] The affected locale list is explicit.
- [ ] The affected route list is explicit.
- [ ] Copy review is complete.
- [ ] No placeholder text remains.
- [ ] No unreviewed machine translation remains.

---

## 2. Language QA

- [ ] Each page has one dominant language.
- [ ] Navigation labels match the page locale.
- [ ] CTA labels match the page locale.
- [ ] Footer labels match the page locale.
- [ ] No mixed-language body copy remains unless explicitly approved.
- [ ] Product names stay consistent with locked naming.
- [ ] Vietnamese pages use full diacritics.
- [ ] Vietnamese terminology follows the locked glossary.

---

## 3. Page-Level SEO QA

- [ ] Each indexable page has a locale-specific `title`.
- [ ] Each indexable page has a locale-specific `meta description`.
- [ ] Each indexable page has one clear `H1`.
- [ ] Each page self-canonicalizes to the correct locale URL.
- [ ] `hreflang` includes all live alternates.
- [ ] `x-default` is correct.
- [ ] `og:title` matches the locale.
- [ ] `og:description` matches the locale.
- [ ] `twitter:title` matches the locale.
- [ ] `twitter:description` matches the locale.
- [ ] Structured data `inLanguage` matches the locale.

---

## 4. Sitewide Technical QA

- [ ] `sitemap.xml` includes every live localized route.
- [ ] `locales/site.locales.json` is current.
- [ ] Language switchers point to true equivalents.
- [ ] Internal links keep users in the same locale when equivalents exist.
- [ ] `robots` directives are correct.
- [ ] The preferred host remains `https://iaifoundation.com`.
- [ ] `www` handling still redirects correctly if applicable.

---

## 5. UI and Browser QA

- [ ] Header menu works on desktop.
- [ ] Header menu works on tablet widths.
- [ ] Header menu works on mobile widths.
- [ ] Open/close state is visually clear.
- [ ] Menu does not overlap content incorrectly.
- [ ] Menu closes on route click.
- [ ] Menu closes on resize back to desktop.
- [ ] Language switcher remains usable in the header.

### 5.1 Required Viewport Matrix

Use the same matrix on preview and on production when header, locale routing, CSS, or JS changes.

| Viewport band | Target width | Required checks |
|---|---|---|
| Desktop | `>= 1280px` | Desktop nav visible, mobile menu hidden, language switcher readable, no overlap with hero |
| Tablet | `768px - 1079px` | Menu toggle visible, menu opens cleanly, menu closes on route click, language switcher remains accessible |
| Mobile | `<= 430px` | Menu toggle label fits, open menu does not clip, links remain tappable, close state restores scroll correctly |

### 5.2 Required Browser Matrix For Menu

At minimum, log one result row per browser used during release QA.

| Browser | Locale tested | Desktop | Tablet | Mobile | Toggle works | Open state clean | Close on link | Close on resize | Language switcher OK | Result | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Safari | | | | | | | | | | | |
| Chrome | | | | | | | | | | | |
| Firefox | | | | | | | | | | | |

### 5.3 Evidence Required For Menu Changes

- [ ] One screenshot per viewport band is captured.
- [ ] At least one screenshot shows the menu open on a small viewport.
- [ ] Tested locale is recorded for every screenshot.
- [ ] Any known browser deviation is logged before release.

---

## 6. Smoke Test Evidence

- [ ] Preview build reviewed.
- [ ] Production deploy completed.
- [ ] Production HTML checked for localized title and description.
- [ ] Production JS/CSS checked if menu or locale switch behavior changed.
- [ ] Screenshots captured for affected locales.

Evidence:

- Preview URL:
- Production URLs checked:
- Commands used:
- Screenshots:

---

## 7. Sign-Off

- [ ] Dev sign-off
- [ ] Content sign-off
- [ ] SEO sign-off
- [ ] QA sign-off
- [ ] Product sign-off

Release decision:

- Approved / Blocked
- Notes:
